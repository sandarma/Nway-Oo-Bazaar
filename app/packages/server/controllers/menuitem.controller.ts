import type { Request, Response } from 'express';
import z from 'zod';
import { menuItemService } from '../services/menuitem.service';

const MenuCategory = {
   MAIN_DISH: 'MAIN_DISH',
   SNACK: 'SNACK',
   DESSERT: 'DESSERT',
   DRINK: 'DRINK',
   CINEMA_TICKET: 'CINEMA_TICKET',
   RAFFLE_TICKET: 'RAFFLE_TICKET',
} as const;

type MenuCategory = (typeof MenuCategory)[keyof typeof MenuCategory];

const menuItemCreateRequestSchema = z.object({
   eventId: z.number(),
   itemCode: z.string().trim().min(1, 'item code is required'),
   name: z.string().trim().min(1, 'item name is required'),
   chef: z.string().trim().optional(),
   category: z.nativeEnum(MenuCategory),
   price: z.number().nonnegative('price must be a non-negative number'),
   stockQty: z
      .number()
      .int()
      .nonnegative('stock quantity must be a non-negative integer'),
});

const menuItemCreateBatchRequestSchema = z.object({
   eventId: z.number(),
   items: z.array(
      z.object({
         itemCode: z.string().trim().min(1, 'item code is required'),
         name: z.string().trim().min(1, 'item name is required'),
         chef: z.string().trim().optional(),
         category: z.nativeEnum(MenuCategory),
         price: z.number().nonnegative('price must be a non-negative number'),
         stockQty: z
            .number()
            .int()
            .nonnegative('stock quantity must be a non-negative integer'),
      })
   ),
});

const menuItemUpdateRequestSchema = z.object({
   itemCode: z.string().trim().min(1, 'item code is required').optional(),
   name: z.string().trim().min(1, 'item name is required').optional(),
   chef: z.string().trim().optional(),
   category: z.nativeEnum(MenuCategory).optional(),
   price: z.number().positive('price must be a positive number').optional(),
   stockQty: z
      .number()
      .int()
      .nonnegative('stock quantity must be a non-negative integer')
      .optional(),
   isSoldOut: z.boolean().optional(),
});

export const menuItemController = {
   async createMenuItem(req: Request, res: Response) {
      // logic to create a new menu item

      const parseResult = menuItemCreateRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const {
            eventId,
            itemCode,
            name,
            chef,
            category: categoryValue,
            price,
            stockQty,
         } = parseResult.data;

         const category: MenuCategory = categoryValue as MenuCategory;

         const menuItem = await menuItemService.createMenuItem({
            eventId,
            itemCode,
            name,
            chef,
            category,
            price,
            stockQty,
            isSoldOut: false,
            createdAt: new Date(),
         });

         res.json({ menuItem });
      } catch (error) {
         console.error('createMenuItem error:', error);
         return res.status(500).json({ error: 'Failed to create menu item' });
      }
   },

   async createMenuItemBatch(req: Request, res: Response) {
      const parseResult = menuItemCreateBatchRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const { eventId, items } = parseResult.data;

         const menuItemsToCreate = items.map((item) => ({
            eventId,
            itemCode: item.itemCode,
            name: item.name,
            chef: item.chef,
            category: item.category as MenuCategory,
            price: item.price,
            stockQty: item.stockQty,
            isSoldOut: false,
            createdAt: new Date(),
         }));

         await menuItemService.createMenuItemsBatch(menuItemsToCreate);

         res.json({ message: 'Menu Items created successfully' });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to create menu items' });
      }
   },

   async getAllMenuItemsByEventId(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);

         const menuItems =
            await menuItemService.getAllMenuItemsByEventId(eventId);
         res.json({ menuItems: menuItems });
      } catch (error) {
         return res
            .status(500)
            .json({ error: 'Failed to retrieve menu items' });
      }
   },

   async getMenuItemById(req: Request, res: Response) {
      try {
         const id = Number(req.params.id);

         const menuItem = await menuItemService.getMenuItemById(id);
         res.json({ menuItem: menuItem });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve menu item' });
      }
   },

   async updateMenuItem(req: Request, res: Response) {
      const parseResult = menuItemUpdateRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const menuItemId = Number(req.params.id);

         if (isNaN(menuItemId)) {
            return res.status(400).json({ error: 'Invalid menu item ID' });
         }

         const {
            itemCode,
            name,
            chef,
            category: categoryValue,
            price,
            stockQty,
            isSoldOut,
         } = parseResult.data;
         const category = categoryValue as MenuCategory;

         const updatedItem = await menuItemService.updateMenuItem(menuItemId, {
            itemCode,
            name,
            chef,
            category,
            price,
            stockQty,
            isSoldOut,
         });

         res.json({ menuItem: updatedItem });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to update menu item' });
      }
   },

   async deleteMenuItem(req: Request, res: Response) {
      try {
         const menuItemId = Number(req.params.id);

         if (isNaN(menuItemId)) {
            return res.status(400).json({ error: 'Invalid menu item ID' });
         }

         await menuItemService.deleteMenuItem(menuItemId);

         res.json({
            message: `Menu Item deleted successfully`,
         });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to delete menu item' });
      }
   },
};
