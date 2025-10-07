import { useState } from "react";
import { Grid, MenuItem, TextField, Box } from "@mui/material";
import MoversList from "../components/MoversList";
import TradeChart from "../components/TradeChart";

const options = [
  { id: "BTC", label: "BTC" },
  { id: "ETH", label: "ETH" },
  { id: "USDT", label: "USDT" },
];

export default function Home() {
  const [symbol, setSymbol] = useState<"BTC" | "ETH" | "USDT">("BTC");
  return (
    <Box className="p-4">
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <MoversList side="left" limit={5} />
        </Grid>
        <Grid item xs={12} md={6}>
          <div className="mb-3">
            <TextField
              select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value as any)}
              label="เลือกเหรียญ"
              fullWidth
            >
              {options.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </div>
          <TradeChart symbol={symbol} height={460} />
        </Grid>
        <Grid item xs={12} md={3}>
          <MoversList side="right" limit={10} />
        </Grid>
      </Grid>
    </Box>
  );
}
