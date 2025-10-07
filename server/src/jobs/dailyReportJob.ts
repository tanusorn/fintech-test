import { buildDailyReport } from "../services/reportService.js";
export async function runDailyReport() {
  await buildDailyReport();
}
