import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
export default function Deposit() {
  const nav = useNavigate();
  const [token, setToken] = useState("USDT");
  const [amount, setAmount] = useState("");
  return (
    <Box className="p-4 flex justify-center">
      <Card className="max-w-xl w-full bg-black/60">
        <CardContent className="space-y-4">
          <Typography variant="h5" color="primary">
            Deposit via Stripe
          </Typography>
          <TextField
            select
            label="Token"
            fullWidth
            value={token}
            onChange={(e) => setToken(e.target.value)}
          >
            {["USDT", "BTC", "ETH"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Amount (fiat)"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={() =>
              nav("/payment", {
                state: {
                  token,
                  amount,
                },
              })
            }
          >
            Continue to Pay
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
