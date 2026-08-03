import { dashboardRepository } from '../repositories/dashboard.repository';
import { prisma } from '../prisma';

function escapeCsvCell(value: string | number | null | undefined) {
   const text = value == null ? '' : String(value);
   if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
   }
   return text;
}

function buildCsv(rows: Array<Array<string | number | null | undefined>>) {
   return rows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');
}

function formatMoney(amount: number) {
   return `$${amount.toFixed(2)}`;
}

function formatDate(date: Date) {
   return date.toLocaleDateString('en-US');
}

function inferOrderSource(customerName: string, note: string | null) {
   const sourceText = `${customerName} ${note ?? ''}`.toUpperCase();
   if (sourceText.includes('(NOB)') || sourceText.includes('NOB')) {
      return 'NOB';
   }
   return 'Non-NOB';
}

export const exportService = {
   async exportFoodOrdersByUserListToCSV(
      eventId: number,
      pickupLocation?: string
   ) {
      const { orders } = await dashboardRepository.getOrdersByEventId(eventId, {
         limit: 10000, // Get all orders
         pickupLocation,
      });

      const event = await prisma.event.findUnique({
         where: { id: eventId },
         select: {
            name: true,
            eventType: true,
            eventDate: true,
            hostedBy: true,
         },
      });

      const isFoodFair = event?.eventType === 'FOOD_FAIR';
      const title = isFoodFair
         ? 'Food Order — BY USER LIST'
         : 'Item Order — BY USER LIST';
      const filteredOrders = orders.filter(
         (order) => order.status !== 'CANCELLED'
      );
      const sortedOrders = [...filteredOrders].sort((left, right) => {
         const leftPickup = left.pickupLocation || 'Event';
         const rightPickup = right.pickupLocation || 'Event';
         const pickupComparison = leftPickup.localeCompare(rightPickup);
         if (pickupComparison !== 0) return pickupComparison;
         return left.orderNumber.localeCompare(right.orderNumber);
      });

      const rows: Array<Array<string | number | null | undefined>> = [
         [title],
         ['Event', event?.name ?? '-'],
         ['Event Date', formatDate(event?.eventDate ?? new Date())],
         ['Export Date', formatDate(new Date())],
         [],
         [
            '**Order**',
            '**Source**',
            '**Name**',
            '**Payment Mode**',
            '**Status**',
            '**Amount**',
            '**Pickup**',
         ],
      ];

      sortedOrders.forEach((order) => {
         const paymentLabel =
            order.paymentMode === 'IN_CASH' ? 'Cash' : 'Bank Transfer';
         const statusLabel = order.status.replace(/_/g, ' ');
         rows.push([
            order.orderNumber,
            inferOrderSource(order.customer.name, order.note),
            order.customer.name,
            paymentLabel,
            statusLabel,
            formatMoney(order.total),
            order.pickupLocation || 'Event',
         ]);
      });

      return buildCsv(rows);
   },

   async exportPrintOutListToCSV(eventId: number) {
      const { orders } = await dashboardRepository.getOrdersByEventId(eventId, {
         limit: 10000,
      });

      const event = await prisma.event.findUnique({
         where: { id: eventId },
         select: {
            name: true,
            eventDate: true,
         },
      });

      const filteredOrders = orders.filter(
         (order) => order.status !== 'CANCELLED'
      );
      const sortedOrders = [...filteredOrders].sort((left, right) =>
         left.orderNumber.localeCompare(right.orderNumber)
      );

      const rows: Array<Array<string | number | null | undefined>> = [
         ['Print Out List'],
         ['Event', event?.name ?? '-'],
         ['Event Date', formatDate(event?.eventDate ?? new Date())],
         ['Export Date', formatDate(new Date())],
         [],
      ];

      sortedOrders.forEach((order) => {
         rows.push([]);
         rows.push([order.customer.name]);
         rows.push(['Order No', order.orderNumber]);
         rows.push(['Pickup', order.pickupLocation || 'Event']);
         rows.push(['', 'Menu', 'Unit Price', 'Qty', 'Subtotal']);

         order.items.forEach((item) => {
            rows.push([
               '',
               item.menuItem.name,
               formatMoney(item.unitPrice),
               item.qty,
               formatMoney(item.subtotal),
            ]);
         });

         rows.push(['', 'Total →', '', '', formatMoney(order.total)]);
      });

      return buildCsv(rows);
   },

   async exportFoodOrdersBySellerListToCSV(eventId: number) {
      const { orders } = await dashboardRepository.getOrdersByEventId(eventId, {
         limit: 10000,
      });

      const event = await prisma.event.findUnique({
         where: { id: eventId },
         select: {
            name: true,
            eventDate: true,
         },
      });

      const title = 'Food Order — BY SELLER LIST';
      const filteredOrders = orders.filter(
         (order) => order.status !== 'CANCELLED'
      );

      const grouped = new Map<
         string,
         { seller: string; menu: string; totalQty: number; amount: number }
      >();

      filteredOrders.forEach((order) => {
         order.items.forEach((item) => {
            const seller = item.menuItem.chef || 'Unknown Seller';
            const menu = item.menuItem.name;
            const key = `${seller}::${menu}`;
            const existing = grouped.get(key);
            const totalQty = (existing?.totalQty ?? 0) + item.qty;
            const amount = (existing?.amount ?? 0) + item.subtotal;

            grouped.set(key, {
               seller,
               menu,
               totalQty,
               amount,
            });
         });
      });

      const rows: Array<Array<string | number | null | undefined>> = [
         [title],
         ['Event', event?.name ?? '-'],
         ['Event Date', formatDate(event?.eventDate ?? new Date())],
         ['Export Date', formatDate(new Date())],
         [],
         ['No', 'Seller', 'Menu', 'Total Qty', 'Amount'],
      ];

      [...grouped.values()]
         .sort((left, right) => {
            const sellerComparison = left.seller.localeCompare(right.seller);
            if (sellerComparison !== 0) return sellerComparison;
            return left.menu.localeCompare(right.menu);
         })
         .forEach((entry, index) => {
            rows.push([
               index + 1,
               entry.seller,
               entry.menu,
               entry.totalQty,
               formatMoney(entry.amount),
            ]);
         });

      return buildCsv(rows);
   },

   async exportOrdersDetailedToCSV(eventId: number) {
      const { orders } = await dashboardRepository.getOrdersByEventId(eventId, {
         limit: 10000,
      });

      const event = await prisma.event.findUnique({
         where: { id: eventId },
         select: { name: true, eventDate: true },
      });

      const filteredOrders = orders.filter(
         (order) => order.status !== 'CANCELLED'
      );
      const sortedOrders = [...filteredOrders].sort((left, right) =>
         left.orderNumber.localeCompare(right.orderNumber)
      );

      const rows: Array<Array<string | number | null | undefined>> = [
         ['Orders — Detailed List'],
         ['Event', event?.name ?? '-'],
         ['Event Date', formatDate(event?.eventDate ?? new Date())],
         ['Export Date', formatDate(new Date())],
         [],
         [
            '**Order**',
            '**Name**',
            '**Phone**',
            '**Items Ordered**',
            '**Payment Mode**',
            '**Status**',
            '**Amount**',
            '**Pickup**',
         ],
      ];

      sortedOrders.forEach((order) => {
         const paymentLabel =
            order.paymentMode === 'IN_CASH' ? 'Cash' : 'Bank Transfer';
         const statusLabel = order.status.replace(/_/g, ' ');
         const itemsList = order.items
            .map((item) => `${item.menuItem.name} x${item.qty}`)
            .join('; ');

         rows.push([
            order.orderNumber,
            order.customer.name,
            order.customer.phone,
            itemsList,
            paymentLabel,
            statusLabel,
            formatMoney(order.total),
            order.pickupLocation || 'Event',
         ]);
      });

      return buildCsv(rows);
   },

   async exportOrdersToCSV(eventId: number) {
      return exportService.exportFoodOrdersByUserListToCSV(eventId);
   },

   async exportMenuToCSV(eventId: number) {
      const menuItems =
         await dashboardRepository.getMenuItemsByEventId(eventId);

      const rows = [
         ['Name', 'Chef', 'Category', 'Price', 'Stock Quantity', 'Sold Out'],
         ...menuItems.map((item) => [
            item.name,
            item.chef || '',
            item.category,
            item.price.toFixed(2),
            item.stockQty,
            item.isSoldOut ? 'Yes' : 'No',
         ]),
      ];

      return buildCsv(rows);
   },

   async generatePackingSlip(orderId: number) {
      const order = await dashboardRepository.getOrderById(orderId);
      if (!order) {
         return null;
      }

      const items = order.items.map((item) => ({
         name: item.menuItem.name,
         qty: item.qty,
         unitPrice: item.unitPrice,
         subtotal: item.subtotal,
      }));

      return {
         orderNumber: order.orderNumber,
         customerName: order.customer.name,
         customerPhone: order.customer.phone,
         eventName: order.event.name,
         eventDate: order.event.eventDate,
         location: order.event.location,
         pickupInfo: order.event.pickupInfo,
         items,
         total: order.total,
         note: order.note,
         createdAt: order.createdAt,
      };
   },
};
