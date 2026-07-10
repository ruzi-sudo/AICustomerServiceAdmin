import { z } from '@hono/zod-openapi';

const optionalNumber = z.preprocess(
  v => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  z.coerce.number().optional()
);

export const ListRolesQuerySchema = z.object({
  name: z.string().optional().openapi({ example: '超级管理员' }),
  status: optionalNumber.openapi({ example: 1 }),
  code: z.union([z.string(), z.array(z.string())]).optional().openapi({ example: 'admin' }),
  pageNum: z.coerce.number().positive().int().default(1),
  pageSize: z.coerce.number().positive().int().default(10),
});

export const RoleMenuIdsSchema = z.object({
  id: z.number().openapi({ example: 1 }),
});
