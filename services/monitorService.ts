import connectToDatabase from "@/lib/mongodb";
import Tracker, { ITracker } from "@/models/Tracker";
import User from "@/models/User";
import SubmissionSnapshot from "@/models/SubmissionSnapshot";
import { fetchAllProblemStatements, PSData } from "./sihScraper";
import { sendThresholdNotification } from "./notificationService";
import { localStorageDB } from "@/lib/storage";

export interface CycleSummary {
  timestamp: Date;
  totalTrackers: number;
  evaluated: number;
  notificationsSent: number;
  errors: number;
  fromCache: boolean;
  sihFetchError?: string;
  psCount: number;
  storageEngine: "MongoDB" | "LocalStorageJSON";
}

let isCycleRunning = false;
let lastCycleSummary: CycleSummary | null = null;

export function getLastCycleSummary(): CycleSummary | null {
  return lastCycleSummary;
}

/**
 * Executes one complete monitoring cycle across all active trackers.
 * Supports both MongoDB and Local JSON File Storage fallback.
 */
export async function runMonitoringCycle(): Promise<CycleSummary> {
  if (isCycleRunning) {
    console.log("[MonitorWorker] Cycle already in progress, skipping duplicate execution.");
    return lastCycleSummary || {
      timestamp: new Date(),
      totalTrackers: 0,
      evaluated: 0,
      notificationsSent: 0,
      errors: 0,
      fromCache: false,
      psCount: 0,
      storageEngine: "LocalStorageJSON",
    };
  }

  isCycleRunning = true;
  const startTime = new Date();
  let notificationsSentCount = 0;
  let evaluatedCount = 0;
  let errorCount = 0;

  try {
    // 1. Try connecting to MongoDB or fall back to local JSON DB
    const dbConn = await connectToDatabase().catch(() => null);
    const useMongoDB = !!dbConn;
    const storageEngine = useMongoDB ? "MongoDB" : "LocalStorageJSON";

    if (!useMongoDB) {
      // Quietly fall back to local storage
    }

    // 2. Fetch live SIH data ONCE
    const sihResult = await fetchAllProblemStatements();
    const { psMap, fromCache, error: sihFetchError } = sihResult;

    if (sihFetchError) {
      console.warn("[MonitorWorker] SIH Fetch Warning:", sihFetchError);
    }

    // 3. Fetch active trackers from appropriate storage engine
    let activeTrackers: ITracker[] = [];
    const userTopicsMap = new Map<string, string>();

    if (useMongoDB) {
      activeTrackers = await Tracker.find({ enabled: true });
      const userIds = Array.from(new Set(activeTrackers.map((t) => t.userId)));
      const users = await User.find({ _id: { $in: userIds } });
      users.forEach((u) => {
        if (u.ntfyTopic) {
          userTopicsMap.set(u._id.toString(), u.ntfyTopic);
          userTopicsMap.set(u.email, u.ntfyTopic);
        }
      });
    } else {
      activeTrackers = localStorageDB.getTrackers().filter((t) => t.enabled);
      const settings = localStorageDB.getUserSettings();
      if (settings.ntfyTopic) {
        userTopicsMap.set("default-user", settings.ntfyTopic);
      }
    }

    const totalTrackers = activeTrackers.length;

    if (totalTrackers === 0) {
      const summary: CycleSummary = {
        timestamp: startTime,
        totalTrackers: 0,
        evaluated: 0,
        notificationsSent: 0,
        errors: 0,
        fromCache,
        sihFetchError,
        psCount: psMap.size,
        storageEngine,
      };
      lastCycleSummary = summary;
      return summary;
    }

    // Default fallback topic if user hasn't configured one yet
    const globalDefaultTopic = localStorageDB.getUserSettings().ntfyTopic || "sanjay-sih-alert-7x92k4";

    // 4. Evaluate each tracker against live SIH counts
    for (const tracker of activeTrackers) {
      evaluatedCount++;
      const psData: PSData | undefined = psMap.get(tracker.psId.toUpperCase());

      if (psData) {
        tracker.currentSubmissions = psData.submitted;
        tracker.maximumSubmissions = psData.maximum;
        tracker.lastCheckedAt = startTime;
        if (psData.title && (!tracker.title || tracker.title.startsWith("Problem Statement"))) {
          tracker.title = psData.title;
        }

        // Record snapshot
        if (useMongoDB) {
          try {
            await SubmissionSnapshot.create({
              trackerId: tracker._id ? tracker._id.toString() : "id",
              psId: tracker.psId,
              count: psData.submitted,
              recordedAt: startTime,
            });
          } catch (snapErr) {}
        } else {
          localStorageDB.addSnapshot(tracker._id || "id", tracker.psId, psData.submitted);
        }

        // 5. Threshold check logic
        if (tracker.currentSubmissions >= tracker.target) {
          if (!tracker.notificationSent) {
            const userTopic = userTopicsMap.get(tracker.userId) || globalDefaultTopic;

            console.log(
              `[MonitorWorker] 🚨 THRESHOLD REACHED for ${tracker.psId}! Current: ${tracker.currentSubmissions}, Target: ${tracker.target}. Sending ntfy to topic: ${userTopic}...`
            );

            const notifResult = await sendThresholdNotification(
              tracker,
              userTopic,
              tracker.currentSubmissions
            );

            if (notifResult.success) {
              tracker.notificationSent = true;
              tracker.status = "reached";
              tracker.lastNotificationAt = new Date();
              notificationsSentCount++;
              console.log(`[MonitorWorker] ✅ Notification delivered to topic ${userTopic} for ${tracker.psId}`);
            } else {
              console.error(
                `[MonitorWorker] ❌ Failed to send notification for ${tracker.psId}: ${notifResult.error}. Will retry next cycle.`
              );
              errorCount++;
            }
          } else {
            tracker.status = "reached";
          }
        } else {
          tracker.status = "monitoring";
        }
      } else {
        if (!sihFetchError) {
          console.warn(`[MonitorWorker] Tracker ${tracker.psId} not found in SIH table data.`);
        }
        tracker.lastCheckedAt = startTime;
      }

      // Save updated tracker state back to database
      if (useMongoDB && tracker._id) {
        await Tracker.updateOne({ _id: tracker._id }, tracker);
      } else if (tracker._id) {
        localStorageDB.updateTracker(tracker._id, tracker);
      }
    }

    const summary: CycleSummary = {
      timestamp: startTime,
      totalTrackers,
      evaluated: evaluatedCount,
      notificationsSent: notificationsSentCount,
      errors: errorCount,
      fromCache,
      sihFetchError,
      psCount: psMap.size,
      storageEngine,
    };

    lastCycleSummary = summary;
    console.log(
      `[MonitorWorker Cycle Done] [Storage: ${storageEngine}] Parsed ${psMap.size} PSs | Evaluated ${evaluatedCount}/${totalTrackers} trackers | Alerts Sent: ${notificationsSentCount}`
    );
    return summary;
  } catch (err: any) {
    console.error("[MonitorWorker Error]:", err.message);
    const summary: CycleSummary = {
      timestamp: startTime,
      totalTrackers: 0,
      evaluated: 0,
      notificationsSent: 0,
      errors: 1,
      fromCache: false,
      sihFetchError: err.message,
      psCount: 0,
      storageEngine: "LocalStorageJSON",
    };
    lastCycleSummary = summary;
    return summary;
  } finally {
    isCycleRunning = false;
  }
}
