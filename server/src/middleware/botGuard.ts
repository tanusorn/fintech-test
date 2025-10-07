import { verifyRecaptcha } from "../utils/recaptcha.js";
import { RequestHandler } from "express";

export const botGuard: RequestHandler = async (req, res, next) => {
  try {
    const token =
      (req.headers["x-recaptcha-token"] as string) ||
      (req.body.recaptchaToken as string);
    const ok = await verifyRecaptcha(token);
    if (!ok)
      return res.status(400).json({ message: "Recaptcha verification failed" });
    next();
  } catch (error) {
    return res.status(400).json({ message: "Recaptcha verification failed" });
  }
};
