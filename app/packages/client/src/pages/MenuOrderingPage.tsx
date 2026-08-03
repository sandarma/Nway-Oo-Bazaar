import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
   eventDate: string;
   location: string;
   preOrderClose: string | null;
   pickupLocations: string | null;
   menuItems: MenuItem[];
};

type CartItem = {
   menuItemId: number;
   name: string;
   price: number;
   qty: number;
   maxQty: number;
};

const categoryLabels: Record<string, string> = {
   MAIN_DISH: 'Main Dishes',
   SNACK: 'Snacks',
   DESSERT: 'Desserts',
   DRINK: 'Drinks',
   CINEMA_TICKET: 'Cinema Tickets',
   RAFFLE_TICKET: 'Raffle Tickets',
};

const categoryOrder = [
   'MAIN_DISH',
   'SNACK',
   'DESSERT',
   'DRINK',
   'CINEMA_TICKET',
   'RAFFLE_TICKET',
];

export default function MenuOrderingPage() {
   const { eventId } = useParams<{ eventId: string }>();
   const navigate = useNavigate();

   const [event, setEvent] = useState<Event | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(false);

   const [cart, setCart] = useState<CartItem[]>([]);
   const [name, setName] = useState('');
   const [phone, setPhone] = useState('');
   const [note, setNote] = useState('');
   const [paymentMode, setPaymentMode] = useState<'IN_CASH' | 'BANK_TRANSFER'>(
      'BANK_TRANSFER'
   );
   const [pickupLocation, setPickupLocation] = useState('');
   const [submitting, setSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState('');
   const [phoneError, setPhoneError] = useState('');

   const isPhoneValid = (value: string) => {
      const digits = value.replace(/[\s\-().]/g, '');
      return (
         digits.length >= 7 && digits.length <= 15 && /^\+?\d+$/.test(digits)
      );
   };

   const validatePhone = (value: string) => {
      if (value.length === 0) {
         setPhoneError('');
         return false;
      }
      if (!isPhoneValid(value)) {
         setPhoneError('Please enter a valid phone number (e.g. 021 123 456)');
         return false;
      }
      setPhoneError('');
      return true;
   };

   useEffect(() => {
      if (!eventId) return;
      setLoading(true);
      axios
         .get(`/api/events/${eventId}`)
         .then((res) => setEvent(res.data.event))
         .catch(() => setError(true))
         .finally(() => setLoading(false));
   }, [eventId]);

   const updateQty = (menuItemId: number, delta: number) => {
      setCart((prev) => {
         const existing = prev.find((c) => c.menuItemId === menuItemId);
         if (existing) {
            const newQty = existing.qty + delta;
            if (newQty <= 0) {
               return prev.filter((c) => c.menuItemId !== menuItemId);
            }
            return prev.map((c) =>
               c.menuItemId === menuItemId
                  ? { ...c, qty: Math.min(newQty, c.maxQty) }
                  : c
            );
         }
         if (delta > 0 && event) {
            const item = event.menuItems.find((i) => i.id === menuItemId);
            if (item) {
               return [
                  ...prev,
                  {
                     menuItemId,
                     name: item.name,
                     price: item.price,
                     qty: 1,
                     maxQty: item.stockQty,
                  },
               ];
            }
         }
         return prev;
      });
   };

   const setQty = (menuItemId: number, qty: number) => {
      setCart((prev) => {
         const existing = prev.find((c) => c.menuItemId === menuItemId);
         if (!existing) return prev;
         if (qty <= 0) {
            return prev.filter((c) => c.menuItemId !== menuItemId);
         }
         return prev.map((c) =>
            c.menuItemId === menuItemId
               ? { ...c, qty: Math.min(qty, c.maxQty) }
               : c
         );
      });
   };

   const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
   const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!event || cart.length === 0 || !name.trim() || !phone.trim()) return;
      if (!validatePhone(phone)) return;
      if (event.eventType === 'FOOD_FAIR' && !pickupLocation) {
         setSubmitError('Please select a pickup location');
         return;
      }

      setSubmitting(true);
      setSubmitError('');

      try {
         const res = await axios.post('/api/orders', {
            eventId: event.id,
            paymentMode,
            pickupLocation:
               event.eventType === 'FOOD_FAIR' ? pickupLocation : undefined,
            customer: { name: name.trim(), phone: phone.trim() },
            items: cart.map((c) => ({
               menuItemId: c.menuItemId,
               quantity: c.qty,
            })),
            note: note.trim() || null,
         });

         const orderNumber = res.data.orderNumber;
         navigate('/order-confirmation', {
            state: { orderNumber, eventName: event.name, paymentMode },
         });
      } catch (err: unknown) {
         let message = 'Failed to place order. Please try again.';
         if (axios.isAxiosError(err) && err.response?.data?.error) {
            const errorData = err.response.data.error;
            if (typeof errorData === 'string') {
               message = errorData;
            } else if (errorData._errors?.length) {
               message = errorData._errors.join(', ');
            } else if (typeof errorData === 'object') {
               message = JSON.stringify(errorData);
            }
         }
         setSubmitError(message);
      } finally {
         setSubmitting(false);
      }
   };

   if (loading) {
      return (
         <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
               <div className="h-8 bg-muted rounded w-1/3" />
               <div className="h-4 bg-muted rounded w-1/4" />
               <div className="h-64 bg-muted rounded" />
            </div>
         </div>
      );
   }

   if (error || !event) {
      return (
         <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-2">Event not found</h1>
            <Link to="/events" className="text-sm text-primary hover:underline">
               ← Back to Events
            </Link>
         </div>
      );
   }

   const grouped = categoryOrder
      .map((cat) => ({
         category: cat,
         label: categoryLabels[cat] ?? cat,
         items: event.menuItems.filter(
            (item) => item.category === cat && !item.isSoldOut
         ),
      }))
      .filter((group) => group.items.length > 0);

   return (
      <div className="max-w-6xl mx-auto px-4 py-12">
         {/* Back link */}
         <div className="mb-6 flex justify-end">
            <Link
               to={`/events/${event.id}`}
               className="text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
            >
               ← Back to {event.name} Event
            </Link>
         </div>

         <h1 className="text-3xl font-bold mb-1">Place Your Order</h1>
         <p className="text-muted-foreground mb-8">
            {event.name} ·{' '}
            {new Date(event.eventDate).toLocaleDateString('en-NZ', {
               weekday: 'long',
               month: 'long',
               day: 'numeric',
            })}
         </p>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menu items */}
            <div className="lg:col-span-2 space-y-8">
               {grouped.map((group) => (
                  <div key={group.category}>
                     <h2 className="font-semibold text-lg mb-4 text-muted-foreground">
                        {group.label}
                     </h2>
                     <div className="space-y-3">
                        {group.items.map((item) => {
                           const cartItem = cart.find(
                              (c) => c.menuItemId === item.id
                           );
                           const qty = cartItem?.qty ?? 0;

                           return (
                              <div
                                 key={item.id}
                                 className="flex items-center gap-4 border border-border rounded-lg p-4"
                              >
                                 <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                       {item.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                       ${item.price.toFixed(2)} ·{' '}
                                       {item.stockQty} available
                                    </p>
                                 </div>

                                 {/* Quantity controls */}
                                 <div className="flex items-center gap-2">
                                    {qty > 0 && (
                                       <>
                                          <button
                                             type="button"
                                             onClick={() =>
                                                updateQty(item.id, -1)
                                             }
                                             className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-sm hover:bg-accent transition-colors"
                                          >
                                             −
                                          </button>
                                          <input
                                             type="number"
                                             value={qty}
                                             onChange={(e) =>
                                                setQty(
                                                   item.id,
                                                   parseInt(e.target.value) || 0
                                                )
                                             }
                                             className="w-12 h-8 text-center border border-border rounded-md text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                          />
                                       </>
                                    )}
                                    <button
                                       type="button"
                                       onClick={() => updateQty(item.id, 1)}
                                       disabled={qty >= item.stockQty}
                                       className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                       +
                                    </button>
                                 </div>

                                 {/* Line total */}
                                 {qty > 0 && (
                                    <p className="text-sm font-medium w-16 text-right">
                                       ${(item.price * qty).toFixed(2)}
                                    </p>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  </div>
               ))}
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-1">
               <div className="border border-border rounded-xl p-5 sticky top-24">
                  <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

                  {cart.length === 0 ? (
                     <p className="text-sm text-muted-foreground">
                        Select items from the menu to get started.
                     </p>
                  ) : (
                     <>
                        <div className="space-y-3 mb-4">
                           {cart.map((item) => (
                              <div
                                 key={item.menuItemId}
                                 className="flex justify-between text-sm"
                              >
                                 <span className="truncate mr-2">
                                    {item.name} × {item.qty}
                                 </span>
                                 <span className="whitespace-nowrap">
                                    ${(item.price * item.qty).toFixed(2)}
                                 </span>
                              </div>
                           ))}
                        </div>

                        <div className="border-t border-border pt-3 mb-6">
                           <div className="flex justify-between font-semibold">
                              <span>
                                 Total ({itemCount} item
                                 {itemCount !== 1 ? 's' : ''})
                              </span>
                              <span>${total.toFixed(2)}</span>
                           </div>
                        </div>

                        {/* Customer info form */}
                        <form onSubmit={handleSubmit} className="space-y-3">
                           <div>
                              <label className="text-sm font-medium">
                                 Your Name *
                              </label>
                              <input
                                 type="text"
                                 value={name}
                                 onChange={(e) => setName(e.target.value)}
                                 required
                                 placeholder="e.g. Sandar"
                                 className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-background"
                              />
                           </div>
                           <div>
                              <label className="text-sm font-medium">
                                 Phone Number *
                              </label>
                              <input
                                 type="tel"
                                 value={phone}
                                 onChange={(e) => {
                                    setPhone(e.target.value);
                                    validatePhone(e.target.value);
                                 }}
                                 required
                                 placeholder="e.g. 021 123 456"
                                 className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-background"
                              />
                              {phoneError && (
                                 <p className="text-xs text-destructive mt-1">
                                    {phoneError}
                                 </p>
                              )}
                           </div>
                           <div>
                              <label className="text-sm font-medium">
                                 Note{' '}
                                 <span className="text-muted-foreground font-normal">
                                    (optional)
                                 </span>
                              </label>
                              <textarea
                                 value={note}
                                 onChange={(e) => setNote(e.target.value)}
                                 rows={2}
                                 placeholder="e.g. I will pick up order myself."
                                 className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-background resize-none"
                              />
                           </div>

                           {event.eventType === 'FOOD_FAIR' &&
                              event.pickupLocations && (
                                 <div>
                                    <label className="text-sm font-medium">
                                       Pickup Location *
                                    </label>
                                    <select
                                       value={pickupLocation}
                                       onChange={(e) =>
                                          setPickupLocation(e.target.value)
                                       }
                                       required
                                       className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-background"
                                    >
                                       <option value="">Select location</option>
                                       {event.pickupLocations
                                          .split(',')
                                          .map((loc) => (
                                             <option key={loc} value={loc}>
                                                {loc}
                                             </option>
                                          ))}
                                    </select>
                                 </div>
                              )}

                           <div>
                              <label className="text-sm font-medium">
                                 Payment Mode *
                              </label>
                              <div className="flex gap-4 mt-1">
                                 <label className="flex items-center gap-2">
                                    <input
                                       type="radio"
                                       value="IN_CASH"
                                       checked={paymentMode === 'IN_CASH'}
                                       onChange={(e) =>
                                          setPaymentMode(
                                             e.target.value as
                                                'IN_CASH' | 'BANK_TRANSFER'
                                          )
                                       }
                                       className="text-primary"
                                    />
                                    <span className="text-sm">In Cash</span>
                                 </label>
                                 <label className="flex items-center gap-2">
                                    <input
                                       type="radio"
                                       value="BANK_TRANSFER"
                                       checked={paymentMode === 'BANK_TRANSFER'}
                                       onChange={(e) =>
                                          setPaymentMode(
                                             e.target.value as
                                                'IN_CASH' | 'BANK_TRANSFER'
                                          )
                                       }
                                       className="text-primary"
                                    />
                                    <span className="text-sm">
                                       Bank Transfer
                                    </span>
                                 </label>
                              </div>
                           </div>

                           {submitError && (
                              <p className="text-sm text-destructive">
                                 {submitError}
                              </p>
                           )}

                           <button
                              type="submit"
                              disabled={
                                 submitting ||
                                 cart.length === 0 ||
                                 !name.trim() ||
                                 !phone.trim() ||
                                 !isPhoneValid(phone)
                              }
                              className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              {submitting ? 'Placing Order...' : 'Place Order'}
                           </button>
                        </form>
                     </>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
