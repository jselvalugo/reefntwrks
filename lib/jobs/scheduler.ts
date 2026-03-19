import cron from "node-cron";
import { runRoasDropCheck, runBudgetPacingCheck } from "./alert-engine";

let initialized = false;

export function initScheduler() {
  if (initialized) return;
  initialized = true;

  // Nightly ROAS drop check at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("[scheduler] Running ROAS drop check...");
    try {
      await runRoasDropCheck();
      console.log("[scheduler] ROAS drop check complete.");
    } catch (err) {
      console.error("[scheduler] ROAS drop check error:", err);
    }
  });

  // Daily budget pacing check at 6:00 AM
  cron.schedule("0 6 * * *", async () => {
    console.log("[scheduler] Running budget pacing check...");
    try {
      await runBudgetPacingCheck();
      console.log("[scheduler] Budget pacing check complete.");
    } catch (err) {
      console.error("[scheduler] Budget pacing check error:", err);
    }
  });

  console.log("[scheduler] Jobs registered.");
}
