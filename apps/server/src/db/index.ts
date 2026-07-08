import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema';

let pool: mysql.Pool | null = null;

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const defaultConfig: DbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root123',
  database: process.env.DB_NAME || 'pureadmin',
};

export async function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: defaultConfig.host,
      port: defaultConfig.port,
      user: defaultConfig.user,
      password: defaultConfig.password,
      database: defaultConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    });
  }
  return drizzle(pool, { schema, mode: 'default' });
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
