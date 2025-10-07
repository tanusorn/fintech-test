import { RequestHandler } from "express";
import { prisma } from "../config/prisma.js";
export const createDeposit: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as any).user.sub as number;
    const { tokenSymbol, amount, slipUrl } = req.body;
    const token = await prisma.token.findUnique({
      where: { symbol: tokenSymbol },
    });
    if (!token) return res.status(400).json({ message: "Token not found" });
    const dr = await prisma.depositRequest.create({
      data: { userId, tokenId: token.id, amount, slipUrl },
    });
    res.json(dr);
  } catch (e) {
    next(e);
  }
};
