import { mysqlTable, int, varchar, text, tinyint, datetime, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const sysUsers = mysqlTable('sys_users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 64 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  nickname: varchar('nickname', { length: 64 }),
  phone: varchar('phone', { length: 32 }),
  avatar: varchar('avatar', { length: 512 }),
  email: varchar('email', { length: 128 }),
  sex: tinyint('sex').default(0),
  status: tinyint('status').default(1),
  remark: text('remark'),
  createdAt: datetime('created_at', { mode: 'date' }).default(new Date()),
  updatedAt: datetime('updated_at', { mode: 'date' }).default(new Date()),
}, (table) => ({
  usernameIdx: uniqueIndex('idx_users_username').on(table.username),
}));

export const sysUserRoles = mysqlTable('sys_user_roles', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  roleId: int('role_id').notNull(),
}, (table) => ({
  userRoleUk: uniqueIndex('uk_user_role').on(table.userId, table.roleId),
  userIdIdx: index('idx_user_roles_user_id').on(table.userId),
  roleIdIdx: index('idx_user_roles_role_id').on(table.roleId),
}));
