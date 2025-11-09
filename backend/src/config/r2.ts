import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env.js';

// Cloudflare R2는 S3 호환 API 사용
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  },
});

export const R2_BUCKET = config.r2BucketName;
export const R2_PUBLIC_URL = config.r2PublicUrl;
