export type User = {
  id: number;
  email: string;
  role?: "USER" | "ADMIN";
  googleEmail?: string | null;
};

export type Wallet = {
  id: number;
  tokenId: number;
  balance: string;
  locked: string;
  token: { id: number; symbol: string; name: string; decimals: number };
};

export type TickerItem = {
  symbol: string;
  price: string | number;
  change7d?: number; // %
  change24h?: number; // %
  name?: string;
  history?: Array<{ t: number; p: number }>;
};
