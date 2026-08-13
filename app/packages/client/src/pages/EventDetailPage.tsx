import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

type MenuItem = {
   id: number;
   name: string;
   category: string;
   price: number;
   stockQty: number;
   isSoldOut: boolean;
};

type Event = {
   id: number;
   name: string;
   eventType: string;
   eventInfo: string | null;
   iconUrl: string | null;
   hostedBy: string | null;
   pickupInfo: string | null;
   paymentInfo: string | null;
   eventDate: string;
   location: string;
   preOrderClose: string | null;
   pickupLocations: string | null;
   menuItems: MenuItem[];
};

export default function EventDetailPage() {
   const { eventId } = useParams<{ eventId: string }>();
   const [event, setEvent] = useState<Event | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(false);

   useEffect(() => {
      if (!eventId) return;
      setLoading(true);
      axios
         .get(`/api/events/${eventId}`)
         .then((res) => setEvent(res.data.event))
         .catch(() => setError(true))
         .finally(() => setLoading(false));
   }, [eventId]);

   if (loading) {
      return (
         <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
               <div className="h-8 bg-muted rounded w-1/3" />
               <div className="h-4 bg-muted rounded w-1/4" />
               <div className="h-32 bg-muted rounded" />
            </div>
         </div>
      );
   }

   if (error || !event) {
      return (
         <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-2">Event not found</h1>
            <p className="text-muted-foreground mb-4">
               The event you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/events" className="text-sm text-primary hover:underline">
               ← Back to Events
            </Link>
         </div>
      );
   }

   const now = new Date();
   const isPast = new Date(event.eventDate) < now;
   const isPreOrderClosed =
      event.preOrderClose && new Date(event.preOrderClose) < now;

   // Group menu items by category
   const eventTypeLabel = event.eventType.replace(/_/g, ' ');

   return (
      <div className="max-w-6xl mx-auto px-4 py-12">
         {/* Back link */}
         <div className="mb-6 flex justify-end">
            <Link
               to="/events"
               className="text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
            >
               ← Back to Events
            </Link>
         </div>

         {/* Event header */}
         <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8">
            {event.iconUrl && (
               <img
                  src={event.iconUrl}
                  alt=""
                  className="w-16 h-16 rounded-xl border-2 border-border object-cover flex-shrink-0"
               />
            )}
            <div>
               <h1 className="text-3xl font-bold mb-1">{event.name}</h1>
               <p className="text-muted-foreground">
                  {new Date(event.eventDate).toLocaleDateString('en-NZ', {
                     weekday: 'long',
                     year: 'numeric',
                     month: 'long',
                     day: 'numeric',
                  })}
                  {' · '}
                  {event.location}
               </p>
               <p className="text-sm text-primary font-medium mt-1">
                  {eventTypeLabel}
               </p>
               {event.hostedBy && (
                  <p className="text-sm text-primary font-medium mt-1">
                     Hosted by {event.hostedBy}
                  </p>
               )}
               {event.eventType === 'FOOD_FAIR' && event.pickupLocations && (
                  <p className="text-sm text-muted-foreground mt-1">
                     Pickup locations:{' '}
                     {event.pickupLocations
                        .split(',')
                        .map((l) => l.trim())
                        .join(', ')}
                  </p>
               )}
            </div>
         </div>

         {/* Event info */}
         {event.eventInfo && (
            <div className="bg-muted rounded-xl p-6 mb-8">
               <h2 className="font-semibold mb-2">About this event</h2>
               <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {event.eventInfo}
               </p>
            </div>
         )}

         {/* Pre-order deadline banner */}
         {event.preOrderClose && !isPast && (
            <div
               className={`rounded-xl p-4 mb-8 flex items-center gap-3 ${
                  isPreOrderClosed
                     ? 'bg-destructive/10 text-destructive'
                     : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
               }`}
            >
               <span className="text-2xl">⏰</span>
               <div>
                  <p className="font-medium text-sm">
                     {isPreOrderClosed
                        ? 'Pre-order is closed'
                        : `Pre-order closes ${new Date(
                             event.preOrderClose
                          ).toLocaleDateString('en-NZ', {
                             weekday: 'long',
                             month: 'long',
                             day: 'numeric',
                          })} at 11:59 PM`}
                  </p>
               </div>
            </div>
         )}

         {/* Menu items — hidden for now
         {grouped.length > 0 && (
            <div className="mb-8">
               <h2 className="text-2xl font-bold mb-6">Menu</h2>
               <div className="space-y-8">
                  {grouped.map((group) => (
                     <div key={group.category}>
                        <h3 className="font-semibold text-lg mb-4 text-muted-foreground">
                           {group.label}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           {group.items.map((item) => (
                              <div
                                 key={item.id}
                                 className={`border border-border rounded-lg p-4 ${
                                    item.isSoldOut ? 'opacity-50' : ''
                                 }`}
                              >
                                 <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                       <p className="font-medium truncate">
                                          {item.name}
                                       </p>
                                    </div>
                                    <span className="font-semibold text-sm whitespace-nowrap">
                                       ${item.price.toFixed(2)}
                                    </span>
                                 </div>
                                 <div className="mt-2">
                                    {item.isSoldOut ? (
                                       <span className="text-xs font-medium text-destructive">
                                          Sold out
                                       </span>
                                    ) : (
                                       <span className="text-xs text-muted-foreground">
                                          {item.stockQty} available
                                       </span>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}
         */}

         {/* Pickup & Payment info */}
         {(event.pickupInfo || event.paymentInfo) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
               {event.pickupInfo && (
                  <div className="bg-muted rounded-xl p-5">
                     <h3 className="font-semibold mb-2">📦 Pickup Info</h3>
                     <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {event.pickupInfo}
                     </p>
                  </div>
               )}
               {event.paymentInfo && (
                  <div className="bg-muted rounded-xl p-5">
                     <h3 className="font-semibold mb-2">💳 Payment Info</h3>
                     <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {event.paymentInfo}
                     </p>
                  </div>
               )}
            </div>
         )}

         {/* Order button */}
         {!isPast && !isPreOrderClosed && (
            <div className="text-center">
               <Link
                  to={`/events/${event.id}/order`}
                  className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
               >
                  Order Now
               </Link>
            </div>
         )}
      </div>
   );
}
