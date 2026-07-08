export { sysUsers, sysUserRoles } from './users';
export { sysRoles } from './roles';
export { sysPages, sysRolePages } from './pages';
export { sysLoginLogs, sysOperationLogs, sysSystemLogs, sysSystemLogDetails, sysOnlineUsers, sysMineLogs } from './logs';
export { sysConfigs } from './configs';

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { sysUsers } from './users';
import type { sysRoles } from './roles';
import type { sysPages } from './pages';
import type { sysLoginLogs, sysOperationLogs, sysSystemLogs, sysOnlineUsers, sysMineLogs } from './logs';

export type SysUser = InferSelectModel<typeof sysUsers>;
export type NewSysUser = InferInsertModel<typeof sysUsers>;
export type SysRole = InferSelectModel<typeof sysRoles>;
export type SysPage = InferSelectModel<typeof sysPages>;
export type SysLoginLog = InferSelectModel<typeof sysLoginLogs>;
export type SysOperationLog = InferSelectModel<typeof sysOperationLogs>;
export type SysSystemLog = InferSelectModel<typeof sysSystemLogs>;
export type SysOnlineUser = InferSelectModel<typeof sysOnlineUsers>;
export type SysMineLog = InferSelectModel<typeof sysMineLogs>;
