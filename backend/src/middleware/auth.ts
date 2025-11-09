import { FastifyRequest, FastifyReply } from 'fastify';

export interface JWTPayload {
  userId: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<JWTPayload>();
    request.user = payload;
  } catch (err) {
    reply.code(401).send({ error: '인증이 필요합니다.' });
  }
}
