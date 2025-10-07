import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 8081),

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "7d",

  DB_URL: process.env.DATABASE_URL,

  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  REDIS_DB: Number(process.env.REDIS_DB) || 0,

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 15 นาที
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100, // 100 requests

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  //GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET!,

  BINANCE_BASE: process.env.BINANCE_API_KEY!,
  COINGECKO_BASE: process.env.COINGECKO_API_KEY!,

  //strip
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  STRIPE_CURRENCY: process.env.STRIPE_CURRENCY || "thb",
};
