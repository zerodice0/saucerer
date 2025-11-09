import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import postgres from 'postgres';
import { config } from '../config/env.js';

export interface Database {
  sql: postgres.Sql;
}

async function databasePlugin(fastify: FastifyInstance) {
  const sql = postgres(config.databaseUrl, {
    ssl: config.nodeEnv === 'production' ? 'require' : false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // SQL 헬퍼 함수들을 Fastify 인스턴스에 추가
  fastify.decorate('sql', sql);

  // 서버 종료 시 DB 연결 종료
  fastify.addHook('onClose', async () => {
    await sql.end();
  });

  // 연결 테스트
  try {
    await sql`SELECT 1`;
    fastify.log.info('✅ PostgreSQL 연결 성공');
  } catch (error) {
    fastify.log.error('❌ PostgreSQL 연결 실패:', error);
    throw error;
  }
}

export const setupDatabase = fp(databasePlugin, {
  name: 'database',
});

// TypeScript 타입 확장
declare module 'fastify' {
  interface FastifyInstance {
    sql: postgres.Sql;
  }
}
