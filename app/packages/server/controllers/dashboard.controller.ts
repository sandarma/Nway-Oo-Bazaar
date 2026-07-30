import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
   async getOverview(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const overview = await dashboardService.getOverview(eventId);
         if (!overview) {
            return res.status(404).json({ error: 'Event not found' });
         }

         return res.json(overview);
      } catch (error) {
         console.error('Failed to get dashboard overview:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async getOrders(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const { status, search, page, limit } = req.query;

         const result = await dashboardService.getOrders(eventId, {
            status: status as string,
            search: search as string,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 20,
         });

         return res.json(result);
      } catch (error) {
         console.error('Failed to get orders:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async getOrderById(req: Request, res: Response) {
      try {
         const orderId = Number(req.params.orderId);
         if (isNaN(orderId)) {
            return res.status(400).json({ error: 'Invalid order ID' });
         }

         const order = await dashboardService.getOrderById(orderId);
         if (!order) {
            return res.status(404).json({ error: 'Order not found' });
         }

         return res.json(order);
      } catch (error) {
         console.error('Failed to get order:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async getMenuItems(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const menuItems = await dashboardService.getMenuItems(eventId);
         return res.json(menuItems);
      } catch (error) {
         console.error('Failed to get menu items:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async updateOrderStatus(req: Request, res: Response) {
      try {
         const orderId = Number(req.params.orderId);
         if (isNaN(orderId)) {
            return res.status(400).json({ error: 'Invalid order ID' });
         }

         const { status } = req.body;
         if (!status) {
            return res.status(400).json({ error: 'Status is required' });
         }

         const updatedOrder = await dashboardService.updateOrderStatus(
            orderId,
            status
         );
         return res.json(updatedOrder);
      } catch (error) {
         console.error('Failed to update order status:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async getAnalytics(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const analytics = await dashboardService.getAnalytics(eventId);
         return res.json(analytics);
      } catch (error) {
         console.error('Failed to get analytics:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },
};
