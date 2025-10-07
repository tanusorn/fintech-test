import { prisma } from "../config/prisma.js";
import dayjs from "dayjs";
export async function buildDailyReport(date = dayjs().startOf("day")) {
  const start = date.toDate();
  const end = date.add(1, "day").toDate();
  const trades = await prisma.trade.findMany({
    where: { createdAt: { gte: start, lt: end } },
  });
  const totalVolume = trades.reduce((a, t) => a + Number(t.amount), 0);
  const totalFee = trades.reduce((a, t) => a + Number(t.fee), 0);
  await prisma.dailyReport.upsert({
    where: { date: start },
    update: {
      totalVolume,
      totalFee,
    },
    create: { date: start, totalVolume, totalFee },
  });
}
