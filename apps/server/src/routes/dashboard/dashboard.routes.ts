import { createRoute } from '@hono/zod-openapi';
import { ErrorResponseSchema } from '../../common/schemas';

export const getCardList = createRoute({
  method: 'post',
  path: '/get-card-list',
  tags: ['dashboard'],
  responses: {
    '200': { description: '卡片列表' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const getMapInfo = createRoute({
  method: 'get',
  path: '/get-map-info',
  tags: ['dashboard'],
  responses: {
    '200': { description: '地图信息' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const getMine = createRoute({
  method: 'get',
  path: '/mine',
  tags: ['dashboard'],
  responses: {
    '200': { description: '个人信息' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
