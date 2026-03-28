import NodeCache from "node-cache";
import Redis from "ioredis";

export const cacheKeys = Object.freeze({
  settingsAll: "settings:all",
  regionsActive: "regions:active",
  regionsAll: "regions:all",
});

const prefixKey = (key) => `cache:${key}`;

let redisClient = null;
let redisInitAttempted = false;

const getRedisClient = () => {
  if (redisClient) return redisClient;
  if (redisInitAttempted) return null;

  redisInitAttempted = true;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  // Best-effort: if Redis is unavailable, callers will fall back to NodeCache.
  redisClient.on("error", () => {
    // Intentionally quiet to avoid log spam in hot paths.
  });

  return redisClient;
};

// Fallback cache for single-instance/local dev (used when REDIS_URL is missing or Redis is down).
// stdTTL=0 => never expire by default; we invalidate explicitly on updates.
export const cache = new NodeCache({
  stdTTL: 0,
  checkperiod: 0,
  useClones: false,
});

export const cacheGetOrSet = async (key, fetcher) => {
  const redis = getRedisClient();
  const redisKey = prefixKey(key);

  if (redis) {
    try {
      if (redis.status !== "ready") {
        await redis.connect();
      }

      const cached = await redis.get(redisKey);
      if (cached !== null) return JSON.parse(cached);

      const value = await fetcher();
      await redis.set(redisKey, JSON.stringify(value));
      return value;
    } catch {
      // fall back to in-memory cache
    }
  }

  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const value = await fetcher();
  cache.set(key, value);
  return value;
};

export const cacheDel = (keys) => {
  if (!keys) return;
  const deleteKeys = Array.isArray(keys) ? keys : [keys];

  const redis = getRedisClient();
  if (redis) {
    // Fire-and-forget best-effort; callers shouldn't await cache invalidation.
    redis.del(deleteKeys.map(prefixKey)).catch(() => {
      // ignore
    });
  }

  cache.del(deleteKeys);
};
