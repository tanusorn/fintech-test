import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import { login, googleLogin } from "../lip/auth";
import { useNavigate, Link } from "react-router-dom";
import { loadReCaptcha } from "../lip/recaptcha";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // โหลด ReCaptcha
  useEffect(() => {
    loadReCaptcha(
      import.meta.env.VITE_RECAPTCHA_SITE_KEY,
      "recaptcha-login",
      () => {}
    );
  }, []);

  // Google One Tap / ปุ่ม Google Login
  useEffect(() => {
    const cid = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // @ts-ignore
    if (window.google && cid) {
      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: async (resp: any) => {
          try {
            await googleLogin(resp.credential);
            localStorage.setItem("googleEmail", "google_user");
            nav("/");
          } catch (err: any) {
            setErr(err?.response?.data?.message || err.message);
          }
        },
      });

      // @ts-ignore
      window.google.accounts.id.renderButton(document.getElementById("gbtn"), {
        theme: "outline",
        size: "large",
      });
    }
  }, [nav]);

  async function onSubmit() {
    try {
      setLoading(true);
      setErr(null);
      await login(email, password);
      localStorage.setItem("email", email);
      nav("/");
    } catch (e: any) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="p-4 flex justify-center">
      <Card className="max-w-md w-full bg-black/60">
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h5" color="primary">
              Login
            </Typography>

            {err && <Typography color="error">{err}</Typography>}

            <TextField
              label="Email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              onClick={onSubmit}
            >
              Login
            </Button>

            {/* ปุ่ม Google */}
            <Box id="gbtn" className="flex justify-center" />

            {/* ย้าย reCAPTCHA มาล่างสุด */}
            <Box
              id="recaptcha-login"
              className="flex justify-center items-center"
              sx={{ mt: 1 }}
            />

            <Typography variant="body2" sx={{ mt: 1 }}>
              ยังไม่มีบัญชี?{" "}
              <Link to="/register" className="text-blue-400">
                Register
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
