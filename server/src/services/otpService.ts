import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
export async function issueWithdrawOTP(userId: number) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const key = `otp:withdraw:${userId}`;
  await redis.set(key, code, "EX", 300); // 5 minutes
  await prisma.otpLog.create({
    data: {
      userId,
      purpose: "WITHDRAW",
      code,
      expiresAt: new Date(Date.now() + 300000),
    },
  });
  // TODO: ส่ง email/SMS จริง ในตัวอย่าง log ไว้ใน DB แล้วให้ admin ดู หรือ console.log
  return { code }; // ใน production ไม่คืน code
}
export async function verifyWithdrawOTP(userId: number, code: string) {
  const key = `otp:withdraw:${userId}`;
  const v = await redis.get(key);
  if (!v || v !== code) return false;
  await redis.del(key);
  return true;
}
