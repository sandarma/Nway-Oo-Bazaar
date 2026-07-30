import { type Order } from '@prisma/client';
import { prisma } from '../prisma';

export const paymentRepository = {
   async findOrderById(orderNumber: string): Promise<Order | null> {
      return prisma.order.findUnique({
         where: { orderNumber },
      });
   },

   async updatePaymentScreenshot(
      orderNumber: string,
      screenshotUrl: string
   ): Promise<Order> {
      return prisma.order.update({
         where: { orderNumber },
         data: { paymentScreenshotUrl: screenshotUrl },
      });
   },
};
