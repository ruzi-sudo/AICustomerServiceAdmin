import { createRoute } from '@hono/zod-openapi';
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
