import express from 'express';
import type { Request, Response } from 'express';
import { chatController } from './controllers/chat.controller';
import { eventController } from './controllers/event.controller';
import { menuItemController } from './controllers/menuitem.controller';
import { orderController } from './controllers/order.controller';
import { uploadPaymentScreenshot } from './controllers/payment.controller';

import { authController } from './controllers/auth.controller';
import { invitationController } from './controllers/invitation.controller';
import { userController } from './controllers/user.controller';
import { dashboardController } from './controllers/dashboard.controller';
import { exportController } from './controllers/export.controller';

import { authenticate } from './middleware/auth';
import { requireRole } from './middleware/authorize';
import { rateLimitLogin } from './middleware/rate-limit';
import { requireEventOwnership } from './middleware/ownership';

const router = express.Router();

// create routes
router.get('/', (req: Request, res: Response) => {
   res.send('Hello World!');
});

router.get('/api/hello', (req: Request, res: Response) => {
   res.json({ message: 'Hello World!' });
});

// ─── Auth routes (public) ────────────────────────────────────────────────────

router.post('/api/auth/register', authController.register);
router.post('/api/auth/login', rateLimitLogin, authController.login);
router.post('/api/auth/refresh', authController.refresh);

// ─── Invitation status (public, for register page) ───────────────────────────
router.get('/api/invitations/check/:code', invitationController.checkStatus);

// ─── Auth routes (authenticated) ─────────────────────────────────────────────

router.get('/api/auth/me', authenticate, authController.me);
router.post('/api/auth/logout', authenticate, authController.logout);

// ─── Admin routes ────────────────────────────────────────────────────────────

router.post(
   '/api/invitations',
   authenticate,
   requireRole('ADMIN'),
   invitationController.create
);
router.get(
   '/api/invitations',
   authenticate,
   requireRole('ADMIN'),
   invitationController.list
);
router.delete(
   '/api/invitations/:id',
   authenticate,
   requireRole('ADMIN'),
   invitationController.revoke
);

router.get(
   '/api/users',
   authenticate,
   requireRole('ADMIN'),
   userController.list
);
router.delete(
   '/api/users/:id',
   authenticate,
   requireRole('ADMIN'),
   userController.delete
);

// ─── Dashboard (protected) ──────────────────────────────────────────────────────

router.get(
   '/api/dashboard/:eventId/overview',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   requireEventOwnership,
   dashboardController.getOverview
);

router.get(
   '/api/dashboard/:eventId/orders',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   requireEventOwnership,
   dashboardController.getOrders
);

router.get(
   '/api/dashboard/orders/:orderId',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   dashboardController.getOrderById
);

router.get(
   '/api/dashboard/:eventId/menu',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   requireEventOwnership,
   dashboardController.getMenuItems
);

router.patch(
   '/api/dashboard/orders/:orderId/status',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   dashboardController.updateOrderStatus
);

router.get(
   '/api/dashboard/:eventId/analytics',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   requireEventOwnership,
   dashboardController.getAnalytics
);

// ─── Export (protected) ──────────────────────────────────────────────────────────

router.get(
   '/api/export/:eventId/orders',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   requireEventOwnership,
   exportController.exportOrders
);

router.get(
   '/api/export/:eventId/food-order-by-user-list',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   requireEventOwnership,
   exportController.exportFoodOrdersByUserList
);

router.get(
   '/api/export/:eventId/print-out-list',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   requireEventOwnership,
   exportController.exportPrintOutList
);

router.get(
   '/api/export/:eventId/food-order-by-seller-list',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   requireEventOwnership,
   exportController.exportFoodOrdersBySellerList
);

router.get(
   '/api/export/:eventId/menu',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   requireEventOwnership,
   exportController.exportMenu
);

router.get(
   '/api/export/orders/:orderId/packing-slip',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   exportController.generatePackingSlip
);

// ─── Chat (public) ───────────────────────────────────────────────────────────
router.post('/api/chat', chatController.sendMessage);
router.post('/api/chat/extract-order', chatController.extractOrder);

// ─── Events ──────────────────────────────────────────────────────────────────
// POST /api/events - create event.
// Request:
// {
//    "name": "Fundraising Food Fair",
//    "eventInfo": "Fundraising food fair",
//    "eventDate": "2026-07-20",
//    "location": "Auckland CBD",
//    "preOrderClose": "2026-07-18"
//  }
router.post(
   '/api/events',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   eventController.createEvent
);

// GET /api/events - get all events.
router.get('/api/events', eventController.getEvents);

// GET /api/events/active - get active events (events that are upcoming or ongoing).
router.get('/api/events/active', eventController.getAciveEvents);

// GET /api/events/:id - get event by id. Includes:
// menu items
// event details
router.get('/api/events/:id', eventController.getEventById);

// PATCH /api/events/:id - update event details.
// Request:
// {
//    "name": "Fundraising Food Fair",
//    "eventInfo": "Fundraising food fair",
//    "eventDate": "2026-07-20",
//    "location": "Auckland CBD",
//    "preOrderClose": "2026-07-18"
//  }
router.patch(
   '/api/events/:id',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   eventController.updateEvent
);

// DELETE /api/events/:id - delete event.
router.delete(
   '/api/events/:id',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   eventController.deleteEvent
);

// ─── Menu Items ──────────────────────────────────────────────────────────────
// POST /api/menu-items - create menu item for an event.
// Request:
// {
//   "eventId": 1,
//   "itemCode": "MOH001",
//   "name": "Mohinga",
//   "category": "MAIN_DISH",
//   "price": 15,
//   "stockQty": 100
// }
router.post(
   '/api/menu-items',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   menuItemController.createMenuItem
);

// POST /api/menu-items/batch - create multiple menu items for an event in batch.
// Request:
// {
//    "eventId": 1,
//    "items": [
//      {
//        "itemCode": "MD-001",
//        "name": "ကြက်သားဒံပေါက်",
//        "category": "MAIN_DISH",
//        "price": 20,
//        "stockQty": 25
//      },
//      {
//        "itemCode": "DR-001",
//        "name": "Durian Bubble Tea",
//        "category": "DRINK",
//        "price": 10,
//        "stockQty": 20
//      }
//    ]
//  }
router.post(
   '/api/menu-items/batch',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   menuItemController.createMenuItemBatch
);

// GET /api/events/:eventId/menu-items - get menu items for an event.
router.get(
   '/api/events/:eventId/menu-items',
   menuItemController.getAllMenuItemsByEventId
);

// PATCH /api/menu-items/:id - update menu item details.
router.patch(
   '/api/menu-items/:id',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   menuItemController.updateMenuItem
);

// DELETE /api/menu-items/:id - delete menu item.
router.delete(
   '/api/menu-items/:id',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   menuItemController.deleteMenuItem
);

// ─── Orders ──────────────────────────────────────────────────────────────────
// POST /api/orders - create order for menu items.
// Request:
// {
//    "eventId": 1,
//    "customer": {
//      "name": "Sandar",
//      "phone": "021123456"
//    },
//    "items": [
//      {
//        "menuItemId": 1,
//        "qty": 2
//      },
//      {
//        "menuItemId": 3,
//        "qty": 1
//      }
//    ],
//    "note": "I will pick up order myself."
//  }
router.post('/api/orders', orderController.createOrder);

// GET /api/orders/:eventId - get all orders for an event. Include order details, customer details, and ordered items details.
router.get('/api/orders/event/:eventId', orderController.getOrdersByEventId);

// GET /api/orders/:orderNumber - get order details by order number.
router.get('/api/orders/:orderNumber', orderController.getOrderByOrderNo);

// GET /api/orders/:orderId - get order details by order ID.
router.get('/api/orders/id/:orderId', orderController.getOrderById);

// PATCH /api/orders/:orderNumber - update order details (e.g. change qty, add/remove items, update note).
router.patch(
   '/api/orders/:orderNumber',
   orderController.updateOrderByOrderNumber
);

// PATCH /api/orders/:orderNumber/cancel - cancel order.
router.patch(
   '/api/orders/:orderNumber/cancel',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   orderController.cancelOrderByOrderNumber
);

// PATCH /api/orders/:orderNumber/confirm - confirm order (mark as paid and ready for preparation).
router.patch(
   '/api/orders/:orderNumber/confirm',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   orderController.confirmOrderByOrderNumber
);

// PATCH /api/orders/:orderNumber/complete - complete order (mark as picked up/delivered).
router.patch(
   '/api/orders/:orderNumber/complete',
   authenticate,
   requireRole('ADMIN', 'ORGANIZER'),
   orderController.completeOrderByOrderNumber
);

// POST /api/orders/:orderNumber/payment - upload payment screenshot.
router.post('/api/orders/:orderNumber/payment', uploadPaymentScreenshot);

export default router;
