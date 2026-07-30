import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const requireEventOwnership = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const user = req.user;
      if (!user) {
         return res.status(401).json({ error: 'Authentication required' });
      }

      // Admins can access all events
      if (user.role === 'ADMIN') {
         return next();
      }

      // For organizers, check event ownership
      const eventIdParam = req.params.eventId || req.params.id;
      if (!eventIdParam) {
         return next(); // Let controller handle missing eventId
      }
      const eventId = Number(eventIdParam);
      if (isNaN(eventId)) {
         return res.status(400).json({ error: 'Invalid event ID' });
      }

      const event = await prisma.event.findUnique({
         where: { id: eventId },
         select: { organizerId: true },
      });

      if (!event) {
         return res.status(404).json({ error: 'Event not found' });
      }

      // If event has no organizer, allow access (backward compatibility)
      if (!event.organizerId) {
         return next();
      }

      // Check if user owns the event
      if (event.organizerId !== user.id) {
         return res
            .status(403)
            .json({ error: 'Access denied: You do not own this event' });
      }

      next();
   } catch (error) {
      console.error('Event ownership check failed:', error);
      return res.status(500).json({ error: 'Internal server error' });
   }
};

export const requireEventOwnershipForBody = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const user = req.user;
      if (!user) {
         return res.status(401).json({ error: 'Authentication required' });
      }

      // Admins can access all events
      if (user.role === 'ADMIN') {
         return next();
      }

      // For organizers, check event ownership from body
      const eventId = req.body.eventId;
      if (!eventId) {
         return next(); // Let controller handle missing eventId
      }

      const event = await prisma.event.findUnique({
         where: { id: eventId },
         select: { organizerId: true },
      });

      if (!event) {
         return res.status(404).json({ error: 'Event not found' });
      }

      // If event has no organizer, allow access (backward compatibility)
      if (!event.organizerId) {
         return next();
      }

      // Check if user owns the event
      if (event.organizerId !== user.id) {
         return res
            .status(403)
            .json({ error: 'Access denied: You do not own this event' });
      }

      next();
   } catch (error) {
      console.error('Event ownership check failed:', error);
      return res.status(500).json({ error: 'Internal server error' });
   }
};
