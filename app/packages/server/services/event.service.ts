import { type Event } from '@prisma/client';
import { eventRepository } from '../repositories/event.repository';

export const eventService = {
   async createEvent(data: Partial<Event>) {
      return eventRepository.createEvent(data);
   },

   async getEvents(): Promise<Event[]> {
      return eventRepository.getEvents();
   },

   async getActiveEvents(): Promise<Event[]> {
      return eventRepository.getActiveEvents();
   },

   async getEventById(eventId: number): Promise<Event | null> {
      return eventRepository.getEventById(eventId);
   },

   async updateEvent(eventid: number, data: Partial<Event>) {
      return eventRepository.updateEvent(eventid, data);
   },

   async deleteEvent(eventId: number): Promise<void> {
      await eventRepository.deleteEvent(eventId);
   },
};
