import { type MenuItem } from '@prisma/client';
import { prisma } from '../prisma';

export const menuItemRepository = {
   async createMenuItem(data: Omit<MenuItem, 'id'>) {
      // INSERT INTO menu_items (itemCode, name, category, price, stockQty, eventId) VALUES (@itemCode, @name, @category, @price, @stockQty, @eventId)
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
      // SELECT * FROM menu_items WHERE eventId = @eventId
      return prisma.menuItem.findMany({
         where: { eventId },
         include: { event: true },
      });
   },

   async getMenuItemById(id: number): Promise<MenuItem | null> {
      // SELECT * FROM menu_items WHERE id = @id
      return prisma.menuItem.findUnique({
         where: { id },
      });
   },

   async updateMenuItem(id: number, data: Partial<Omit<MenuItem, 'id'>>) {
      // UPDATE menu_items SET itemCode = @itemCode, name = @name, category = @category, price = @price, stockQty = @stockQty WHERE id = @menuItemId

      return prisma.menuItem.update({
         where: { id },
         data,
      });
   },

   async deleteMenuItem(id: number): Promise<void> {
      // DELETE FROM menu_items WHERE id = @menuItemId
      await prisma.menuItem.delete({
         where: { id },
      });
   },
};
