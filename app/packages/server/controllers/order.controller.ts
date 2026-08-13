import type { Request, Response } from 'express';
import z from 'zod';
import { orderService } from '../services/order.service';
import { isValidPhone } from '../utils/validations';

const PaymentMode = {
   IN_CASH: 'IN_CASH',
   BANK_TRANSFER: 'BANK_TRANSFER',
} as const;

type PaymentMode = (typeof PaymentMode)[keyof typeof PaymentMode];

const createOrderRequestSchema = z.object({
   note: z.string().nullable().optional(),
   eventId: z.number().positive('eventId must be a positive number'),
   paymentMode: z.nativeEnum(PaymentMode),
   pickupLocation: z.string().trim().optional(),
   customer: z.object({
      name: z.string().trim().min(1, 'customer name is required'),
      phone: z.string().trim().optional(),
   }),
   items: z
      .array(
         z.object({
            menuItemId: z.number().int().positive(),
            quantity: z.number().int().positive(),
         })
      )
      .min(1, 'At least one item is required in the order'),
   donation: z.number().nonnegative().optional().default(0),
   discount: z.number().nonnegative().optional().default(0),
   receivedFrom: z.string().trim().optional(),
   receivedFromOther: z.string().trim().optional(),
});

const updateOrderRequestSchema = z.object({
   items: z
      .array(
         z.object({
            menuItemId: z.number().int().positive(),
            quantity: z.number().int().positive(),
         })
      )
      .min(1, 'At least one item is required in the order'),
   note: z.string().nullable().optional(),
   donation: z.number().nonnegative().optional(),
   discount: z.number().nonnegative().optional(),
   receivedFrom: z.string().trim().optional(),
   receivedFromOther: z.string().trim().optional(),
   pickupLocation: z.string().trim().nullable().optional(),
});

export const orderController = {
   async createOrder(req: Request, res: Response) {
      // Logic to create a new order

      const parseResult = createOrderRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const {
            note,
            eventId,
            paymentMode,
            pickupLocation,
            customer,
            items,
            donation,
            discount,
            receivedFrom,
            receivedFromOther,
         } = parseResult.data;

         const order = await orderService.createOrder(
            note ?? null,
            eventId,
            paymentMode as PaymentMode,
            pickupLocation,
            { name: customer.name, phone: customer.phone ?? '' },
            items,
            donation,
            discount,
            receivedFrom,
            receivedFromOther
         );

         return res.status(201).json(order);
      } catch (error) {
         // return res.status(500).json({ error: 'Failed to create order' });
         const message =
            error instanceof Error ? error.message : 'Failed to create order';
         return res.status(400).json({ error: message });
      }
   },
   async getOrders(req: Request, res: Response) {
      // Logic to retrieve all orders
      try {
         const orders = await orderService.getOrders();
         return res.json(orders);
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve orders' });
      }
   },
   async getOrderById(req: Request, res: Response) {
      // Logic to retrieve an order by ID
      try {
         const orderId = Number(req.params.orderId);
         if (isNaN(orderId)) {
            return res.status(400).json({ error: 'Invalid order ID' });
         }

         const order = await orderService.getOrderById(orderId);
         if (!order) {
            return res.status(404).json({ error: 'Order not found' });
         }

         return res.json(order);
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve order' });
      }
   },
   async getOrdersByEventId(req: Request, res: Response) {
      // Logic to retrieve all orders for an event. Include order details, customer details, and ordered items details

      try {
         const eventId = Number(req.params.eventId);
         if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
         }

         const orders = await orderService.getOrdersByEventId(eventId);

         return res.json(orders);
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve orders' });
      }
   },
   async getOrderByOrderNo(req: Request, res: Response) {
      // Logic to retrieve an order by order number

      try {
         const orderNumber = Array.isArray(req.params.orderNumber)
            ? req.params.orderNumber[0]
            : req.params.orderNumber;
         if (!orderNumber) {
            return res.status(400).json({ error: 'Order number is required' });
         }

         const order = await orderService.getOrderByOrderNo(orderNumber);

         if (!order) {
            return res.status(404).json({ error: 'Order not found' });
         }

         return res.json(order);
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve order' });
      }
   },
   async updateOrderByOrderNumber(req: Request, res: Response) {
      const parseResult = updateOrderRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }
      try {
         const orderNumber = Array.isArray(req.params.orderNumber)
            ? req.params.orderNumber[0]
            : req.params.orderNumber;
         if (!orderNumber) {
            return res.status(400).json({ error: 'Order number is required' });
         }
         const {
            items,
            note,
            donation,
            discount,
            receivedFrom,
            receivedFromOther,
            pickupLocation,
         } = parseResult.data;

         const updatedOrder = await orderService.updateOrderByOrderNo(
            orderNumber,
            note ?? '',
            items,
            donation,
            discount,
            receivedFrom,
            receivedFromOther,
            pickupLocation
         );

         return res.json(updatedOrder);
      } catch (error) {
         console.error('updateOrderByOrderNumber error:', error);
         return res.status(500).json({ error: 'Failed to update order' });
      }
   },
   async cancelOrderByOrderNumber(req: Request, res: Response) {
      // Logic to cancel an order (e.g. update order status to 'CANCELLED')
      try {
         const orderNumber = Array.isArray(req.params.orderNumber)
            ? req.params.orderNumber[0]
            : req.params.orderNumber;

         if (!orderNumber) {
            return res.status(400).json({ error: 'Order number is required' });
         }

         const cancelledOrder =
            await orderService.cancelOrderByOrderNumber(orderNumber);

         return res.json(cancelledOrder);
      } catch (error) {
         return res.status(500).json({ error: 'Failed to cancel order' });
      }
   },
   async confirmOrderByOrderNumber(req: Request, res: Response) {
      // Logic to confirm an order (e.g. mark as paid and ready for preparation)
      try {
         const orderNumber = Array.isArray(req.params.orderNumber)
            ? req.params.orderNumber[0]
            : req.params.orderNumber;

         if (!orderNumber) {
            return res.status(400).json({ error: 'Order number is required' });
         }

         const confirmedOrder =
            await orderService.confirmOrderByOrderNumber(orderNumber);

         return res.json(confirmedOrder);
      } catch (error) {
         return res.status(500).json({ error: 'Failed to confirm order' });
      }
   },
   async completeOrderByOrderNumber(req: Request, res: Response) {
      // Logic to complete an order (e.g. mark as picked up/delivered)

      try {
         const orderNumber = Array.isArray(req.params.orderNumber)
            ? req.params.orderNumber[0]
            : req.params.orderNumber;

         if (!orderNumber) {
            return res.status(400).json({ error: 'Order number is required' });
         }

         const completedOrder =
            await orderService.completeOrderByOrderNumber(orderNumber);

         return res.json(completedOrder);
      } catch (error) {
         return res.status(500).json({ error: 'Failed to complete order' });
      }
   },
};
