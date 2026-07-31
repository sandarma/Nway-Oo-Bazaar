import type { Request, Response } from 'express';
import multer from 'multer';
import { paymentService } from '../services/payment.service';
import { getS3Object } from '../utils/s3';
import { Readable } from 'stream';

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

   async proxyS3File(req: Request, res: Response) {
      try {
         const keyParam = req.params.key;
         const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam;

         if (!key) {
            return res.status(400).json({ error: 'File key is required' });
         }

         const result = await getS3Object(key);

         if (result.ContentType) {
            res.setHeader('Content-Type', result.ContentType);
         }
         if (result.ContentLength) {
            res.setHeader('Content-Length', result.ContentLength);
         }
         res.setHeader('Cache-Control', 'public, max-age=86400');

         if (result.Body) {
            // Convert AWS SDK stream to Node.js readable stream
            const stream = result.Body as unknown as Readable;
            stream.pipe(res);
            return;
         }

         return res.status(404).json({ error: 'File not found' });
      } catch (error) {
         console.error('S3 proxy error:', error);
         return res.status(404).json({ error: 'File not found' });
      }
   },
};

// Export multer middleware for use in routes
export const uploadPaymentScreenshot = [
   upload.single('paymentScreenshot'),
   paymentController.uploadPaymentScreenshot,
];
