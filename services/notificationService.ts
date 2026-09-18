import axios from "axios";
import { ITracker } from "@/models/Tracker";

const NTFY_SERVER_URL = process.env.NTFY_SERVER_URL || "https://ntfy.sh";

export interface NotificationPayload {
  topic: string;
  title: string;
  message: string;
  priority?: "min" | "low" | "default" | "high" | "urgent" | 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  clickUrl?: string;
}

/**
 * Validates ntfy topic name format
 */
export function validateNtfyTopic(topic: string): { valid: boolean; message?: string } {
  if (!topic || typeof topic !== "string") {
    return { valid: false, message: "Topic name is required." };
  }
  const clean = topic.trim();
  if (clean.length < 4) {
    return { valid: false, message: "Topic name must be at least 4 characters long." };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
    return { valid: false, message: "Topic can only contain letters, numbers, hyphens, and underscores." };
  }
  return { valid: true };
}

/**
 * Sends a push notification to ntfy server
 */
export async function sendNtfyMessage(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  if (!payload.topic) {
    return { success: false, error: "Missing ntfy topic" };
  }

  const cleanTopic = payload.topic.trim();
  const url = `${NTFY_SERVER_URL.replace(/\/+$/, "")}/${cleanTopic}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      Title: payload.title,
      Priority: String(payload.priority || "high"),
    };

    if (payload.tags && payload.tags.length > 0) {
      headers["Tags"] = payload.tags.join(",");
    }

    if (payload.clickUrl) {
      headers["Click"] = payload.clickUrl;
    }

    const response = await axios.post(url, payload.message, {
      headers,
      timeout: 10000,
    });

    if (response.status === 200 || response.status === 201) {
      return { success: true };
    } else {
      return { success: false, error: `ntfy returned HTTP ${response.status}` };
    }
  } catch (err: any) {
    console.error(`[ntfy Notification Error] topic=${cleanTopic}:`, err.message);
    return { success: false, error: err.message || "Failed to send ntfy notification" };
  }
}

/**
 * Sends a threshold alert notification for a specific tracker
 */
export async function sendThresholdNotification(
  tracker: Partial<ITracker> & { psId: string; target: number },
  topic: string,
  currentSubmissions: number
): Promise<{ success: boolean; error?: string }> {
  const max = tracker.maximumSubmissions || 500;
  const titleText = tracker.title ? `\n\nProblem Statement:\n${tracker.title}` : "";

  const title = `🚨 SIH Submission Alert`;
  const message = `${tracker.psId} has reached your target!\n\nCurrent submissions: ${currentSubmissions}/${max}\nYour target: ${tracker.target}${titleText}`;

  return sendNtfyMessage({
    topic,
    title,
    message,
    priority: "high",
    tags: ["warning", "sih", "alert"],
    clickUrl: "https://sih.gov.in/sih2026PS",
  });
}

/**
 * Sends a test notification to verify user's ntfy setup
 */
export async function sendTestNotification(topic: string): Promise<{ success: boolean; error?: string }> {
  const title = `🔔 SIH Tracker Test Notification`;
  const message = `Success! Your ntfy notification setup is connected.\n\nYou will receive instant alerts when your tracked SIH 2026 Problem Statements reach your target submission counts.`;

  return sendNtfyMessage({
    topic,
    title,
    message,
    priority: "default",
    tags: ["white_check_mark", "tada", "sih"],
  });
}
