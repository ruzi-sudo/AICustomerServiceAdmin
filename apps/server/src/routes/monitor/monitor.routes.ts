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

export const operationLogs = createRoute({
  method: 'post',
  path: '/operation-logs',
  tags: ['monitor'],
  request: { body: { content: { 'application/json': { schema: ListQuerySchema } } } },
  responses: {
    '200': { description: '操作日志列表' },
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
