import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { validateNtfyTopic } from "@/services/notificationService";
import { localStorageDB } from "@/lib/storage";

export async function GET() {
  try {
    const dbConn = await connectToDatabase();

    let settings = localStorageDB.getUserSettings();
    if (dbConn) {
      let user = await User.findOne({ email: "user@sih-tracker.com" });
      if (!user) {
        user = await User.create({
          name: "SIH Candidate",
          email: "user@sih-tracker.com",
          ntfyTopic: settings.ntfyTopic || "sanjay-sih-alert-7x92k4",
        });
      }
      return NextResponse.json({
        success: true,
        data: {
          topic: user.ntfyTopic,
          email: user.email,
          name: user.name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        topic: settings.ntfyTopic,
        email: settings.email,
        name: settings.name,
      },
    });
  } catch (err: any) {
    console.error("[Get Notification Settings Error]:", err);
    const settings = localStorageDB.getUserSettings();
    return NextResponse.json({
      success: true,
      data: {
        topic: settings.ntfyTopic,
        email: settings.email,
        name: settings.name,
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic: rawTopic } = body;

    const topic = rawTopic ? rawTopic.trim() : "";
    const validation = validateNtfyTopic(topic);

    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
    }

    const dbConn = await connectToDatabase();

    // Update local storage
    localStorageDB.updateUserSettings({ ntfyTopic: topic });

    if (dbConn) {
      let user = await User.findOne({ email: "user@sih-tracker.com" });
      if (!user) {
        await User.create({
          name: "SIH Candidate",
          email: "user@sih-tracker.com",
          ntfyTopic: topic,
        });
      } else {
        user.ntfyTopic = topic;
        await user.save();
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        topic,
      },
      message: "Notification settings updated successfully.",
    });
  } catch (err: any) {
    console.error("[Update Notification Settings Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
