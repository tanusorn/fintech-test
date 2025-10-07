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
import { register } from "../lip/auth";
import { useNavigate, Link } from "react-router-dom";
import { loadReCaptcha } from "../lip/recaptcha";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    loadReCaptcha(
      import.meta.env.VITE_RECAPTCHA_SITE_KEY,
      "recaptcha-register",
      () => {}
    );
  }, []);

  async function onSubmit() {
    try {
      await register(email, password);
      localStorage.setItem("email", email);
      nav("/login");
    } catch (e: any) {
      setErr(e?.response?.data?.message || e.message);
    }
  }

  return (
    <Box className="p-4 flex justify-center">
      <Card className="max-w-md w-full bg-black/60">
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h5" color="primary">
              Register
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

            <Button variant="contained" fullWidth onClick={onSubmit}>
              Create Account
            </Button>

            {/* reCAPTCHA ไว้ล่างสุด และกึ่งกลาง */}
            <Box
              id="recaptcha-register"
              className="flex justify-center items-center"
            />

            <Typography variant="body2">
              มีบัญชีอยู่แล้ว?{" "}
              <Link to="/login" className="text-blue-400">
                Login
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
