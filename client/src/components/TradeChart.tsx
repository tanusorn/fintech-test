import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  UTCTimestamp,
  ISeriesApi,
} from "lightweight-charts";
import dayjs from "dayjs";

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

const RANGE_OPTS = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "1Y", days: 365 },
];

const COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
};

function calcMA(src: Candle[], period: number) {
  const out: { time: UTCTimestamp; value: number }[] = [];
  let sum = 0;
  for (let i = 0; i < src.length; i++) {
    sum += src[i].close;
    if (i >= period) sum -= src[i - period].close;
    if (i >= period - 1) {
      out.push({ time: src[i].time, value: +(sum / period).toFixed(2) });
    }
  }
  return out;
}

export default function TradeChart({
  symbol = "BTC",
  height = 460,
}: {
  symbol?: "BTC" | "ETH" | "USDT";
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const coinId = useMemo(() => COINGECKO_ID[symbol] || "bitcoin", [symbol]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#CFCFCF",
      },
      grid: {
        vertLines: { color: "#1f1f1f" },
        horzLines: { color: "#1f1f1f" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#2b2b2b" },
      timeScale: {
        borderColor: "#2b2b2b",
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      localization: {
        priceFormatter: (p: number) =>
          p.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        timeFormatter: (t: number) => dayjs.unix(t).format("YYYY-MM-DD HH:mm"),
      },
    });

    // --- Series ---
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#7CFC00",
      downColor: "#e74c3c",
      borderDownColor: "#e74c3c",
      borderUpColor: "#7CFC00",
      wickDownColor: "#e74c3c",
      wickUpColor: "#7CFC00",
    });

    const volSeries: ISeriesApi<"Histogram"> = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "", // แยกพาเนลล่าง
      color: "#666",
    });

    // ตั้ง margins ผ่าน priceScale ของซีรีส์ (เลี่ยง error priceScale(''))
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const ma7 = chart.addLineSeries({ color: "#eab308", lineWidth: 2 }); // เหลือง
    const ma25 = chart.addLineSeries({ color: "#b388ff", lineWidth: 2 }); // ม่วงอ่อน
    const ma99 = chart.addLineSeries({ color: "#00bcd4", lineWidth: 2 }); // ฟ้า

    // --- Resize observer ---
    let ro: ResizeObserver | null = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    ro.observe(containerRef.current);

    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // 1) ดึง OHLC
        const ohlcRes = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
        );
        const ohlc: [number, number, number, number, number][] =
          await ohlcRes.json();

        // 2) ดึง Volume
        const volRes = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
        );
        const volJson = await volRes.json();
        const volMap = new Map<number, number>();
        (volJson.total_volumes || []).forEach((v: [number, number]) => {
          volMap.set(Math.floor(v[0] / 1000), v[1]);
        });

        const candles: Candle[] = ohlc.map((c) => ({
          time: Math.floor(c[0] / 1000) as UTCTimestamp,
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
          volume: volMap.get(Math.floor(c[0] / 1000)) ?? 0,
        }));

        if (!mounted) return;

        candleSeries.setData(candles);
        volSeries.setData(
          candles.map((c) => ({
            time: c.time,
            value: c.volume ?? 0,
            color: c.close >= c.open ? "#2e7d32" : "#9a0007",
          }))
        );
        ma7.setData(calcMA(candles, 7));
        ma25.setData(calcMA(candles, 25));
        ma99.setData(calcMA(candles, 99));

        chart.timeScale().fitContent();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      ro?.disconnect();
      chart.remove();
      ro = null;
    };
  }, [coinId, days, height]);

  return (
    <div className="w-full bg-black rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">{symbol}/USDT</span>
        </div>
        <div className="flex gap-2">
          {RANGE_OPTS.map((r) => (
            <button
              key={r.label}
              onClick={() => setDays(r.days)}
              className={`px-2 py-1 rounded ${
                days === r.days
                  ? "bg-primary text-black"
                  : "bg-black border border-white/10 text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} style={{ height }} />

      <div className="mt-2 text-sm text-white/70 flex gap-4">
        <span>MA(7) = เหลือง</span>
        <span>MA(25) = ม่วง</span>
        <span>MA(99) = ฟ้า</span>
        {loading && <span className="text-white/40">Loading…</span>}
      </div>
    </div>
  );
}
