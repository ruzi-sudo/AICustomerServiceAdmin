import bcrypt from 'bcryptjs';
import { eq, and, isNotNull, sql, count } from 'drizzle-orm';
import { getDb } from '../db';
import { sysUsers, sysRoles, sysUserRoles, sysPages, sysRolePages } from '../db/schema';
import { signToken, signRefreshToken } from '../middlewares/auth';

export async function login(username: string, password: string) {
  const db = await getDb();

  const [user] = await db
    .select({
      id: sysUsers.id,
      username: sysUsers.username,
      password: sysUsers.password,
      nickname: sysUsers.nickname,
      avatar: sysUsers.avatar,
      phone: sysUsers.phone,
      email: sysUsers.email,
      status: sysUsers.status,
    })
    .from(sysUsers)
    .where(eq(sysUsers.username, username))
    .limit(1);

  if (!user) {
    throw { code: 10001, message: '用户名或密码错误', status: 400 };
  }
  if (user.status !== 1) {
    throw { code: 10001, message: '账号已停用', status: 400 };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw { code: 10001, message: '用户名或密码错误', status: 400 };
  }

  const roles = await db
    .select({
      id: sysRoles.id,
      code: sysRoles.code,
    })
    .from(sysRoles)
    .innerJoin(sysUserRoles, eq(sysRoles.id, sysUserRoles.roleId))
    .where(eq(sysUserRoles.userId, user.id));

  const roleCodes = roles.map(r => r.code);

  const perms = await db
    .select({ auths: sysPages.auths })
    .from(sysPages)
    .innerJoin(sysRolePages, eq(sysPages.id, sysRolePages.pageId))
    .innerJoin(sysUserRoles, eq(sysRolePages.roleId, sysUserRoles.roleId))
    .where(
      and(
        eq(sysUserRoles.userId, user.id),
        isNotNull(sysPages.auths),
        sql`${sysPages.auths} != ''`,
      ),
    );

  const permList = perms.map(p => p.auths!).filter(Boolean);

  const payload = { userId: user.id, username: user.username, roles: roleCodes };
  const accessToken = signToken(payload);
  const refreshToken = signRefreshToken({ userId: user.id, username: user.username });

  return {
    avatar: user.avatar || '',
    username: user.username,
    nickname: user.nickname,
    roles: roleCodes,
    permissions: roleCodes.includes('admin') ? ['*:*:*'] : permList,
    accessToken,
    refreshToken,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19),
  };
}

export async function refreshToken(token: string) {
  if (!token) {
    throw { code: 10001, message: '请求参数缺失或格式不正确', status: 400 };
  }

  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'pureadmin-jwt-secret-key';
  const decoded = jwt.default.verify(token, JWT_SECRET) as { userId: number; username: string };

  const payload = { userId: decoded.userId, username: decoded.username, roles: [] as string[] };
  const accessToken = signToken(payload);
  const newRefreshToken = signRefreshToken({ userId: decoded.userId, username: decoded.username });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19),
  };
}
