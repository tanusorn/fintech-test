import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

//middleware ของ Express ที่เอาไว้ "จำกัดจำนวน request ต่อช่วงเวลา"
export const defaultLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 นาที
  max: env.RATE_LIMIT_MAX, // 100 requests
});

//ผู้ใช้ 1 IP → login ได้สูงสุด 20 ครั้งต่อ 15 นาที
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 20, // 20 requests
});
