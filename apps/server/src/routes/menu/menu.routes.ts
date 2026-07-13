import { createRoute, z } from '@hono/zod-openapi';
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

export const createMenu = createRoute({
  method: 'post',
  path: '/menu/create',
  tags: ['menu'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            parentId: z.coerce.number().optional(),
            menuType: z.coerce.number().default(0),
            title: z.string().min(1),
            name: z.string().optional(),
            path: z.string().optional(),
            component: z.string().optional(),
            rank: z.coerce.number().optional(),
            redirect: z.string().optional(),
            icon: z.string().optional(),
            extraIcon: z.string().optional(),
            enterTransition: z.string().optional(),
            leaveTransition: z.string().optional(),
            activePath: z.string().optional(),
            auths: z.string().optional(),
            keepAlive: z.coerce.number().optional(),
            hiddenTag: z.coerce.number().optional(),
            fixedTag: z.coerce.number().optional(),
            showLink: z.coerce.number().optional(),
            showParent: z.coerce.number().optional(),
            status: z.coerce.number().optional(),
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

export const updateMenu = createRoute({
  method: 'post',
  path: '/menu/update',
  tags: ['menu'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.coerce.number(),
            parentId: z.coerce.number().optional(),
            menuType: z.coerce.number().optional(),
            title: z.string().min(1).optional(),
            name: z.string().optional(),
            path: z.string().optional(),
            component: z.string().optional(),
            rank: z.coerce.number().optional(),
            redirect: z.string().optional(),
            icon: z.string().optional(),
            extraIcon: z.string().optional(),
            enterTransition: z.string().optional(),
            leaveTransition: z.string().optional(),
            activePath: z.string().optional(),
            auths: z.string().optional(),
            keepAlive: z.coerce.number().optional(),
            hiddenTag: z.coerce.number().optional(),
            fixedTag: z.coerce.number().optional(),
            showLink: z.coerce.number().optional(),
            showParent: z.coerce.number().optional(),
            status: z.coerce.number().optional(),
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

export const deleteMenu = createRoute({
  method: 'post',
  path: '/menu/delete',
  tags: ['menu'],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ id: z.coerce.number() }) } },
    },
  },
  responses: {
    '200': { description: '删除成功' },
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
