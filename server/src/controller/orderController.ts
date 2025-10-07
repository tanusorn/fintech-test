import { RequestHandler } from "express";
import { schemas } from "../utils/validation.js";
import { placeOrder } from "../services/orderService.js";
import { match } from "../services/tradeEngineService.js";
export const place: RequestHandler = async (req, res, next) => {
  try {
    const { error, value } = schemas.order.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const userId = (req as any).user.sub as number;
    await placeOrder({
      userId,
      tokenSymbol: value.token,
      side: value.side,
      type: value.type,
      price: value.price,
      amount: value.amount,
    });
    await match(value.token);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
