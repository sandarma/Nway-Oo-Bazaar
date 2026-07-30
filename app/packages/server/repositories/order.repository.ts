import { type Order } from '@prisma/client';
import { prisma } from '../prisma';
type PricedOrderItem = {
   menuItemId: number;
   quantity: number;
   unitPrice: number;
   subtotal: number;
};

export const orderRepository = {
   async createOrderWithStock(
      orderNumber: string,
      note: string | null,
      eventId: number,
      customerId: number,
      paymentMode: 'IN_CASH' | 'BANK_TRANSFER',
      pickupLocation: string | undefined,
      items: { menuItemId: number; quantity: number }[]
   ): Promise<Order> {
      return prisma.$transaction(
         async (tx) => {
            let total = 0;
            const pricedItems: PricedOrderItem[] = [];

            for (const item of items) {
               const menu = await tx.menuItem.findUnique({
                  where: { id: item.menuItemId },
               });
               if (!menu)
                  throw new Error(`Menu item ${item.menuItemId} not found`);
               if (menu.isSoldOut) throw new Error(`${menu.name} is sold out`);
               if (menu.stockQty < item.quantity) {
                  throw new Error(
                     `${menu.name} has only ${menu.stockQty} left`
                  );
               }

               const subtotal = menu.price * item.quantity;
               total += subtotal;
               pricedItems.push({
                  menuItemId: menu.id,
                  quantity: item.quantity,
                  unitPrice: menu.price,
                  subtotal,
               });
            }

            const createdOrder = await tx.order.create({
               data: {
                  customerId,
                  eventId,
                  orderNumber,
                  note,
                  total,
                  paymentMode,
                  pickupLocation,
                  status:
                     paymentMode === 'IN_CASH'
                        ? 'CONFIRMED_IN_CASH'
                        : 'CONFIRMED_BANK_TRANSFER',
                  items: {
                     create: pricedItems.map((item) => ({
                        menuItemId: item.menuItemId,
                        qty: item.quantity,
                        unitPrice: item.unitPrice,
                        subtotal: item.subtotal,
                     })),
                  },
               },
               include: {
                  event: true,
                  items: { include: { menuItem: true } },
                  customer: true,
               },
            });

            for (const item of pricedItems) {
               const updated = await tx.menuItem.update({
                  where: { id: item.menuItemId },
                  data: { stockQty: { decrement: item.quantity } },
               });
               if (updated.stockQty <= 0 && !updated.isSoldOut) {
                  await tx.menuItem.update({
                     where: { id: item.menuItemId },
                     data: { isSoldOut: true },
                  });
               }
            }

            return createdOrder;
         },
         { timeout: 30000 }
      );
   },

   async updateOrderByOrderNoWithStock(
      orderNumber: string,
      note: string | null,
      items: { menuItemId: number; quantity: number }[]
   ): Promise<Order> {
      return prisma.$transaction(
         async (tx) => {
            const existingOrder = await tx.order.findUnique({
               where: { orderNumber },
               include: { items: { include: { menuItem: true } } },
            });
            if (!existingOrder) throw new Error('Order not found');

            const oldMap = new Map<number, number>();
            for (const oldItem of existingOrder.items) {
               oldMap.set(oldItem.menuItemId, oldItem.qty);
            }

            const newMap = new Map<number, number>();
            for (const newItem of items) {
               newMap.set(newItem.menuItemId, newItem.quantity);
            }

            const allMenuItemIds = new Set<number>([
               ...Array.from(oldMap.keys()),
               ...Array.from(newMap.keys()),
            ]);

            for (const menuItemId of allMenuItemIds) {
               const oldQty = oldMap.get(menuItemId) ?? 0;
               const newQty = newMap.get(menuItemId) ?? 0;
               const delta = newQty - oldQty;
               const menu = await tx.menuItem.findUnique({
                  where: { id: menuItemId },
               });
               if (!menu) throw new Error(`Menu item ${menuItemId} not found`);
               if (delta > 0) {
                  if (menu.isSoldOut)
                     throw new Error(`${menu.name} is sold out`);
                  if (menu.stockQty < delta) {
                     throw new Error(
                        `${menu.name} has only ${menu.stockQty} left`
                     );
                  }
               }
            }

            for (const menuItemId of allMenuItemIds) {
               const oldQty = oldMap.get(menuItemId) ?? 0;
               const newQty = newMap.get(menuItemId) ?? 0;
               const delta = newQty - oldQty;

               if (delta > 0) {
                  await tx.menuItem.update({
                     where: { id: menuItemId },
                     data: { stockQty: { decrement: delta } },
                  });
               } else if (delta < 0) {
                  await tx.menuItem.update({
                     where: { id: menuItemId },
                     data: { stockQty: { increment: Math.abs(delta) } },
                  });
               }

               const latest = await tx.menuItem.findUnique({
                  where: { id: menuItemId },
               });
               if (!latest) continue;
               await tx.menuItem.update({
                  where: { id: menuItemId },
                  data: { isSoldOut: latest.stockQty <= 0 },
               });
            }

            let total = 0;
            const pricedItems: PricedOrderItem[] = [];
            for (const item of items) {
               const menu = await tx.menuItem.findUnique({
                  where: { id: item.menuItemId },
               });
               if (!menu)
                  throw new Error(`Menu item ${item.menuItemId} not found`);
               const subtotal = menu.price * item.quantity;
               total += subtotal;
               pricedItems.push({
                  menuItemId: item.menuItemId,
                  quantity: item.quantity,
                  unitPrice: menu.price,
                  subtotal,
               });
            }

            await tx.orderItem.deleteMany({
               where: { orderId: existingOrder.id },
            });

            return tx.order.update({
               where: { id: existingOrder.id },
               data: {
                  note,
                  total,
                  items: {
                     create: pricedItems.map((item) => ({
                        menuItemId: item.menuItemId,
                        qty: item.quantity,
                        unitPrice: item.unitPrice,
                        subtotal: item.subtotal,
                     })),
                  },
               },
               include: {
                  items: { include: { menuItem: true } },
                  customer: true,
                  event: true,
               },
            });
         },
         { timeout: 30000 }
      );
   },

   async cancelOrderByOrderNumberWithStock(
      orderNumber: string
   ): Promise<Order> {
      return prisma.$transaction(
         async (tx) => {
            const existingOrder = await tx.order.findUnique({
               where: { orderNumber },
               include: { items: { include: { menuItem: true } } },
            });

            if (!existingOrder) throw new Error('Order not found');
            if (existingOrder.status === 'CANCELLED') {
               return tx.order.findUniqueOrThrow({
                  where: { id: existingOrder.id },
                  include: {
                     event: true,
                     items: { include: { menuItem: true } },
                     customer: true,
                  },
               });
            }

            for (const item of existingOrder.items) {
               const updated = await tx.menuItem.update({
                  where: { id: item.menuItemId },
                  data: { stockQty: { increment: item.qty } },
               });

               if (updated.isSoldOut && updated.stockQty > 0) {
                  await tx.menuItem.update({
                     where: { id: item.menuItemId },
                     data: { isSoldOut: false },
                  });
               }
            }

            return tx.order.update({
               where: { id: existingOrder.id },
               data: { status: 'CANCELLED' },
               include: {
                  event: true,
                  items: { include: { menuItem: true } },
                  customer: true,
               },
            });
         },
         { timeout: 30000 }
      );
   },

   async deleteOrderByOrderNumberWithStock(
      orderNumber: string
   ): Promise<Order> {
      return prisma.$transaction(
         async (tx) => {
            const existingOrder = await tx.order.findUnique({
               where: { orderNumber },
               include: { items: { include: { menuItem: true } } },
            });
            if (!existingOrder) throw new Error('Order not found');

            for (const item of existingOrder.items) {
               const updated = await tx.menuItem.update({
                  where: { id: item.menuItemId },
                  data: { stockQty: { increment: item.qty } },
               });
               if (updated.isSoldOut && updated.stockQty > 0) {
                  await tx.menuItem.update({
                     where: { id: item.menuItemId },
                     data: { isSoldOut: false },
                  });
               }
            }

            await tx.orderItem.deleteMany({
               where: { orderId: existingOrder.id },
            });

            return tx.order.delete({
               where: { id: existingOrder.id },
            });
         },
         { timeout: 30000 }
      );
   },

   async createOrder(
      orderNumber: string,
      note: string | null,
      eventId: number,
      customerId: number,
      total: number,
      items: {
         menuItemId: number;
         quantity: number;
         unitPrice: number;
         subtotal: number;
      }[]
   ): Promise<Order> {
      return prisma.order.create({
         data: {
            customerId,
            eventId,
            orderNumber,
            total,
            items: {
               create: items.map((item) => ({
                  menuItem: { connect: { id: item.menuItemId } }, // Assuming menuItemId corresponds to an existing menuItem
                  qty: item.quantity,
                  unitPrice: item.unitPrice,
                  subtotal: item.subtotal,
               })),
            },
         },
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async getOrders(): Promise<Order[]> {
      // SELECT * FROM orders
      return prisma.order.findMany({
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async getOrderById(orderId: number): Promise<Order | null> {
      // SELECT * FROM orders WHERE id = @id
      return prisma.order.findUnique({
         where: { id: orderId },
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async getOrdersByEventId(eventId: number): Promise<Order[]> {
      // SELECT * FROM orders WHERE eventId = @eventId
      return prisma.order.findMany({
         where: { eventId },
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async getLastOrderByEventId(eventId: number): Promise<Order | null> {
      return prisma.order.findFirst({
         where: { eventId },
         orderBy: { createdAt: 'desc' },
         include: {
            items: { include: { menuItem: true } },
            customer: true,
            event: true,
         },
      });
   },

   async getMaxOrderNumberForDate(datePrefix: string): Promise<string | null> {
      const lastOrder = await prisma.order.findFirst({
         where: {
            orderNumber: { startsWith: `ORD-${datePrefix}-` },
         },
         orderBy: { orderNumber: 'desc' },
         select: { orderNumber: true },
      });
      return lastOrder?.orderNumber ?? null;
   },

   async getOrdersByCustomer(customerId: number): Promise<Order[]> {
      return prisma.order.findMany({
         where: { customerId },
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async getOrderByOrderNo(orderNumber: string): Promise<Order | null> {
      // SELECT * FROM orders WHERE orderNumber = @orderNumber
      return prisma.order.findUnique({
         where: { orderNumber: orderNumber },
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async getOrdersByCustomerAndEvent(
      customerId: number,
      eventId: number
   ): Promise<Order[]> {
      // SELECT * FROM orders WHERE customerId = @customerId AND eventId = @eventId
      return prisma.order.findMany({
         where: { customerId, eventId },
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async updateOrderById(
      orderNumber: string,
      note: string | null,
      total: number,
      items: {
         menuItemId: number;
         quantity: number;
         unitPrice: number;
         subtotal: number;
      }[]
   ): Promise<Order> {
      const existingOrder = await prisma.order.findUnique({
         where: { orderNumber },
         select: { id: true },
      });

      if (!existingOrder) {
         throw new Error('Order not found');
      }

      await prisma.orderItem.deleteMany({
         where: { orderId: existingOrder.id },
      });

      return prisma.order.update({
         where: { orderNumber },
         data: {
            note,
            total,
            items: {
               create: items.map((item) => ({
                  menuItem: { connect: { id: item.menuItemId } },
                  qty: item.quantity,
                  unitPrice: item.unitPrice,
                  subtotal: item.subtotal,
               })),
            },
         },
         include: {
            items: { include: { menuItem: true } },
            customer: true,
            event: true,
         },
      });
   },

   async updateOrderByOrderNo(
      orderNumber: string,
      note: string | null,
      total: number,
      items: {
         menuItemId: number;
         quantity: number;
         unitPrice: number;
         subtotal: number;
      }[]
   ): Promise<Order> {
      const existingOrder = await prisma.order.findUnique({
         where: { orderNumber },
         select: { id: true },
      });

      if (!existingOrder) {
         throw new Error('Order not found');
      }

      await prisma.orderItem.deleteMany({
         where: { orderId: existingOrder.id },
      });

      return prisma.order.update({
         where: { orderNumber },
         data: {
            note,
            total,
            items: {
               create: items.map((item) => ({
                  menuItem: { connect: { id: item.menuItemId } },
                  qty: item.quantity,
                  unitPrice: item.unitPrice,
                  subtotal: item.subtotal,
               })),
            },
         },
         include: {
            items: { include: { menuItem: true } },
            customer: true,
            event: true,
         },
      });
   },

   async confirmOrderByOrderNumber(orderNumber: string): Promise<Order> {
      // UPDATE orders SET status = 'CONFIRMED' WHERE orderNumber = @orderNumber
      const existingOrder = await prisma.order.findUnique({
         where: { orderNumber },
         select: { paymentMode: true },
      });
      const status =
         existingOrder?.paymentMode === 'IN_CASH'
            ? 'CONFIRMED_IN_CASH'
            : 'CONFIRMED_BANK_TRANSFER';

      return prisma.order.update({
         where: { orderNumber },
         data: { status },
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async completeOrderByOrderNumber(orderNumber: string): Promise<Order> {
      // UPDATE orders SET status = 'COMPLETED' WHERE orderNumber = @orderNumber
      return prisma.order.update({
         where: { orderNumber },
         data: { status: 'COMPLETED' },
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async cancelOrderByOrderNumber(orderNumber: string): Promise<Order> {
      // UPDATE orders SET status = 'CANCELLED' WHERE orderNumber = @orderNumber
      return prisma.order.update({
         where: { orderNumber },
         data: { status: 'CANCELLED' },
         include: {
            event: true,
            items: { include: { menuItem: true } },
            customer: true,
         },
      });
   },

   async deleteOrderByOrderNumber(orderNumber: string): Promise<Order> {
      // DELETE FROM orders WHERE orderNumber = @orderNumber
      return prisma.order.delete({
         where: { orderNumber },
      });
   },
};
