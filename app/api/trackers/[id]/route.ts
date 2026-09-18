import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Tracker from "@/models/Tracker";
import User from "@/models/User";
import { sendThresholdNotification } from "@/services/notificationService";
import { localStorageDB } from "@/lib/storage";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { target: targetInput, enabled } = body;

    const dbConn = await connectToDatabase();

    let tracker: any = null;
    if (dbConn) {
      tracker = await Tracker.findById(id);
    } else {
      tracker = localStorageDB.getTrackerById(id);
    }

    if (!tracker) {
      return NextResponse.json({ success: false, error: "Tracker not found." }, { status: 404 });
    }

    if (typeof enabled === "boolean") {
      tracker.enabled = enabled;
      if (!enabled) {
        tracker.status = "disabled";
      } else {
        tracker.status = tracker.currentSubmissions >= tracker.target ? "reached" : "monitoring";
      }
    }

    if (targetInput !== undefined) {
      const newTarget = Number(targetInput);
      if (isNaN(newTarget) || !Number.isInteger(newTarget) || newTarget <= 0) {
        return NextResponse.json(
          { success: false, error: "Target must be a positive whole integer." },
          { status: 400 }
        );
      }

      if (newTarget > tracker.maximumSubmissions) {
        return NextResponse.json(
          { success: false, error: `Target cannot exceed maximum capacity of ${tracker.maximumSubmissions}.` },
          { status: 400 }
        );
      }

      tracker.target = newTarget;

      if (newTarget > tracker.currentSubmissions) {
        tracker.notificationSent = false;
        tracker.status = tracker.enabled ? "monitoring" : "disabled";
      } else if (newTarget <= tracker.currentSubmissions && tracker.enabled) {
        tracker.status = "reached";
        if (!tracker.notificationSent) {
          const ntfyTopic = localStorageDB.getUserSettings().ntfyTopic || "sanjay-sih-alert-7x92k4";
          const notifResult = await sendThresholdNotification(tracker, ntfyTopic, tracker.currentSubmissions);
          if (notifResult.success) {
            tracker.notificationSent = true;
            tracker.lastNotificationAt = new Date();
          }
        }
      }
    }

    if (dbConn && tracker.save) {
      await tracker.save();
    } else {
      localStorageDB.updateTracker(id, tracker);
    }

    return NextResponse.json({
      success: true,
      data: tracker,
    });
  } catch (err: any) {
    console.error("[Update Tracker Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to update tracker" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const dbConn = await connectToDatabase();

    let deleted = false;
    if (dbConn) {
      const result = await Tracker.deleteOne({ _id: id });
      deleted = result.deletedCount > 0;
    } else {
      deleted = localStorageDB.deleteTracker(id);
    }

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Tracker not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Tracker removed successfully.",
    });
  } catch (err: any) {
    console.error("[Delete Tracker Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to remove tracker" }, { status: 500 });
  }
}
