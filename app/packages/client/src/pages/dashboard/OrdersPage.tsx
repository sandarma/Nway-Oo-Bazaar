import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
   Search,
   Eye,
   CheckCircle,
   XCircle,
   ChevronLeft,
   ChevronRight,
   Image,
   Pencil,
   Plus,
   Trash2,
} from 'lucide-react';
import EventSelector from '@/components/dashboard/EventSelector';
import { getOrderStatusColor, getOrderStatusLabel } from '@/lib/orderStatus';

interface Order {
   id: number;
   orderNumber: string;
   status:
      | 'PENDING'
      | 'CONFIRMED'
      | 'CONFIRMED_IN_CASH'
      | 'CONFIRMED_BANK_TRANSFER'
      | 'PAID_IN_CASH'
      | 'PAID_BANK_TRANSFER'
      | 'COMPLETED'
      | 'CANCELLED';
   total: number;
   note: string | null;
   donation: number;
   discount: number;
   receivedFrom: string | null;
   receivedFromOther: string | null;
   pickupLocation: string | null;
   paymentMode: 'IN_CASH' | 'BANK_TRANSFER' | null;
   paymentScreenshotUrl: string | null;
   createdAt: string;
   customer: {
      name: string;
      phone: string;
   };
   items: {
      menuItemId: number;
      qty: number;
      unitPrice: number;
      subtotal: number;
      menuItem: {
         name: string;
      };
   }[];
   event: {
      id: number;
      name: string;
      preOrderClose: string | null;
   };
}

interface Pagination {
   page: number;
   limit: number;
   total: number;
   totalPages: number;
}

export default function OrdersPage() {
   const { toast } = useToast();
   const [searchParams, setSearchParams] = useSearchParams();
   const [orders, setOrders] = useState<Order[]>([]);
   const [loading, setLoading] = useState(true);
   const [pagination, setPagination] = useState<Pagination | null>(null);
   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
   const [editingOrder, setEditingOrder] = useState<Order | null>(null);
   const [showPaymentModal, setShowPaymentModal] = useState(false);

   const eventId = searchParams.get('eventId');
   const status = searchParams.get('status') || 'ALL';
   const search = searchParams.get('search') || '';
   const page = parseInt(searchParams.get('page') || '1');

   useEffect(() => {
      if (!eventId) return;

      let isMounted = true;

      void (async () => {
         try {
            const params = new URLSearchParams({
               status,
               search,
               page: page.toString(),
               limit: '10',
            });
            const response = await api.get(
               `/dashboard/${eventId}/orders?${params}`
            );
            if (!isMounted) return;
            setOrders(response.data.orders);
            setPagination(response.data.pagination);
         } catch (error) {
            console.error('Failed to fetch orders:', error);
         } finally {
            if (isMounted) {
               setLoading(false);
            }
         }
      })();

      return () => {
         isMounted = false;
      };
   }, [eventId, status, search, page]);

   const handleStatusUpdate = async (
      orderId: number,
      newStatus: Order['status']
   ) => {
      try {
         await api.patch(`/dashboard/orders/${orderId}/status`, {
            status: newStatus,
         });
         setOrders(
            orders.map((o) =>
               o.id === orderId ? { ...o, status: newStatus } : o
            )
         );
         if (selectedOrder?.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
         }
      } catch (error) {
         console.error('Failed to update order status:', error);
         toast('Failed to update order status', 'error');
      }
   };

   const handleOrderUpdated = (updatedOrder: Order) => {
      setOrders((currentOrders) =>
         currentOrders.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
         )
      );
      setSelectedOrder((current) =>
         current?.id === updatedOrder.id ? updatedOrder : current
      );
      setEditingOrder(null);
   };

   const updateSearchParams = (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
         params.set(key, value);
      } else {
         params.delete(key);
      }
      if (key !== 'page') {
         params.set('page', '1');
      }
      setSearchParams(params);
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            <EventSelector />
            <button
               onClick={async () => {
                  try {
                     const res = await api.get(`/export/${eventId}/orders`, {
                        responseType: 'blob',
                     });
                     // Extract filename from Content-Disposition header
                     const disposition = res.headers['content-disposition'];
                     let filename = `orders-${eventId}.csv`;
                     if (disposition) {
                        const match = disposition.match(
                           /filename="?([^";\s]+)"?/
                        );
                        if (match) filename = match[1];
                     }
                     const url = window.URL.createObjectURL(
                        new Blob([res.data])
                     );
                     const link = document.createElement('a');
                     link.href = url;
                     link.setAttribute('download', filename);
                     document.body.appendChild(link);
                     link.click();
                     link.remove();
                     window.URL.revokeObjectURL(url);
                  } catch {
                     toast(
                        'Failed to export orders. Please try again.',
                        'error'
                     );
                  }
               }}
               className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-muted"
            >
               Export CSV
            </button>
         </div>

         {/* Filters */}
         <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <input
                  type="text"
                  placeholder="Search by order number, customer name, or phone..."
                  value={search}
                  onChange={(e) => updateSearchParams('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground"
               />
            </div>
            <select
               value={status}
               onChange={(e) => updateSearchParams('status', e.target.value)}
               className="px-4 py-2 border border-border rounded-md bg-background text-foreground"
            >
               <option value="ALL">All Status</option>
               <option value="PENDING">Pending</option>
               <option value="CONFIRMED">Confirmed</option>
               <option value="CONFIRMED_IN_CASH">Confirmed (In Cash)</option>
               <option value="CONFIRMED_BANK_TRANSFER">
                  Confirmed (Bank Transfer)
               </option>
               <option value="PAID_IN_CASH">Paid (In Cash)</option>
               <option value="PAID_BANK_TRANSFER">Paid (Bank Transfer)</option>
               <option value="COMPLETED">Completed</option>
               <option value="CANCELLED">Cancelled</option>
            </select>
         </div>

         {/* Orders List */}
         {loading ? (
            <div className="space-y-4">
               {[...Array(5)].map((_, i) => (
                  <div
                     key={i}
                     className="h-24 bg-muted rounded-lg animate-pulse"
                  />
               ))}
            </div>
         ) : orders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
               <p className="text-muted-foreground">No orders found</p>
            </div>
         ) : (
            <div className="space-y-4">
               {orders.map((order) => (
                  <OrderCard
                     key={order.id}
                     order={order}
                     onView={() => setSelectedOrder(order)}
                     onEdit={() => setEditingOrder(order)}
                     onStatusUpdate={handleStatusUpdate}
                  />
               ))}
            </div>
         )}

         {/* Pagination */}
         {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
               <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(
                     pagination.page * pagination.limit,
                     pagination.total
                  )}{' '}
                  of {pagination.total} orders
               </p>
               <div className="flex gap-2">
                  <button
                     onClick={() =>
                        updateSearchParams('page', (page - 1).toString())
                     }
                     disabled={page <= 1}
                     className="p-2 border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                     onClick={() =>
                        updateSearchParams('page', (page + 1).toString())
                     }
                     disabled={page >= pagination.totalPages}
                     className="p-2 border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
         )}

         {/* Order Detail Modal */}
         {selectedOrder && (
            <OrderDetailModal
               order={selectedOrder}
               onClose={() => setSelectedOrder(null)}
               onEdit={() => setEditingOrder(selectedOrder)}
               onStatusUpdate={handleStatusUpdate}
               onViewPayment={() => setShowPaymentModal(true)}
            />
         )}

         {editingOrder && (
            <OrderEditModal
               order={editingOrder}
               onClose={() => setEditingOrder(null)}
               onSaved={handleOrderUpdated}
            />
         )}

         {/* Payment Screenshot Modal */}
         {showPaymentModal && selectedOrder?.paymentScreenshotUrl && (
            <PaymentModal
               imageUrl={selectedOrder.paymentScreenshotUrl}
               onClose={() => setShowPaymentModal(false)}
            />
         )}
      </div>
   );
}

function OrderCard({
   order,
   onView,
   onEdit,
   onStatusUpdate,
}: {
   order: Order;
   onView: () => void;
   onEdit: () => void;
   onStatusUpdate: (orderId: number, status: Order['status']) => void;
}) {
   const statusClass = getOrderStatusColor(order.status);
   const statusLabel = getOrderStatusLabel(order.status);
   const canMarkPaid =
      order.status === 'CONFIRMED_IN_CASH' ||
      order.status === 'CONFIRMED_BANK_TRANSFER' ||
      order.status === 'CONFIRMED';

   return (
      <div className="p-4 bg-card border border-border rounded-lg">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
               <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">
                     {order.orderNumber}
                  </span>
                  <span
                     className={`px-2 py-0.5 text-xs font-medium rounded ${statusClass}`}
                  >
                     {statusLabel}
                  </span>
                  {order.paymentScreenshotUrl && (
                     <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                        Uploaded Payment Screenshot
                     </span>
                  )}
               </div>
               <p className="mt-1 font-medium text-foreground">
                  {order.customer.name}
               </p>
               <p className="text-sm text-muted-foreground">
                  {order.customer.phone}
               </p>
               <p className="text-sm text-muted-foreground mt-1">
                  {order.items.length} item(s) • ${order.total.toFixed(2)}
               </p>
               <p className="text-sm text-muted-foreground mt-1">
                  Payment:{' '}
                  <span className="font-medium text-foreground">
                     {order.paymentMode === 'IN_CASH'
                        ? 'In Cash'
                        : order.paymentMode === 'BANK_TRANSFER'
                          ? 'Bank Transfer'
                          : '-'}
                  </span>
               </p>
            </div>
            <div className="flex items-center gap-2">
               {(order.status === 'PENDING' ||
                  order.status === 'CONFIRMED') && (
                  <>
                     {order.paymentMode !== 'BANK_TRANSFER' && (
                        <button
                           onClick={() =>
                              onStatusUpdate(order.id, 'CONFIRMED_IN_CASH')
                           }
                           className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-800 rounded-md hover:bg-emerald-200"
                        >
                           Confirm (In Cash)
                        </button>
                     )}
                     {order.paymentMode !== 'IN_CASH' && (
                        <button
                           onClick={() =>
                              onStatusUpdate(
                                 order.id,
                                 'CONFIRMED_BANK_TRANSFER'
                              )
                           }
                           className="px-3 py-1.5 text-sm bg-sky-100 text-sky-800 rounded-md hover:bg-sky-200"
                        >
                           Confirm (Bank Transfer)
                        </button>
                     )}
                     <button
                        onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                     >
                        Cancel
                     </button>
                  </>
               )}
               {canMarkPaid && (
                  <button
                     onClick={() =>
                        onStatusUpdate(
                           order.id,
                           order.paymentMode === 'IN_CASH'
                              ? 'PAID_IN_CASH'
                              : 'PAID_BANK_TRANSFER'
                        )
                     }
                     className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200"
                  >
                     {order.paymentMode === 'IN_CASH'
                        ? 'Paid (In Cash)'
                        : order.paymentMode === 'BANK_TRANSFER'
                          ? 'Paid (Bank Transfer)'
                          : 'Mark Paid'}
                  </button>
               )}
               {(order.status === 'PAID_IN_CASH' ||
                  order.status === 'PAID_BANK_TRANSFER' ||
                  order.status === 'COMPLETED') && (
                  <button
                     onClick={() => onStatusUpdate(order.id, 'COMPLETED')}
                     className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                  >
                     Complete
                  </button>
               )}
               <button
                  onClick={onEdit}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  title="Edit order"
               >
                  <Pencil className="w-4 h-4" />
               </button>
               <button
                  onClick={onView}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
               >
                  <Eye className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>
   );
}

function OrderDetailModal({
   order,
   onClose,
   onEdit,
   onStatusUpdate,
   onViewPayment,
}: {
   order: Order;
   onClose: () => void;
   onEdit: () => void;
   onStatusUpdate: (orderId: number, status: Order['status']) => void;
   onViewPayment: () => void;
}) {
   const statusClass = getOrderStatusColor(order.status);
   const statusLabel = getOrderStatusLabel(order.status);
   const canMarkPaid =
      order.status === 'CONFIRMED_IN_CASH' ||
      order.status === 'CONFIRMED_BANK_TRANSFER' ||
      order.status === 'CONFIRMED';

   return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
         <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
               <div>
                  <h2 className="text-lg font-semibold text-foreground">
                     Order {order.orderNumber}
                  </h2>
                  <span
                     className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${statusClass}`}
                  >
                     {statusLabel}
                  </span>
               </div>
               <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-md"
               >
                  ✕
               </button>
            </div>
            <div className="p-4 space-y-4">
               {/* Customer Info */}
               <div>
                  <h3 className="font-medium text-foreground mb-2">Customer</h3>
                  <p className="text-sm text-muted-foreground">
                     {order.customer.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                     {order.customer.phone}
                  </p>
               </div>

               {/* Order Items */}
               <div>
                  <h3 className="font-medium text-foreground mb-2">Items</h3>
                  <div className="space-y-2">
                     {order.items.map((item, index) => (
                        <div
                           key={index}
                           className="flex justify-between text-sm"
                        >
                           <span className="text-muted-foreground">
                              {item.menuItem.name} x{item.qty}
                           </span>
                           <span className="text-foreground">
                              ${item.subtotal.toFixed(2)}
                           </span>
                        </div>
                     ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border flex justify-between font-medium">
                     <span className="text-foreground">Total</span>
                     <span className="text-foreground">
                        ${order.total.toFixed(2)}
                     </span>
                  </div>
               </div>

               {/* Note */}
               {order.note && (
                  <div>
                     <h3 className="font-medium text-foreground mb-2">Note</h3>
                     <p className="text-sm text-muted-foreground">
                        {order.note}
                     </p>
                  </div>
               )}

               {/* Payment */}
               {order.paymentScreenshotUrl && (
                  <div>
                     <h3 className="font-medium text-foreground mb-2">
                        Payment
                     </h3>
                     <button
                        onClick={onViewPayment}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                     >
                        <Image className="w-4 h-4" />
                        View Payment Screenshot
                     </button>
                  </div>
               )}

               {/* Status Actions */}
               <div className="pt-4 border-t border-border">
                  <h3 className="font-medium text-foreground mb-2">
                     Update Status
                  </h3>
                  <div className="mb-3">
                     <button
                        onClick={onEdit}
                        className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted"
                     >
                        Edit Order
                     </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {(order.status === 'PENDING' ||
                        order.status === 'CONFIRMED') && (
                        <>
                           {order.paymentMode !== 'BANK_TRANSFER' && (
                              <button
                                 onClick={() =>
                                    onStatusUpdate(
                                       order.id,
                                       'CONFIRMED_IN_CASH'
                                    )
                                 }
                                 className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-800 rounded-md hover:bg-emerald-200"
                              >
                                 <CheckCircle className="w-4 h-4 inline mr-1" />
                                 Confirm (In Cash)
                              </button>
                           )}
                           {order.paymentMode !== 'IN_CASH' && (
                              <button
                                 onClick={() =>
                                    onStatusUpdate(
                                       order.id,
                                       'CONFIRMED_BANK_TRANSFER'
                                    )
                                 }
                                 className="px-3 py-1.5 text-sm bg-sky-100 text-sky-800 rounded-md hover:bg-sky-200"
                              >
                                 <CheckCircle className="w-4 h-4 inline mr-1" />
                                 Confirm (Bank Transfer)
                              </button>
                           )}
                           <button
                              onClick={() =>
                                 onStatusUpdate(order.id, 'CANCELLED')
                              }
                              className="px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                           >
                              <XCircle className="w-4 h-4 inline mr-1" />
                              Cancel
                           </button>
                        </>
                     )}
                     {canMarkPaid && (
                        <button
                           onClick={() =>
                              onStatusUpdate(
                                 order.id,
                                 order.paymentMode === 'IN_CASH'
                                    ? 'PAID_IN_CASH'
                                    : 'PAID_BANK_TRANSFER'
                              )
                           }
                           className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200"
                        >
                           <CheckCircle className="w-4 h-4 inline mr-1" />
                           {order.paymentMode === 'IN_CASH'
                              ? 'Paid (In Cash)'
                              : order.paymentMode === 'BANK_TRANSFER'
                                ? 'Paid (Bank Transfer)'
                                : 'Mark Paid'}
                        </button>
                     )}
                     {(order.status === 'PAID_IN_CASH' ||
                        order.status === 'PAID_BANK_TRANSFER' ||
                        order.status === 'COMPLETED') && (
                        <button
                           onClick={() => onStatusUpdate(order.id, 'COMPLETED')}
                           className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                        >
                           <CheckCircle className="w-4 h-4 inline mr-1" />
                           Complete
                        </button>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

type MenuOption = {
   id: number;
   name: string;
   chef: string | null;
   category: string;
   price: number;
   stockQty: number;
   isSoldOut: boolean;
};

function OrderEditModal({
   order,
   onClose,
   onSaved,
}: {
   order: Order;
   onClose: () => void;
   onSaved: (order: Order) => void;
}) {
   const { toast } = useToast();
   const [menuItems, setMenuItems] = useState<MenuOption[]>([]);
   const [loadingMenu, setLoadingMenu] = useState(true);
   const [saving, setSaving] = useState(false);
   const [note, setNote] = useState(order.note || '');
   const [donation, setDonation] = useState(order.donation || 0);
   const [discount, setDiscount] = useState(order.discount || 0);
   const [receivedFrom, setReceivedFrom] = useState(order.receivedFrom || '');
   const [receivedFromOther, setReceivedFromOther] = useState(
      order.receivedFromOther || ''
   );
   const [pickupLocation, setPickupLocation] = useState(
      order.pickupLocation || ''
   );
   const [items, setItems] = useState(
      order.items.map((item) => ({
         menuItemId: item.menuItemId,
         name: item.menuItem.name,
         qty: item.qty,
         unitPrice: item.unitPrice,
      }))
   );

   // Store original state for discard changes
   const originalItems = order.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.menuItem.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
   }));
   const originalNote = order.note || '';
   const originalDonation = order.donation || 0;
   const originalDiscount = order.discount || 0;
   const originalReceivedFrom = order.receivedFrom || '';
   const originalReceivedFromOther = order.receivedFromOther || '';
   const originalPickupLocation = order.pickupLocation || '';

   const handleDiscardChanges = () => {
      setItems(originalItems);
      setNote(originalNote);
      setDonation(originalDonation);
      setDiscount(originalDiscount);
      setReceivedFrom(originalReceivedFrom);
      setReceivedFromOther(originalReceivedFromOther);
      setPickupLocation(originalPickupLocation);
      toast('Changes discarded', 'success');
   };
   const [newMenuItemId, setNewMenuItemId] = useState('');
   const [newQty, setNewQty] = useState('1');

   useEffect(() => {
      let isMounted = true;
      void (async () => {
         try {
            const response = await api.get(`/dashboard/${order.event.id}/menu`);
            if (isMounted) {
               setMenuItems(response.data);
            }
         } catch (error) {
            console.error('Failed to load menu options:', error);
            toast('Failed to load menu options', 'error');
         } finally {
            if (isMounted) {
               setLoadingMenu(false);
            }
         }
      })();

      return () => {
         isMounted = false;
      };
   }, [order.event.id, toast]);

   const selectedOption = menuItems.find(
      (item) => item.id === Number(newMenuItemId)
   );

   const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.qty,
      0
   );
   const total = subtotal + donation - discount;

   const updateItemQty = (menuItemId: number, qty: number) => {
      setItems((current) =>
         current.map((item) =>
            item.menuItemId === menuItemId
               ? {
                    ...item,
                    qty,
                 }
               : item
         )
      );
   };

   const removeItem = (menuItemId: number) => {
      setItems((current) => {
         if (current.length <= 1) {
            toast('An order must contain at least one item', 'error');
            return current;
         }
         return current.filter((item) => item.menuItemId !== menuItemId);
      });
   };

   const addItem = () => {
      if (!selectedOption) return;
      const qty = Number(newQty);
      if (!Number.isInteger(qty) || qty <= 0) {
         toast('Quantity must be at least 1', 'error');
         return;
      }

      setItems((current) => {
         const existing = current.find(
            (item) => item.menuItemId === selectedOption.id
         );
         if (existing) {
            return current.map((item) =>
               item.menuItemId === selectedOption.id
                  ? { ...item, qty: item.qty + qty }
                  : item
            );
         }

         return [
            ...current,
            {
               menuItemId: selectedOption.id,
               name: selectedOption.name,
               qty,
               unitPrice: selectedOption.price,
            },
         ];
      });

      setNewMenuItemId('');
      setNewQty('1');
   };

   const handleSave = async () => {
      if (!order.orderNumber) return;

      // Check if pre-order is closed and confirm
      if (order.event?.preOrderClose) {
         const isClosed = new Date() > new Date(order.event.preOrderClose);
         if (isClosed) {
            const confirmed = window.confirm(
               '⚠️ Pre-order for this event has closed.\n\nAre you sure you want to save changes to this order?'
            );
            if (!confirmed) return;
         }
      }

      setSaving(true);
      try {
         const payload = {
            note: note.trim() || null,
            donation: donation || 0,
            discount: discount || 0,
            receivedFrom: receivedFrom || undefined,
            receivedFromOther:
               receivedFrom === 'Others' ? receivedFromOther : undefined,
            pickupLocation: pickupLocation || null,
            items: items.map((item) => ({
               menuItemId: item.menuItemId,
               quantity: item.qty,
            })),
         };
         const response = await api.patch(
            `/orders/${order.orderNumber}`,
            payload
         );
         onSaved(response.data);
         toast('Order updated successfully', 'success');
      } catch (error) {
         console.error('Failed to update order:', error);
         toast('Failed to update order', 'error');
      } finally {
         setSaving(false);
      }
   };

   const handleCancelOrder = async () => {
      if (
         !confirm(
            'Are you sure you want to cancel this order? This cannot be undone.'
         )
      ) {
         return;
      }

      try {
         const response = await api.patch(
            `/orders/${order.orderNumber}/cancel`
         );
         onSaved(response.data);
         toast('Order cancelled successfully', 'success');
      } catch (error) {
         console.error('Failed to cancel order:', error);
         toast('Failed to cancel order', 'error');
      }
   };

   return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
         <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
               <div>
                  <h2 className="text-lg font-semibold text-foreground">
                     Edit Order {order.orderNumber}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                     Update quantities, add items, or cancel this order.
                  </p>
               </div>
               <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-md"
               >
                  ✕
               </button>
            </div>

            <div className="p-4 space-y-4">
               {/* Order Received From & Pickup Location */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Order Received From
                     </label>
                     <select
                        value={receivedFrom}
                        onChange={(e) => {
                           setReceivedFrom(e.target.value);
                           if (e.target.value !== 'Others') {
                              setReceivedFromOther('');
                           }
                        }}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     >
                        <option value="">Select...</option>
                        <option value="NOB">NOB</option>
                        <option value="Ko ZG">Ko ZG</option>
                        <option value="Ko Lynn">Ko Lynn</option>
                        <option value="Others">Others</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Pickup Location
                     </label>
                     <select
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     >
                        <option value="">Select location</option>
                        <option value="In Event">In Event</option>
                        <option value="Downtown CBD">Downtown CBD</option>
                        <option value="Kelston">Kelston</option>
                        <option value="Northshore">Northshore</option>
                        <option value="Hamilton">Hamilton</option>
                     </select>
                  </div>
               </div>

               {receivedFrom === 'Others' && (
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Specify for Others
                     </label>
                     <input
                        type="text"
                        value={receivedFromOther}
                        onChange={(e) => setReceivedFromOther(e.target.value)}
                        placeholder="Enter name or source"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     />
                  </div>
               )}

               {/* Donation / Discount */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Donation / Delivery ($)
                     </label>
                     <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={donation}
                        onChange={(e) =>
                           setDonation(parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-foreground mb-1">
                        Discount ($)
                     </label>
                     <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount}
                        onChange={(e) =>
                           setDiscount(parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                     />
                  </div>
               </div>

               {/* Note */}
               <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                     Note
                  </label>
                  <textarea
                     value={note}
                     onChange={(e) => setNote(e.target.value)}
                     rows={3}
                     className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
               </div>

               <div className="space-y-3">
                  <h3 className="font-medium text-foreground">Current items</h3>
                  {items.map((item) => (
                     <div
                        key={item.menuItemId}
                        className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3 items-center p-3 border border-border rounded-lg"
                     >
                        <div>
                           <p className="font-medium text-foreground">
                              {item.name}
                           </p>
                           <p className="text-sm text-muted-foreground">
                              ${item.unitPrice.toFixed(2)} each
                           </p>
                        </div>
                        <input
                           type="number"
                           min="1"
                           value={item.qty}
                           onChange={(e) =>
                              updateItemQty(
                                 item.menuItemId,
                                 Number(e.target.value)
                              )
                           }
                           className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        />
                        <button
                           type="button"
                           onClick={() => removeItem(item.menuItemId)}
                           className="px-3 py-2 text-sm border border-border rounded-md hover:bg-muted flex items-center gap-2 justify-center"
                        >
                           <Trash2 className="w-4 h-4" />
                           Remove
                        </button>
                     </div>
                  ))}
               </div>

               <div className="space-y-3 pt-2 border-t border-border">
                  <h3 className="font-medium text-foreground">Add item</h3>
                  {loadingMenu ? (
                     <p className="text-sm text-muted-foreground">
                        Loading menu items...
                     </p>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3 items-center">
                        <select
                           value={newMenuItemId}
                           onChange={(e) => setNewMenuItemId(e.target.value)}
                           className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                           <option value="">Select menu item</option>
                           {menuItems.map((menuItem) => (
                              <option key={menuItem.id} value={menuItem.id}>
                                 {menuItem.name} — ${menuItem.price.toFixed(2)}
                              </option>
                           ))}
                        </select>
                        <input
                           type="number"
                           min="1"
                           value={newQty}
                           onChange={(e) => setNewQty(e.target.value)}
                           className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        />
                        <button
                           type="button"
                           onClick={addItem}
                           className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2 justify-center"
                        >
                           <Plus className="w-4 h-4" />
                           Add
                        </button>
                     </div>
                  )}
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm">
                     <div className="flex justify-between gap-4 text-muted-foreground">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                     </div>
                     {donation > 0 && (
                        <div className="flex justify-between gap-4 text-green-600">
                           <span>Donation / Delivery:</span>
                           <span>+${donation.toFixed(2)}</span>
                        </div>
                     )}
                     {discount > 0 && (
                        <div className="flex justify-between gap-4 text-red-600">
                           <span>Discount:</span>
                           <span>-${discount.toFixed(2)}</span>
                        </div>
                     )}
                     <div className="flex justify-between gap-4 font-semibold text-foreground mt-1 pt-1 border-t border-border">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button
                        type="button"
                        onClick={handleCancelOrder}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                     >
                        Cancel Order
                     </button>
                     <button
                        type="button"
                        onClick={handleDiscardChanges}
                        className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted"
                     >
                        Discard Changes
                     </button>
                     <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                     >
                        {saving ? 'Saving...' : 'Save Changes'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function PaymentModal({
   imageUrl,
   onClose,
}: {
   imageUrl: string;
   onClose: () => void;
}) {
   return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
         <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
               <h2 className="text-lg font-semibold text-foreground">
                  Payment Screenshot
               </h2>
               <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-md"
               >
                  ✕
               </button>
            </div>
            <div className="p-4">
               <img
                  src={imageUrl}
                  alt="Payment Screenshot"
                  className="w-full h-auto rounded-lg"
               />
            </div>
         </div>
      </div>
   );
}
