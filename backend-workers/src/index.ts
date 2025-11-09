import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types/env';

// 라우트 임포트
import auth from './routes/auth';
import sauces from './routes/sauces';
import ingredients from './routes/ingredients';
import cookingRecords from './routes/cooking-records';
import upload from './routes/upload';

const app = new Hono<{ Bindings: Env }>();

// 로거 미들웨어
app.use('*', logger());

// CORS 설정
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// 헬스체크
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'saucerer-backend-workers',
  });
});

// 라우트 등록
app.route('/auth', auth);
app.route('/api/sauces', sauces);
app.route('/api/ingredients', ingredients);
app.route('/api/cooking-records', cookingRecords);
app.route('/api/upload', upload);

// 404 핸들러
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// 에러 핸들러
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
  }, 500);
});

export default app;
