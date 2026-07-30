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

   async deleteMenuItem(id: number): Promise<void> {
      await menuItemRepository.deleteMenuItem(id);
   },
};
