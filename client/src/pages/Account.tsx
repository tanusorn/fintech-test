// Account.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lip/api";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
} from "@mui/material";

type WalletRow = {
  id: number;
  balance: string;
  locked: string;
  token: { symbol: string; decimals: number; name: string };
};

export default function Account() {
  const { state } = useLocation() as any;
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await api.get("/api/wallets/me");
      setWallets(r.data);
      setLoaded(true);
    })();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {state?.depositOk && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Deposit successful: <strong>{state.amount}</strong>{" "}
          {state.token ?? ""} (PI: {state.pi})
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            My Wallets
          </Typography>
          {loaded && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell align="right">Locked</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {wallets.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.token.symbol}</TableCell>
                    <TableCell align="right">{w.balance}</TableCell>
                    <TableCell align="right">{w.locked}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
