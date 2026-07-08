import { createRoute } from '@hono/zod-openapi';
import { LoginBodySchema, RefreshBodySchema } from './auth.schemas';
import { ErrorResponseSchema } from '../../common/schemas';

export const login = createRoute({
  method: 'post',
  path: '/login',
  tags: ['auth'],
  request: { body: { content: { 'application/json': { schema: LoginBodySchema } } } },
  responses: {
    '200': { description: '登录成功' },
    '400': { description: '参数错误', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const refreshToken = createRoute({
  method: 'post',
  path: '/refresh-token',
  tags: ['auth'],
  request: { body: { content: { 'application/json': { schema: RefreshBodySchema } } } },
  responses: {
    '200': { description: '刷新成功' },
    '400': { description: '参数错误', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
