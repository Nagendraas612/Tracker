import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Tracker from "@/models/Tracker";
import { localStorageDB } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildSnapshot(trackers: any[]) {
  return {
    data: trackers,
    stats: {
      totalTrackers: trackers.length,
      activeMonitoring: trackers.filter((tracker) => tracker.enabled && tracker.status === "monitoring").length,
      targetsReached: trackers.filter((tracker) => tracker.status === "reached").length,
      notificationsSent: trackers.filter((tracker) => tracker.notificationSent).length,
    },
  };
}

async function getSnapshot() {
  const dbConn = await connectToDatabase();

  if (dbConn) {
    const trackers = await Tracker.find({}).sort({ createdAt: -1 }).lean();
    return buildSnapshot(trackers);
  }

  return buildSnapshot(localStorageDB.getTrackers());
}

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      let previousSnapshot = "";

      const close = () => {
        if (isClosed) return;
        isClosed = true;
        if (interval) clearInterval(interval);
        if (heartbeat) clearInterval(heartbeat);
        req.signal.removeEventListener("abort", close);
        try {
          controller.close();
        } catch {}
      };

      const enqueue = (chunk: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          close();
        }
      };

      const publish = async () => {
        if (isClosed) return;

        try {
          const snapshot = await getSnapshot();
          const serialized = JSON.stringify(snapshot);

          if (serialized !== previousSnapshot) {
            previousSnapshot = serialized;
            enqueue(`event: trackers\ndata: ${serialized}\n\n`);
          }
        } catch (error) {
          console.error("[Tracker Stream Error]:", error);
          enqueue(`event: error\ndata: ${JSON.stringify({ error: "Unable to read tracker updates" })}\n\n`);
        }
      };

      req.signal.addEventListener("abort", close);
      interval = setInterval(() => void publish(), 1000);
      heartbeat = setInterval(() => {
        enqueue(": heartbeat\n\n");
      }, 15000);

      void publish();
    },
    cancel() {
      isClosed = true;
      if (interval) clearInterval(interval);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
