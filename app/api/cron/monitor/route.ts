import { NextResponse } from "next/server";
import { runMonitoringCycle } from "@/services/monitorService";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds

export async function GET(req: Request) {
  try {
    const summary = await runMonitoringCycle();
    return NextResponse.json({
      success: true,
      message: "Monitoring cycle completed successfully.",
      data: summary,
    });
  } catch (err: any) {
    console.error("[Cron Monitor Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to execute monitoring cycle",
      },
      { status: 500 }
    );
  }
}
