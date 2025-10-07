import { OAuth2Client, LoginTicket } from "google-auth-library";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { signAccess, signRefresh } from "../utils/jwt.js";
import { redis } from "../config/redis.js";
import type { Token } from "@prisma/client";
import { hash, compare } from "../utils/bcrypt.js";
import { AppError } from "../utils/appError.js";

// สมัครสมาชิก (register)
export async function register(email: string, password: string) {
  // ตรวจสอบก่อน (กัน error สื่อความหมายดีขึ้น)
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError("Email already exists", 400);

  // สร้าง user ใหม่
  const user = await prisma.user.create({
    data: { email, passwordHash: await hash(password) },
  });

  // bootstrap wallets for base tokens
  const tokens = await prisma.token.findMany();
  if (tokens.length) {
    await prisma.wallet.createMany({
      data: tokens.map((t) => ({ userId: user.id, tokenId: t.id })),
      skipDuplicates: true,
    });
  }

  return user;
}

// ตรวจสอบ email/password แล้วออก access+refresh token
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user?.passwordHash) throw new AppError("Invalid credentials", 401);

  const ok = await compare(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const access = signAccess(user.id, user.role);
  const refresh = signRefresh(user.id);

  try {
    await redis.set(`refresh:${user}:${refresh}`, "1", { EX: 7 * 24 * 3600 });
  } catch (e) {
    console.warn("REDIS SET REFRESH FAILED:", e);
  }

  const { passwordHash, ...safeUser } = user as any;
  return { access, refresh, user: safeUser };
}

// ใช้ refresh token ออก access token ใหม่
export async function refreshToken(userId: number, refresh: string) {
  const key = `refresh:${userId}:${refresh}`;
  const ok = await redis.get(key);
  if (!ok) throw new AppError("Invalid refresh token", 401);
  return signAccess(userId, "USER"); // TODO: role จริง
}
// Google OAuth2
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function assertGoogleTicket(ticket: LoginTicket) {
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) throw new Error("Invalid Google token");

  //ตรวจ issuer และ email_verified เพื่อความปลอดภัยเพิ่ม
  const iss = payload.iss;
  if (iss !== "accounts.google.com" && iss !== "https://accounts.google.com") {
    throw new Error("Invalid token issuer");
  }
  if (payload.email_verified === false) {
    throw new Error("Unverified email");
  }

  return payload;
}

export async function googleLogin(idToken: string) {
  // 1) Verify ID token
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = assertGoogleTicket(ticket);

  // 2) ดำเนินการแบบ transaction กันกรณี race condition (สองคนกดพร้อมกัน)
  const result = await prisma.$transaction(async (tx) => {
    // 2.1 ค้นด้วย googleId ก่อน (กรณีเคยผูกแล้ว)
    let user = await tx.user.findUnique({
      where: { googleId: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    // 2.2 ยังไม่เคยผูก ก็ลองดู email เดิมแล้วอัปเดตให้ผูก googleId
    if (!user) {
      const byEmail = await tx.user.findUnique({
        where: { email: payload.email! },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (byEmail) {
        user = await tx.user.update({
          where: { id: byEmail.id },
          data: { googleId: payload.sub },
          select: { id: true, email: true, role: true, isActive: true },
        });
      } else {
        // 2.3 ไม่มีทั้งสอง → สร้าง user ใหม่ และสร้าง wallet เริ่มต้น
        const newUser = await tx.user.create({
          data: {
            email: payload.email!,
            googleId: payload.sub,
            isActive: true,
          },
          select: { id: true, email: true, role: true, isActive: true },
        });

        // สร้างกระเป๋าตาม token ที่มีอยู่ (idempotent)
        const tokens: Pick<Token, "id">[] = await tx.token.findMany({
          select: { id: true },
        });

        if (tokens.length) {
          await tx.wallet.createMany({
            data: tokens.map((t) => ({ userId: newUser.id, tokenId: t.id })),
            skipDuplicates: true,
          });
        }

        user = newUser;
      }
    }

    if (!user.isActive) {
      throw new Error("Account inactive");
    }

    return user;
  });

  // 3) ออก token
  const access = signAccess(result.id, result.role);
  const refresh = signRefresh(result.id);

  // 4) (ตัวเลือก) เก็บ refresh key สำหรับ rotation/revoke
  // หมายเหตุ: ถ้าใช้ ioredis v5+ แนะนำรูปแบบ options object มากกว่า tuple
  await redis.set(`refresh:${result.id}:${refresh}`, "1", "EX", 7 * 24 * 3600);

  // 5) คืนเฉพาะฟิลด์ที่จำเป็น (sanitize)
  return {
    access,
    refresh,
    user: { id: result.id, email: result.email, role: result.role },
  };
}
