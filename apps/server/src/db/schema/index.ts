export { sysUsers, sysUserRoles } from './users';
export { sysRoles } from './roles';
export { sysPages, sysRolePages } from './pages';
export { sysLoginLogs, sysSystemLogs, sysSystemLogDetails, sysOnlineUsers } from './logs';
export { sysConfigs } from './configs';

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { sysUsers } from './users';
import type { sysRoles } from './roles';
import type { sysPages } from './pages';
import type { sysLoginLogs, sysSystemLogs, sysOnlineUsers } from './logs';

export type SysUser = InferSelectModel<typeof sysUsers>;
export type NewSysUser = InferInsertModel<typeof sysUsers>;
export type SysRole = InferSelectModel<typeof sysRoles>;
export type SysPage = InferSelectModel<typeof sysPages>;
export type SysLoginLog = InferSelectModel<typeof sysLoginLogs>;
export type SysSystemLog = InferSelectModel<typeof sysSystemLogs>;
export type SysOnlineUser = InferSelectModel<typeof sysOnlineUsers>;
