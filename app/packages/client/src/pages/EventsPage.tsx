import { useEffect, useState } from 'react';
import axios from 'axios';
import EventCard, { type EventCardData } from '../components/events/EventCard';

type Filter = 'all' | 'upcoming' | 'past';

export default function EventsPage() {
   const [events, setEvents] = useState<EventCardData[]>([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState<Filter>('upcoming');

   useEffect(() => {
      const endpoint =
         filter === 'upcoming' ? '/api/events/active' : '/api/events';
      setLoading(true);
      axios
         .get(endpoint)
         .then((res) => {
            const data =
               filter === 'upcoming' ? res.data.activeEvents : res.data.events;
            setEvents(data);
         })
         .catch(() => setEvents([]))
         .finally(() => setLoading(false));
   }, [filter]);

   const now = new Date();
   const displayEvents =
      filter === 'past'
         ? events.filter((e) => new Date(e.eventDate) < now)
         : events;

   return (
      <div className="max-w-6xl mx-auto px-4 py-12">
         <h1 className="text-4xl font-bold mb-2">Events</h1>
         <p className="text-muted-foreground mb-8">
            Browse upcoming and past fundraising events.
         </p>

         {/* Filter tabs */}
         <div className="flex gap-2 mb-8">
            {(
               [
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'past', label: 'Past Events' },
                  { key: 'all', label: 'All' },
               ] as const
            ).map((tab) => (
               <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                     filter === tab.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
               >
                  {tab.label}
               </button>
            ))}
         </div>

         {/* Events grid */}
         {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1, 2, 3].map((i) => (
                  <div
                     key={i}
                     className="rounded-2xl border border-border overflow-hidden animate-pulse"
                  >
                     <div className="h-44 bg-muted" />
                     <div className="p-5 space-y-3">
                        <div className="h-6 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                     </div>
                  </div>
               ))}
            </div>
         ) : displayEvents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl">
               <p className="text-muted-foreground">
                  {filter === 'upcoming'
                     ? 'No upcoming events at the moment. Check back soon!'
                     : 'No events found.'}
               </p>
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {displayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
               ))}
            </div>
         )}
      </div>
   );
}
