import { RequestHandler } from "express";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js"; // หรือ "../config/env.js" ถ้าคุณใช้ ESM จริง

// augment req.user ในไฟล์เดียว
declare global {
  namespace Express {
    interface Request {
      user?: { sub: number; role: "USER" | "ADMIN" };
    }
  }
}
export {};

// AccessPayload = JwtPayload + role (ไม่ไปแก้ type ของ sub)
type AccessPayload = JwtPayload & {
  role: "USER" | "ADMIN";
};

export const authCheck: RequestHandler = (req, res, next) => {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) {
    res.setHeader("WWW-Authenticate", "Bearer");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = auth.slice(7).trim();

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    });

    // jwt.verify อาจคืน string ได้ → แคบชนิดก่อน
    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Invalid token" });
    }

    const payload = decoded as AccessPayload;
    if (payload.sub == null || !payload.role) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const sub =
      typeof payload.sub === "string" ? Number(payload.sub) : payload.sub;
    if (!Number.isFinite(sub)) {
      return res.status(401).json({ message: "Invalid subject" });
    }

    req.user = { sub, role: payload.role };
    next();
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};
