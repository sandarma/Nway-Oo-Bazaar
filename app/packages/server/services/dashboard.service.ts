import { dashboardRepository } from '../repositories/dashboard.repository';

export const dashboardService = {
   async getOverview(eventId: number) {
      return dashboardRepository.getOverviewByEventId(eventId);
   },

   async getOrders(
      eventId: number,
      options: {
         status?: string;
         search?: string;
         page?: number;
         limit?: number;
      } = {}
   ) {
      return dashboardRepository.getOrdersByEventId(eventId, options);
   },

   async getOrderById(orderId: number) {
      return dashboardRepository.getOrderById(orderId);
   },

   async getMenuItems(eventId: number) {
      return dashboardRepository.getMenuItemsByEventId(eventId);
   },

   async updateOrderStatus(orderId: number, status: string) {
      // Validate status transition
      const validStatuses = [
         'PENDING',
         'CONFIRMED',
         'CONFIRMED_IN_CASH',
         'CONFIRMED_BANK_TRANSFER',
         'PAID_IN_CASH',
         'PAID_BANK_TRANSFER',
         'COMPLETED',
         'CANCELLED',
      ];
      if (!validStatuses.includes(status)) {
         throw new Error('Invalid order status');
      }

      return dashboardRepository.updateOrderStatus(orderId, status);
   },

   async getAnalytics(eventId: number) {
      return dashboardRepository.getAnalyticsByEventId(eventId);
   },
};
