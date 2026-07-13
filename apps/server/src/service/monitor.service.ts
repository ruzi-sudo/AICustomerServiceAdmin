import { eq, like, and, count, desc, inArray } from 'drizzle-orm';
import { getDb } from '../db';
import {
  sysLoginLogs,
  sysSystemLogs,
  sysSystemLogDetails,
  sysOnlineUsers,
} from '../db/schema';
import { removeUserCredentialByOnlineUserId } from './redis.service';

export async function listOnlineUsers(params: { username?: string; pageNum: number; pageSize: number }) {
  const db = await getDb();
  const { pageNum, pageSize } = params;

  const whereClause = params.username ? like(sysOnlineUsers.username, `%${params.username}%`) : undefined;

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(sysOnlineUsers)
    .where(whereClause);

  const offset = (pageNum - 1) * pageSize;
  const rows = await db
    .select()
    .from(sysOnlineUsers)
    .where(whereClause)
    .orderBy(desc(sysOnlineUsers.loginTime))
    .limit(pageSize)
    .offset(offset);

  const list = rows.map(r => ({
    id: r.id,
    userId: r.userId ?? 0,
    username: r.username,
    ip: r.ip || '',
    address: r.address || '',
    system: r.system || '',
    browser: r.browser || '',
    loginTime: r.loginTime,
  }));

  return { list, total, pageSize, currentPage: pageNum };
}

export async function listLoginLogs(params: { username?: string; status?: number; pageNum: number; pageSize: number }) {
  const db = await getDb();
  const { pageNum, pageSize } = params;

  const conditions = [];
  if (params.username) conditions.push(like(sysLoginLogs.username, `%${params.username}%`));
  if (params.status !== undefined && params.status !== null) conditions.push(eq(sysLoginLogs.status, params.status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(sysLoginLogs)
    .where(whereClause);

  const offset = (pageNum - 1) * pageSize;
  const rows = await db
    .select()
    .from(sysLoginLogs)
    .where(whereClause)
    .orderBy(desc(sysLoginLogs.loginTime))
    .limit(pageSize)
    .offset(offset);

  const list = rows.map(r => ({
    id: r.id,
    userId: r.userId ?? 0,
    username: r.username,
    ip: r.ip || '',
    address: r.address || '',
    system: r.system || '',
    browser: r.browser || '',
    status: r.status ?? 1,
    behavior: r.status === 1 ? '账号登录' : '第三方登录',
    loginTime: r.loginTime,
  }));

  return { list, total, pageSize, currentPage: pageNum };
}

export async function listSystemLogs(params: { module?: string; pageNum: number; pageSize: number }) {
  const db = await getDb();
  const { pageNum, pageSize } = params;

  const whereClause = params.module ? like(sysSystemLogs.module, `%${params.module}%`) : undefined;

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(sysSystemLogs)
    .where(whereClause);

  const offset = (pageNum - 1) * pageSize;
  const rows = await db
    .select()
    .from(sysSystemLogs)
    .where(whereClause)
    .orderBy(desc(sysSystemLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  const list = rows.map(r => ({
    id: r.id,
    userId: r.userId ?? 0,
    username: r.username || '',
    level: r.status !== null ? (r.status === 1 ? 1 : r.status === 0 ? 3 : 1) : 1,
    module: r.module || '',
    url: r.requestUrl || '',
    method: (r.requestMethod || 'GET').toUpperCase(),
    ip: r.ip || '',
    address: r.address || '',
    system: r.system || '',
    browser: r.browser || '',
    takesTime: r.takesTime ?? 0,
    requestTime: r.createdAt,
  }));

  return { list, total, pageSize, currentPage: pageNum };
}

export async function forceOffline(id: number) {
  const db = await getDb();
  await removeUserCredentialByOnlineUserId(id);
  await db.delete(sysOnlineUsers).where(eq(sysOnlineUsers.id, id));
}

export async function forceOfflineByUsername(username: string) {
  const db = await getDb();
  const onlineUsers = await db
    .select({ id: sysOnlineUsers.id })
    .from(sysOnlineUsers)
    .where(eq(sysOnlineUsers.username, username));

  for (const user of onlineUsers) {
    await removeUserCredentialByOnlineUserId(user.id);
  }

  await db.delete(sysOnlineUsers).where(eq(sysOnlineUsers.username, username));
}

export async function deleteSystemLogs(ids: number[]) {
  const db = await getDb();
  if (ids.length === 0) return;
  await db.delete(sysSystemLogs).where(inArray(sysSystemLogs.id, ids));
}

export async function clearSystemLogs() {
  const db = await getDb();
  await db.delete(sysSystemLogs);
}

export async function deleteLoginLogs(ids: number[]) {
  const db = await getDb();
  if (ids.length === 0) return;
  await db.delete(sysLoginLogs).where(inArray(sysLoginLogs.id, ids));
}

export async function clearLoginLogs() {
  const db = await getDb();
  await db.delete(sysLoginLogs);
}

export async function getSystemLogDetail(id: number) {
  const db = await getDb();
  const [log] = await db
    .select()
    .from(sysSystemLogs)
    .where(eq(sysSystemLogs.id, id))
    .limit(1);

  if (!log) return null;

  // 查询详情表中的请求头和响应头
  const [detail] = await db
    .select()
    .from(sysSystemLogDetails)
    .where(eq(sysSystemLogDetails.logId, id))
    .limit(1);

  let reqHeaders = { Authorization: 'Bearer ***', 'Content-Type': 'application/json' };
  let resHeaders = { 'Content-Type': 'application/json' };
  let resBody = null;

  if (detail) {
    try { reqHeaders = JSON.parse(detail.requestHeaders || '{}'); } catch {}
    try { resHeaders = JSON.parse(detail.responseHeaders || '{}'); } catch {}
    resBody = detail.responseBody
      ? (() => { try { return JSON.parse(detail.responseBody); } catch { return detail.responseBody; } })()
      : null;
  }

  return {
    id: log.id,
    userId: log.userId ?? 0,
    username: log.username || '',
    level: log.status !== null ? (log.status === 1 ? 1 : log.status === 0 ? 3 : 1) : 1,
    module: log.module || '',
    url: log.requestUrl || '',
    method: (log.requestMethod || 'GET').toUpperCase(),
    ip: log.ip || '',
    address: log.address || '',
    system: log.system || '',
    browser: log.browser || '',
    takesTime: log.takesTime ?? 0,
    responseHeaders: resHeaders,
    responseBody: resBody,
    requestHeaders: reqHeaders,
    requestBody: log.requestParams
      ? (() => { try { return JSON.parse(log.requestParams); } catch { return log.requestParams; } })()
      : null,
    traceId: `trace-${log.id}-${Date.now()}`,
    requestTime: log.createdAt,
  };
}
