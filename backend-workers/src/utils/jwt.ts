import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from '../types/env';

const ALGORITHM = 'HS256';

/**
 * JWT 토큰 생성
 */
export async function signJWT(payload: JWTPayload, secret: string, expiresIn: string = '7d'): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);

  // expiresIn을 초 단위로 변환 (7d -> 604800초)
  const expirationTime = parseExpiration(expiresIn);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirationTime)
    .sign(secretKey);

  return token;
}

/**
 * JWT 토큰 검증
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const secretKey = new TextEncoder().encode(secret);

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [ALGORITHM],
    });

    return payload as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * expiresIn 문자열을 초 단위로 변환
 * 예: '7d' -> 604800, '24h' -> 86400, '60m' -> 3600
 */
function parseExpiration(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiresIn format. Use format like: 60s, 30m, 24h, 7d');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: throw new Error('Invalid time unit');
  }
}
