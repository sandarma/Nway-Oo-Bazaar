import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Calendar } from 'lucide-react';

interface Event {
   id: number;
   name: string;
   eventDate: string;
}

export default function EventSelector() {
   const [searchParams, setSearchParams] = useSearchParams();
   const [events, setEvents] = useState<Event[]>([]);
   const [loading, setLoading] = useState(true);

   const selectedEventId = searchParams.get('eventId');

   useEffect(() => {
      const fetchEvents = async () => {
         try {
            const response = await api.get('/events');
            setEvents(response.data.events);
            // Auto-select first event if none selected
            if (
               !searchParams.get('eventId') &&
               response.data.events.length > 0
            ) {
               const firstEvent = response.data.events[0];
               setSearchParams(
                  { eventId: String(firstEvent.id) },
                  { replace: true }
               );
            }
         } catch (error) {
            console.error('Failed to fetch events:', error);
         } finally {
            setLoading(false);
         }
      };

      fetchEvents();
   }, []);

   const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value) {
         setSearchParams({ eventId: value }, { replace: true });
      }
   };

   if (loading) {
      return (
         <div className="h-12 bg-muted rounded-lg animate-pulse w-full max-w-sm" />
      );
   }

   if (events.length === 0) {
      return (
         <div className="text-sm text-muted-foreground">
            No events found. Create an event first.
         </div>
      );
   }

   return (
      <div className="relative w-full max-w-sm">
         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Calendar className="w-5 h-5 text-primary" />
         </div>
         <select
            value={selectedEventId || ''}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-3 border-2 border-primary/50 rounded-lg bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary appearance-none cursor-pointer shadow-sm"
         >
            <option value="">Select an event...</option>
            {events.map((event) => (
               <option key={event.id} value={event.id}>
                  {event.name} —{' '}
                  {new Date(event.eventDate).toLocaleDateString('en-NZ')}
               </option>
            ))}
         </select>
         <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
               className="w-4 h-4 text-muted-foreground"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
               />
            </svg>
         </div>
      </div>
   );
}
