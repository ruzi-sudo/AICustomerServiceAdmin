import { eq, like, and, count, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { sysRoles, sysUserRoles } from '../db/schema';

export async function listAllRoles() {
  const db = await getDb();
  const roles = await db
    .select({ id: sysRoles.id, name: sysRoles.name })
    .from(sysRoles)
    .orderBy(desc(sysRoles.id));
  return roles;
}

export async function getRoleIdsByUserId(userId: number) {
  const db = await getDb();
  const rows = await db
    .select({ roleId: sysUserRoles.roleId })
    .from(sysUserRoles)
    .where(eq(sysUserRoles.userId, userId));
  return rows.map(r => r.roleId);
}

export async function listRoles(params: {
  name?: string;
  status?: number;
  code?: string;
  pageNum: number;
  pageSize: number;
}) {
  const db = await getDb();
  const { pageNum, pageSize } = params;

  const conditions = [];
  if (params.name) conditions.push(like(sysRoles.name, `%${params.name}%`));
  if (params.status !== undefined) conditions.push(eq(sysRoles.status, params.status));
  if (params.code) conditions.push(eq(sysRoles.code, params.code));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(sysRoles)
    .where(whereClause);

  const offset = (pageNum - 1) * pageSize;
  const roles = await db
    .select({
      id: sysRoles.id,
      name: sysRoles.name,
      code: sysRoles.code,
      status: sysRoles.status,
      remark: sysRoles.remark,
      createTime: sysRoles.createdAt,
      updateTime: sysRoles.updatedAt,
    })
    .from(sysRoles)
    .where(whereClause)
    .orderBy(desc(sysRoles.id))
    .limit(pageSize)
    .offset(offset);

  const list = roles.map(r => ({
    id: r.id,
    name: r.name,
    code: r.code,
    status: r.status ?? 1,
    remark: r.remark || '',
    createTime: r.createTime ? new Date(r.createTime).getTime() : Date.now(),
    updateTime: r.updateTime ? new Date(r.updateTime).getTime() : Date.now(),
  }));

  return { list, total, pageSize, currentPage: pageNum };
}
