import { OpenAPIHono } from '@hono/zod-openapi';
import { validatorParamsHook } from '../../common/validator';
import * as routes from './menu.routes';
import * as menuService from '../../service/menu.service';

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.listMenus, async (c) => {
  const data = await menuService.listAllMenus();
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.getAsyncRoutes, async (c) => {
  const user = c.get('user') as { roles: string[] };
  const data = await menuService.getAsyncRoutes(user.roles);
  return c.json({ code: 0, message: '操作成功', data });
});
