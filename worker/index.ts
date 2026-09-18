import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { runMonitoringCycle } from "../services/monitorService";

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 30000;
let isRunning = true;

async function startWorker() {
  console.log(`
======================================================
🚀 SIH TRACKER MONITORING WORKER INITIALIZED
======================================================
Source URL:       https://sih.gov.in/sih2026PS
Polling Interval: ${POLL_INTERVAL_MS / 1000}s (${POLL_INTERVAL_MS}ms)
Demo Mode:        ${process.env.DEMO_MODE === "true" ? "ENABLED (Testing Mode)" : "DISABLED (Live Production Mode)"}
Database:         ${process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sih_tracker"}
======================================================
  `);

  while (isRunning) {
    const cycleStart = Date.now();
    try {
      console.log(`\n[${new Date().toISOString()}] 🔍 Starting SIH monitoring cycle...`);
      const summary = await runMonitoringCycle();

      if (summary.sihFetchError) {
        console.warn(`[${new Date().toISOString()}] ⚠️ SIH Fetch Note: ${summary.sihFetchError}`);
      }
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] ❌ Error in monitoring loop:`, err.message);
    }

    const elapsed = Date.now() - cycleStart;
    const sleepTime = Math.max(1000, POLL_INTERVAL_MS - elapsed);

    console.log(`[${new Date().toISOString()}] 💤 Sleeping for ${(sleepTime / 1000).toFixed(1)}s until next cycle...`);
    await new Promise((res) => setTimeout(res, sleepTime));
  }
}

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("\n[Worker] Received SIGINT signal. Shutting down worker gracefully...");
  isRunning = false;
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[Worker] Received SIGTERM signal. Shutting down worker gracefully...");
  isRunning = false;
  process.exit(0);
});

startWorker();
