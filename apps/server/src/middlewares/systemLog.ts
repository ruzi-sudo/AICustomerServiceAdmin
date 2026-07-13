import type { Context, Next } from 'hono';
import { getDb } from '../db';
import { sysSystemLogs, sysSystemLogDetails } from '../db/schema';

/**
 * 系统日志中间件
 * 标记在路由上即可自动记录请求/响应到 sys_system_logs
 *
 * 用法:
 *   app.use('/user/*', systemLogMiddleware)
 *   或
 *   route.openapi(someRoute, systemLogMiddleware, async (c) => { ... })
 */
export async function systemLogMiddleware(c: Context, next: Next) {
  // 跳过非 API 请求
  if (c.req.method === 'OPTIONS') {
    await next();
    return;
  }

  const url = new URL(c.req.url);
  const path = url.pathname.replace('/api', '');
  const start = Date.now();

  // 收集请求体
  let requestBody: string | null = null;
  try {
    const cloned = c.req.raw.clone();
    requestBody = await cloned.text().catch(() => null);
  } catch { /* ignore */ }

  // 获取用户信息
  let username = '';
  let userId = 0;
  try {
    const user = c.get('user') as { userId?: number; username?: string } | undefined;
    username = user?.username || '';
    userId = user?.userId ?? 0;
  } catch { /* 匿名请求 */ }

  // 解析 User-Agent
  const ua = c.req.header('user-agent') || '';
  const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
  const browser = browserMatch ? browserMatch[0] : '未知';
  const systemMatch = ua.match(/\(([^)]+)\)/);
  let system = '未知';
  if (systemMatch) {
    const raw = systemMatch[1];
    if (/Windows NT/.test(raw)) system = 'Windows';
    else if (/Mac OS X/.test(raw)) system = 'macOS';
    else if (/Linux/.test(raw) && !/Android/.test(raw)) system = 'Linux';
    else if (/Android/.test(raw)) system = 'Android';
    else if (/iOS/.test(raw)) system = 'iOS';
  }

  // 获取模块名
  const module = path.split('/').filter(Boolean)[0] || '';

  // 先执行 next，拿到响应状态
  try {
    await next();
  } catch (err) {
    // 异常也在下面记录，但先恢复异常
    const took = Date.now() - start;
    await writeLog({
      username, module, path, method: c.req.method,
      requestBody, ip: getClientIp(c), system, browser,
      status: 0, userId, took, error: (err as Error).message, reqHeaders: {}, resHeaders: {},
    });
    throw err;
  }

  const took = Date.now() - start;
  const status = c.res.status < 400 ? 1 : 0;

  // 收集响应体（异步，不阻塞）
  let responseBody: string | null = null;
  try {
    const resClone = c.res.clone();
    responseBody = await resClone.text().catch(() => null);
  } catch { /* ignore */ }

  // 收集请求头
  const reqHeaders: Record<string, string> = {};
  c.req.raw.headers.forEach((v, k) => {
    if (k !== 'authorization' || v.startsWith('Bearer ***')) {
      reqHeaders[k] = k === 'authorization' ? 'Bearer ***' : v;
    }
  });

  // 收集响应头
  const resHeaders: Record<string, string> = {};
  c.res.headers.forEach((v, k) => { resHeaders[k] = v; });

  // 异步写入，不阻塞响应
  writeLog({
    username, userId, module, path, method: c.req.method,
    requestBody, responseBody, ip: getClientIp(c), system, browser,
    status, took, reqHeaders, resHeaders,
  }).catch(() => {});
}

function getClientIp(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c.req.header('x-real-ip')
    || '127.0.0.1';
}

async function writeLog(params: {
  username: string;
  userId: number;
  module: string;
  path: string;
  method: string;
  requestBody: string | null;
  responseBody?: string | null;
  ip: string;
  system: string;
  browser: string;
  status: number;
  took: number;
  error?: string;
  reqHeaders: Record<string, string>;
  resHeaders: Record<string, string>;
}) {
  try {
    const db = await getDb();
    const operation = params.error
      ? `[异常] ${params.method} ${params.path} - ${params.error.slice(0, 100)}`
      : `${params.method} ${params.path}`;

    // 先插入主表拿到 logId
    const [result] = await db.insert(sysSystemLogs).values({
      username: params.username || 'anonymous',
      userId: params.userId ?? 0,
      module: params.module,
      operation,
      requestUrl: params.path,
      requestMethod: params.method,
      requestParams: params.requestBody ? params.requestBody.slice(0, 500) : null,
      responseData: params.responseBody ? params.responseBody.slice(0, 2000) : null,
      errorMessage: params.error || null,
      ip: params.ip,
      address: '',
      system: params.system,
      browser: params.browser,
      takesTime: params.took,
      status: params.status,
      createdAt: new Date(),
    } as typeof sysSystemLogs.$inferInsert);

    // 写入详情表
    const logId = Number(result.insertId);
    if (logId) {
      await db.insert(sysSystemLogDetails).values({
        logId,
        requestBody: params.requestBody || null,
        requestHeaders: JSON.stringify(params.reqHeaders),
        responseHeaders: JSON.stringify(params.resHeaders),
        responseBody: params.responseBody || null,
        traceId: `trace-${logId}-${Date.now()}`,
        requestTime: new Date(),
      } as typeof sysSystemLogDetails.$inferInsert);
    }
  } catch { /* 非关键操作不抛异常 */ }
}
