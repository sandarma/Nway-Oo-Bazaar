import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, MapPin, Clock, Edit, Trash2 } from 'lucide-react';

interface Event {
   id: number;
   name: string;
   eventType: string;
   eventInfo: string;
   eventDate: string;
   location: string;
   preOrderClose: string | null;
   organizerId: number | null;
   hostedBy: string | null;
   pickupInfo: string | null;
   paymentInfo: string | null;
   pickupLocations: string | null;
   createdAt: string;
}

export default function EventsPage() {
   const { toast } = useToast();
   const [events, setEvents] = useState<Event[]>([]);
   const [loading, setLoading] = useState(true);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [editingEvent, setEditingEvent] = useState<Event | null>(null);

   useEffect(() => {
      fetchEvents();
   }, []);

   const fetchEvents = async () => {
      try {
         const response = await api.get('/events');
         setEvents(response.data.events);
      } catch (error) {
         console.error('Failed to fetch events:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleDelete = async (eventId: number) => {
      if (!confirm('Are you sure you want to delete this event?')) {
         return;
      }

      try {
         await api.delete(`/events/${eventId}`);
         setEvents(events.filter((e) => e.id !== eventId));
      } catch (error) {
         console.error('Failed to delete event:', error);
         toast('Failed to delete event', 'error');
      }
   };

   const handleCreate = async (eventData: Partial<Event>) => {
      try {
         const response = await api.post('/events', eventData);
         setEvents([response.data.event, ...events]);
         setShowCreateModal(false);
      } catch (error) {
         console.error('Failed to create event:', error);
         toast('Failed to create event', 'error');
      }
   };

   const handleUpdate = async (eventData: Partial<Event>) => {
      if (!editingEvent) return;

      try {
         const response = await api.patch(
            `/events/${editingEvent.id}`,
            eventData
         );
         setEvents(
            events.map((e) =>
               e.id === editingEvent.id ? response.data.event : e
            )
         );
         setEditingEvent(null);
      } catch (error) {
         console.error('Failed to update event:', error);
         toast('Failed to update event', 'error');
      }
   };

   if (loading) {
      return (
         <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-32 animate-pulse" />
            <div className="h-12 bg-muted rounded animate-pulse" />
            {[...Array(3)].map((_, i) => (
               <div
                  key={i}
                  className="h-32 bg-muted rounded-lg animate-pulse"
               />
            ))}
         </div>
      );
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Events</h1>
            <button
               onClick={() => setShowCreateModal(true)}
               className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
               <Plus className="w-4 h-4" />
               Create Event
            </button>
         </div>

         {/* Events List */}
         <div className="space-y-4">
            {events.length === 0 ? (
               <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No events yet</p>
                  <button
                     onClick={() => setShowCreateModal(true)}
                     className="mt-4 text-primary hover:underline"
                  >
                     Create your first event
                  </button>
               </div>
            ) : (
               events.map((event) => (
                  <EventCard
                     key={event.id}
                     event={event}
                     onEdit={() => setEditingEvent(event)}
                     onDelete={() => handleDelete(event.id)}
                  />
               ))
            )}
         </div>

         {/* Create Modal */}
         {showCreateModal && (
            <EventModal
               title="Create Event"
               onClose={() => setShowCreateModal(false)}
               onSubmit={handleCreate}
            />
         )}

         {/* Edit Modal */}
         {editingEvent && (
            <EventModal
               title="Edit Event"
               event={editingEvent}
               onClose={() => setEditingEvent(null)}
               onSubmit={handleUpdate}
            />
         )}
      </div>
   );
}

function EventCard({
   event,
   onEdit,
   onDelete,
}: {
   event: Event;
   onEdit: () => void;
   onDelete: () => void;
}) {
   const isPast = new Date(event.eventDate) < new Date();
   const isPreOrderClosed =
      event.preOrderClose && new Date(event.preOrderClose) < new Date();

   const eventTypeLabel: Record<string, string> = {
      FOOD_FAIR: 'Food Fair',
      RAFFLE_TICKET: 'Raffle Ticket',
      CINEMA_TICKET: 'Cinema Ticket',
   };

   const eventTypeColor: Record<string, string> = {
      FOOD_FAIR: 'bg-green-100 text-green-800',
      RAFFLE_TICKET: 'bg-purple-100 text-purple-800',
      CINEMA_TICKET: 'bg-blue-100 text-blue-800',
   };

   return (
      <div
         className={`p-4 bg-card border border-border rounded-lg ${isPast ? 'opacity-60' : ''}`}
      >
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
               <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                     {event.name}
                  </h3>
                  <span
                     className={`px-2 py-0.5 text-xs font-medium rounded ${eventTypeColor[event.eventType] || 'bg-gray-100 text-gray-800'}`}
                  >
                     {eventTypeLabel[event.eventType] || event.eventType}
                  </span>
               </div>
               <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                     <Calendar className="w-4 h-4" />
                     {new Date(event.eventDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                     <MapPin className="w-4 h-4" />
                     {event.location}
                  </span>
                  {event.preOrderClose && (
                     <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Pre-order closes:{' '}
                        {new Date(event.preOrderClose).toLocaleDateString()}
                     </span>
                  )}
               </div>
               <div className="flex gap-2 mt-2">
                  {isPast && (
                     <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                        Past
                     </span>
                  )}
                  {isPreOrderClosed && (
                     <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Pre-order Closed
                     </span>
                  )}
               </div>
               {(event.hostedBy || event.pickupLocations) && (
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                     {event.hostedBy && (
                        <span>
                           Hosted by{' '}
                           <span className="font-medium text-foreground">
                              {event.hostedBy}
                           </span>
                        </span>
                     )}
                     {event.eventType === 'FOOD_FAIR' &&
                        event.pickupLocations && (
                           <span>
                              Pickup locations:{' '}
                              <span className="font-medium text-foreground">
                                 {event.pickupLocations}
                              </span>
                           </span>
                        )}
                  </div>
               )}
            </div>
            {!isPast && (
               <div className="flex items-center gap-2">
                  <Link
                     to={`/dashboard/orders?eventId=${event.id}`}
                     className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20"
                  >
                     View Orders
                  </Link>
                  <Link
                     to={`/dashboard/menu?eventId=${event.id}`}
                     className="px-3 py-1.5 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20"
                  >
                     {event.eventType === 'FOOD_FAIR'
                        ? 'View Menu'
                        : 'View Item'}
                  </Link>
                  <button
                     onClick={onEdit}
                     className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                     <Edit className="w-4 h-4" />
                  </button>
                  <button
                     onClick={onDelete}
                     className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                  >
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            )}
         </div>
      </div>
   );
}

function EventModal({
   title,
   event,
   onClose,
   onSubmit,
}: {
   title: string;
   event?: Event;
   onClose: () => void;
   onSubmit: (data: Partial<Event>) => void;
}) {
   const [formData, setFormData] = useState({
      name: event?.name || '',
      eventType: event?.eventType || 'FOOD_FAIR',
      eventInfo: event?.eventInfo || '',
      eventDate: event?.eventDate
         ? new Date(event.eventDate).toISOString().slice(0, 16)
         : '',
      location: event?.location || '',
      preOrderClose: event?.preOrderClose
         ? new Date(event.preOrderClose).toISOString().slice(0, 16)
         : '',
      hostedBy: event?.hostedBy || '',
      pickupInfo: event?.pickupInfo || '',
      paymentInfo: event?.paymentInfo || '',
      pickupLocations: event?.pickupLocations || '',
   });

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
         ...formData,
         eventDate: new Date(formData.eventDate).toISOString(),
         preOrderClose: formData.preOrderClose
            ? new Date(formData.preOrderClose).toISOString()
            : null,
      });
   };

   return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
         <div className="bg-card rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
               <h2 className="text-lg font-semibold text-foreground">
                  {title}
               </h2>
               <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-md"
               >
                  ✕
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Event Name *
                  </label>
                  <input
                     type="text"
                     value={formData.name}
                     onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     required
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Event Type *
                  </label>
                  <select
                     value={formData.eventType}
                     onChange={(e) =>
                        setFormData({ ...formData, eventType: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     required
                  >
                     <option value="FOOD_FAIR">Food Fair</option>
                     <option value="RAFFLE_TICKET">Raffle Ticket</option>
                     <option value="CINEMA_TICKET">Cinema Ticket</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Event Info *
                  </label>
                  <textarea
                     value={formData.eventInfo}
                     onChange={(e) =>
                        setFormData({ ...formData, eventInfo: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     rows={3}
                     required
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Event Date *
                     </label>
                     <input
                        type="datetime-local"
                        value={formData.eventDate}
                        onChange={(e) =>
                           setFormData({
                              ...formData,
                              eventDate: e.target.value,
                           })
                        }
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        required
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Pre-order Close *
                     </label>
                     <input
                        type="datetime-local"
                        value={formData.preOrderClose}
                        onChange={(e) =>
                           setFormData({
                              ...formData,
                              preOrderClose: e.target.value,
                           })
                        }
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        required
                     />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Location *
                  </label>
                  <input
                     type="text"
                     value={formData.location}
                     onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     required
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Hosted By *
                  </label>
                  <input
                     type="text"
                     value={formData.hostedBy}
                     onChange={(e) =>
                        setFormData({ ...formData, hostedBy: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     required
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Pickup Info *
                  </label>
                  <textarea
                     value={formData.pickupInfo}
                     onChange={(e) =>
                        setFormData({ ...formData, pickupInfo: e.target.value })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     rows={2}
                     required
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Payment Info *
                  </label>
                  <textarea
                     value={formData.paymentInfo}
                     onChange={(e) =>
                        setFormData({
                           ...formData,
                           paymentInfo: e.target.value,
                        })
                     }
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     rows={2}
                     required
                  />
               </div>
               {formData.eventType === 'FOOD_FAIR' && (
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Pickup Locations *
                     </label>
                     <div className="flex flex-wrap gap-3">
                        {[
                           'In Event',
                           'Downtown CBD',
                           'Hamilton',
                           'Kelston',
                           'Northshore',
                        ].map((loc) => (
                           <label key={loc} className="flex items-center gap-2">
                              <input
                                 type="checkbox"
                                 checked={formData.pickupLocations
                                    ?.split(',')
                                    .includes(loc)}
                                 onChange={(e) => {
                                    const current = formData.pickupLocations
                                       ? formData.pickupLocations.split(',')
                                       : [];
                                    const updated = e.target.checked
                                       ? [...current, loc]
                                       : current.filter((l) => l !== loc);
                                    setFormData({
                                       ...formData,
                                       pickupLocations: updated.join(','),
                                    });
                                 }}
                                 className="rounded border-border"
                              />
                              <span className="text-sm text-foreground">
                                 {loc}
                              </span>
                           </label>
                        ))}
                     </div>
                  </div>
               )}
               <div className="flex gap-3 pt-4">
                  <button
                     type="button"
                     onClick={onClose}
                     className="flex-1 px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
                  >
                     Cancel
                  </button>
                  <button
                     type="submit"
                     className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                     {event ? 'Update' : 'Create'}
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}
