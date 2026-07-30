import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getOrderStatusMeta } from '@/lib/orderStatus';

type OrderItem = {
   id: number;
   qty: number;
   unitPrice: number;
   subtotal: number;
   menuItem: {
      name: string;
   };
};

type Order = {
   id: number;
   orderNumber: string;
   status: string;
   total: number;
   note: string | null;
   paymentMode: 'IN_CASH' | 'BANK_TRANSFER' | null;
   createdAt: string;
   customer: {
      name: string;
      phone: string;
   };
   event: {
      id: number;
      name: string;
      eventDate: string;
      location: string;
   };
   items: OrderItem[];
};

export default function OrderConfirmationPage() {
   const location = useLocation();
   const { orderNumber } = (location.state as { orderNumber?: string }) ?? {};

   const [order, setOrder] = useState<Order | null>(null);
   const [loading, setLoading] = useState(() => Boolean(orderNumber));
   const [error, setError] = useState(() => !orderNumber);

   useEffect(() => {
      if (!orderNumber) return;
      axios
         .get(`/api/orders/${orderNumber}`)
         .then((res) => setOrder(res.data))
         .catch(() => setError(true))
         .finally(() => setLoading(false));
   }, [orderNumber]);

   if (loading) {
      return (
         <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
               <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
               <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
               <div className="h-48 bg-muted rounded" />
            </div>
         </div>
      );
   }

   if (error || !order) {
      return (
         <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-2">Order not found</h1>
            <p className="text-muted-foreground mb-4">
               We couldn't find your order. Please check your order number.
            </p>
            <div className="flex justify-end">
               <Link
                  to="/events"
                  className="text-sm text-primary hover:underline text-right"
               >
                  ← Browse Events
               </Link>
            </div>
         </div>
      );
   }

   return (
      <div className="max-w-2xl mx-auto px-4 py-12">
         {/* Success icon */}
         <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-4">
               <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
               Thank you for your order, {order.customer.name}.
            </p>
         </div>

         {/* Order number */}
         <div className="bg-muted rounded-xl p-5 text-center mb-6">
            <p className="text-sm text-muted-foreground mb-1">Order Number</p>
            <p className="text-2xl font-bold tracking-wide">
               {order.orderNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
               Please save this for your records.
            </p>
         </div>

         {/* Order details */}
         <div className="border border-border rounded-xl p-5 mb-6">
            <div className="flex justify-between text-sm mb-1">
               <span className="text-muted-foreground">Event</span>
               <span className="font-medium">{order.event.name}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
               <span className="text-muted-foreground">Event Date</span>
               <span>
                  {new Date(order.event.eventDate).toLocaleDateString('en-NZ', {
                     weekday: 'long',
                     month: 'long',
                     day: 'numeric',
                  })}
               </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
               <span className="text-muted-foreground">Pickup Location</span>
               <span>{order.event.location}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
               <span className="text-muted-foreground">Payment Mode</span>
               <span className="font-medium">
                  {order.paymentMode === 'IN_CASH'
                     ? 'In Cash'
                     : order.paymentMode === 'BANK_TRANSFER'
                       ? 'Bank Transfer'
                       : '-'}
               </span>
            </div>
            <div className="flex justify-between text-sm">
               <span className="text-muted-foreground">Status</span>
               <span className="font-medium">
                  {getOrderStatusMeta(order.status).label}
               </span>
            </div>
         </div>

         {/* Items */}
         <div className="border border-border rounded-xl p-5 mb-6">
            <h2 className="font-semibold mb-3">Order Items</h2>
            <div className="space-y-2">
               {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                     <span>
                        {item.menuItem.name} × {item.qty}
                     </span>
                     <span>${item.subtotal.toFixed(2)}</span>
                  </div>
               ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 flex justify-between font-semibold">
               <span>Total</span>
               <span>${order.total.toFixed(2)}</span>
            </div>
         </div>

         {/* Note */}
         {order.note && (
            <div className="bg-muted rounded-xl p-5 mb-6">
               <p className="text-sm text-muted-foreground mb-1">Your Note</p>
               <p className="text-sm">{order.note}</p>
            </div>
         )}

         {order.paymentMode === 'BANK_TRANSFER' && (
            <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-5 mb-8">
               <h2 className="font-semibold mb-2">📦 Next Steps</h2>
               <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Upload your payment screenshot.</li>
                  <li>Keep your order number handy for pickup.</li>
                  <li>Pick up your order on the event day.</li>
               </ol>
            </div>
         )}

         {order.paymentMode === 'IN_CASH' && (
            <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-5 mb-8">
               <h2 className="font-semibold mb-2">💵 Cash Payment</h2>
               <p className="text-sm text-muted-foreground">
                  Please pay in cash at the event when you pick up your order.
               </p>
            </div>
         )}

         {/* Actions */}
         <div className="flex flex-col sm:flex-row gap-3">
            <Link
               to={`/events/${order.event.id}`}
               className="flex-1 text-center border border-border px-4 py-2.5 rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
               Back to Event
            </Link>
            {order.paymentMode === 'BANK_TRANSFER' && (
               <Link
                  to={`/payment-upload?order=${order.orderNumber}`}
                  className="flex-1 text-center bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
               >
                  Upload Payment
               </Link>
            )}
         </div>
      </div>
   );
}
