import { RequestHandler } from "express";
export const requireRole =
  (role: "ADMIN" | "USER"): RequestHandler =>
  (req, res, next) => {
    const u = (req as any).user;
    if (!u) return res.status(401).json({ message: "Unauthorized" });
    if (role === "ADMIN" && u.role !== "ADMIN")
      return res.status(403).json({
        message: "Forbidden",
      });
    next();
  };
