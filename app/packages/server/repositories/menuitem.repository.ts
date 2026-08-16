import { type MenuItem } from '@prisma/client';
import { prisma } from '../prisma';

export const menuItemRepository = {
   async createMenuItem(data: Omit<MenuItem, 'id'>) {
      // INSERT INTO menu_items (name, category, price, stockQty, eventId, orderIndex) VALUES (...)
      return prisma.menuItem.create({
         data,
      });
   },

   async createMenuItemsBatch(items: Omit<MenuItem, 'id'>[]) {
      // Use a transaction to ensure all items are created successfully
      return prisma.$transaction(
         items.map((item) =>
            prisma.menuItem.create({
               data: item,
            })
         )
      );
   },

   async getAllMenuItemsByEventId(eventId: number): Promise<MenuItem[]> {
      // SELECT * FROM menu_items WHERE eventId = @eventId ORDER BY orderIndex ASC
      return prisma.menuItem.findMany({
         where: { eventId },
         include: { event: true },
         orderBy: { orderIndex: 'asc' },
      });
   },

   async getMenuItemById(id: number): Promise<MenuItem | null> {
      // SELECT * FROM menu_items WHERE id = @id
      return prisma.menuItem.findUnique({
         where: { id },
      });
   },

   async updateMenuItem(id: number, data: Partial<Omit<MenuItem, 'id'>>) {
      // UPDATE menu_items SET name = @name, category = @category, price = @price, stockQty = @stockQty, orderIndex = @orderIndex WHERE id = @menuItemId
      return prisma.menuItem.update({
         where: { id },
         data,
      });
   },

   async reorderMenuItems(items: { id: number; orderIndex: number }[]) {
      // UPDATE menu_items SET orderIndex = @orderIndex WHERE id = @id
      return prisma.$transaction(
         items.map((item) =>
            prisma.menuItem.update({
               where: { id: item.id },
               data: { orderIndex: item.orderIndex },
            })
         )
      );
   },

   async importMenuItems(
      eventId: number,
      items: {
         flag: 'ADD' | 'UPDATE' | 'REMOVE';
         name: string;
         chef?: string | null;
         category: MenuItem['category'];
         price: number;
         stockQty: number;
      }[]
   ) {
      const failedItems: Array<{
         flag: 'ADD' | 'UPDATE' | 'REMOVE';
         name: string;
         reason: string;
      }> = [];

      return prisma.$transaction(
         async (tx) => {
            const currentItems = await tx.menuItem.findMany({
               where: { eventId },
               orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
            });

            const currentByName = new Map(
               currentItems.map((item) => [
                  item.name.trim().toLowerCase(),
                  item,
               ])
            );

            const successfulChanges: Array<{
               flag: 'ADD' | 'UPDATE' | 'REMOVE';
               name: string;
               previous?: MenuItem | null;
               next?: MenuItem | null;
            }> = [];

            for (const rawItem of items) {
               try {
                  const name = rawItem.name.trim();
                  const lookupKey = name.toLowerCase();
                  const existing = currentByName.get(lookupKey);

                  if (rawItem.flag === 'ADD') {
                     if (existing) {
                        // throw new Error(`Menu item "${name}" already exists`);
                        failedItems.push({
                           flag: 'ADD',
                           name,
                           reason: 'Menu item already exists.',
                        });

                        continue;
                     }

                     const created = await tx.menuItem.create({
                        data: {
                           eventId,
                           name,
                           chef: rawItem.chef?.trim() || null,
                           category: rawItem.category,
                           price: rawItem.price,
                           stockQty: rawItem.stockQty,
                           isSoldOut: rawItem.stockQty <= 0,
                           orderIndex: currentItems.length,
                           createdAt: new Date(),
                        },
                     });

                     currentItems.push(created);
                     currentByName.set(lookupKey, created);
                     successfulChanges.push({
                        flag: 'ADD',
                        name,
                        next: created,
                     });
                     continue;
                  }

                  if (!existing) {
                     // throw new Error(`Menu item "${name}" not found`);
                     failedItems.push({
                        flag: rawItem.flag,
                        name,
                        reason: 'Menu item not found.',
                     });

                     continue;
                  }

                  if (rawItem.flag === 'UPDATE') {
                     const updated = await tx.menuItem.update({
                        where: { id: existing.id },
                        data: {
                           name,
                           chef: rawItem.chef?.trim() || null,
                           category: rawItem.category,
                           price: rawItem.price,
                           stockQty: rawItem.stockQty,
                           isSoldOut: rawItem.stockQty <= 0,
                        },
                     });

                     currentByName.set(lookupKey, updated);
                     successfulChanges.push({
                        flag: 'UPDATE',
                        name,
                        previous: existing,
                        next: updated,
                     });
                     continue;
                  }

                  // Check whether this menu item has been ordered
                  const existingOrder = await tx.orderItem.findFirst({
                     where: {
                        menuItemId: existing.id,
                     },
                     // select: {
                     //    id: true,
                     // },
                     include: {
                        order: {
                           select: {
                              orderNumber: true,
                           },
                        },
                     },
                  });

                  if (existingOrder) {
                     failedItems.push({
                        flag: 'REMOVE',
                        name,
                        reason: `Cannot delete because it is used in order ${existingOrder.order.orderNumber}.`,
                     });

                     continue;
                  }

                  // Safe to delete
                  await tx.menuItem.delete({
                     where: { id: existing.id },
                  });

                  currentByName.delete(lookupKey);

                  successfulChanges.push({
                     flag: 'REMOVE',
                     name,
                     previous: existing,
                  });

                  const index = currentItems.findIndex(
                     (item) => item.id === existing.id
                  );

                  if (index >= 0) {
                     currentItems.splice(index, 1);
                  }
               } catch (error) {
                  failedItems.push({
                     flag: rawItem.flag,
                     name: rawItem.name,
                     reason:
                        error instanceof Error
                           ? error.message
                           : 'Unexpected error.',
                  });
                  continue;
               }
            }

            const remainingItems = await tx.menuItem.findMany({
               where: { eventId },
               orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
            });

            await Promise.all(
               remainingItems.map((item, index) =>
                  tx.menuItem.update({
                     where: { id: item.id },
                     data: { orderIndex: index },
                  })
               )
            );

            const menuItems = await tx.menuItem.findMany({
               where: { eventId },
               orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
               include: { event: true },
            });

            const added = successfulChanges.filter(
               (c) => c.flag === 'ADD'
            ).length;
            const updated = successfulChanges.filter(
               (c) => c.flag === 'UPDATE'
            ).length;
            const removed = successfulChanges.filter(
               (c) => c.flag === 'REMOVE'
            ).length;

            return {
               message:
                  failedItems.length === 0
                     ? 'Menu imported successfully.'
                     : 'Menu imported with some skipped items.',

               summary: {
                  total: items.length,
                  added,
                  updated,
                  removed,
                  failed: failedItems.length,
               },

               successfulChanges,

               failedItems,

               menuItems,
            };
         },
         { timeout: 30000 }
      );
   },

   async deleteMenuItem(id: number): Promise<void> {
      // DELETE FROM menu_items WHERE id = @menuItemId
      await prisma.menuItem.delete({
         where: { id },
      });
   },
};
