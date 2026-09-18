import fs from "fs";
import path from "path";
import { ITracker } from "@/models/Tracker";

export interface UserSettings {
  ntfyTopic: string;
  name: string;
  email: string;
}

export interface DBData {
  trackers: ITracker[];
  userSettings: UserSettings;
  snapshots: Array<{
    trackerId: string;
    psId: string;
    count: number;
    recordedAt: string;
  }>;
}

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "sih_tracker_data")
  : path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const defaultData: DBData = {
  trackers: [],
  userSettings: {
    ntfyTopic: "sanjay-sih-alert-7x92k4",
    name: "SIH Candidate",
    email: "user@sih-tracker.com",
  },
  snapshots: [],
};

function ensureDbExists(): DBData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("[Local Storage Error]:", err);
    return defaultData;
  }
}

function saveDb(data: DBData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Local Storage Save Error]:", err);
  }
}

export const localStorageDB = {
  getTrackers(): ITracker[] {
    const db = ensureDbExists();
    return db.trackers || [];
  },

  getTrackerById(id: string): ITracker | null {
    const trackers = this.getTrackers();
    return trackers.find((t) => t._id === id) || null;
  },

  getTrackerByPsId(psId: string): ITracker | null {
    const trackers = this.getTrackers();
    const cleanPsId = psId.trim().toUpperCase();
    return trackers.find((t) => t.psId.toUpperCase() === cleanPsId) || null;
  },

  createTracker(trackerData: Partial<ITracker>): ITracker {
    const db = ensureDbExists();
    const id = trackerData._id || `trk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const newTracker: ITracker = {
      _id: id,
      userId: trackerData.userId || "default-user",
      psId: trackerData.psId?.toUpperCase() || "",
      title: trackerData.title || "Problem Statement",
      organization: trackerData.organization || "SIH 2026",
      category: trackerData.category || "Software",
      theme: trackerData.theme || "General",
      target: trackerData.target || 50,
      currentSubmissions: trackerData.currentSubmissions || 0,
      maximumSubmissions: trackerData.maximumSubmissions || 500,
      status: trackerData.status || "monitoring",
      enabled: trackerData.enabled ?? true,
      notificationSent: trackerData.notificationSent ?? false,
      lastCheckedAt: trackerData.lastCheckedAt || now,
      lastNotificationAt: trackerData.lastNotificationAt,
      deadline: trackerData.deadline || "30 September 2026",
      createdAt: now,
      updatedAt: now,
    };

    db.trackers.unshift(newTracker);
    saveDb(db);
    return newTracker;
  },

  updateTracker(id: string, updates: Partial<ITracker>): ITracker | null {
    const db = ensureDbExists();
    const index = db.trackers.findIndex((t) => t._id === id);
    if (index === -1) return null;

    const existing = db.trackers[index];
    const updated: ITracker = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    db.trackers[index] = updated;
    saveDb(db);
    return updated;
  },

  deleteTracker(id: string): boolean {
    const db = ensureDbExists();
    const initialLength = db.trackers.length;
    db.trackers = db.trackers.filter((t) => t._id !== id);
    if (db.trackers.length !== initialLength) {
      saveDb(db);
      return true;
    }
    return false;
  },

  getUserSettings(): UserSettings {
    const db = ensureDbExists();
    return db.userSettings || defaultData.userSettings;
  },

  updateUserSettings(newSettings: Partial<UserSettings>): UserSettings {
    const db = ensureDbExists();
    db.userSettings = {
      ...db.userSettings,
      ...newSettings,
    };
    saveDb(db);
    return db.userSettings;
  },

  addSnapshot(trackerId: string, psId: string, count: number): void {
    const db = ensureDbExists();
    if (!db.snapshots) db.snapshots = [];
    db.snapshots.push({
      trackerId,
      psId,
      count,
      recordedAt: new Date().toISOString(),
    });
    // Keep max 500 snapshots
    if (db.snapshots.length > 500) {
      db.snapshots = db.snapshots.slice(-500);
    }
    saveDb(db);
  },
};
