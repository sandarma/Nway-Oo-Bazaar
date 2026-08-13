import type { Request, Response } from 'express';
import z from 'zod';
import { eventService } from '../services/event.service';

const EventType = {
   FOOD_FAIR: 'FOOD_FAIR',
   RAFFLE_TICKET: 'RAFFLE_TICKET',
   CINEMA_TICKET: 'CINEMA_TICKET',
} as const;

type EventType = (typeof EventType)[keyof typeof EventType];

const eventCreateRequestSchema = z.object({
   name: z.string().trim().min(1, 'event name is required'),
   eventCodePrefix: z
      .string()
      .trim()
      .min(1, 'event code prefix is required')
      .max(20, 'event code prefix must be 20 characters or less')
      .regex(/^[A-Z0-9]+$/i, 'event code prefix must be alphanumeric'),
   eventType: z.nativeEnum(EventType),
   eventInfo: z.string().trim().min(1, 'event info is required'),
   hostedBy: z.string().trim().min(1, 'hosted by is required'),
   pickupInfo: z.string().trim().min(1, 'pickup info is required'),
   paymentInfo: z.string().trim().min(1, 'payment info is required'),
   eventDate: z.coerce.date(),
   location: z.string().trim().min(1, 'location is required'),
   preOrderClose: z.coerce.date({
      message: 'pre-order close date is required',
   }),
   pickupLocations: z.string().trim().optional(),
});

const eventUpdateRequestSchema = z.object({
   name: z.string().trim().min(1, 'event name is required').optional(),
   eventCodePrefix: z
      .string()
      .trim()
      .max(20, 'event code prefix must be 20 characters or less')
      .regex(/^[A-Z0-9]+$/i, 'event code prefix must be alphanumeric')
      .optional(),
   eventType: z.nativeEnum(EventType).optional(),
   eventInfo: z.string().trim().min(1, 'event info is required').optional(),
   hostedBy: z.string().trim().optional(),
   pickupInfo: z.string().trim().optional(),
   paymentInfo: z.string().trim().optional(),
   eventDate: z.coerce.date().optional(),
   location: z.string().trim().min(1, 'location is required').optional(),
   preOrderClose: z.coerce.date().optional(),
   pickupLocations: z.string().trim().optional(),
});

export const eventController = {
   async createEvent(req: Request, res: Response) {
      // Logic to create a new event
      const parseResult = eventCreateRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }
      try {
         const {
            name,
            eventCodePrefix,
            eventType,
            eventInfo,
            hostedBy,
            pickupInfo,
            paymentInfo,
            eventDate,
            location,
            preOrderClose,
            pickupLocations,
         } = parseResult.data;

         const normalizedPreOrderClose: Date | undefined = preOrderClose;
         if (normalizedPreOrderClose instanceof Date) {
            normalizedPreOrderClose.setHours(23, 59, 59, 999);
         }

         const event = await eventService.createEvent({
            name,
            eventCodePrefix: eventCodePrefix.toUpperCase(),
            eventType: eventType as EventType,
            eventInfo,
            hostedBy,
            pickupInfo,
            paymentInfo,
            eventDate,
            location,
            preOrderClose: normalizedPreOrderClose,
            pickupLocations,
         });

         return res.json({ event });
      } catch (error) {
         console.error('createEvent error:', error);
         return res.status(500).json({ error: 'Failed to create event' });
      }
   },
   async getEvents(req: Request, res: Response) {
      // Logic to retrieve all events
      try {
         const events = await eventService.getEvents();
         return res.json({ events: events }); // Return an array of events
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve events' });
      }
   },
   async getAciveEvents(req: Request, res: Response) {
      // logic to retrive all active events
      try {
         const activeEvents = await eventService.getActiveEvents();
         return res.json({ activeEvents: activeEvents }); // Return an array of active events
      } catch (error) {
         return res
            .status(500)
            .json({ error: 'Failed to retrieve active events' });
      }
   },
   async getEventById(req: Request, res: Response) {
      // logic to retrive an event by ID. Include menu items and event details
      try {
         const eventId = Number(req.params.id);

         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const event = await eventService.getEventById(eventId);
         return res.json({ event: event }); // Return the event with the specified ID
      } catch (error) {
         console.error('getEventById error:', error);
         return res.status(500).json({ error: 'Failed to retrieve event' });
      }
   },
   async updateEvent(req: Request, res: Response) {
      const parseResult = eventUpdateRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }
      // logic to update an event by ID
      try {
         const eventId = Number(req.params.id);

         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const {
            name,
            eventType,
            eventInfo,
            hostedBy,
            pickupInfo,
            paymentInfo,
            eventDate,
            location,
            preOrderClose,
            pickupLocations,
         } = parseResult.data;

         const event = await eventService.updateEvent(eventId, {
            name,
            eventType: eventType as EventType | undefined,
            eventInfo,
            hostedBy,
            pickupInfo,
            paymentInfo,
            eventDate,
            location,
            preOrderClose,
            pickupLocations,
         });

         return res.json({ event });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to update event' });
      }
   },
   async deleteEvent(req: Request, res: Response) {
      // Logic to delete an event by ID
      try {
         const eventId = Number(req.params.id);

         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         await eventService.deleteEvent(eventId);

         return res.json({
            message: `Event deleted successfully`,
         });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to delete event' });
      }
   },
};
