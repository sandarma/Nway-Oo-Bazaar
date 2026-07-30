import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export const dashboardRepository = {
   async getOverviewByEventId(eventId: number) {
      const event = await prisma.event.findUnique({
         where: { id: eventId },
         include: {
            menuItems: true,
         },
      });

      if (!event) {
         return null;
      }

      const orders = await prisma.order.findMany({
         where: { eventId },
         include: {
            items: {
               include: {
                  menuItem: true,
               },
            },
            customer: true,
         },
      });

      // Calculate stats
      const totalOrders = orders.length;
      const totalRevenue = orders
         .filter((o) => o.status !== 'CANCELLED')
         .reduce((sum, o) => sum + o.total, 0);
      const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
      const confirmedOrders = orders.filter(
         (o) => o.status === 'CONFIRMED'
      ).length;
      const completedOrders = orders.filter(
         (o) => o.status === 'COMPLETED'
      ).length;
      const cancelledOrders = orders.filter(
         (o) => o.status === 'CANCELLED'
      ).length;

      // Items sold breakdown
      const itemsSold = orders
         .filter((o) => o.status !== 'CANCELLED')
         .flatMap((o) => o.items)
         .reduce(
            (acc, item) => {
               const name = item.menuItem.name;
               acc[name] = (acc[name] || 0) + item.qty;
               return acc;
            },
            {} as Record<string, number>
         );

      return {
         event,
         stats: {
            totalOrders,
            totalRevenue,
            pendingOrders,
            confirmedOrders,
            completedOrders,
            cancelledOrders,
         },
         itemsSold,
      };
   },

   async getOrdersByEventId(
      eventId: number,
      options: {
         status?: string;
         search?: string;
         pickupLocation?: string;
         page?: number;
         limit?: number;
      } = {}
   ) {
      const { status, search, pickupLocation, page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = { eventId };

      if (status && status !== 'ALL') {
         where.status = status;
      }

      if (search) {
         where.OR = [
            { orderNumber: { contains: search } },
            { customer: { name: { contains: search } } },
            { customer: { phone: { contains: search } } },
         ];
      }

      if (pickupLocation && pickupLocation !== 'ALL') {
         where.pickupLocation = pickupLocation;
      }

      const [orders, total] = await Promise.all([
         prisma.order.findMany({
            where,
            include: {
               items: {
                  include: {
                     menuItem: true,
                  },
               },
               customer: true,
               event: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
         }),
         prisma.order.count({ where }),
      ]);

      return {
         orders,
         pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
         },
      };
   },

   async getOrderById(orderId: number) {
      return prisma.order.findUnique({
         where: { id: orderId },
         include: {
            items: {
               include: {
                  menuItem: true,
               },
            },
            customer: true,
            event: true,
         },
      });
   },

   async getMenuItemsByEventId(eventId: number) {
      return prisma.menuItem.findMany({
         where: { eventId },
         orderBy: { category: 'asc' },
         include: { event: true },
      });
   },

   async updateOrderStatus(orderId: number, status: string) {
      return prisma.order.update({
         where: { id: orderId },
         data: { status: status as Prisma.OrderUpdateInput['status'] },
      });
   },

   async getAnalyticsByEventId(eventId: number) {
      const orders = await prisma.order.findMany({
         where: { eventId },
         include: {
            items: {
               include: {
                  menuItem: true,
               },
            },
            customer: true,
         },
      });

      // Revenue over time (daily)
      const revenueByDate = orders
         .filter((o) => o.status !== 'CANCELLED')
         .reduce(
            (acc, order) => {
               const dateStr = order.createdAt.toISOString().split('T')[0];
               if (dateStr) {
                  acc[dateStr] = (acc[dateStr] || 0) + order.total;
               }
               return acc;
            },
            {} as Record<string, number>
         );

      // Items sold breakdown
      const itemsSold = orders
         .filter((o) => o.status !== 'CANCELLED')
         .flatMap((o) => o.items)
         .reduce(
            (acc, item) => {
               const name = item.menuItem.name;
               acc[name] = (acc[name] || 0) + item.qty;
               return acc;
            },
            {} as Record<string, number>
         );

      // Order status distribution
      const statusDistribution = orders.reduce(
         (acc, order) => {
            const status = order.status as string;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
         },
         {} as Record<string, number>
      );

      // Top selling items
      const topSellingItems = Object.entries(itemsSold)
         .sort(([, a], [, b]) => b - a)
         .slice(0, 10)
         .map(([name, qty]) => ({ name, qty }));

      return {
         revenueByDate,
         itemsSold,
         statusDistribution,
         topSellingItems,
      };
   },
};
