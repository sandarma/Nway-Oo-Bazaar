import { paymentRepository } from '../repositories/payment.repository';
import { uploadToS3 } from '../utils/s3';

export const paymentService = {
   async uploadPaymentScreenshot(
      orderNumber: string,
      file: Express.Multer.File
   ): Promise<{ message: string; url: string }> {
      const order = await paymentRepository.findOrderById(orderNumber);
      if (!order) {
         throw new Error('Order not found');
      }

      const bucketName = process.env.MY_AWS_S3_BUCKET_NAME || '';
      const key = `payment-screenshots/${orderNumber}-${Date.now()}${getExtension(file.originalname)}`;

      const screenshotUrl = await uploadToS3({
         bucket: bucketName,
         key,
         body: file.buffer,
         contentType: file.mimetype,
      });

      await paymentRepository.updatePaymentScreenshot(
         orderNumber,
         screenshotUrl
      );

      return {
         message: 'Payment screenshot uploaded successfully',
         url: screenshotUrl,
      };
   },
};

function getExtension(filename: string): string {
   const dotIndex = filename.lastIndexOf('.');
   return dotIndex !== -1 ? filename.substring(dotIndex) : '';
}
