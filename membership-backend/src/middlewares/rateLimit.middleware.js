import rateLimit from "express-rate-limit";

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
  message: defaultMessage,
});

export const loginLimiter = rateLimit({
  windowMs: parsePositiveInt(
    process.env.RATE_LIMIT_LOGIN_WINDOW_MS,
    15 * 60 * 1000,
  ),
  max: parsePositiveInt(process.env.RATE_LIMIT_LOGIN_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});
