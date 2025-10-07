import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
export default function CryptoChart({
  symbol = "bitcoin",
}: {
  symbol?: string;
}) {
  const [data, setData] = useState<{ t: number; p: number }[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      // ดึง historical price 7 วันจาก CoinGecko (public)
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${symbol}/
market_chart?vs_currency=usd&days=7`);
      const j = await r.json();
      const rows = (j.prices || []).map((x: any) => ({ t: x[0], p: x[1] }));
      if (mounted) setData(rows);
    })();
    return () => {
      mounted = false;
    };
  }, [symbol]);
  return (
    <div className="w-full h-[420px] p-4 bg-black rounded-xl">
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data}>
          <XAxis
            dataKey="t"
            tickFormatter={(v) => dayjs(v).format("MM/DD")}
            stroke="#888"
          />
          <YAxis dataKey="p" stroke="#888" />
          <Tooltip
            labelFormatter={(v) => dayjs(v).format("YYYY-MM-DD HH:mm")}
          />
          <Line
            type="monotone"
            dataKey="p"
            dot={false}
            stroke="#7CFC00"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
