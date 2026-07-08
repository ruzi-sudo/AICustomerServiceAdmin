import { mysqlTable, int, varchar, text, datetime, uniqueIndex } from 'drizzle-orm/mysql-core';

export const sysConfigs = mysqlTable('sys_configs', {
  id: int('id').primaryKey().autoincrement(),
  configKey: varchar('config_key', { length: 100 }).notNull().unique(),
  configValue: text('config_value'),
  description: varchar('description', { length: 255 }),
  createdAt: datetime('created_at', { mode: 'date' }).default(new Date()),
  updatedAt: datetime('updated_at', { mode: 'date' }).default(new Date()),
}, (table) => ({
  configKeyIdx: uniqueIndex('idx_configs_key').on(table.configKey),
}));
