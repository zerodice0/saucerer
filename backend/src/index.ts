import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import { config } from './config/env.js';
import { setupDatabase } from './plugins/database.js';
import { authenticate } from './middleware/auth.js';
import { setupAuth } from './routes/auth.js';
import { setupSauces } from './routes/sauces.js';
import { setupIngredients } from './routes/ingredients.js';
import { setupCookingRecords } from './routes/cooking-records.js';
import { setupUpload } from './routes/upload.js';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
  },
});

async function start() {
  try {
    // CORS 설정
    await fastify.register(cors, {
      origin: config.frontendUrl,
      credentials: true,
    });

    // 쿠키 파서
    await fastify.register(cookie);

    // Multipart 파일 업로드
    await fastify.register(multipart);

    // JWT 플러그인
    await fastify.register(jwt, {
      secret: config.jwtSecret,
      cookie: {
        cookieName: 'token',
        signed: false,
      },
    });

    // 데이터베이스 연결
    await fastify.register(setupDatabase);

    // 인증 미들웨어 데코레이터 추가
    fastify.decorate('authenticate', authenticate);

    // 라우트 등록
    await fastify.register(setupAuth, { prefix: '/auth' });
    await fastify.register(setupSauces, { prefix: '/api/sauces' });
    await fastify.register(setupIngredients, { prefix: '/api/ingredients' });
    await fastify.register(setupCookingRecords, { prefix: '/api/cooking-records' });
    await fastify.register(setupUpload, { prefix: '/api/upload' });

    // 헬스체크
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // 서버 시작
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`🚀 Saucerer Backend 서버가 포트 ${config.port}에서 실행 중입니다`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
