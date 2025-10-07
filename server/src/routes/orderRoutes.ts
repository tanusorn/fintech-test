import { Router } from "express";
import { place } from "../controller/orderController.js";
import { authCheck } from "../middleware/auth.js";

const r = Router();

r.post("/", authCheck, place);

export default r;
