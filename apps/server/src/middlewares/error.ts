import type { Context, ErrorHandler } from 'hono';
import type { HTTPResponseError } from 'hono/types';
import { ApiException } from '../common/exception';

export const errorHandler: ErrorHandler = (err: Error | HTTPResponseError, c: Context) => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof ApiException) {
    return c.json({
      code: err.code,
      message: err.message,
      data: {},
    }, err.status);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return c.json({
      code: 10002,
      message: '登录状态已过期，请重新登录',
      data: {},
    }, 401);
  }

  // Default error
  return c.json({
    code: -1,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    data: {},
  }, 500);
};
