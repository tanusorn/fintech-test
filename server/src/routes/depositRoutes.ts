import { Router } from "express";
import { authCheck } from "../middleware/auth.js";
import { createDeposit } from "../controller/depositController.js";

const r = Router();

r.post("/", authCheck, createDeposit);
export default r;
