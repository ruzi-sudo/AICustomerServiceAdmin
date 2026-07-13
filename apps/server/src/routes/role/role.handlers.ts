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

route.openapi(routes.createRole, async (c) => {
  const body = c.req.valid('json') as {
    name: string;
    code: string;
    status?: number;
    remark?: string;
  };
  try {
    const data = await roleService.createRole(body);
    return c.json({ code: 0, message: '操作成功', data });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message || '创建失败', data: {} }, err.status || 400);
  }
});

route.openapi(routes.updateRole, async (c) => {
  const body = c.req.valid('json') as {
    id: number;
    name?: string;
    code?: string;
    status?: number;
    remark?: string;
  };
  try {
    await roleService.updateRole(body);
    return c.json({ code: 0, message: '操作成功', data: {} });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message || '修改失败', data: {} }, err.status || 400);
  }
});

route.openapi(routes.deleteRole, async (c) => {
  const body = c.req.valid('json');
  try {
    await roleService.deleteRole(body.id);
    return c.json({ code: 0, message: '操作成功', data: {} });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message || '删除失败', data: {} }, err.status || 400);
  }
});

route.openapi(routes.saveRoleMenu, async (c) => {
  const body = c.req.valid('json');
  await roleService.saveRoleMenu(body.id, body.menuIds);
  return c.json({ code: 0, message: '操作成功', data: {} });
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
