import { prisma } from "../config/prisma.js";
import { Prisma } from "@prisma/client";

const D = Prisma.Decimal;
const toD = (x: string | number | Prisma.Decimal) => new D(x.toString());

export async function placeOrder(params: {
  userId: number;
  tokenSymbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  price?: string;
  amount: string;
}) {
  const token = await prisma.token.findUnique({
    where: { symbol: params.tokenSymbol },
  });
  if (!token) throw new Error("Token not found");

  if (params.side === "BUY") {
    if (params.type === "LIMIT" && !params.price) {
      throw new Error("Price required for LIMIT BUY");
    }

    const amountD = toD(params.amount);
    const priceD = params.price ? toD(params.price) : new D(0);
    const notional = priceD.mul(amountD);

    await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUnique({
        where: { userId_tokenId: { userId: params.userId, tokenId: token.id } },
      });
      if (!w) throw new Error("Wallet missing");

      const wBal = toD(w.balance);
      if (wBal.lt(notional)) throw new Error("Insufficient");

      await tx.wallet.update({
        where: { id: w.id },
        data: {
          balance: { decrement: notional },
          locked: { increment: notional },
        },
      });

      await tx.order.create({
        data: {
          userId: params.userId,
          tokenId: token.id,
          side: "BUY",
          type: params.type,
          price: params.price ? priceD : null,
          amount: amountD,
        },
      });
    });
  } else {
    // SELL
    await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUnique({
        where: { userId_tokenId: { userId: params.userId, tokenId: token.id } },
      });
      if (!w) throw new Error("Wallet missing");

      const amountD = toD(params.amount);
      const wBal = toD(w.balance);
      if (wBal.lt(amountD)) throw new Error("Insufficient");

      await tx.wallet.update({
        where: { id: w.id },
        data: {
          balance: { decrement: amountD },
          locked: { increment: amountD },
        },
      });

      await tx.order.create({
        data: {
          userId: params.userId,
          tokenId: token.id,
          side: "SELL",
          type: params.type,
          price: params.price ? toD(params.price) : null,
          amount: amountD,
        },
      });
    });
  }
}
