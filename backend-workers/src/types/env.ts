// Cloudflare Workers 환경 변수 타입 정의
export interface Env {
  // Secrets
  DATABASE_URL: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  R2_PUBLIC_URL: string;
  FRONTEND_URL: string;

  // R2 Bucket 바인딩
  IMAGES_BUCKET: R2Bucket;

  // 환경 변수
  ENVIRONMENT?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  exp?: number;
}
