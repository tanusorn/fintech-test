import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
});
// ใส่ JWT และ Recaptcha token (ถ้ามี)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const rct = sessionStorage.getItem("recaptcha");
  if (rct) config.headers["X-ReCaptcha-Token"] = rct;
  return config;
});
