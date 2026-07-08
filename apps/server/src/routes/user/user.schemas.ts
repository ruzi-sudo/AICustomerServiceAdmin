import { z } from '@hono/zod-openapi';

export const ListUsersQuerySchema = z.object({
  username: z.string().optional().openapi({ example: 'admin' }),
  status: z.coerce.number().optional().openapi({ example: 1 }),
  phone: z.string().optional().openapi({ example: '15888886789' }),
  pageNum: z.coerce.number().positive().int().default(1),
  pageSize: z.coerce.number().positive().int().default(10),
});
