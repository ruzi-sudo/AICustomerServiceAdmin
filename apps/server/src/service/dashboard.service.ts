import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { sysRoles, sysUserRoles, sysUsers } from '../db/schema';

export async function getMineInfo(userId: number) {
  const db = await getDb();
  const [user] = await db
    .select({
      id: sysUsers.id,
      avatar: sysUsers.avatar,
      username: sysUsers.username,
      email: sysUsers.email,
      status: sysUsers.status,
      remark: sysUsers.remark,
    })
    .from(sysUsers)
    .where(eq(sysUsers.id, userId))
    .limit(1);

  if (!user) return null;

  const roles = await db
    .select({
      id: sysRoles.id,
      code: sysRoles.code,
    })
    .from(sysUserRoles)
    .innerJoin(sysRoles, eq(sysUserRoles.roleId, sysRoles.id))
    .where(eq(sysUserRoles.userId, user.id));

  return {
    id: user.id,
    avatar: user.avatar || '',
    username: user.username,
    email: user.email || '',
    status: user.status ?? 1,
    remark: user.remark || '',
    roleIds: roles.map(role => role.id),
    roles: roles.map(role => role.code),
    description: user.remark || '',
  };
}
