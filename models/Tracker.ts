import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITracker {
  _id?: string;
  userId: string;
  psId: string;
  title: string;
  organization: string;
  category: string;
  theme: string;
  target: number;
  currentSubmissions: number;
  maximumSubmissions: number;
  status: "monitoring" | "reached" | "error" | "disabled";
  enabled: boolean;
  notificationSent: boolean;
  lastCheckedAt: Date;
  lastNotificationAt?: Date;
  deadline?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TrackerSchema = new Schema<ITracker>(
  {
    userId: { type: String, required: true, index: true },
    psId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    organization: { type: String, default: "SIH 2026" },
    category: { type: String, default: "Software" },
    theme: { type: String, default: "General" },
    target: { type: Number, required: true, min: 1 },
    currentSubmissions: { type: Number, required: true, default: 0 },
    maximumSubmissions: { type: Number, required: true, default: 500 },
    status: {
      type: String,
      enum: ["monitoring", "reached", "error", "disabled"],
      default: "monitoring",
    },
    enabled: { type: Boolean, default: true, index: true },
    notificationSent: { type: Boolean, default: false },
    lastCheckedAt: { type: Date, default: Date.now },
    lastNotificationAt: { type: Date },
    deadline: { type: String },
  },
  { timestamps: true }
);

// Compound index to quickly query active trackers
TrackerSchema.index({ enabled: 1, status: 1 });
TrackerSchema.index({ userId: 1, psId: 1 }, { unique: true });

const Tracker: Model<ITracker> = mongoose.models.Tracker || mongoose.model<ITracker>("Tracker", TrackerSchema);
export default Tracker;
