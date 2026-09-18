import { NextResponse } from "next/server";
import { sendTestNotification, validateNtfyTopic } from "@/services/notificationService";
import { localStorageDB } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    let topic = "";

    try {
      const body = await req.json();
      if (body?.topic) topic = body.topic.trim();
    } catch (e) {
      // Body optional
    }

    if (!topic) {
      topic = localStorageDB.getUserSettings().ntfyTopic || "sanjay-sih-alert-7x92k4";
    }

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Please configure an ntfy topic first before testing notifications." },
        { status: 400 }
      );
    }

    const validation = validateNtfyTopic(topic);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
    }

    const result = await sendTestNotification(topic);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test notification successfully dispatched to ntfy topic: "${topic}". Check your phone!`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to deliver test notification to ntfy topic "${topic}": ${result.error}`,
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[Test Notification API Error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
