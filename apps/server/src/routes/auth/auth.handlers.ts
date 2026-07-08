import { OpenAPIHono } from '@hono/zod-openapi';
import { validatorParamsHook } from '../../common/validator';
import * as routes from './auth.routes';
import * as authService from '../../service/auth.service';
import { ParamsException } from '../../common/exception';

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.login, async (c) => {
  const body = c.req.valid('json');
  try {
    const data = await authService.login(body.username, body.password);
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
