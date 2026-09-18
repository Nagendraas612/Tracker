import { NextResponse } from "next/server";
import { runMonitoringCycle, getLastCycleSummary } from "@/services/monitorService";

export async function GET() {
  const lastSummary = getLastCycleSummary();
  return NextResponse.json({
    success: true,
    system: {
      status: "online",
      monitoringWorker: "active",
      pollIntervalMs: Number(process.env.POLL_INTERVAL_MS) || 30000,
      demoMode: process.env.DEMO_MODE === "true",
      lastCycleSummary: lastSummary,
    },
  });
}

export async function POST(req: Request) {
  try {
    const summary = await runMonitoringCycle();
    return NextResponse.json({
      success: true,
      message: "Manual monitoring cycle triggered successfully.",
      summary,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
