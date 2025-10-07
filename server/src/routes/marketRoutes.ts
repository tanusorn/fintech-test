import { Router } from "express";
import { ticker } from "../controller/marketController.js";

const r = Router();
r.get("/ticker", ticker);

export default r;
