import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { createDb } from '../utils/db';
import { signJWT } from '../utils/jwt';
import { authenticate, getUser } from '../middleware/auth';
import type { Env, JWTPayload } from '../types/env';
import type { User, InsertUser } from '../types/database';

const auth = new Hono<{ Bindings: Env }>();

/**
 * Google OAuth2 로그인 시작
 */
auth.get('/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const callbackUrl = `${c.req.url.split('/auth')[0]}/auth/google/callback`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'profile email');
  authUrl.searchParams.set('access_type', 'online');

  return c.redirect(authUrl.toString());
});

/**
 * Google OAuth2 콜백
 */
auth.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code');
    if (!code) {
      return c.redirect(`${c.env.FRONTEND_URL}?error=auth_failed`);
    }

    // Access Token 교환
    const callbackUrl = `${c.req.url.split('/auth')[0]}/auth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as { access_token: string };

    // 사용자 정보 가져오기
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json() as {
      id: string;
      email: string;
      name: string;
    };

    // 데이터베이스 연결
    const db = createDb(c.env);

    // 사용자 조회 또는 생성
    let user = await db`
      SELECT * FROM users WHERE google_id = ${googleUser.id} LIMIT 1
    `.then((rows: User[]) => rows[0]);

    if (!user) {
      // 이메일로 기존 사용자 확인
      user = await db`
        SELECT * FROM users WHERE email = ${googleUser.email} LIMIT 1
      `.then((rows: User[]) => rows[0]);

      if (user) {
        // 기존 사용자에 Google ID 연결
        await db`
          UPDATE users
          SET google_id = ${googleUser.id},
              name = ${googleUser.name},
              updated_at = NOW()
          WHERE id = ${user.id}
        `;
      } else {
        // 새 사용자 생성
        const newUser: InsertUser = {
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.id,
        };

        const result = await db`
          INSERT INTO users (email, name, google_id)
          VALUES (${newUser.email}, ${newUser.name}, ${newUser.google_id})
          RETURNING *
        `;
        user = result[0] as User;
      }
    }

    // JWT 토큰 생성
    const jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
    };

    const token = await signJWT(jwtPayload, c.env.JWT_SECRET, '7d');

    // 쿠키에 토큰 저장
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7일
    });

    // 프론트엔드로 리다이렉트
    return c.redirect(`${c.env.FRONTEND_URL}/sauces`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.redirect(`${c.env.FRONTEND_URL}?error=auth_failed`);
  }
});

/**
 * 로그아웃
 */
auth.post('/logout', async (c) => {
  deleteCookie(c, 'token', { path: '/' });
  return c.json({ success: true });
});

/**
 * 현재 사용자 정보
 */
auth.get('/me', authenticate, async (c) => {
  try {
    const userPayload = getUser(c);
    const db = createDb(c.env);

    const user = await db`
      SELECT id, email, name, created_at
      FROM users
      WHERE id = ${userPayload.userId}
      LIMIT 1
    `.then((rows: User[]) => rows[0]);

    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    return c.json(user);
  } catch (error) {
    return c.json({ error: '사용자 조회 실패' }, 500);
  }
});

export default auth;
