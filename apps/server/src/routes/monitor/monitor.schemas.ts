import { z } from '@hono/zod-openapi';

const optionalNumber = z.preprocess(
  v => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  z.coerce.number().optional()
);

export const ListQuerySchema = z.object({
  username: z.string().optional(),
  status: optionalNumber,
  module: z.string().optional(),
  pageNum: z.coerce.number().positive().int().default(1),
  pageSize: z.coerce.number().positive().int().default(10),
});

export const DetailQuerySchema = z.object({
  id: z.number().openapi({ example: 1 }),
});
