import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid, // ✅ ใช้ Grid แทน Grid2
} from "@mui/material";

import ConfirmDialog from "../components/ConfirmDialog";
import { api } from "../lip/api"; // ✅ ตรวจว่าพิมพ์ lib ไม่ใช่ lip

export default function Order() {
  const [token, setToken] = useState("BTC");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<"MARKET" | "LIMIT">("LIMIT");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function place() {
    try {
      const payload: any = { token, side, type, amount };
      if (type === "LIMIT") payload.price = price;

      await api.post("/api/orders", payload);
      setMsg("✅ Order submitted successfully");
    } catch (err: any) {
      setMsg(err?.response?.data?.message || err.message);
    }
  }

  return (
    <Box className="p-4 flex justify-center">
      <Card className="max-w-2xl w-full bg-black/60">
        <CardContent className="space-y-4">
          <Typography variant="h5" color="primary">
            Place Order
          </Typography>

          {/* ✅ ใช้ Grid container/item */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Token"
                fullWidth
                value={token}
                onChange={(e) => setToken(e.target.value)}
              >
                {["BTC", "ETH", "USDT"].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Side"
                fullWidth
                value={side}
                onChange={(e) => setSide(e.target.value as "BUY" | "SELL")}
              >
                {["BUY", "SELL"].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Type"
                fullWidth
                value={type}
                onChange={(e) => setType(e.target.value as "MARKET" | "LIMIT")}
              >
                {["MARKET", "LIMIT"].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {type === "LIMIT" && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Price"
                  fullWidth
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                label="Amount"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Grid>
          </Grid>

          <div className="flex gap-3 items-center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpen(true)}
            >
              Confirm Order
            </Button>

            {msg && (
              <Typography color="primary" variant="body2">
                {msg}
              </Typography>
            )}
          </div>

          <ConfirmDialog
            open={open}
            title="Confirm your order"
            content={`Token: ${token} | Side: ${side} | Type: ${type}${
              type === "LIMIT" ? ` | Price: ${price}` : ""
            } | Amount: ${amount}`}
            onConfirm={() => {
              setOpen(false);
              place();
            }}
            onClose={() => setOpen(false)}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
