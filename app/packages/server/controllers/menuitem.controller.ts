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
   orderIndex: z.number().int().optional(),
});

const reorderRequestSchema = z.object({
   items: z.array(
      z.object({
         id: z.number(),
         orderIndex: z.number().int(),
      })
   ),
});

const menuItemImportRequestSchema = z.object({
   eventId: z.number().int().positive('eventId must be a positive number'),
   items: z
      .array(
         z.object({
            flag: z.enum(['ADD', 'UPDATE', 'REMOVE']),
            name: z.string().trim().min(1, 'item name is required'),
            chef: z.string().trim().optional().nullable(),
            category: z.nativeEnum(MenuCategory),
            price: z
               .number()
               .nonnegative('price must be a non-negative number'),
            stockQty: z
               .number()
               .int()
               .nonnegative('stock quantity must be a non-negative integer'),
         })
      )
      .min(1, 'At least one menu item is required'),
});

export const menuItemController = {
   async createMenuItem(req: Request, res: Response) {
      const parseResult = menuItemCreateRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const {
            eventId,
            name,
            chef,
            category: categoryValue,
            price,
            stockQty,
         } = parseResult.data;

         const category: MenuCategory = categoryValue as MenuCategory;

         const menuItem = await menuItemService.createMenuItem({
            eventId,
            name,
            chef: chef ?? null,
            category,
            price,
            stockQty,
            isSoldOut: false,
            orderIndex: 0,
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

         const menuItemsToCreate = items.map((item, index) => ({
            eventId,
            name: item.name,
            chef: item.chef ?? null,
            category: item.category as MenuCategory,
            price: item.price,
            stockQty: item.stockQty,
            isSoldOut: false,
            orderIndex: index,
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
            name,
            chef,
            category: categoryValue,
            price,
            stockQty,
            isSoldOut,
            orderIndex,
         } = parseResult.data;
         const category = categoryValue as MenuCategory | undefined;

         const updatedItem = await menuItemService.updateMenuItem(menuItemId, {
            name,
            chef,
            category,
            price,
            stockQty,
            isSoldOut,
            orderIndex,
         });

         res.json({ menuItem: updatedItem });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to update menu item' });
      }
   },

   async reorderMenuItems(req: Request, res: Response) {
      const parseResult = reorderRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const { items } = parseResult.data;
         await menuItemService.reorderMenuItems(items);
         res.json({ message: 'Menu items reordered successfully' });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to reorder menu items' });
      }
   },

   async importMenuItems(req: Request, res: Response) {
      const parseResult = menuItemImportRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const { eventId, items } = parseResult.data;
         console.log(`Importing menu items for eventId: ${eventId}`, items);
         const result = await menuItemService.importMenuItems(eventId, items);
         return res.json(result);
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Failed to import menu';
         return res.status(400).json({ error: message });
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
