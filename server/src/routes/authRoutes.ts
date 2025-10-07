import { Router } from "express";
import { login, register } from "../controller/authController.js";
import { loginWithGoogle } from "../controller/authController.js";
import { defaultLimiter } from "../middleware/rateLimiter.js";
import { botGuard } from "../middleware/botGuard.js";

const r = Router();

r.post("/register", defaultLimiter, botGuard, register);
r.post("/login", defaultLimiter, botGuard, login);
r.post("/google", defaultLimiter, botGuard, loginWithGoogle);

export default r;

// r.post("/register", defaultLimiter, botGuard, register);
// r.post("/login", defaultLimiter, botGuard, login);
// r.post("/google", defaultLimiter, botGuard, loginWithGoogle);
