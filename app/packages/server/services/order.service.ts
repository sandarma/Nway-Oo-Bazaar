import { type Order } from '@prisma/client';
import { prisma } from '../prisma';
import { orderRepository } from '../repositories/order.repository';
import { customerService } from './customer.service';

type OrderItemInput = { menuItemId: number; quantity: number };

export const orderService = {
   async createOrder(
      note: string | null,
      eventId: number,
      paymentMode: 'IN_CASH' | 'BANK_TRANSFER',
      pickupLocation: string | undefined,
      customer: { name: string; phone: string },
      items: OrderItemInput[],
      donation: number = 0,
      discount: number = 0,
      receivedFrom?: string,
      receivedFromOther?: string
   ): Promise<Order> {
      // check if customer exists, if not create a new customer
      let existingCustomer = await customerService.getCustomerByNameAndPhone(
         customer.name,
         customer.phone
      );

      if (!existingCustomer) {
         existingCustomer = await customerService.createCustomer({
            name: customer.name,
            phone: customer.phone,
            createdAt: new Date(),
         });
      }

      if (!existingCustomer.id) {
         throw new Error('Failed to create or retrieve customer');
      }

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error('Event not found');
      if (event.preOrderClose && new Date() > event.preOrderClose) {
         throw new Error('Pre-order is closed for this event');
      }

      // generate order number using event code prefix (e.g. 8888-00001)
      const prefix = event.eventCodePrefix;

      const lastOrderNumber =
         await orderRepository.getMaxOrderNumberForPrefix(prefix);
      let orderCount = 0;
      if (lastOrderNumber) {
         const lastOrderCount = parseInt(lastOrderNumber.split('-')[1] ?? '0');
         orderCount = Number.isNaN(lastOrderCount) ? 0 : lastOrderCount;
      }

      // Retry up to 3 times if a unique constraint collision occurs
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
         const orderNumber = `${prefix}-${String(orderCount + 1).padStart(5, '0')}`;
         try {
            return await orderRepository.createOrderWithStock(
               orderNumber,
               note,
               eventId,
               existingCustomer.id,
               paymentMode,
               pickupLocation,
               items,
               donation,
               discount,
               receivedFrom,
               receivedFromOther
            );
         } catch (err) {
            if (
               err instanceof Error &&
               err.message.includes('Unique constraint failed')
            ) {
               lastError = err;
               orderCount++;
               continue;
            }
            throw err;
         }
      }
      throw lastError ?? new Error('Failed to create order after retries');
   },

   async getOrders(): Promise<Order[]> {
      return orderRepository.getOrders();
   },

   async getOrderById(orderId: number): Promise<Order | null> {
      return orderRepository.getOrderById(orderId);
   },

   async getOrdersByEventId(eventId: number): Promise<Order[]> {
      return orderRepository.getOrdersByEventId(eventId);
   },

   async getOrderByOrderNo(orderNumber: string): Promise<Order | null> {
      return orderRepository.getOrderByOrderNo(orderNumber);
   },

   async getOrdersByCustomer(customerId: number): Promise<Order[]> {
      return orderRepository.getOrdersByCustomer(customerId);
   },

   async getOrdersByCustomerAndEvent(
      customerId: number,
      eventId: number
   ): Promise<Order[]> {
      return orderRepository.getOrdersByCustomerAndEvent(customerId, eventId);
   },

   async updateOrderByOrderNo(
      orderNumber: string,
      note: string | null,
      items: OrderItemInput[],
      donation?: number,
      discount?: number,
      receivedFrom?: string,
      receivedFromOther?: string,
      pickupLocation?: string | null
   ): Promise<Order> {
      const existingOrder =
         await orderRepository.getOrderByOrderNo(orderNumber);
      if (!existingOrder) throw new Error('Order not found');
      if (existingOrder.status === 'CANCELLED')
         throw new Error('Order is cancelled');
      if (existingOrder.status === 'COMPLETED')
         throw new Error('Order is completed');

      return orderRepository.updateOrderByOrderNoWithStock(
         orderNumber,
         note,
         items,
         donation,
         discount,
         receivedFrom,
         receivedFromOther
      );
   },

   async confirmOrderByOrderNumber(orderNumber: string): Promise<Order> {
      return orderRepository.confirmOrderByOrderNumber(orderNumber);
   },

   async completeOrderByOrderNumber(orderNumber: string): Promise<Order> {
      return orderRepository.completeOrderByOrderNumber(orderNumber);
   },

   async cancelOrderByOrderNumber(orderNumber: string): Promise<Order> {
      return orderRepository.cancelOrderByOrderNumberWithStock(orderNumber);
   },

   async deleteOrderByOrderNumber(orderNumber: string): Promise<Order> {
      return orderRepository.deleteOrderByOrderNumberWithStock(orderNumber);
   },
};
