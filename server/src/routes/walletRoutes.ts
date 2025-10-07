import { Router } from "express";
import { myWallets } from "../controller/walletController.js";
import { authCheck } from "../middleware/auth.js";
const r = Router();

r.get("/me", authCheck, myWallets);

export default r;
