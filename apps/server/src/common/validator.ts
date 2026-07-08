import type { Context } from 'hono';
import type { ZodError } from 'zod';

export function validatorParamsHook(result: { success: boolean; error?: ZodError }, c: Context) {
  if (!result.success) {
    return c.json(
      { code: 10001, message: '请求参数缺失或格式不正确', data: {} },
      400,
    );
  }
}
