import { createRoute } from '@hono/zod-openapi';
import { LoginBodySchema, RefreshBodySchema, RegisterBodySchema } from './auth.schemas';
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

export const register = createRoute({
  method: 'post',
  path: '/register',
  tags: ['auth'],
  request: { body: { content: { 'application/json': { schema: RegisterBodySchema } } } },
  responses: {
    '200': { description: '注册成功' },
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

export const logout = createRoute({
  method: 'post',
  path: '/logout',
  tags: ['auth'],
  responses: {
    '200': { description: '退出成功' },
  },
});
