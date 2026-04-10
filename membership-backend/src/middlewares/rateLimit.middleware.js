import rateLimit from "express-rate-limit";
import Redis from "ioredis";
import { RedisStore } from "rate-limit-redis";

let redisClient;
const getRedisClient = () => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
  });

  redisClient.on("error", () => {
    // Keep quiet to avoid log spam; express-rate-limit will fail open.
  });

  return redisClient;
};

const getRedisStore = (prefix) => {
  const redis = getRedisClient();
  if (!redis) return undefined;

  return new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix,
  });
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const defaultMessage = {
  success: false,
  message: "Too many requests, please try again later.",
};

export const globalLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: parsePositiveInt(process.env.RATE_LIMIT_MAX, 300),
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore("rl:global:"),
  passOnStoreError: true,
  message: defaultMessage,
});

export const loginLimiter = rateLimit({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_LOGIN_WINDOW_MS,
    15 * 60 * 1000,
  ),
  max: parsePositiveInt(process.env.RATE_LIMIT_LOGIN_MAX, 10),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore("rl:login:"),
  passOnStoreError: true,
  message: {
    success: false,
    message: "Too many failed login attempts, please try again later.",
  },
});
