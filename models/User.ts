import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  image?: string;
  ntfyTopic: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    image: { type: String },
    ntfyTopic: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
