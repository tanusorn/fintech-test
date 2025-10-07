import { createRequire } from "module";
import { env } from "./env.js";
const require = createRequire(import.meta.url);
const Redis = require("ioredis"); // CJS import

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL)
  : new Redis({ host: env.REDIS_HOST, port: env.REDIS_PORT, db: env.REDIS_DB });

redis.on("connect", () => {
  const where =
    env.REDIS_URL ?? `${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_DB}`;
  console.log(`[redis] connected -> ${where}`);
});
redis.on("error", (err: Error) => console.error("[redis] error:", err.message));

export default redis;
