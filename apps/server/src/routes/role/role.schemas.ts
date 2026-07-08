import { z } from '@hono/zod-openapi';

export const ListRolesQuerySchema = z.object({
  name: z.string().optional().openapi({ example: '超级管理员' }),
  status: z.coerce.number().optional().openapi({ example: 1 }),
  code: z.string().optional().openapi({ example: 'admin' }),
  pageNum: z.coerce.number().positive().int().default(1),
  pageSize: z.coerce.number().positive().int().default(10),
});

export const RoleMenuIdsSchema = z.object({
  id: z.number().openapi({ example: 1 }),
});
