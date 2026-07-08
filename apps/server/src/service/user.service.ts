import { eq, like, and, count, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { sysUsers } from '../db/schema';

export async function listUsers(params: {
  username?: string;
  status?: number;
  phone?: string;
  pageNum: number;
  pageSize: number;
}) {
  const db = await getDb();
  const { pageNum, pageSize } = params;

  const conditions = [];
  if (params.username) conditions.push(like(sysUsers.username, `%${params.username}%`));
  if (params.status !== undefined) conditions.push(eq(sysUsers.status, params.status));
  if (params.phone) conditions.push(eq(sysUsers.phone, params.phone));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(sysUsers)
    .where(whereClause);

  const offset = (pageNum - 1) * pageSize;
  const users = await db
    .select({
      id: sysUsers.id,
      username: sysUsers.username,
      nickname: sysUsers.nickname,
      avatar: sysUsers.avatar,
      phone: sysUsers.phone,
      email: sysUsers.email,
      sex: sysUsers.sex,
      status: sysUsers.status,
      remark: sysUsers.remark,
      createTime: sysUsers.createdAt,
    })
    .from(sysUsers)
    .where(whereClause)
    .orderBy(desc(sysUsers.id))
    .limit(pageSize)
    .offset(offset);

  const list = users.map(u => ({
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    avatar: u.avatar || '',
    phone: u.phone || '',
    email: u.email || '',
    sex: u.sex ?? 0,
    status: u.status ?? 1,
    remark: u.remark || '',
    createTime: u.createTime ? new Date(u.createTime).getTime() : Date.now(),
  }));

  return { list, total, pageSize, currentPage: pageNum };
}
