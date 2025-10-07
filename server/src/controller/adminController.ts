import { RequestHandler } from "express";
import { prisma } from "../config/prisma.js";
export const approveDeposit: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const dr = await prisma.depositRequest.findUnique({
      where: { id: Number(id) },
    });
    if (!dr || dr.status !== "PENDING")
      return res.status(400).json({ message: "Invalid request" });
    await prisma.$transaction(async (tx) => {
      await tx.depositRequest.update({
        where: { id: dr.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: (req as any).user.sub,
        },
      });
      await tx.wallet.update({
        where: { userId_tokenId: { userId: dr.userId, tokenId: dr.tokenId } },
        data: { balance: { increment: dr.amount } },
      });
      await tx.transaction.create({
        data: {
          userId: dr.userId,
          tokenId: dr.tokenId,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount: dr.amount,
        },
      });
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
