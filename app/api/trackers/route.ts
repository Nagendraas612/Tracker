import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";

export const maxDuration = 60; // 60 seconds
import Tracker from "@/models/Tracker";
import User from "@/models/User";
import { getProblemStatement, normalizePsId, isValidPsIdFormat } from "@/services/sihScraper";
import { sendThresholdNotification } from "@/services/notificationService";
import { localStorageDB } from "@/lib/storage";

export async function GET() {
  try {
    const userId = "default-user";
    const dbConn = await connectToDatabase();

    let trackers: any[] = [];
    if (dbConn) {
      trackers = await Tracker.find({}).sort({ createdAt: -1 });
    } else {
      trackers = localStorageDB.getTrackers();
    }

    const totalTrackers = trackers.length;
    const activeMonitoring = trackers.filter((t) => t.enabled && t.status === "monitoring").length;
    const targetsReached = trackers.filter((t) => t.status === "reached").length;
    const notificationsSent = trackers.filter((t) => t.notificationSent).length;

    return NextResponse.json({
      success: true,
      data: trackers,
      stats: {
        totalTrackers,
        activeMonitoring,
        targetsReached,
        notificationsSent,
      },
    });
  } catch (err: any) {
    console.error("[Get Trackers API Error]:", err);
    // Fallback to local storage
    const trackers = localStorageDB.getTrackers();
    return NextResponse.json({
      success: true,
      data: trackers,
      stats: {
        totalTrackers: trackers.length,
        activeMonitoring: trackers.filter((t) => t.enabled && t.status === "monitoring").length,
        targetsReached: trackers.filter((t) => t.status === "reached").length,
        notificationsSent: trackers.filter((t) => t.notificationSent).length,
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const userId = "default-user";
    const body = await req.json();
    const { psId: rawPsId, target: targetInput } = body;

    if (!rawPsId || typeof rawPsId !== "string") {
      return NextResponse.json({ success: false, error: "Problem Statement ID is required." }, { status: 400 });
    }

    const psId = normalizePsId(rawPsId);

    if (!isValidPsIdFormat(psId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Problem Statement ID format. Example: SIH26171" },
        { status: 400 }
      );
    }

    const target = Number(targetInput);
    if (isNaN(target) || !Number.isInteger(target) || target <= 0) {
      return NextResponse.json(
        { success: false, error: "Threshold target must be a positive whole integer." },
        { status: 400 }
      );
    }

    const dbConn = await connectToDatabase();

    // Check duplicate tracker
    let existingTracker = null;
    if (dbConn) {
      existingTracker = await Tracker.findOne({ psId });
    } else {
      existingTracker = localStorageDB.getTrackerByPsId(psId);
    }

    if (existingTracker) {
      return NextResponse.json(
        {
          success: false,
          error: `You are already tracking ${psId}. You can edit your existing tracker threshold on the dashboard.`,
        },
        { status: 400 }
      );
    }

    // Fetch live SIH data
    const psData = await getProblemStatement(psId);

    if (!psData) {
      return NextResponse.json(
        { success: false, error: `Problem Statement ${psId} not found on the official SIH 2026 website.` },
        { status: 404 }
      );
    }

    if (target > psData.maximum) {
      return NextResponse.json(
        {
          success: false,
          error: `Target threshold (${target}) cannot exceed maximum allowed limit of ${psData.maximum}.`,
        },
        { status: 400 }
      );
    }

    const currentSubmissions = psData.submitted;
    const isTargetAlreadyReached = currentSubmissions >= target;

    let notificationSent = false;
    let status: "monitoring" | "reached" = isTargetAlreadyReached ? "reached" : "monitoring";
    let lastNotificationAt: Date | undefined;

    // Get user ntfy topic
    let ntfyTopic = localStorageDB.getUserSettings().ntfyTopic || "sanjay-sih-alert-7x92k4";
    if (dbConn) {
      const userDoc = await User.findOne({ email: "user@sih-tracker.com" });
      if (userDoc?.ntfyTopic) ntfyTopic = userDoc.ntfyTopic;
    }

    // Trigger immediate alert if already reached
    if (isTargetAlreadyReached && ntfyTopic) {
      const notifResult = await sendThresholdNotification(
        {
          psId,
          target,
          maximumSubmissions: psData.maximum,
          title: psData.title,
        },
        ntfyTopic,
        currentSubmissions
      );

      if (notifResult.success) {
        notificationSent = true;
        lastNotificationAt = new Date();
      }
    }

    // Save tracker
    let newTracker: any = null;
    if (dbConn) {
      newTracker = await Tracker.create({
        userId,
        psId,
        title: psData.title,
        organization: psData.organization,
        category: psData.category,
        theme: psData.theme,
        target,
        currentSubmissions,
        maximumSubmissions: psData.maximum,
        status,
        enabled: true,
        notificationSent,
        lastCheckedAt: new Date(),
        lastNotificationAt,
        deadline: psData.deadline,
      });
    } else {
      newTracker = localStorageDB.createTracker({
        userId,
        psId,
        title: psData.title,
        organization: psData.organization,
        category: psData.category,
        theme: psData.theme,
        target,
        currentSubmissions,
        maximumSubmissions: psData.maximum,
        status,
        enabled: true,
        notificationSent,
        lastCheckedAt: new Date(),
        lastNotificationAt,
        deadline: psData.deadline,
      });
    }

    return NextResponse.json({
      success: true,
      data: newTracker,
      message: isTargetAlreadyReached
        ? "Tracker created! Target was already reached and an alert was sent to your phone."
        : "Tracker created successfully and monitoring started.",
    });
  } catch (err: any) {
    console.error("[Create Tracker Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to create tracker" }, { status: 500 });
  }
}
