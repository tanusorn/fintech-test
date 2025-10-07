//บังคับให้ property ใน object เป็น literal ไม่ใช่ type
export const WS_EVENTS = {
  CONNECTION: "connection",
  ORDERBOOK: "orderbook",
  TRADE: "trade",
  TICKER: "ticker",
  ORDER_UPDATE: "order_update",
  WITHDRAWAL: "withdrawal",
  DEPOSIT: "deposit",
} as const;
