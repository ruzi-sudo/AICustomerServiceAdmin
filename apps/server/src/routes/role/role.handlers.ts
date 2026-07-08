import { OpenAPIHono } from '@hono/zod-openapi';
import { validatorParamsHook } from '../../common/validator';
import * as routes from './role.routes';
import * as roleService from '../../service/role.service';
import * as menuService from '../../service/menu.service';

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.listRoles, async (c) => {
  const body = c.req.valid('json');
  const data = await roleService.listRoles({
    name: body.name,
    status: body.status,
    code: body.code,
    pageNum: body.pageNum,
    pageSize: body.pageSize,
  });
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.roleMenu, async (c) => {
  const data = await menuService.getRoleMenuTree();
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.roleMenuIds, async (c) => {
  const body = c.req.valid('json');
  const data = await menuService.getMenuIdsByRoleId(body.id);
  return c.json({ code: 0, message: '操作成功', data });
});
