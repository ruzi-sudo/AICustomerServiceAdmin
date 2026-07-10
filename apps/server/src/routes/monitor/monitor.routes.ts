import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { ListQuerySchema, DetailQuerySchema } from './monitor.schemas';
import { ErrorResponseSchema } from '../../common/schemas';

export const onlineLogs = createRoute({
  method: 'post',
  path: '/online-logs',
  tags: ['monitor'],
  request: { body: { content: { 'application/json': { schema: ListQuerySchema } } } },
  responses: {
    '200': { description: '在线用户列表' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const loginLogs = createRoute({
  method: 'post',
  path: '/login-logs',
  tags: ['monitor'],
  request: { body: { content: { 'application/json': { schema: ListQuerySchema } } } },
  responses: {
    '200': { description: '登录日志列表' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const systemLogs = createRoute({
  method: 'post',
  path: '/system-logs',
  tags: ['monitor'],
  request: { body: { content: { 'application/json': { schema: ListQuerySchema } } } },
  responses: {
    '200': { description: '系统日志列表' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const systemLogsDetail = createRoute({
  method: 'post',
  path: '/system-logs-detail',
  tags: ['monitor'],
  request: { body: { content: { 'application/json': { schema: DetailQuerySchema } } } },
  responses: {
    '200': { description: '系统日志详情' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const forceOffline = createRoute({
  method: 'post',
  path: '/online-logs/force-offline',
  tags: ['monitor'],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ id: z.number() }) } },
    },
  },
  responses: {
    '200': { description: '强退成功' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const userLogout = createRoute({
  method: 'post',
  path: '/logout',
  tags: ['monitor'],
  responses: {
    '200': { description: '退出成功' },
  },
});

export const deleteSystemLogs = createRoute({
  method: 'post',
  path: '/system-logs/delete',
  tags: ['monitor'],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ ids: z.array(z.number()) }) } },
    },
  },
  responses: {
    '200': { description: '删除成功' },
  },
});

export const clearSystemLogs = createRoute({
  method: 'post',
  path: '/system-logs/clear',
  tags: ['monitor'],
  responses: {
    '200': { description: '清空成功' },
  },
});

export const deleteLoginLogs = createRoute({
  method: 'post',
  path: '/login-logs/delete',
  tags: ['monitor'],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ ids: z.array(z.number()) }) } },
    },
  },
  responses: {
    '200': { description: '删除成功' },
  },
});

export const clearLoginLogs = createRoute({
  method: 'post',
  path: '/login-logs/clear',
  tags: ['monitor'],
  responses: {
    '200': { description: '清空成功' },
  },
});
