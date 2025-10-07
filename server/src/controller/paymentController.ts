// controllers/createPaymentIntent.ts
import { RequestHandler } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { v4 as uuidv4, validate as isUuid } from "uuid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// บางสกุลเงินไม่มีทศนิยม (จำนวนที่ส่งให้ Stripe ต้องเป็นหน่วย minor แบบจำนวนเต็ม)
const ZERO_DECIMAL = new Set([
  "JPY",
  "KRW",
  "VND",
  "CLP",
  "UGX",
  "XAF",
  "XOF",
  "XPF",
  "BIF",
  "DJF",
  "GNF",
  "KMF",
  "MGA",
  "PYG",
  "RWF",
  "VUV",
]);

// amount string → minor units (integer) ตามกฎสกุลเงิน
function toMinorUnits(amountStr: string, currency: string): number {
  const s = (amountStr ?? "").toString().trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error("Invalid amount format");
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) throw new Error("Amount must be > 0");

  const factor = ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100;
  const minor = Math.round(n * factor);

  // Stripe ต้องการจำนวนเต็มและ > 0
  if (!Number.isInteger(minor) || minor <= 0)
    throw new Error("Invalid minor amount");
  return minor;
}

export const createPaymentIntent: RequestHandler = async (req, res, next) => {
  try {
    const { tokenSymbol, amount } = req.body as {
      tokenSymbol: string;
      amount: string | number;
    };

    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      return res.status(400).json({ message: "Amount must be > 0" }); // ← 400 ชัดเจน
    }

    const amountMinor = Math.round(n * 100); // THB -> สตางค์

    const intent = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency: env.STRIPE_CURRENCY || "thb",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: String((req as any).user?.sub ?? ""),
        tokenSymbol,
        amount: String(n),
      },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (e) {
    next(e);
  }
};

//  สร้าง PaymentIntent เพื่อใช้กับ Payment Element
export const getPaymentStatus: RequestHandler = async (req, res, next) => {
  try {
    const { pid, id, pi, cs } = req.query as {
      pid?: string; // ✅ publicId (UUID)
      id?: string; // legacy numeric id (ยังรองรับ)
      pi?: string; // payment intent id
      cs?: string; // checkout session id
    };

    let payment = null;

    if (pid) {
      if (!isUuid(pid))
        return res.status(400).json({ message: "Invalid pid (UUID) format" });
      payment = await prisma.payment.findUnique({ where: { publicId: pid } });
    } else if (id) {
      const num = Number(id);
      if (!Number.isInteger(num))
        return res.status(400).json({ message: "Invalid id" });
      payment = await prisma.payment.findUnique({ where: { id: num } });
    } else if (pi) {
      payment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: pi },
      });
    } else if (cs) {
      payment = await prisma.payment.findFirst({
        where: { stripeCheckoutSessionId: cs },
      });
    } else {
      return res.status(400).json({ message: "Provide pid or id or pi or cs" });
    }

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // ตรวจว่า settle แล้วหรือยัง (เทียบกับ provider/externalRef)
    const externalRef =
      payment.stripePaymentIntentId ?? payment.stripeCheckoutSessionId ?? "";
    const tx = externalRef
      ? await prisma.transaction.findFirst({
          where: { provider: "STRIPE", externalRef },
          select: { id: true },
        })
      : null;

    res.json({
      payment: {
        id: payment.publicId, // ✅ ส่ง UUID ออกไป
        legacyId: payment.id, // (optional) เผื่อ debug
        status: payment.status,
        method: payment.method,
        currency: payment.currency,
        amount: payment.amount, // string (Decimal field)
      },
      settled: !!tx,
      externalRef,
    });
  } catch (e) {
    next(e);
  }
};

//  สร้าง Stripe Checkout Session (redirect flow)
export const createCheckoutSession: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number((req as any).user?.sub);
    if (!userId)
      return res.status(401).json({ message: "ไปloginก่อนนะครับพี่ชาย" });

    const { tokenSymbol, amount } = req.body as {
      tokenSymbol: string;
      amount: string;
    };
    if (!tokenSymbol || !amount) {
      return res
        .status(400)
        .json({ message: "tokenSymbol and amount are required" });
    }

    const token = await prisma.token.findUnique({
      where: { symbol: tokenSymbol },
    });
    if (!token) return res.status(400).json({ message: "Token not found" });

    const currency = (process.env.STRIPE_CURRENCY || "thb").toUpperCase();
    const amountMinor = toMinorUnits(amount, currency);

    // เลือกวิธีชำระเงิน (Checkout รองรับ promptpay เมื่อสกุลเงินเป็น THB)
    const paymentMethodTypes =
      currency === "THB"
        ? ([
            "card",
            "promptpay",
          ] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[])
        : (["card"] as any);

    const successUrl =
      process.env.CHECKOUT_SUCCESS_URL ||
      `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/payments/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      process.env.CHECKOUT_CANCEL_URL ||
      `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/payments/cancel?session_id={CHECKOUT_SESSION_ID}`;

    // รองรับ Idempotency-Key (กันสร้างซ้ำตอน retry)
    const idemKey = (
      req.header("Idempotency-Key") ||
      `checkout:${userId}:${token.id}:${amountMinor}`
    ).toString();

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: paymentMethodTypes,
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amountMinor,
              product_data: {
                name: `Deposit ${amount} ${tokenSymbol}`,
                metadata: { app: "mini-exchange", tokenSymbol },
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: `${userId}:${token.id}`,
        metadata: {
          app: "mini-exchange",
          userId: String(userId),
          tokenId: String(token.id),
          tokenSymbol,
          amount,
        },
      },
      { idempotencyKey: idemKey }
    );

    // บันทึก Payment (ส่ง amount เป็น string ให้ Prisma)
    await prisma.payment.create({
      data: {
        userId,
        tokenId: token.id,
        amount, // ส่งเป็น string
        currency,
        stripeCheckoutSessionId: session.id,
        status: mapCheckoutStatusToPrisma(session.payment_status),
        method: null,
        metadata: {
          mode: "checkout",
          checkout_payment_status: session.payment_status, // เก็บค่าจริงของ Stripe ไว้ดู
        },
      },
    });

    // ส่ง URL ให้ frontend redirect
    return res.json({
      sessionId: session.id,
      checkoutUrl: session.url,
      paymentStatus: session.payment_status || "unpaid",
    });
  } catch (e: any) {
    if (e?.raw?.message) {
      return res.status(400).json({ message: e.raw.message });
    }
    next(e);
  }
};

function mapCheckoutStatusToPrisma(
  s: Stripe.Checkout.Session.PaymentStatus | null | undefined
):
  | "created"
  | "processing"
  | "requires_action"
  | "succeeded"
  | "failed"
  | "canceled" {
  switch (s) {
    case "paid":
      return "succeeded";
    case "no_payment_required":
      return "succeeded"; // หรือ "created" หากต้องการให้รอ webhook
    case "unpaid":
    default:
      return "created";
  }
}
