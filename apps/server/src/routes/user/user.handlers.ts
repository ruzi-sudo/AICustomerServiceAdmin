import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import { validatorParamsHook } from '../../common/validator';
import * as routes from './user.routes';
import * as userService from '../../service/user.service';
import * as roleService from '../../service/role.service';

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.listUsers, async (c) => {
  const body = c.req.valid('json');
  const data = await userService.listUsers({
    username: body.username,
    status: body.status,
    phone: body.phone,
    pageNum: body.pageNum,
    pageSize: body.pageSize,
  });
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.createUser, async (c) => {
  const body = c.req.valid('json');
  try {
    const data = await userService.createUser(body);
    return c.json({ code: 0, message: '操作成功', data });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message || '创建失败', data: {} }, err.status || 400);
  }
});

route.openapi(routes.updateUser, async (c) => {
  const body = c.req.valid('json');
  try {
    await userService.updateUser(body);
    return c.json({ code: 0, message: '操作成功', data: {} });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message || '修改失败', data: {} }, err.status || 400);
  }
});

route.openapi(routes.deleteUser, async (c) => {
  const body = c.req.valid('json');
  try {
    await userService.deleteUser(body.id);
    return c.json({ code: 0, message: '操作成功', data: {} });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message || '删除失败', data: {} }, err.status || 400);
  }
});

route.openapi(routes.batchDeleteUser, async (c) => {
  const body = c.req.valid('json');
  await userService.batchDeleteUser(body.ids);
  return c.json({ code: 0, message: '操作成功', data: {} });
});

route.openapi(routes.resetPassword, async (c) => {
  const body = c.req.valid('json');
  try {
    await userService.resetPassword(body.id, body.password);
    return c.json({ code: 0, message: '操作成功', data: {} });
  } catch (err: any) {
    return c.json({ code: err.code || 10001, message: err.message || '重置失败', data: {} }, err.status || 400);
  }
});

route.openapi(routes.listAllRoles, async (c) => {
  const data = await roleService.listAllRoles();
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.listRoleIds, async (c) => {
  const body = c.req.valid('json');
  if (!body.userId) {
    return c.json({ code: 10001, message: '请求参数缺失或格式不正确', data: [] }, 400);
  }
  const data = await roleService.getRoleIdsByUserId(body.userId);
  return c.json({ code: 0, message: '操作成功', data });
});
