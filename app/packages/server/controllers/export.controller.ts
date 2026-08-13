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

async function getEventFilePrefix(eventId: number): Promise<string> {
   const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { eventCodePrefix: true, name: true },
   });
   if (!event) return `event-${eventId}`;
   return event.eventCodePrefix || sanitizeFilename(event.name);
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

         const eventPrefix = await getEventFilePrefix(eventId);
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="food-order-by-user-list-${eventPrefix}.csv"`
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

         const eventPrefix = await getEventFilePrefix(eventId);
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="print-out-list-${eventPrefix}.csv"`
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

         const eventPrefix = await getEventFilePrefix(eventId);
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="food-order-by-seller-list-${eventPrefix}.csv"`
         );
         return res.send(csv);
      } catch (error) {
         console.error('Failed to export seller list:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async exportOrders(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const csv = await exportService.exportOrdersDetailedToCSV(eventId);

         const eventPrefix = await getEventFilePrefix(eventId);
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="orders-${eventPrefix}.csv"`
         );
         return res.send(csv);
      } catch (error) {
         console.error('Failed to export orders:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   async exportMenu(req: Request, res: Response) {
      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const csv = await exportService.exportMenuToCSV(eventId);

         const eventPrefix = await getEventFilePrefix(eventId);
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="menu-${eventPrefix}.csv"`
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
