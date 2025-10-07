import express from "express";
import http from "http";
import { env } from "./config/env.js";
import { useSecurity, notFound } from "./middleware/security.js";
import { defaultLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import depositRoutes from "./routes/depositRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { stripeWebhook } from "./controller/stripeWebhook.js";
import { initSocket } from "./websocket/socket.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";
import redis from "./config/redis.js";

const app = express();
useSecurity(app);

app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    (req as any).rawBody = (req as any).body;
    next();
  },
  stripeWebhook
);

app.use(express.json());
app.use(defaultLimiter);
//healtttt!!!!
app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({
      message: "Server can Starting on 8081",
      ok: true,
      time: new Date().toISOString(),
    });
});

app.get("/health/redis", async (_req, res) => {
  try {
    res.json({ ok: true, pong: await redis.ping() });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = initSocket(server);

server.listen(env.PORT, () => {
  logger.info(`Server Start On :${env.PORT}`);
});
