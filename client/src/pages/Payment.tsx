import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../lip/stripe";
import { api } from "../lip/api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

async function checkSettled(pi: string) {
  const r = await api.get(`/api/payments/status?pi=${encodeURIComponent(pi)}`);
  return r.data as {
    payment?: {
      id: number;
      status: string;
      amount: string;
      method: string;
      currency: string;
    };
    settled: boolean;
    externalRef?: string;
  };
}

function CheckoutForm({ onSuccess }: { onSuccess: (pi: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ กัน re-confirm หลัง redirect: ถ้ากลับมาพร้อม client_secret แล้วสถานะ success/processing ก็ไม่ต้องกดซ้ำ
  useEffect(() => {
    (async () => {
      if (!stripe) return;
      const cs = new URLSearchParams(window.location.search).get(
        "payment_intent_client_secret"
      );
      if (!cs) return;
      const { paymentIntent } = await stripe.retrievePaymentIntent(cs);
      if (paymentIntent?.status === "succeeded") {
        onSuccess(paymentIntent.id);
      } else if (paymentIntent?.status === "processing") {
        setMsg("Payment is processing. Waiting for settlement…");
      }
    })();
  }, [stripe, onSuccess]);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    setMsg(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.origin + "/payment" },
    });

    if (error) {
      setMsg(error.message || "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.id) {
      try {
        const stat = await checkSettled(paymentIntent.id);
        if (stat?.settled) {
          onSuccess(paymentIntent.id);
          return;
        }
        setMsg("Payment confirmed. Waiting for settlement...");
      } catch (e: any) {
        setMsg(e?.response?.data?.message || e.message);
      }
    }

    setLoading(false);
  };

  return (
    <>
      <PaymentElement />
      <Button
        className="mt-4"
        variant="contained"
        disabled={!stripe || !elements || loading}
        onClick={handleSubmit}
      >
        {loading ? "Processing…" : "Pay"}
      </Button>
      {loading && (
        <div className="mt-2">
          <CircularProgress size={22} />
        </div>
      )}
      {msg && (
        <Alert className="mt-3" severity="info">
          {msg}
        </Alert>
      )}
    </>
  );
}

export default function Payment() {
  const { state } = useLocation() as any;
  const nav = useNavigate();
  const query = useQuery();

  const tokenSymbol = state?.token || "USDT";
  const amount = state?.amount ?? ""; // ✅ อย่า default "0" จะยิง intent ผิด

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initMsg, setInitMsg] = useState<string | null>(
    "Initializing payment session..."
  );
  const [initErr, setInitErr] = useState<string | null>(null);

  // 1) ตรวจสถานะเมื่อกลับจาก redirect
  useEffect(() => {
    (async () => {
      const returnCS = query.get("payment_intent_client_secret");
      const returnPI = query.get("payment_intent");
      if (returnCS || returnPI) {
        try {
          if (returnPI) {
            const stat = await checkSettled(returnPI);
            if (stat?.settled) {
              nav("/account", {
                replace: true,
                state: {
                  depositOk: true,
                  amount: stat.payment?.amount,
                  currency: stat.payment?.currency?.toUpperCase(),
                },
              });
              return;
            }
          }
          if (returnCS) {
            setClientSecret(returnCS);
            setInitMsg(null);
          }
        } catch (e: any) {
          setInitErr(e?.response?.data?.message || e.message);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) ถ้ายังไม่มี clientSecret → สร้าง PaymentIntent (แต่ต้อง amount > 0)
  useEffect(() => {
    (async () => {
      if (clientSecret) return;

      // ✅ กัน amount ผิดก่อน: ไม่เรียก intent ถ้า <=0 หรือว่าง
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) {
        setInitErr("Amount must be > 0");
        setInitMsg(null);
        return;
      }

      try {
        const r = await api.post("/api/payments/intent", {
          tokenSymbol,
          amount,
        });
        setClientSecret(r.data.clientSecret);
        setInitMsg(null);
      } catch (e: any) {
        setInitErr(e?.response?.data?.message || e.message);
        setInitMsg(null);
      }
    })();
  }, [tokenSymbol, amount, clientSecret]);

  const handleSuccess = (pi: string) => {
    nav("/account", { replace: true, state: { depositOk: true, pi } });
  };

  return (
    <Box className="p-4 flex justify-center">
      <Card className="max-w-xl w-full bg-black/60">
        <CardContent className="space-y-4">
          <Typography variant="h5" color="primary">
            Stripe Payment
          </Typography>

          {initMsg && <Typography>{initMsg}</Typography>}
          {initErr && <Alert severity="error">{initErr}</Alert>}

          {/* ✅ รี-mount เมื่อ clientSecret เปลี่ยน */}
          {clientSecret && (
            <Elements
              key={clientSecret}
              stripe={stripePromise!}
              options={{ clientSecret }}
            >
              <CheckoutForm onSuccess={handleSuccess} />
            </Elements>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
