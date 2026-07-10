import { z } from '@hono/zod-openapi';

export const ErrorResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({}).optional(),
});
