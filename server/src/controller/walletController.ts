import { RequestHandler } from "express";
import * as wallet from "../services/walletService.js";
export const myWallets: RequestHandler = async (req, res, next) => {
  try {
    const rows = await wallet.getWallet((req as any).user.sub);
    res.json(rows);
  } catch (e) {
    next(e);
  }
};
