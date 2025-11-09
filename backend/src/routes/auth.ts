import { FastifyInstance } from 'fastify';
import oauth2 from '@fastify/oauth2';
import { config } from '../config/env.js';
import { User, InsertUser } from '../types/database.js';
import { JWTPayload } from '../middleware/auth.js';

export async function setupAuth(fastify: FastifyInstance) {
  // Google OAuth2 설정
  await fastify.register(oauth2, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: config.googleClientId,
        secret: config.googleClientSecret,
      },
      auth: oauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/google',
    callbackUri: config.oauthCallbackUrl,
  });

  // Google 로그인 시작
  fastify.get('/google', async (request, reply) => {
    try {
      const redirectUrl = await (fastify as any).googleOAuth2.generateAuthorizationUri(request);
      reply.redirect(redirectUrl);
    } catch (err) {
      fastify.log.error('Google OAuth 시작 실패:', err);
      reply.code(500).send({ error: 'OAuth 인증 시작 실패' });
    }
  });

  // Google OAuth 콜백
  fastify.get('/google/callback', async (request, reply) => {
    try {
      const { token } = await (fastify as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      // Google 사용자 정보 가져오기
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      const googleUser: any = await response.json();

      // 사용자 조회 또는 생성
      let user = await fastify.sql<User[]>`
        SELECT * FROM users WHERE google_id = ${googleUser.id} LIMIT 1
      `.then(rows => rows[0]);

      if (!user) {
        // 이메일로 기존 사용자 확인
        user = await fastify.sql<User[]>`
          SELECT * FROM users WHERE email = ${googleUser.email} LIMIT 1
        `.then(rows => rows[0]);

        if (user) {
          // 기존 사용자에 Google ID 연결
          await fastify.sql`
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

          [user] = await fastify.sql<User[]>`
            INSERT INTO users (email, name, google_id)
            VALUES (${newUser.email}, ${newUser.name}, ${newUser.google_id})
            RETURNING *
          `;
        }
      }

      // JWT 토큰 생성
      const jwtPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
      };

      const jwtToken = fastify.jwt.sign(jwtPayload, {
        expiresIn: '7d',
      });

      // 쿠키에 토큰 저장
      reply.setCookie('token', jwtToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7일
      });

      // 프론트엔드로 리다이렉트
      reply.redirect(`${config.frontendUrl}/sauces`);
    } catch (err) {
      fastify.log.error('Google OAuth 콜백 실패:', err);
      reply.redirect(`${config.frontendUrl}?error=auth_failed`);
    }
  });

  // 로그아웃
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { success: true };
  });

  // 현재 사용자 정보
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await fastify.sql<User[]>`
      SELECT id, email, name, created_at
      FROM users
      WHERE id = ${request.user!.userId}
      LIMIT 1
    `.then(rows => rows[0]);

    if (!user) {
      return reply.code(404).send({ error: '사용자를 찾을 수 없습니다.' });
    }

    return user;
  });
}
