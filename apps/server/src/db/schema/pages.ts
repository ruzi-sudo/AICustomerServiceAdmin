import { mysqlTable, int, varchar, tinyint, datetime, index, uniqueIndex } from 'drizzle-orm/mysql-core';

export const sysPages = mysqlTable('sys_pages', {
  id: int('id').primaryKey().autoincrement(),
  parentId: int('parent_id').default(0),
  menuType: tinyint('menu_type').default(0),
  title: varchar('title', { length: 128 }).notNull(),
  name: varchar('name', { length: 128 }),
  path: varchar('path', { length: 255 }),
  component: varchar('component', { length: 255 }),
  rank: int('rank').default(99),
  redirect: varchar('redirect', { length: 255 }),
  icon: varchar('icon', { length: 64 }),
  extraIcon: varchar('extra_icon', { length: 64 }),
  enterTransition: varchar('enter_transition', { length: 64 }),
  leaveTransition: varchar('leave_transition', { length: 64 }),
  activePath: varchar('active_path', { length: 255 }),
  auths: varchar('auths', { length: 255 }),
  keepAlive: tinyint('keep_alive').default(0),
  hiddenTag: tinyint('hidden_tag').default(0),
  fixedTag: tinyint('fixed_tag').default(0),
  showLink: tinyint('show_link').default(1),
  showParent: tinyint('show_parent').default(0),
  status: tinyint('status').default(1),
  createdAt: datetime('created_at', { mode: 'date' }).default(new Date()),
  updatedAt: datetime('updated_at', { mode: 'date' }).default(new Date()),
}, (table) => ({
  parentIdIdx: index('idx_pages_parent_id').on(table.parentId),
}));

export const sysRolePages = mysqlTable('sys_role_pages', {
  id: int('id').primaryKey().autoincrement(),
  roleId: int('role_id').notNull(),
  pageId: int('page_id').notNull(),
}, (table) => ({
  rolePageUk: uniqueIndex('uk_role_page').on(table.roleId, table.pageId),
  roleIdIdx: index('idx_role_pages_role_id').on(table.roleId),
  pageIdIdx: index('idx_role_pages_page_id').on(table.pageId),
}));
