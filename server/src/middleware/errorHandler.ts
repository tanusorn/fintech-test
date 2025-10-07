// middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/appError.js";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1) AppError ของเราเอง
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // 2) Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 = Unique constraint failed
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target)
        ? err.meta!.target.join(",")
        : String(err.meta?.target ?? "");
      // แปลงชื่อ target เป็นข้อความที่อ่านง่าย (เลือกใส่เพิ่มได้)
      const friendly = mapUniqueTarget(target);
      return res.status(409).json({
        message: `Unique constraint failed on: ${friendly}`,
        code: "P2002",
      });
    }

    // ตัวอย่าง เผื่อรองรับโค้ดอื่น ๆ ที่พบบ่อย
    if (err.code === "P2003") {
      return res
        .status(409)
        .json({ message: "Foreign key constraint failed", code: "P2003" });
    }
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Record not found", code: "P2025" });
    }
  }

  // 3) JWT errors
  if (err?.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  if (err?.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  // 4) Fallback
  console.error("UNHANDLED ERROR:", err);
  return res.status(500).json({ message: "Internal server error" });
}

// helper: แปลงชื่อคอลัมน์/อินเด็กซ์ให้เป็นข้อความที่เป็นมิตร
function mapUniqueTarget(target: string): string {
  // ตัวอย่างแมปชื่อ index/field → ข้อความ
  const map: Record<string, string> = {
    email: "email",
    User_email_key: "email",
    stripeCheckoutSessionId: "Stripe checkout session id",
    stripePaymentIntentId: "Stripe payment intent id",
    publicId: "public id",
    userId_tokenId: "wallet (userId + tokenId)",
  };
  return map[target] ?? (target || "unknown field");
}
