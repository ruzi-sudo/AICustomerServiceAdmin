import { z } from '@hono/zod-openapi';

export const ListQuerySchema = z.object({
  username: z.string().optional(),
  status: z.coerce.number().optional(),
  module: z.string().optional(),
  pageNum: z.coerce.number().positive().int().default(1),
  pageSize: z.coerce.number().positive().int().default(10),
});

export const DetailQuerySchema = z.object({
  id: z.number().openapi({ example: 1 }),
});
