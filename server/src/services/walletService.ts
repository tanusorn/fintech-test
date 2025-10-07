import { prisma } from "../config/prisma.js";
import { Prisma } from "@prisma/client";

/** ดูกระเป๋า */
export async function getWallet(userId: number) {
  return prisma.wallet.findMany({
    where: { userId },
    include: { token: true },
  });
}

/** เติมเงินเข้ากระเป๋า (ถ้ายังไม่มี wallet ให้สร้าง) */
export async function credit(
  userId: number,
  tokenSymbol: string,
  amount: string
) {
  const token = await prisma.token.findUnique({
    where: { symbol: tokenSymbol },
  });
  if (!token) throw new Error("Token not found");

  const amt = new Prisma.Decimal(amount);

  return prisma.wallet.upsert({
    where: { userId_tokenId: { userId, tokenId: token.id } },
    update: { balance: { increment: amt } }, // ✅ Prisma.Decimal
    create: { userId, tokenId: token.id, balance: amt },
  });
}

/** ตัดเงินออกจากกระเป๋า (กันติดลบด้วย transaction) */
export async function debit(
  userId: number,
  tokenSymbol: string,
  amount: string
) {
  const token = await prisma.token.findUnique({
    where: { symbol: tokenSymbol },
  });
  if (!token) throw new Error("Token not found");

  const amt = new Prisma.Decimal(amount);

  return prisma.$transaction(async (tx) => {
    const w = await tx.wallet.findUnique({
      where: { userId_tokenId: { userId, tokenId: token.id } },
    });
    if (!w) throw new Error("Wallet not found");

    // w.balance เป็น Prisma.Decimal อยู่แล้ว ใช้เทียบตรง ๆ ได้
    if (w.balance.lt(amt)) {
      throw new Error("Insufficient balance");
    }

    return tx.wallet.update({
      where: { userId_tokenId: { userId, tokenId: token.id } },
      data: { balance: { decrement: amt } }, // ✅ Prisma.Decimal
    });
  });
}
