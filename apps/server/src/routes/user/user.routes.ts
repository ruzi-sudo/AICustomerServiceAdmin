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

export const createUser = createRoute({
  method: 'post',
  path: '/user/create',
  tags: ['user'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            username: z.string().min(2).max(64),
            password: z.string().min(6).max(64),
            avatar: z.string().optional(),
            email: z.string(),
            status: z.coerce.number().optional(),
            roleIds: z.array(z.number()).optional(),
            remark: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    '200': { description: '创建成功' },
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

export const updateUser = createRoute({
  method: 'post',
  path: '/user/update',
  tags: ['user'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.number(),
            username: z.string().min(2).max(64).optional(),
            avatar: z.string().optional(),
            email: z.string().optional(),
            status: z.coerce.number().optional(),
            roleIds: z.array(z.number()).optional(),
            remark: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    '200': { description: '修改成功' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const deleteUser = createRoute({
  method: 'post',
  path: '/user/delete',
  tags: ['user'],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ id: z.number() }) } },
    },
  },
  responses: {
    '200': { description: '删除成功' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const batchDeleteUser = createRoute({
  method: 'post',
  path: '/user/batch-delete',
  tags: ['user'],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ ids: z.array(z.number()) }) } },
    },
  },
  responses: {
    '200': { description: '批量删除成功' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const resetPassword = createRoute({
  method: 'post',
  path: '/user/reset-password',
  tags: ['user'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.number(),
            password: z.string().min(6).max(64),
          }),
        },
      },
    },
  },
  responses: {
    '200': { description: '重置成功' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
