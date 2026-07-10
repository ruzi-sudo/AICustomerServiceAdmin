import { eq, like, and, count, desc, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { sysRoles, sysUserRoles, sysRolePages, sysUsers } from '../db/schema';

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
  if (params.status !== undefined && params.status !== null) conditions.push(eq(sysRoles.status, params.status));
  if (params.code) {
    const codes = Array.isArray(params.code) ? params.code : [params.code];
    conditions.push(inArray(sysRoles.code, codes));
  }

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

export async function createRole(params: {
  name: string;
  code: string;
  status?: number;
  remark?: string;
}) {
  const db = await getDb();

  const [existing] = await db
    .select({ id: sysRoles.id })
    .from(sysRoles)
    .where(eq(sysRoles.code, params.code))
    .limit(1);
  if (existing) {
    throw { code: 10001, message: '角色标识已存在', status: 400 };
  }

  const [result] = await db.insert(sysRoles).values({
    name: params.name,
    code: params.code,
    status: params.status ?? 1,
    remark: params.remark || null,
  });

  return { id: Number(result.insertId) };
}

export async function updateRole(params: {
  id: number;
  name?: string;
  code?: string;
  status?: number;
  remark?: string;
}) {
  const db = await getDb();

  const [existing] = await db
    .select({ id: sysRoles.id })
    .from(sysRoles)
    .where(eq(sysRoles.id, params.id))
    .limit(1);
  if (!existing) {
    throw { code: 10003, message: '角色不存在', status: 404 };
  }

  const updateData: Record<string, any> = {};
  if (params.name !== undefined) updateData.name = params.name;
  if (params.code !== undefined) updateData.code = params.code;
  if (params.status !== undefined) updateData.status = params.status;
  if (params.remark !== undefined) updateData.remark = params.remark;

  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();
    await db.update(sysRoles).set(updateData).where(eq(sysRoles.id, params.id));
  }
}

export async function deleteRole(id: number) {
  const db = await getDb();

  const [existing] = await db
    .select({ id: sysRoles.id })
    .from(sysRoles)
    .where(eq(sysRoles.id, id))
    .limit(1);
  if (!existing) {
    throw { code: 10003, message: '角色不存在', status: 404 };
  }

  // 先删除角色关联的权限和用户关系
  await db.delete(sysRolePages).where(eq(sysRolePages.roleId, id));
  await db.delete(sysUserRoles).where(eq(sysUserRoles.roleId, id));
  await db.delete(sysRoles).where(eq(sysRoles.id, id));

  // 兜底：给所有无角色的用户分配 common 角色
  await ensureFallbackRole(db);
}

async function ensureFallbackRole(db: any) {
  // 查出所有无角色的用户
  const hasRoleRows = await db.select({ userId: sysUserRoles.userId }).from(sysUserRoles);
  const hasRoleIds = [...new Set(hasRoleRows.map(r => r.userId))];
  const allUsers = await db.select({ id: sysUsers.id }).from(sysUsers);
  const orphanUserIds = allUsers.filter(u => !hasRoleIds.includes(u.id)).map(u => u.id);
  if (orphanUserIds.length === 0) return;

  // 查找 common 角色（前端已禁用删除，肯定存在）
  const [commonRole] = await db
    .select({ id: sysRoles.id })
    .from(sysRoles)
    .where(eq(sysRoles.code, 'common'))
    .limit(1);
  if (!commonRole) return;

  for (const userId of orphanUserIds) {
    await db.insert(sysUserRoles).values({ userId, roleId: commonRole.id });
  }
}

export async function saveRoleMenu(id: number, menuIds: number[]) {
  const db = await getDb();

  // 先删除旧权限
  await db.delete(sysRolePages).where(eq(sysRolePages.roleId, id));

  // 插入新权限
  if (menuIds.length > 0) {
    await db.insert(sysRolePages).values(
      menuIds.map(menuId => ({ roleId: id, pageId: menuId }))
    );
  }
}
