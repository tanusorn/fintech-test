import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tokens = [
    { symbol: "USDT", name: "Tether USD", decimals: 18 },
    { symbol: "BTC", name: "Bitcoin", decimals: 8 },
    { symbol: "ETH", name: "Ethereum", decimals: 18 },
  ];

  for (const t of tokens) {
    await prisma.token.upsert({
      where: {
        symbol: t.symbol,
      },
      update: {},
      create: t,
    });
  }
  console.log("Seeded Added");
}

main().finally(() => prisma.$disconnect());
