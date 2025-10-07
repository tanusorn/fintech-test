import { RequestHandler } from "express";
import * as svc from "../services/authService.js";
import { schemas } from "../utils/validation.js";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { error, value } = schemas.register.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const user = await svc.register(value.email, value.password);
    res.json({ user });
  } catch (e) {
    next(e);
  }
};
export const login: RequestHandler = async (req, res, next) => {
  try {
    const { error, value } = schemas.login.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const r = await svc.login(value.email, value.password);
    res.json(r);
  } catch (e) {
    next(e);
  }
};

export const loginWithGoogle: RequestHandler = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "idToken required" });
    const r = await svc.googleLogin(idToken);
    res.json(r);
  } catch (e) {
    next(e);
  }
};
