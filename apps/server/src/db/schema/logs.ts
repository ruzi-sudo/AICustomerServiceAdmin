import { mysqlTable, int, varchar, tinyint, text, datetime, index } from 'drizzle-orm/mysql-core';

export const sysLoginLogs = mysqlTable('sys_login_logs', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').default(0),
  username: varchar('username', { length: 64 }).notNull(),
  ip: varchar('ip', { length: 64 }),
  address: varchar('address', { length: 128 }),
  system: varchar('system', { length: 64 }),
  browser: varchar('browser', { length: 64 }),
  status: tinyint('status').default(1),
  loginTime: datetime('login_time', { mode: 'date' }).default(new Date()),
}, (table) => ({
  usernameIdx: index('idx_login_logs_username').on(table.username),
}));

export const sysSystemLogs = mysqlTable('sys_system_logs', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').default(0),
  username: varchar('username', { length: 64 }),
  module: varchar('module', { length: 64 }),
  operation: varchar('operation', { length: 255 }),
  requestUrl: varchar('request_url', { length: 512 }),
  requestMethod: varchar('request_method', { length: 16 }),
  requestParams: text('request_params'),
  responseData: text('response_data'),
  errorMessage: text('error_message'),
  ip: varchar('ip', { length: 64 }),
  address: varchar('address', { length: 128 }),
  system: varchar('system', { length: 64 }),
  browser: varchar('browser', { length: 64 }),
  takesTime: int('takes_time').default(0),
  status: tinyint('status').default(0),
  createdAt: datetime('created_at', { mode: 'date' }).default(new Date()),
}, (table) => ({
  usernameIdx: index('idx_system_logs_username').on(table.username),
  moduleIdx: index('idx_system_logs_module').on(table.module),
}));

export const sysSystemLogDetails = mysqlTable('sys_system_log_details', {
  id: int('id').primaryKey().autoincrement(),
  logId: int('log_id').notNull(),
  requestBody: text('request_body'),
  requestHeaders: text('request_headers'),
  responseHeaders: text('response_headers'),
  responseBody: text('response_body'),
  stackTrace: text('stack_trace'),
  traceId: varchar('trace_id', { length: 64 }),
  requestTime: datetime('request_time', { mode: 'date' }),
}, (table) => ({
  logIdIdx: index('idx_system_log_details_log_id').on(table.logId),
}));

export const sysOnlineUsers = mysqlTable('sys_online_users', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').default(0),
  username: varchar('username', { length: 64 }).notNull(),
  ip: varchar('ip', { length: 64 }),
  address: varchar('address', { length: 128 }),
  system: varchar('system', { length: 64 }),
  browser: varchar('browser', { length: 64 }),
  loginTime: datetime('login_time', { mode: 'date' }).default(new Date()),
}, (table) => ({
  usernameIdx: index('idx_online_users_username').on(table.username),
}));

export const sysMineLogs = mysqlTable('sys_mine_logs', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  ip: varchar('ip', { length: 64 }),
  address: varchar('address', { length: 128 }),
  system: varchar('system', { length: 64 }),
  browser: varchar('browser', { length: 64 }),
  summary: varchar('summary', { length: 255 }),
  operatingTime: datetime('operating_time', { mode: 'date' }).default(new Date()),
}, (table) => ({
  userIdIdx: index('idx_mine_logs_user_id').on(table.userId),
  operatingTimeIdx: index('idx_mine_logs_operating_time').on(table.operatingTime),
}));
