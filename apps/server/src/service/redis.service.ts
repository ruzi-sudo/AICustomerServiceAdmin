import { createHash } from 'node:crypto';
import { createClient, type RedisClientType } from 'redis';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { sysOnlineUsers } from '../db/schema';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 24 * 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS) || 7 * 24 * 60 * 60;

let client: RedisClientType | null = null;
let subscriber: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType> | null = null;
let subscriberStarted = false;
let hasLoggedConnectionHint = false;

interface UserCredential {
  userId: number;
  username: string;
  onlineUserId: number;
  accessToken: string;
  refreshToken: string;
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function accessTokenKey(token: string): string {
  return `auth:token:${tokenHash(token)}`;
}

function credentialKey(onlineUserId: number, token: string): string {
  return `auth:credential:${onlineUserId}:${tokenHash(token)}`;
}

function refreshTokenKey(token: string): string {
  return `auth:refresh:${tokenHash(token)}`;
}

function onlineUserKey(onlineUserId: number): string {
  return `auth:online:${onlineUserId}`;
}

function onlineUserPayload(data: UserCredential): string {
  return JSON.stringify({
    accessTokenKey: accessTokenKey(data.accessToken),
    credentialKey: credentialKey(data.onlineUserId, data.accessToken),
    refreshTokenKey: refreshTokenKey(data.refreshToken),
  });
}

function parseOnlineUserIdFromCredentialKey(key: string): number | null {
  const match = /^auth:credential:(\d+):/.exec(key);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function formatRedisError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function logRedisConnectionHint(err: unknown): void {
  if (hasLoggedConnectionHint) return;
  hasLoggedConnectionHint = true;
  console.error(
    `[Redis] Unable to connect to ${REDIS_URL}: ${formatRedisError(err)}. ` +
    'Start Redis with `docker compose -f docker/docker-compose.yml up -d redis` or set REDIS_URL.',
  );
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (client?.isOpen) return client;
  if (!connectPromise) {
    client = createClient({ url: REDIS_URL }) as RedisClientType;
    client.on('error', (err) => {
      logRedisConnectionHint(err);
    });
    connectPromise = client.connect().then(() => client as RedisClientType).catch((err) => {
      connectPromise = null;
      throw err;
    });
  }
  return connectPromise;
}

export async function configureRedisKeyspaceEvents(): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    await redis.configSet('notify-keyspace-events', 'Ex');
    return true;
  } catch (err) {
    logRedisConnectionHint(err);
    return false;
  }
}

export async function storeUserCredential(data: UserCredential): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const payload = JSON.stringify(data);
    await redis
      .multi()
      .set(accessTokenKey(data.accessToken), String(data.onlineUserId), { EX: ACCESS_TOKEN_TTL_SECONDS })
      .set(credentialKey(data.onlineUserId, data.accessToken), payload, { EX: ACCESS_TOKEN_TTL_SECONDS })
      .set(refreshTokenKey(data.refreshToken), payload, { EX: REFRESH_TOKEN_TTL_SECONDS })
      .set(onlineUserKey(data.onlineUserId), onlineUserPayload(data), { EX: REFRESH_TOKEN_TTL_SECONDS })
      .exec();
    return true;
  } catch (err) {
    console.error('[Redis] Failed to store user credential:', err);
    return false;
  }
}

export async function replaceUserCredential(oldData: UserCredential, newData: UserCredential): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const payload = JSON.stringify(newData);
    await redis
      .multi()
      .del(accessTokenKey(oldData.accessToken))
      .del(credentialKey(oldData.onlineUserId, oldData.accessToken))
      .del(refreshTokenKey(oldData.refreshToken))
      .set(accessTokenKey(newData.accessToken), String(newData.onlineUserId), { EX: ACCESS_TOKEN_TTL_SECONDS })
      .set(credentialKey(newData.onlineUserId, newData.accessToken), payload, { EX: ACCESS_TOKEN_TTL_SECONDS })
      .set(refreshTokenKey(newData.refreshToken), payload, { EX: REFRESH_TOKEN_TTL_SECONDS })
      .set(onlineUserKey(newData.onlineUserId), onlineUserPayload(newData), { EX: REFRESH_TOKEN_TTL_SECONDS })
      .exec();
    return true;
  } catch (err) {
    console.error('[Redis] Failed to replace user credential:', err);
    return false;
  }
}

export async function getUserCredentialByRefreshToken(refreshToken: string): Promise<UserCredential | null> {
  try {
    const redis = await getRedisClient();
    const payload = await redis.get(refreshTokenKey(refreshToken));
    if (!payload) return null;
    return JSON.parse(String(payload)) as UserCredential;
  } catch (err) {
    console.error('[Redis] Failed to read refresh credential:', err);
    return null;
  }
}

export async function removeUserCredentialByOnlineUserId(onlineUserId: number): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const payload = await redis.get(onlineUserKey(onlineUserId));
    if (!payload) {
      await redis.del(onlineUserKey(onlineUserId));
      return true;
    }

    const keys = JSON.parse(String(payload)) as {
      accessTokenKey?: string;
      credentialKey?: string;
      refreshTokenKey?: string;
    };

    const keysToDelete = [
      keys.accessTokenKey,
      keys.credentialKey,
      keys.refreshTokenKey,
      onlineUserKey(onlineUserId),
    ].filter((key): key is string => Boolean(key));

    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
    }
    return true;
  } catch (err) {
    console.error(`[Redis] Failed to remove credential for online user ${onlineUserId}:`, err);
    return false;
  }
}

export async function isAccessTokenOnline(token: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    return await redis.exists(accessTokenKey(token)) === 1;
  } catch (err) {
    console.error('[Redis] Failed to validate access token:', err);
    return false;
  }
}

export async function startCredentialExpirationListener(): Promise<void> {
  if (subscriberStarted) return;
  subscriberStarted = true;

  try {
    const configured = await configureRedisKeyspaceEvents();
    if (!configured) {
      subscriberStarted = false;
      return;
    }
    subscriber = (await getRedisClient()).duplicate() as RedisClientType;
    subscriber.on('error', (err) => {
      console.error(`[Redis] Subscriber error: ${formatRedisError(err)}`);
    });
    await subscriber.connect();
    await subscriber.subscribe('__keyevent@0__:expired', async (key) => {
      const onlineUserId = parseOnlineUserIdFromCredentialKey(key);
      if (!onlineUserId) return;

      try {
        const db = await getDb();
        await db.delete(sysOnlineUsers).where(eq(sysOnlineUsers.id, onlineUserId));
      } catch (err) {
        console.error(`[Redis] Failed to remove expired online user ${onlineUserId}:`, err);
      }
    });
  } catch (err) {
    subscriberStarted = false;
    console.error(`[Redis] Failed to start expiration listener: ${formatRedisError(err)}`);
  }
}
