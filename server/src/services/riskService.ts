import { prisma } from "../config/prisma.js";
import { Prisma } from "@prisma/client";

const D = Prisma.Decimal;

export async function checkTradeLimit(
  userId: number,
  notional: string | number | Prisma.Decimal
) {
  const u = await prisma.userLimits.findUnique({ where: { userId } });
  if (!u) return true;
  const notionalD = new D(notional.toString());
  const daySpent = u.tradedToday.plus(notionalD);

  if (daySpent.gt(u.dailyTradeLimit)) {
    await prisma.riskLog.create({
      data: {
        userId,
        action: "TRADE_LIMIT_EXCEEDED",
        severity: "MEDIUM",
        reason: "Daily trade limit",
      },
    });
    return false;
  }
  return true;
}
