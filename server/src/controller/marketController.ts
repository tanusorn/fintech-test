import { RequestHandler } from "express";
import { fetchTicker } from "../services/marketDataService.js";
export const ticker: RequestHandler = async (req, res, next) => {
  try {
    const { symbol } = req.query as any;
    const t = await fetchTicker(symbol);
    res.json(t);
  } catch (e) {
    next(e);
  }
};
