import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class ApiException extends HTTPException {
  public code: number;

  constructor(code: number, status: ContentfulStatusCode, options?: { res?: Response; message?: string; cause?: unknown }) {
    super(status, {
      ...options,
      message: options?.message || 'Internal Server Error',
    });
    this.name = 'ApiException';
    this.code = code;
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message = '未登录或登录状态已过期') {
    super(10002, 401, { message });
    this.name = 'UnauthorizedException';
  }
}

export class ParamsException extends ApiException {
  constructor(message = '请求参数缺失或格式不正确') {
    super(10001, 400, { message });
    this.name = 'ParamsException';
  }
}

export class NotFoundException extends ApiException {
  constructor(message = '资源不存在') {
    super(10003, 404, { message });
    this.name = 'NotFoundException';
  }
}
