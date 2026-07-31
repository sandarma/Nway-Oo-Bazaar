import {
   S3Client,
   PutObjectCommand,
   GetObjectCommand,
} from '@aws-sdk/client-s3';

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

   // Return the proxy URL instead of direct S3 URL
   return `/api/s3/${key}`;
}

export async function getS3Object(key: string) {
   const bucketName = process.env.MY_AWS_S3_BUCKET_NAME || '';
   const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
   });

   const response = await s3Client.send(command);
   return {
      Body: response.Body,
      ContentType: response.ContentType,
      ContentLength: response.ContentLength,
   };
}
