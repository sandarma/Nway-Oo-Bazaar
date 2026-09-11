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

      const successfulChanges: Array<{
         flag: 'ADD' | 'UPDATE' | 'REMOVE';
         name: string;
         previous?: MenuItem | null;
         next?: MenuItem | null;
      }> = [];

      return prisma.$transaction(
         async (tx) => {
            // Step 1: Fetch all current items once (single query)
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

            // Step 2: Separate items by operation type
            const itemsToAdd: typeof items = [];
            const itemsToUpdate: typeof items = [];
            const itemsToRemove: typeof items = [];

            for (const rawItem of items) {
               const name = rawItem.name.trim();
               const lookupKey = name.toLowerCase();
               const existing = currentByName.get(lookupKey);

               if (rawItem.flag === 'ADD') {
                  if (existing) {
                     failedItems.push({
                        flag: 'ADD',
                        name,
                        reason: 'Menu item already exists.',
                     });
                  } else {
                     itemsToAdd.push(rawItem);
                  }
               } else if (rawItem.flag === 'UPDATE') {
                  if (!existing) {
                     failedItems.push({
                        flag: 'UPDATE',
                        name,
                        reason: 'Menu item not found.',
                     });
                  } else {
                     itemsToUpdate.push(rawItem);
                  }
               } else if (rawItem.flag === 'REMOVE') {
                  if (!existing) {
                     failedItems.push({
                        flag: 'REMOVE',
                        name,
                        reason: 'Menu item not found.',
                     });
                  } else {
                     itemsToRemove.push(rawItem);
                  }
               }
            }

            // Step 3: Check which items to remove have existing orders (batch query)
            const removeItemIds = itemsToRemove
               .map(
                  (item) =>
                     currentByName.get(item.name.trim().toLowerCase())?.id
               )
               .filter((id): id is number => id !== undefined);

            const orderItems = await tx.orderItem.findMany({
               where: { menuItemId: { in: removeItemIds } },
               select: {
                  menuItemId: true,
                  order: { select: { orderNumber: true } },
               },
            });

            const orderedItemIds = new Map(
               orderItems.map((oi) => [oi.menuItemId, oi.order.orderNumber])
            );

            // Separate removable vs blocked items
            const canRemove: number[] = [];
            for (const rawItem of itemsToRemove) {
               const name = rawItem.name.trim();
               const existing = currentByName.get(name.toLowerCase());
               if (!existing) continue;

               const orderNumber = orderedItemIds.get(existing.id);
               if (orderNumber) {
                  failedItems.push({
                     flag: 'REMOVE',
                     name,
                     reason: `Cannot delete because it is used in order ${orderNumber}.`,
                  });
               } else {
                  canRemove.push(existing.id);
                  successfulChanges.push({
                     flag: 'REMOVE',
                     name,
                     previous: existing,
                  });
               }
            }

            // Step 4: Bulk delete (1 query)
            if (canRemove.length > 0) {
               await tx.menuItem.deleteMany({
                  where: { id: { in: canRemove } },
               });
            }

            // Step 5: Bulk create (1 query)
            const currentCount = currentItems.length;
            if (itemsToAdd.length > 0) {
               const now = new Date();
               await tx.menuItem.createMany({
                  data: itemsToAdd.map((rawItem, idx) => ({
                     eventId,
                     name: rawItem.name.trim(),
                     chef: rawItem.chef?.trim() || null,
                     category: rawItem.category,
                     price: rawItem.price,
                     stockQty: rawItem.stockQty,
                     isSoldOut: rawItem.stockQty <= 0,
                     orderIndex: currentCount + idx,
                     createdAt: now,
                  })),
               });

               // Track successful adds
               for (const rawItem of itemsToAdd) {
                  successfulChanges.push({
                     flag: 'ADD',
                     name: rawItem.name.trim(),
                  });
               }
            }

            // Step 6: Bulk update (individual queries needed for tracking)
            for (const rawItem of itemsToUpdate) {
               const name = rawItem.name.trim();
               const existing = currentByName.get(name.toLowerCase());
               if (!existing) continue;

               await tx.menuItem.update({
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

               successfulChanges.push({
                  flag: 'UPDATE',
                  name,
                  previous: existing,
               });
            }

            // Step 7: Reorder all items using single raw query
            const remainingItems = await tx.menuItem.findMany({
               where: { eventId },
               orderBy: [{ id: 'asc' }],
               select: { id: true },
            });

            if (remainingItems.length > 0) {
               const cases = remainingItems
                  .map((item, index) => `WHEN id = ${item.id} THEN ${index}`)
                  .join(' ');
               const ids = remainingItems.map((item) => item.id).join(',');
               await tx.$executeRawUnsafe(
                  `UPDATE menu_items SET orderIndex = CASE ${cases} END WHERE id IN (${ids})`
               );
            }

            // Step 8: Fetch final result (single query)
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
         { timeout: 10000 } // 10 seconds - matches Netlify free plan limit
      );
   },

   async deleteMenuItem(id: number): Promise<void> {
      // DELETE FROM menu_items WHERE id = @menuItemId
      await prisma.menuItem.delete({
         where: { id },
      });
   },
};
