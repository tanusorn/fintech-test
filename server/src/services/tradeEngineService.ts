import { prisma } from "../config/prisma.js";
import { Prisma } from "@prisma/client";

const D = Prisma.Decimal;

// helper: min สำหรับ Decimal
const minD = (a: Prisma.Decimal, b: Prisma.Decimal) => (a.cmp(b) <= 0 ? a : b);

const FEE_RATE = new D("0.001"); // 0.1%

export async function match(tokenSymbol: string) {
  const token = await prisma.token.findUnique({
    where: { symbol: tokenSymbol },
  });
  if (!token) throw new Error("Token not found");

  const buys = await prisma.order.findMany({
    where: {
      tokenId: token.id,
      status: { in: ["NEW", "PARTIAL"] },
      side: "BUY",
    },
    orderBy: [{ price: "desc" }, { id: "asc" }],
  });

  const sells = await prisma.order.findMany({
    where: {
      tokenId: token.id,
      status: { in: ["NEW", "PARTIAL"] },
      side: "SELL",
    },
    orderBy: [{ price: "asc" }, { id: "asc" }],
  });

  for (const b of buys) {
    for (const s of sells) {
      const bPrice = b.type === "MARKET" ? s.price : b.price;
      const sPrice = s.type === "MARKET" ? b.price : s.price;
      if (!bPrice || !sPrice) continue;

      const bP = new D(bPrice.toString());
      const sP = new D(sPrice.toString());
      if (bP.lt(sP)) continue; // ยังไม่ cross

      const bRemaining = new D(b.amount.toString()).minus(b.filled.toString());
      const sRemaining = new D(s.amount.toString()).minus(s.filled.toString());
      const size = minD(bRemaining, sRemaining);
      if (size.lte(0)) continue;

      const price = sP; // maker = SELL
      const notional = price.mul(size);
      const fee = notional.mul(FEE_RATE);

      await prisma.$transaction(async (tx) => {
        await tx.trade.create({
          data: {
            tokenId: token.id,
            buyOrderId: b.id,
            sellOrderId: s.id,
            buyerId: b.userId,
            sellerId: s.userId,
            price, // Prisma.Decimal
            amount: size, // Prisma.Decimal
            fee, // Prisma.Decimal
          },
        });

        await tx.order.update({
          where: { id: b.id },
          data: {
            filled: { increment: size },
            status: size.eq(bRemaining) ? "FILLED" : "PARTIAL",
          },
        });

        await tx.order.update({
          where: { id: s.id },
          data: {
            filled: { increment: size },
            status: size.eq(sRemaining) ? "FILLED" : "PARTIAL",
          },
        });

        // BUYER: ลด locked(quote), เพิ่ม balance(base)
        const buyerWallet = await tx.wallet.findUnique({
          where: { userId_tokenId: { userId: b.userId, tokenId: token.id } },
        });
        if (!buyerWallet) throw new Error("Buyer wallet missing");
        await tx.wallet.update({
          where: { id: buyerWallet.id },
          data: {
            locked: { decrement: notional },
            balance: { increment: size },
          },
        });

        // SELLER: ลด locked(base), เพิ่ม balance(quote - fee)
        const sellerWallet = await tx.wallet.findUnique({
          where: { userId_tokenId: { userId: s.userId, tokenId: token.id } },
        });
        if (!sellerWallet) throw new Error("Seller wallet missing");
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: {
            locked: { decrement: size },
            balance: { increment: notional.minus(fee) },
          },
        });

        // ค่าธรรมเนียมเข้า ExchangeWallet
        const ex = await tx.exchangeWallet.upsert({
          where: { tokenId: token.id },
          create: { tokenId: token.id },
          update: {},
        });
        await tx.exchangeWallet.update({
          where: { id: ex.id },
          data: { balance: { increment: fee } },
        });

        // Logs
        await tx.transaction.createMany({
          data: [
            {
              userId: b.userId,
              tokenId: token.id,
              type: "TRADE",
              status: "COMPLETED",
              amount: size,
            },
            {
              userId: s.userId,
              tokenId: token.id,
              type: "TRADE",
              status: "COMPLETED",
              amount: size,
            },
            {
              userId: s.userId,
              tokenId: token.id,
              type: "FEE_ADJUST",
              status: "COMPLETED",
              amount: fee,
            },
          ],
        });
      });
    }
  }
}
