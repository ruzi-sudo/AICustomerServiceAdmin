import bcrypt from 'bcryptjs';
import { eq, and, isNotNull, sql, count, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { sysUsers, sysRoles, sysUserRoles, sysPages, sysRolePages, sysOnlineUsers, sysLoginLogs } from '../db/schema';
import { signToken, signRefreshToken } from '../middlewares/auth';

export async function login(username: string, password: string, clientInfo?: { ip?: string; ua?: string }) {
  const db = await getDb();

  const [user] = await db
    .select({
      id: sysUsers.id,
      username: sysUsers.username,
      password: sysUsers.password,
      avatar: sysUsers.avatar,
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

  // 记录在线用户
  try {
    const ua = clientInfo?.ua || '';
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    const browser = browserMatch ? browserMatch[0] : '未知';
    const systemMatch = ua.match(/\(([^)]+)\)/);
    let system = '未知';
    if (systemMatch) {
      const raw = systemMatch[1];
      if (/Windows NT/.test(raw)) system = 'Windows';
      else if (/Mac OS X/.test(raw)) system = 'macOS';
      else if (/Linux/.test(raw) && !/Android/.test(raw)) system = 'Linux';
      else if (/Android/.test(raw)) system = 'Android';
      else if (/iOS/.test(raw)) system = 'iOS';
    }

    const ip = clientInfo?.ip || '127.0.0.1';
    // 异步查询 IP 归属地，不阻塞登录
    let address = '';
    const isPrivate = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$)/.test(ip);
    if (ip && !isPrivate) {
      lookupIpAddress(ip).then(addr => {
        if (addr) {
          getDb().then(db =>
            db.update(sysOnlineUsers)
              .set({ address: addr })
              .where(and(eq(sysOnlineUsers.username, user.username), eq(sysOnlineUsers.ip, ip)))
          ).catch(() => {});
        }
      }).catch(() => {});
    }

    await db.insert(sysOnlineUsers).values({
      userId: user.id,
      username: user.username,
      ip,
      address,
      system,
      browser,
      loginTime: new Date(),
    });

    // 写入登录日志
    await db.insert(sysLoginLogs).values({
      userId: user.id,
      username: user.username,
      ip,
      address,
      system,
      browser,
      status: 1,
      loginTime: new Date(),
    });
  } catch { /* 非关键 */ }

  return {
    avatar: user.avatar || '',
    username: user.username,
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

/** 通过 ip-api.com 免费接口查询 IP 归属地（中国区可正常返回中文地址） */
async function lookupIpAddress(ip: string): Promise<string> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return '';
    const data = await res.json() as { status: string; country: string; regionName: string; city: string };
    if (data.status === 'success') {
      return `${data.country}${data.regionName}${data.city}`;
    }
  } catch { /* 超时或失败时跳过 */ }
  return '';
}
