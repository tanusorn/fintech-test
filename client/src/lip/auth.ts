import { api } from "./api";

function announceAuthChange() {
  window.dispatchEvent(new Event("auth-changed"));
}

export async function register(email: string, password: string) {
  const r = await api.post("/api/auth/register", { email, password });
  return r.data;
}

export async function login(email: string, password: string) {
  const r = await api.post("/api/auth/login", { email, password });
  localStorage.setItem("access", r.data.access);
  localStorage.setItem("refresh", r.data.refresh);
  localStorage.setItem("email", email);
  announceAuthChange();
  return r.data;
}

export async function googleLogin(idToken: string) {
  const r = await api.post("/api/auth/google", { idToken });
  localStorage.setItem("access", r.data.access);
  localStorage.setItem("refresh", r.data.refresh);
  localStorage.setItem("googleEmail", r.data.email || "google_user");
  announceAuthChange();
}

export async function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("email");
  localStorage.removeItem("googleEmail");
  sessionStorage.removeItem("recaptcha");
  announceAuthChange();
}
