import { OpenAPIHono } from '@hono/zod-openapi';
import { validatorParamsHook } from '../../common/validator';
import * as routes from './monitor.routes';
import * as monitorService from '../../service/monitor.service';

export const route = new OpenAPIHono({
  defaultHook: (result, c) => validatorParamsHook(result, c),
});

route.openapi(routes.onlineLogs, async (c) => {
  const body = c.req.valid('json');
  const data = await monitorService.listOnlineUsers({
    username: body.username,
    pageNum: body.pageNum,
    pageSize: body.pageSize,
  });
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.loginLogs, async (c) => {
  const body = c.req.valid('json');
  const data = await monitorService.listLoginLogs({
    username: body.username,
    status: body.status,
    pageNum: body.pageNum,
    pageSize: body.pageSize,
  });
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.systemLogs, async (c) => {
  const body = c.req.valid('json');
  const data = await monitorService.listSystemLogs({
    module: body.module,
    pageNum: body.pageNum,
    pageSize: body.pageSize,
  });
  return c.json({ code: 0, message: '操作成功', data });
});

route.openapi(routes.systemLogsDetail, async (c) => {
  const body = c.req.valid('json');
  const data = await monitorService.getSystemLogDetail(body.id);
  if (!data) {
    return c.json({ code: 10003, message: '日志不存在', data: {} }, 404);
  }
  return c.json({ code: 0, message: '操作成功', ...data });
});

route.openapi(routes.forceOffline, async (c) => {
  const body = c.req.valid('json');
  await monitorService.forceOffline(body.id);
  return c.json({ code: 0, message: '操作成功', data: {} });
});

route.openapi(routes.userLogout, async (c) => {
  const user = (c as any).get('user') as { username?: string } | undefined;
  if (user?.username) {
    await monitorService.forceOfflineByUsername(user.username);
  }
  return c.json({ code: 0, message: '操作成功', data: {} });
});

route.openapi(routes.deleteSystemLogs, async (c) => {
  const body = c.req.valid('json');
  await monitorService.deleteSystemLogs(body.ids);
  return c.json({ code: 0, message: '操作成功', data: {} });
});

route.openapi(routes.clearSystemLogs, async (c) => {
  await monitorService.clearSystemLogs();
  return c.json({ code: 0, message: '操作成功', data: {} });
});

route.openapi(routes.deleteLoginLogs, async (c) => {
  const body = c.req.valid('json');
  await monitorService.deleteLoginLogs(body.ids);
  return c.json({ code: 0, message: '操作成功', data: {} });
});

route.openapi(routes.clearLoginLogs, async (c) => {
  await monitorService.clearLoginLogs();
  return c.json({ code: 0, message: '操作成功', data: {} });
});
