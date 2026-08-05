import { type MenuItem } from '@prisma/client';
import { menuItemRepository } from '../repositories/menuitem.repository';

export const menuItemService = {
   async createMenuItem(data: Omit<MenuItem, 'id'>) {
      return menuItemRepository.createMenuItem(data);
   },

   async createMenuItemsBatch(items: Omit<MenuItem, 'id'>[]) {
      return menuItemRepository.createMenuItemsBatch(items);
   },

   async getAllMenuItemsByEventId(eventId: number): Promise<MenuItem[]> {
      return menuItemRepository.getAllMenuItemsByEventId(eventId);
   },

   async getMenuItemById(id: number): Promise<MenuItem | null> {
      return menuItemRepository.getMenuItemById(id);
   },

   async updateMenuItem(id: number, data: Partial<Omit<MenuItem, 'id'>>) {
      return menuItemRepository.updateMenuItem(id, data);
   },

   async reorderMenuItems(items: { id: number; orderIndex: number }[]) {
      return menuItemRepository.reorderMenuItems(items);
   },

   async importMenuItems(
      eventId: number,
      items: {
         flag: 'ADD' | 'UPDATE' | 'REMOVE';
         name: string;
         chef?: string | null;
         category: import('@prisma/client').MenuCategory;
         price: number;
         stockQty: number;
      }[]
   ) {
      return menuItemRepository.importMenuItems(eventId, items);
   },

   async deleteMenuItem(id: number): Promise<void> {
      await menuItemRepository.deleteMenuItem(id);
   },
};
