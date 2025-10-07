// routes/stripeWebhook.ts
import { Request, Response, RequestHandler } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

function centsToString(amountCents: number): string {
  const sign = amountCents < 0 ? "-" : "";
  const abs = Math.abs(amountCents);
  const s = abs.toString();
  if (s.length <= 2) return `${sign}0.${s.padStart(2, "0")}`;
  return `${sign}${s.slice(0, -2)}.${s.slice(-2)}`;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {});

type SettleArgs = {
  providerRef: string;
  userId: number;
  tokenId: number;
  tokenSymbol: string;
  amountTokens: string; // หน่วย token/เครดิต เป็น string ที่ Prisma รองรับ
};

// === Idempotent crediting + logging ===
async function settleDeposit({
  providerRef,
  userId,
  tokenId,
  tokenSymbol,
  amountTokens,
}: SettleArgs) {
  await prisma.$transaction(
    async (tx) => {
      await tx.transaction.create({
        data: {
          userId,
          tokenId,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount: amountTokens,
          provider: "STRIPE",
          externalRef: providerRef,
          memo: `Stripe deposit ${tokenSymbol}`,
        },
      });

      await tx.wallet.upsert({
        where: { userId_tokenId: { userId, tokenId } },
        update: { balance: { increment: amountTokens } },
        create: { userId, tokenId, balance: amountTokens },
      });

      await tx.payment.updateMany({
        where: {
          OR: [
            { stripePaymentIntentId: providerRef },
            { stripeCheckoutSessionId: providerRef },
          ],
        },
        data: { status: "succeeded" },
      });

      await tx.notification.create({
        data: {
          userId,
          message: `Deposit ${amountTokens} ${tokenSymbol} succeeded via Stripe.`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "DEPOSIT_SUCCEEDED",
          meta: {
            provider: "STRIPE",
            ref: providerRef,
            tokenSymbol,
            amountTokens,
          },
        },
      });
    },
    { timeout: 15000 }
  );
}

async function markPayment(
  piOrSessionId: string,
  status:
    | "processing"
    | "requires_action"
    | "failed"
    | "canceled"
    | "succeeded",
  failureReason?: any
) {
  await prisma.payment.updateMany({
    where: {
      OR: [
        { stripePaymentIntentId: piOrSessionId },
        { stripeCheckoutSessionId: piOrSessionId },
      ],
    },
    data: {
      status,
      ...(failureReason ? { metadata: { failureReason } } : {}),
    },
  });
}

export const stripeWebhook: RequestHandler = async (
  req: Request,
  res: Response
) => {
  logger.info(
    { type: req.headers["stripe-signature"] ? "signed" : "no-sign" },
    "Stripe webhook HIT"
  );
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig,
      webhookSecret
    );
  } catch (err) {
    logger.warn(err, "Stripe webhook signature verification failed");
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const md = (pi.metadata || {}) as any;
        const userId = Number(md.userId);
        const tokenId = Number(md.tokenId);
        const tokenSymbol = String(md.tokenSymbol || "CREDIT");

        const amountCents = (pi.amount_received ?? pi.amount ?? 0) as number;
        const amountTokens =
          amountCents > 0 ? centsToString(amountCents) : (md.amount as string); // fallback

        await settleDeposit({
          providerRef: pi.id,
          userId,
          tokenId,
          tokenSymbol,
          amountTokens,
        });
        break;
      }

      case "payment_intent.processing": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markPayment(pi.id, "processing");
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markPayment(pi.id, "failed", {
          code: pi.last_payment_error?.code,
          message: pi.last_payment_error?.message,
        });
        break;
      }

      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markPayment(pi.id, "canceled");
        break;
      }

      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const md = (s.metadata || {}) as any;
        const userId = Number(md.userId);
        const tokenId = Number(md.tokenId);
        const tokenSymbol = String(md.tokenSymbol || "CREDIT");

        const amountCents = (s.amount_total ?? 0) as number;
        const amountTokens =
          amountCents > 0 ? centsToString(amountCents) : (md.amount as string);

        if (s.payment_status === "paid") {
          await settleDeposit({
            providerRef: s.id,
            userId,
            tokenId,
            tokenSymbol,
            amountTokens,
          });
        } else {
          await markPayment(s.id, (s.payment_status as any) || "processing");
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const s = event.data.object as Stripe.Checkout.Session;
        await markPayment(s.id, "failed", { message: "async_payment_failed" });
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object as Stripe.Checkout.Session;
        await markPayment(s.id, "succeeded");
        break;
      }

      default: {
        logger.info({ type: event.type }, "Unhandled Stripe event");
      }
    }

    res.json({ received: true });
  } catch (e) {
    const err = e as any;
    if (err?.code === "P2002") {
      logger.info(err, "Duplicate deposit ignored (idempotent)");
      return res.json({ received: true, idempotent: true });
    }
    logger.error(e, "Stripe webhook error");
    res.status(500).json({ error: (e as Error).message });
  }
};
