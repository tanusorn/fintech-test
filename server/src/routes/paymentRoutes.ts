import { Router } from "express";
import { authCheck } from "../middleware/auth.js";
import {
  createPaymentIntent,
  createCheckoutSession,
  getPaymentStatus,
} from "../controller/paymentController.js";

const r = Router();

r.post("/intent", authCheck, createPaymentIntent);
r.post("/checkout", authCheck, createCheckoutSession);
r.get("/status", authCheck, getPaymentStatus);

export default r;
