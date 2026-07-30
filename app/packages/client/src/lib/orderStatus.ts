const ORDER_STATUS_META: Record<
   string,
   { label: string; color: string; icon: string }
> = {
   PENDING: {
      label: 'Pending Review',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⏳',
   },
   CONFIRMED: {
      label: 'Confirmed',
      color: 'bg-blue-100 text-blue-800',
      icon: '✅',
   },
   CONFIRMED_IN_CASH: {
      label: 'Confirmed (In Cash)',
      color: 'bg-emerald-100 text-emerald-800',
      icon: '💵',
   },
   CONFIRMED_BANK_TRANSFER: {
      label: 'Confirmed (Bank Transfer)',
      color: 'bg-sky-100 text-sky-800',
      icon: '🏦',
   },
   PAID_IN_CASH: {
      label: 'Paid (In Cash)',
      color: 'bg-green-100 text-green-800',
      icon: '💵',
   },
   PAID_BANK_TRANSFER: {
      label: 'Paid (Bank Transfer)',
      color: 'bg-purple-100 text-purple-800',
      icon: '🏦',
   },
   COMPLETED: {
      label: 'Completed',
      color: 'bg-green-100 text-green-800',
      icon: '✅',
   },
   CANCELLED: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800',
      icon: '❌',
   },
};

export function getOrderStatusMeta(status: string) {
   return (
      ORDER_STATUS_META[status] ?? {
         label: status,
         color: 'bg-gray-100 text-gray-800',
         icon: 'ℹ️',
      }
   );
}

export function getOrderStatusLabel(status: string) {
   return getOrderStatusMeta(status).label;
}

export function getOrderStatusColor(status: string) {
   return getOrderStatusMeta(status).color;
}

export function getOrderStatusIcon(status: string) {
   return getOrderStatusMeta(status).icon;
}
