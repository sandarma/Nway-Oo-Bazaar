import type { Request, Response } from 'express';
import multer from 'multer';
import { paymentService } from '../services/payment.service';

// Configure multer for memory storage (buffer for S3 upload)
const upload = multer({
   storage: multer.memoryStorage(),
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
   fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowed.includes(file.mimetype)) {
         cb(null, true);
      } else {
         cb(new Error('Only JPG, PNG, and WebP images are allowed'));
      }
   },
});

export const paymentController = {
   async uploadPaymentScreenshot(req: Request, res: Response) {
      try {
         const orderNumber = Array.isArray(req.params.orderNumber)
            ? req.params.orderNumber[0]
            : req.params.orderNumber;

         if (!orderNumber) {
            return res.status(400).json({ error: 'Order number is required' });
         }

         if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
         }

         const result = await paymentService.uploadPaymentScreenshot(
            orderNumber,
            req.file
         );

         return res.json(result);
      } catch (error) {
         const message =
            error instanceof Error
               ? error.message
               : 'Failed to upload payment screenshot';
         const status = message === 'Order not found' ? 404 : 500;
         return res.status(status).json({ error: message });
      }
   },
};

// Export multer middleware for use in routes
export const uploadPaymentScreenshot = [
   upload.single('paymentScreenshot'),
   paymentController.uploadPaymentScreenshot,
];
