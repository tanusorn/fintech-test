import axios from "axios";
import { env } from "../config/env.js";
export async function fetchTicker(symbol: string) {
  const r = await axios.get(`${env.BINANCE_BASE}/api/v3/ticker/price`, {
    params: { symbol },
  });
  return r.data; // {symbol, price}
}
