import { type Event } from '@prisma/client';
import { prisma } from '../prisma';

export const eventRepository = {
   async createEvent(data: Partial<Event>) {
      // INSERT INTO events (name, eventType, eventInfo, eventDate, location, preOrderClose) VALUES (...)
      return prisma.event.create({
         data: {
            name: data.name || '', // Default to an empty string if undefined
            eventType: (data.eventType as any) || 'FOOD_FAIR',
            eventInfo: data.eventInfo,
            hostedBy: data.hostedBy,
            pickupInfo: data.pickupInfo,
            paymentInfo: data.paymentInfo,
            pickupLocations: (data as any).pickupLocations,
            eventDate: data.eventDate ? new Date(data.eventDate) : new Date(), // Default to current date if undefined
            location: data.location || '', // Default to an empty string if undefined
            preOrderClose: data.preOrderClose
               ? new Date(data.preOrderClose)
               : undefined,
         },
      });
   },
   async getEvents(): Promise<Event[]> {
      // SELECT * FROM events  ORDER BY eventDate DESC
      return prisma.event.findMany({
         orderBy: { eventDate: 'desc' },
      });
   },

   async getActiveEvents(): Promise<Event[]> {
      // SELECT * FROM events WHERE eventDate >= NOW() ORDER BY eventDate ASC
      //   console.log('Getting active events');
      //   console.log(await prisma.event.findFirst());
      return prisma.event.findMany({
         where: { eventDate: { gte: new Date() } }, // only get upcoming events
         orderBy: { eventDate: 'desc' },
      });
   },

   async getEventById(eventId: number): Promise<Event | null> {
      // SELECT * FROM events WHERE id = @eventId
      return prisma.event.findUnique({
         where: { id: eventId },
         include: {
            menuItems: {
               orderBy: { orderIndex: 'asc' },
            },
         },
      });
   },

   async updateEvent(eventid: number, data: Partial<Event>) {
      // UPDATE events SET ... WHERE id = @eventId
      return prisma.event.update({
         where: { id: eventid },
         data: {
            name: data.name,
            eventType: data.eventType as any,
            eventInfo: data.eventInfo,
            hostedBy: data.hostedBy,
            pickupInfo: data.pickupInfo,
            paymentInfo: data.paymentInfo,
            pickupLocations: (data as any).pickupLocations,
            eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
            location: data.location,
            preOrderClose: data.preOrderClose
               ? new Date(data.preOrderClose)
               : undefined,
         },
      });
   },

   async deleteEvent(eventId: number): Promise<void> {
      // DELETE FROM events WHERE id = @eventId
      await prisma.event.delete({
         where: { id: eventId },
      });
   },
};
