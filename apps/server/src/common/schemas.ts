import { z } from '@hono/zod-openapi';

export const PaginationSchema = z.object({
  pageNum: z.coerce.number().positive().int().default(1).openapi({ example: 1 }),
  pageSize: z.coerce.number().positive().int().max(100).default(10).openapi({ example: 10 }),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number().default(0),
    message: z.string().default('操作成功'),
    data: dataSchema,
  });

export const ApiListSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    list: z.array(itemSchema),
    total: z.number(),
    pageSize: z.number(),
    currentPage: z.number(),
  });

export const ErrorResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({}).optional(),
});
