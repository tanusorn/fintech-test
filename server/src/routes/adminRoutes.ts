import { Router } from "express";
import { authCheck } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { approveDeposit } from "../controller/adminController.js";

const r = Router();

r.post("/deposit/:id/approve", authCheck, requireRole("ADMIN"), approveDeposit);

export default r;
