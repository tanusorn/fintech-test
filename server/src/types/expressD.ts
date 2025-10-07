import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: { sub: number; role: "ADMIN" | "USER" };
  }
}
