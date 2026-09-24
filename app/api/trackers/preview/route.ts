import { NextResponse } from "next/server";
import { getProblemStatement, normalizePsId, isValidPsIdFormat } from "@/services/sihScraper";

export const maxDuration = 60; // 60 seconds

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { psId: rawPsId } = body;

    if (!rawPsId || typeof rawPsId !== "string") {
      return NextResponse.json({ success: false, error: "Problem Statement ID is required." }, { status: 400 });
    }

    const psId = normalizePsId(rawPsId);

    if (!isValidPsIdFormat(psId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Problem Statement ID format. Must be e.g. SIH26171 or SIH26001.",
        },
        { status: 400 }
      );
    }

    const psData = await getProblemStatement(psId);

    if (!psData) {
      return NextResponse.json(
        {
          success: false,
          error: `Problem Statement ${psId} not found on the official SIH 2026 page.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: psData,
    });
  } catch (err: any) {
    console.error("[Tracker Preview API Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch PS preview" }, { status: 500 });
  }
}
