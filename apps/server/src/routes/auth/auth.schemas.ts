import { z } from '@hono/zod-openapi';

export const LoginBodySchema = z.object({
  username: z.string().min(1).openapi({ example: 'admin' }),
  password: z.string().min(1).openapi({ example: 'admin123' }),
});

export const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1).openapi({ example: 'eyJhbGciOiJIUzUxMiJ9.adminRefresh' }),
});

export const LoginResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    avatar: z.string(),
    username: z.string(),
    nickname: z.string(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    accessToken: z.string(),
    refreshToken: z.string(),
    expires: z.string(),
  }),
});

export const RefreshResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expires: z.string(),
  }),
});
