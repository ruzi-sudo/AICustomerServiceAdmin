import { eq, like, and, count, desc } from 'drizzle-orm';
import { getDb } from '../db';
import {
  sysOnlineUsers,
  sysLoginLogs,
  sysOperationLogs,
  sysSystemLogs,
} from '../db/schema';

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
  if (params.status !== undefined) conditions.push(eq(sysLoginLogs.status, params.status));

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

export async function listOperationLogs(params: { module?: string; status?: number; pageNum: number; pageSize: number }) {
  const db = await getDb();
  const { pageNum, pageSize } = params;

  const conditions = [];
  if (params.module) conditions.push(like(sysOperationLogs.module, `%${params.module}%`));
  if (params.status !== undefined) conditions.push(eq(sysOperationLogs.status, params.status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(sysOperationLogs)
    .where(whereClause);

  const offset = (pageNum - 1) * pageSize;
  const rows = await db
    .select()
    .from(sysOperationLogs)
    .where(whereClause)
    .orderBy(desc(sysOperationLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  const list = rows.map(r => ({
    id: r.id,
    username: r.username,
    ip: r.ip || '',
    address: r.address || '',
    system: '',
    browser: '',
    status: r.status ?? 1,
    summary: r.operation || '',
    module: r.module || '',
    operatingTime: r.createdAt,
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
    level: r.status !== null ? (r.status === 1 ? 1 : r.status === 0 ? 3 : 1) : 1,
    module: r.module || '',
    url: r.requestUrl || '',
    method: (r.requestMethod || 'GET').toUpperCase(),
    ip: r.ip || '',
    address: r.address || '',
    system: '',
    browser: '',
    takesTime: 0,
    requestTime: r.createdAt,
  }));

  return { list, total, pageSize, currentPage: pageNum };
}

export async function getSystemLogDetail(id: number) {
  const db = await getDb();
  const [log] = await db
    .select()
    .from(sysSystemLogs)
    .where(eq(sysSystemLogs.id, id))
    .limit(1);

  if (!log) return null;

  return {
    id: log.id,
    level: log.status !== null ? (log.status === 1 ? 1 : log.status === 0 ? 3 : 1) : 1,
    module: log.module || '',
    url: log.requestUrl || '',
    method: (log.requestMethod || 'GET').toUpperCase(),
    ip: log.ip || '',
    address: log.address || '',
    system: '',
    browser: '',
    takesTime: 0,
    responseHeaders: { 'Content-Type': 'application/json' },
    responseBody: null,
    requestHeaders: {
      Authorization: 'Bearer ***',
      'Content-Type': 'application/json',
    },
    requestBody: log.requestParams
      ? (() => { try { return JSON.parse(log.requestParams); } catch { return log.requestParams; } })()
      : null,
    traceId: `trace-${log.id}-${Date.now()}`,
    requestTime: log.createdAt,
  };
}
