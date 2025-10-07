import jwt, { Secret, SignOptions } from "jsonwebtoken";
import type { StringValue as MsString } from "ms";
import { env } from "../config/env.js";

const ACCESS_SECRET: Secret = env.JWT_ACCESS_SECRET;
const REFRESH_SECRET: Secret = env.JWT_REFRESH_SECRET;

const ACCESS_OPTS: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES as MsString,
};
const REFRESH_OPTS: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES as MsString,
};
export const signAccess = (sub: number, role: "USER" | "ADMIN") =>
  jwt.sign({ sub, role }, ACCESS_SECRET, ACCESS_OPTS);

export const signRefresh = (sub: number) =>
  jwt.sign({ sub }, REFRESH_SECRET, REFRESH_OPTS);
