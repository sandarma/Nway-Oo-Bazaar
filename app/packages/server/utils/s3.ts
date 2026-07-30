import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
   region: process.env.MY_AWS_REGION || 'us-east-2',
   credentials: {
      accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || '',
   },
});

interface UploadParams {
   bucket: string;
   key: string;
   body: Buffer;
   contentType: string;
}

export async function uploadToS3({
   bucket,
   key,
   body,
   contentType,
}: UploadParams): Promise<string> {
   const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
   });

   await s3Client.send(command);

   // Return the S3 URL
   return `https://${bucket}.s3.${process.env.MY_AWS_REGION || 'us-east-2'}.amazonaws.com/${key}`;
}
