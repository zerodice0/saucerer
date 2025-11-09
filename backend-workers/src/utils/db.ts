import { neon } from '@neondatabase/serverless';
import type { Env } from '../types/env';

/**
 * Neon PostgreSQL 연결 생성
 */
export function createDb(env: Env) {
  return neon(env.DATABASE_URL);
}

/**
 * SQL 헬퍼 - 기존 Fastify SQL과 유사한 인터페이스 제공
 */
export function sql(db: ReturnType<typeof neon>) {
  return db;
}
