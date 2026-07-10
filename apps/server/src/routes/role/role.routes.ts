import { createRoute, z } from '@hono/zod-openapi';
import { ListRolesQuerySchema, RoleMenuIdsSchema } from './role.schemas';
import { ErrorResponseSchema } from '../../common/schemas';

export const listRoles = createRoute({
  method: 'post',
  path: '/role',
  tags: ['role'],
  request: { body: { content: { 'application/json': { schema: ListRolesQuerySchema } } } },
  responses: {
    '200': { description: '角色列表' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const createRole = createRoute({
  method: 'post',
  path: '/role/create',
  tags: ['role'],
  request: { body: { content: { 'application/json': { schema: z.object({
    name: z.string().min(1).max(64),
    code: z.string().min(1).max(64),
    status: z.coerce.number().optional(),
    remark: z.string().optional(),
  }) } } } },
  responses: {
    '200': { description: '创建成功' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const updateRole = createRoute({
  method: 'post',
  path: '/role/update',
  tags: ['role'],
  request: { body: { content: { 'application/json': { schema: z.object({
    id: z.number(),
    name: z.string().min(1).max(64).optional(),
    code: z.string().min(1).max(64).optional(),
    status: z.coerce.number().optional(),
    remark: z.string().optional(),
  }) } } } },
  responses: {
    '200': { description: '修改成功' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const deleteRole = createRoute({
  method: 'post',
  path: '/role/delete',
  tags: ['role'],
  request: { body: { content: { 'application/json': { schema: z.object({ id: z.number() }) } } } },
  responses: {
    '200': { description: '删除成功' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const saveRoleMenu = createRoute({
  method: 'post',
  path: '/role/save-menu',
  tags: ['role'],
  request: { body: { content: { 'application/json': { schema: z.object({
    id: z.number(),
    menuIds: z.array(z.number()),
  }) } } } },
  responses: {
    '200': { description: '保存成功' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const roleMenu = createRoute({
  method: 'post',
  path: '/role-menu',
  tags: ['role'],
  responses: {
    '200': { description: '菜单权限树' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const roleMenuIds = createRoute({
  method: 'post',
  path: '/role-menu-ids',
  tags: ['role'],
  request: { body: { content: { 'application/json': { schema: RoleMenuIdsSchema } } } },
  responses: {
    '200': { description: '角色已分配的菜单ID' },
    '401': { description: '未授权', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});
