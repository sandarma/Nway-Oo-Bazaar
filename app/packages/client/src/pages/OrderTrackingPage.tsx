import { useCallback, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getOrderStatusMeta } from '@/lib/orderStatus';

type OrderItem = {
   id: number;
   qty: number;
   unitPrice: number;
   subtotal: number;
   menuItem: {
      name: string;
      category: string;
   };
};

type Order = {
   id: number;
   orderNumber: string;
   status: string;
   total: number;
   note: string | null;
   pickupLocation: string | null;
   paymentMode: string | null;
   createdAt: string;
   event: {
      name: string;
      eventType: string;
      eventDate: string;
      location: string;
      pickupInfo: string | null;
      paymentInfo: string | null;
   };
   items: OrderItem[];
   customer: {
      name: string;
      phone: string;
   };
};

export default function OrderTrackingPage() {
   const { orderNumber: urlOrderNumber } = useParams<{ orderNumber: string }>();
   const [inputValue, setInputValue] = useState(urlOrderNumber || '');
   const [order, setOrder] = useState<Order | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   const handleSearch = useCallback(
      async (orderNum?: string) => {
         const num = orderNum || inputValue;
         if (!num) return;

         setLoading(true);
         setError('');
         setOrder(null);

         try {
            const { data } = await axios.get(`/api/orders/${num}`);
            setOrder(data);
         } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
               setError(
                  'Order not found. Please check your order number and try again.'
               );
            } else {
               setError('Something went wrong. Please try again later.');
            }
         } finally {
            setLoading(false);
         }
      },
      [inputValue]
   );

   const status = order ? getOrderStatusMeta(order.status) : null;

   return (
      <div className="max-w-2xl mx-auto px-4 py-10">
         <h1 className="text-2xl font-bold text-foreground mb-2">
            Track Your Order
         </h1>
         <p className="text-muted-foreground mb-6">
            Enter your order number to check the latest status.
         </p>

         {/* Search form */}
         <form
            onSubmit={(e) => {
               e.preventDefault();
               handleSearch();
            }}
            className="flex gap-3 mb-8"
         >
            <input
               type="text"
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               className="flex-1 px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
               placeholder="e.g. ORD-20260712-0002"
            />
            <button
               type="submit"
               disabled={loading || !inputValue}
               className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
            >
               {loading ? 'Checking...' : 'Track'}
            </button>
         </form>

         {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md mb-6">
               {error}
            </div>
         )}

         {order && status && (
            <div className="space-y-6">
               {/* Status banner */}
               <div className={`p-4 rounded-lg ${status.color}`}>
                  <div className="flex items-center gap-2">
                     <span className="text-2xl">{status.icon}</span>
                     <div>
                        <p className="font-semibold">{status.label}</p>
                        <p className="text-sm opacity-75">
                           Order #{order.orderNumber}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Upload payment button — only for bank transfer awaiting upload */}
               {order.status === 'CONFIRMED_BANK_TRANSFER' && (
                  <Link
                     to={`/payment-upload?order=${order.orderNumber}`}
                     className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                     Upload Payment
                  </Link>
               )}

               {/* Event details */}
               <div className="bg-card border border-border rounded-lg p-5">
                  <h2 className="font-semibold text-foreground mb-3">
                     Event Details
                  </h2>
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Event</span>
                        <span className="text-foreground font-medium">
                           {order.event.name}
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="text-foreground">
                           {new Date(order.event.eventDate).toLocaleDateString(
                              'en-NZ',
                              {
                                 weekday: 'long',
                                 year: 'numeric',
                                 month: 'long',
                                 day: 'numeric',
                              }
                           )}
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span className="text-foreground">
                           {order.event.location}
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">
                           Event Type
                        </span>
                        <span className="text-foreground">
                           {order.event.eventType.replace(/_/g, ' ')}
                        </span>
                     </div>
                     {order.event.eventType === 'FOOD_FAIR' && (
                        <div className="flex justify-between">
                           <span className="text-muted-foreground">
                              Pickup Location
                           </span>
                           <span className="text-foreground text-right max-w-[60%]">
                              {order.pickupLocation || '-'}
                           </span>
                        </div>
                     )}
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">
                           Payment Mode
                        </span>
                        <span className="text-foreground">
                           {order.paymentMode === 'IN_CASH'
                              ? 'In Cash'
                              : order.paymentMode === 'BANK_TRANSFER'
                                ? 'Bank Transfer'
                                : '-'}
                        </span>
                     </div>
                     {order.event.pickupInfo && (
                        <div className="flex justify-between">
                           <span className="text-muted-foreground">
                              Pickup Info
                           </span>
                           <span className="text-foreground text-right max-w-[60%]">
                              {order.event.pickupInfo}
                           </span>
                        </div>
                     )}
                  </div>
               </div>

               {/* Order items */}
               <div className="bg-card border border-border rounded-lg p-5">
                  <h2 className="font-semibold text-foreground mb-3">
                     Order Items
                  </h2>
                  <div className="space-y-3">
                     {order.items.map((item) => (
                        <div
                           key={item.id}
                           className="flex justify-between text-sm"
                        >
                           <div>
                              <span className="text-foreground">
                                 {item.menuItem.name}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                 × {item.qty}
                              </span>
                           </div>
                           <span className="text-foreground font-medium">
                              ${item.subtotal.toFixed(2)}
                           </span>
                        </div>
                     ))}
                  </div>
                  <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold">
                     <span className="text-foreground">Total</span>
                     <span className="text-foreground">
                        ${order.total.toFixed(2)}
                     </span>
                  </div>
               </div>

               {/* Customer info */}
               <div className="bg-card border border-border rounded-lg p-5">
                  <h2 className="font-semibold text-foreground mb-3">
                     Customer
                  </h2>
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="text-foreground">
                           {order.customer.name}
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="text-foreground">
                           {order.customer.phone}
                        </span>
                     </div>
                     {order.event.eventType === 'FOOD_FAIR' &&
                        order.pickupLocation && (
                           <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                 Pickup Location
                              </span>
                              <span className="text-foreground">
                                 {order.pickupLocation}
                              </span>
                           </div>
                        )}
                  </div>
               </div>

               {/* Order note */}
               <div className="bg-card border border-border rounded-lg p-5">
                  <h2 className="font-semibold text-foreground mb-2">Note</h2>
                  <p className="text-sm text-muted-foreground">
                     {order.note?.trim() || '-'}
                  </p>
               </div>

               {/* Ordered at */}
               <p className="text-xs text-muted-foreground text-center">
                  Ordered on {new Date(order.createdAt).toLocaleString('en-NZ')}
               </p>
            </div>
         )}
      </div>
   );
}
