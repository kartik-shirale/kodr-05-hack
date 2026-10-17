import crypto from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export type UserRole = 'TEACHER' | 'STUDENT';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: { sub: string; role: UserRole }): string {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: '15m',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtAccessSecret) as JwtPayload;
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax',
  maxAge: config.accessTokenTtlMs,
  path: '/',
};

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax',
  maxAge: config.refreshTokenTtlMs,
  path: '/',
};

export function setAuthCookies(res: Response, accessToken: string, rawRefreshToken: string) {
  res.cookie('access_token', accessToken, accessTokenCookieOptions);
  res.cookie('refresh_token', rawRefreshToken, refreshTokenCookieOptions);
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { ...accessTokenCookieOptions, maxAge: 0 });
  res.clearCookie('refresh_token', { ...refreshTokenCookieOptions, maxAge: 0 });
}
