import { OpenAPIHono } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { validatorParamsHook } from '../../common/validator';
import * as routes from './auth.routes';
import * as authService from '../../service/auth.service';
import { ParamsException } from '../../common/exception';
import { getDb } from '../../db';
import { sysOnlineUsers } from '../../db/schema';

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.login, async (c) => {
  const body = c.req.valid('json');
  try {
    const data = await authService.login(body.username, body.password, {
      ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || '127.0.0.1',
      ua: c.req.header('user-agent') || '',
    });
    return c.json({ code: 0, message: '操作成功', data });
  } catch (err: any) {
    return c.json({ code: err.code, message: err.message, data: {} }, err.status || 400);
  }
});

route.openapi(routes.refreshToken, async (c) => {
  const body = c.req.valid('json');
  try {
    const data = await authService.refreshToken(body.refreshToken);
    return c.json({ code: 0, message: '操作成功', data });
  } catch (err: any) {
    return c.json({ code: err.code, message: err.message, data: {} }, err.status || 400);
  }
});
