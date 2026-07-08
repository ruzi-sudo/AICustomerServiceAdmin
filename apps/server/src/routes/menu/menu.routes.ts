import { createRoute } from '@hono/zod-openapi';
import { ErrorResponseSchema } from '../../common/schemas';

export const listMenus = createRoute({
  method: 'post',
  path: '/menu',
  tags: ['menu'],
  responses: {
    '200': { description: '菜单列表' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const getAsyncRoutes = createRoute({
  method: 'get',
  path: '/get-async-routes',
  tags: ['menu'],
  responses: {
    '200': { description: '动态路由' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
