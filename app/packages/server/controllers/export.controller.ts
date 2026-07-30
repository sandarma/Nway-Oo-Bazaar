import type { Request, Response } from 'express';
import { exportService } from '../services/export.service';
import { prisma } from '../prisma';

function sanitizeFilename(name: string): string {
   return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
}

async function getEventName(eventId: number): Promise<string> {
   const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
   });
   return event ? sanitizeFilename(event.name) : `event-${eventId}`;
}

export const exportController = {
   async exportFoodOrdersByUserList(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const pickupLocation =
            typeof req.query.pickupLocation === 'string'
               ? req.query.pickupLocation
               : undefined;

         const csv = await exportService.exportFoodOrdersByUserListToCSV(
            eventId,
            pickupLocation
         );

         const eventName = await getEventName(eventId);
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="food-order-by-user-list-${eventName}.csv"`
         );
         return res.send(csv);
      } catch (error) {
         console.error('Failed to export orders:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async exportPrintOutList(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const csv = await exportService.exportPrintOutListToCSV(eventId);

         const eventName = await getEventName(eventId);
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="print-out-list-${eventName}.csv"`
         );
         return res.send(csv);
      } catch (error) {
         console.error('Failed to export print out list:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async exportFoodOrdersBySellerList(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const csv =
            await exportService.exportFoodOrdersBySellerListToCSV(eventId);

         const eventName = await getEventName(eventId);
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="food-order-by-seller-list-${eventName}.csv"`
         );
         return res.send(csv);
      } catch (error) {
         console.error('Failed to export seller list:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async exportOrders(req: Request, res: Response) {
      return exportController.exportFoodOrdersByUserList(req, res);
   },

   async exportMenu(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const csv = await exportService.exportMenuToCSV(eventId);

         const eventName = await getEventName(eventId);
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="menu-${eventName}.csv"`
         );
         return res.send(csv);
      } catch (error) {
         console.error('Failed to export menu:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async generatePackingSlip(req: Request, res: Response) {
      try {
         const orderId = Number(req.params.orderId);
         if (isNaN(orderId)) {
            return res.status(400).json({ error: 'Invalid order ID' });
         }

         const packingSlip = await exportService.generatePackingSlip(orderId);
         if (!packingSlip) {
            return res.status(404).json({ error: 'Order not found' });
         }

         return res.json(packingSlip);
      } catch (error) {
         console.error('Failed to generate packing slip:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },
};
