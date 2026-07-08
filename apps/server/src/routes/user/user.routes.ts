import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import { ListUsersQuerySchema } from './user.schemas';
import { ErrorResponseSchema } from '../../common/schemas';

export const listUsers = createRoute({
  method: 'post',
  path: '/user',
  tags: ['user'],
  request: { body: { content: { 'application/json': { schema: ListUsersQuerySchema } } } },
  responses: {
    '200': { description: '用户列表' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const listAllRoles = createRoute({
  method: 'get',
  path: '/list-all-role',
  tags: ['user'],
  responses: {
    '200': { description: '所有角色列表' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const listRoleIds = createRoute({
  method: 'post',
  path: '/list-role-ids',
  tags: ['user'],
  request: { body: { content: { 'application/json': { schema: z.object({ userId: z.number() }) } } } },
  responses: {
    '200': { description: '用户的角色ID列表' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
