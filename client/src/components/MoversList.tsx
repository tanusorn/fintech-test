import { useEffect, useState } from "react";

type Coin = {
  id: string;
  symbol: string;
  name: string;
  price_change_percentage_7d_in_currency: number;
  current_price: number;
};

export default function MoversList({
  side = "left",
  limit = 5,
}: {
  side?: "left" | "right";
  limit?: number;
}) {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const r = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=7d"
      );
      const j = await r.json();

      const sorted = j.sort(
        (a: Coin, b: Coin) =>
          b.price_change_percentage_7d_in_currency -
          a.price_change_percentage_7d_in_currency
      );

      if (mounted) setCoins(sorted.slice(0, limit));
    })();

    return () => {
      mounted = false;
    };
  }, [limit]);

  return (
    <div className="bg-black/60 rounded-xl p-4 border border-white/10">
      <h3 className="text-primary font-semibold mb-3">
        {side === "left" ? "Top 5" : "Top 10"} Gainers (7d)
      </h3>

      <ul className="space-y-2">
        {coins.map((c, idx) => (
          <li key={c.id} className="flex justify-between">
            <span>
              {idx + 1}. {c.name} ({c.symbol.toUpperCase()})
            </span>
            <span className="text-primary">
              {c.price_change_percentage_7d_in_currency.toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
