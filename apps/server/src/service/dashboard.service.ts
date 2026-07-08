import { eq, desc, asc } from 'drizzle-orm';
import { getDb } from '../db';
import { sysUsers, sysMineLogs } from '../db/schema';

export async function getMineInfo(username: string) {
  const db = await getDb();
  const [user] = await db
    .select({
      avatar: sysUsers.avatar,
      username: sysUsers.username,
      nickname: sysUsers.nickname,
      email: sysUsers.email,
      phone: sysUsers.phone,
    })
    .from(sysUsers)
    .where(eq(sysUsers.username, username))
    .limit(1);

  if (!user) return null;

  return {
    avatar: user.avatar || '',
    username: user.username,
    nickname: user.nickname,
    email: user.email || '',
    phone: user.phone || '',
    description: '一个热爱开源的前端工程师',
  };
}

export async function getMineLogs(userId: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(sysMineLogs)
    .where(eq(sysMineLogs.userId, userId))
    .orderBy(desc(sysMineLogs.operatingTime));

  const list = rows.map(r => ({
    id: r.id,
    ip: r.ip || '',
    address: r.address || '',
    system: r.system || '',
    browser: r.browser || '',
    summary: r.summary || '',
    operatingTime: r.operatingTime,
  }));

  return { list, total: list.length, pageSize: 10, currentPage: 1 };
}
