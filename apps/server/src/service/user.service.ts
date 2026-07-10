import { eq, like, and, count, desc, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { sysUsers, sysUserRoles } from '../db/schema';
import { sysRoles } from '../db/schema';

export async function listUsers(params: {
  username?: string;
  status?: number;
  phone?: string;
  email?: string;
  pageNum: number;
  pageSize: number;
}) {
  const db = await getDb();
  const { pageNum, pageSize } = params;

  const conditions = [];
  if (params.username) conditions.push(like(sysUsers.username, `%${params.username}%`));
  if (params.status !== undefined && params.status !== null) conditions.push(eq(sysUsers.status, params.status));
  if (params.email) conditions.push(like(sysUsers.email, `%${params.email}%`));

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
      avatar: sysUsers.avatar,
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

  // 为每个用户查询角色
  const userIds = users.map(u => u.id);
  const userRoles = userIds.length > 0
    ? await db
        .select({ userId: sysUserRoles.userId, code: sysRoles.code, roleId: sysUserRoles.roleId })
        .from(sysUserRoles)
        .innerJoin(sysRoles, eq(sysUserRoles.roleId, sysRoles.id))
        .where(inArray(sysUserRoles.userId, userIds))
    : [];

  const rolesByUser: Record<number, { codes: string[]; ids: number[] }> = {};
  for (const ur of userRoles) {
    if (!rolesByUser[ur.userId]) rolesByUser[ur.userId] = { codes: [], ids: [] };
    rolesByUser[ur.userId].codes.push(ur.code);
    rolesByUser[ur.userId].ids.push(ur.roleId);
  }

  const list = users.map(u => ({
    id: u.id,
    username: u.username,
    avatar: u.avatar || '',
    email: u.email || '',
    sex: u.sex ?? 0,
    status: u.status ?? 1,
    roleIds: rolesByUser[u.id]?.ids || [],
    roles: rolesByUser[u.id]?.codes || [],
    remark: u.remark || '',
    createTime: u.createTime ? new Date(u.createTime).getTime() : Date.now(),
  }));

  return { list, total, pageSize, currentPage: pageNum };
}

export async function createUser(params: {
  username: string;
  password: string;
  nickname?: string;
  phone?: string;
  email?: string;
  sex?: number;
  status?: number;
  roleIds?: number[];
  remark?: string;
}) {
  const db = await getDb();

  // 检查用户名是否已存在
  const [existing] = await db
    .select({ id: sysUsers.id })
    .from(sysUsers)
    .where(eq(sysUsers.username, params.username))
    .limit(1);
  if (existing) {
    throw { code: 10001, message: '用户名已存在', status: 400 };
  }

  const hashedPassword = await bcrypt.hash(params.password, 10);

  const [result] = await db.insert(sysUsers).values({
    username: params.username,
    password: hashedPassword,
    email: params.email || null,
    phone: params.phone || null,
    sex: params.sex ?? 0,
    status: params.status ?? 1,
    remark: params.remark || null,
  });

  const userId = Number(result.insertId);

  // 分配角色
  if (params.roleIds && params.roleIds.length > 0) {
    await db.insert(sysUserRoles).values(
      params.roleIds.map(roleId => ({ userId, roleId }))
    );
  }

  return { id: userId };
}

export async function updateUser(params: {
  id: number;
  nickname?: string;
  phone?: string;
  email?: string;
  sex?: number;
  status?: number;
  roleIds?: number[];
  remark?: string;
}) {
  const db = await getDb();

  const [existing] = await db
    .select({ id: sysUsers.id })
    .from(sysUsers)
    .where(eq(sysUsers.id, params.id))
    .limit(1);
  if (!existing) {
    throw { code: 10003, message: '用户不存在', status: 404 };
  }

  const updateData: Record<string, any> = {};
  if (params.username !== undefined) updateData.username = params.username;
  if (params.nickname !== undefined) updateData.nickname = params.nickname;
  if (params.phone !== undefined) updateData.phone = params.phone;
  if (params.email !== undefined) updateData.email = params.email;
  if (params.sex !== undefined) updateData.sex = params.sex;
  if (params.status !== undefined) updateData.status = params.status;
  if (params.remark !== undefined) updateData.remark = params.remark;

  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();
    await db.update(sysUsers)
      .set(updateData)
      .where(eq(sysUsers.id, params.id));
  }

  // 更新角色
  if (params.roleIds !== undefined) {
    // 删除旧角色
    await db.delete(sysUserRoles).where(eq(sysUserRoles.userId, params.id));
    // 分配新角色
    if (params.roleIds.length > 0) {
      await db.insert(sysUserRoles).values(
        params.roleIds.map(roleId => ({ userId: params.id, roleId }))
      );
    }
  }
}

export async function deleteUser(id: number) {
  const db = await getDb();

  const [existing] = await db
    .select({ id: sysUsers.id })
    .from(sysUsers)
    .where(eq(sysUsers.id, id))
    .limit(1);
  if (!existing) {
    throw { code: 10003, message: '用户不存在', status: 404 };
  }

  await db.delete(sysUsers).where(eq(sysUsers.id, id));
}

export async function batchDeleteUser(ids: number[]) {
  if (ids.length === 0) return;
  const db = await getDb();
  await db.delete(sysUsers).where(inArray(sysUsers.id, ids));
}

export async function resetPassword(id: number, password: string) {
  const db = await getDb();

  const [existing] = await db
    .select({ id: sysUsers.id })
    .from(sysUsers)
    .where(eq(sysUsers.id, id))
    .limit(1);
  if (!existing) {
    throw { code: 10003, message: '用户不存在', status: 404 };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.update(sysUsers)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(sysUsers.id, id));
}
