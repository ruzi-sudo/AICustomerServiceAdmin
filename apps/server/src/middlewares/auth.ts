import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { UnauthorizedException } from '../common/exception';

const JWT_SECRET = process.env.JWT_SECRET || 'pureadmin-jwt-secret-key';

export interface JwtPayload {
  userId: number;
  username: string;
  roles: string[];
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function signRefreshToken(payload: Pick<JwtPayload, 'userId' | 'username'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('未登录或登录状态已过期');
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    c.set('user', payload);
    await next();
  } catch (err) {
    throw new UnauthorizedException('登录状态已过期，请重新登录');
  }
}
