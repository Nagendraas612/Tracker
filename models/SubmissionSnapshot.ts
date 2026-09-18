import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubmissionSnapshot {
  _id?: string;
  trackerId: string;
  psId: string;
  count: number;
  recordedAt: Date;
}

const SubmissionSnapshotSchema = new Schema<ISubmissionSnapshot>(
  {
    trackerId: { type: String, required: true, index: true },
    psId: { type: String, required: true, index: true },
    count: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

const SubmissionSnapshot: Model<ISubmissionSnapshot> =
  mongoose.models.SubmissionSnapshot ||
  mongoose.model<ISubmissionSnapshot>("SubmissionSnapshot", SubmissionSnapshotSchema);

export default SubmissionSnapshot;
