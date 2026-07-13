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
      .set(`auth:refresh:${tokenHash(data.refreshToken)}`, payload, { EX: REFRESH_TOKEN_TTL_SECONDS })
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
      .del(`auth:refresh:${tokenHash(oldData.refreshToken)}`)
      .set(accessTokenKey(newData.accessToken), String(newData.onlineUserId), { EX: ACCESS_TOKEN_TTL_SECONDS })
      .set(credentialKey(newData.onlineUserId, newData.accessToken), payload, { EX: ACCESS_TOKEN_TTL_SECONDS })
      .set(`auth:refresh:${tokenHash(newData.refreshToken)}`, payload, { EX: REFRESH_TOKEN_TTL_SECONDS })
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
    const payload = await redis.get(`auth:refresh:${tokenHash(refreshToken)}`);
    if (!payload) return null;
    return JSON.parse(String(payload)) as UserCredential;
  } catch (err) {
    console.error('[Redis] Failed to read refresh credential:', err);
    return null;
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
