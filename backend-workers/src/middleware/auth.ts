import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyJWT } from '../utils/jwt';
import type { Env, JWTPayload } from '../types/env';

/**
 * JWT 인증 미들웨어
 */
export async function authenticate(c: Context<{ Bindings: Env }>) {
  try {
    const token = getCookie(c, 'token');

    if (!token) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    // Context에 사용자 정보 저장
    c.set('user', payload);

    // 다음 핸들러로 진행
    return;
  } catch (error) {
    return c.json({ error: '유효하지 않은 토큰입니다.' }, 401);
  }
}

/**
 * Context에서 사용자 정보 가져오기
 */
export function getUser(c: Context): JWTPayload {
  return c.get('user');
}
