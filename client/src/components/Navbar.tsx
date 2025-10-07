import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout } from "../lip/auth"; // ⬅️ เพิ่มบรรทัดนี้

export default function Navbar() {
  const nav = useNavigate();
  const [loggedIn, setLoggedIn] = useState<boolean>(
    !!localStorage.getItem("access")
  );
  const [email, setEmail] = useState<string | null>(null);
  const [gEmail, setGEmail] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setLoggedIn(!!localStorage.getItem("access"));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync); // 👈 ฟัง custom event
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  async function handleLogout() {
    // ล็อกเอาต์ + เคลียร์ค่าใน storage
    await logout();
    sessionStorage.removeItem("recaptcha");
    localStorage.removeItem("email");
    localStorage.removeItem("googleEmail");
    setLoggedIn(false);
    nav("/login"); // กลับไปหน้า Login
  }

  return (
    <AppBar position="sticky">
      <Toolbar className="flex justify-between">
        <Typography
          variant="h6"
          component={Link}
          to="/"
          className="no-underline text-white"
        >
          Mini Exchange
        </Typography>
        <Box className="flex gap-3 items-center">
          <Button color="primary" component={Link} to="/order">
            Order
          </Button>
          <Button color="primary" component={Link} to="/deposit">
            Deposit
          </Button>

          {loggedIn ? (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => nav("/account")}
              >
                Info / My Account
              </Button>
              <Button variant="outlined" color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button
                variant="outlined"
                color="primary"
                component={Link}
                to="/register"
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
