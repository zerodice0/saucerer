import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env.js';

// R2 환경 변수 검증
const requiredR2Vars = {
  R2_ACCOUNT_ID: config.r2AccountId,
  R2_ACCESS_KEY_ID: config.r2AccessKeyId,
  R2_SECRET_ACCESS_KEY: config.r2SecretAccessKey,
  R2_PUBLIC_URL: config.r2PublicUrl,
};

// 프로덕션 환경에서는 필수, 개발 환경에서는 경고
for (const [key, value] of Object.entries(requiredR2Vars)) {
  if (!value) {
    const message = `환경변수 ${key}가 설정되지 않았습니다. 이미지 업로드 기능이 작동하지 않을 수 있습니다.`;
    if (config.nodeEnv === 'production') {
      throw new Error(message);
    } else {
      console.warn(`⚠️  ${message}`);
    }
  }
}

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
