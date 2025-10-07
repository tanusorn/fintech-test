import axios from "axios";
import { env } from "../config/env.js";

export async function verifyRecaptcha(token?: string) {
  if (!token) return false;
  try {
    const url = "https://www.google.com/recaptcha/api/siteverify";
    const res = await axios.post(url, null, {
      params: { secret: env.RECAPTCHA_SECRET, response: token },
    });
    return (
      !!res.data.success &&
      (res.data.score == undefined || res.data.score >= 0.5)
    );
  } catch (error) {
    return false;
  }
}
