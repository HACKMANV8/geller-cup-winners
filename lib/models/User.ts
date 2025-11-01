import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  uid: string; // Firebase UID
  email: string;
  displayName: string;
  photoURL?: string;
  provider?: string; // 'email' or 'github'
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    photoURL: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: ["email", "github"],
      default: "email",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create compound index for faster queries
UserSchema.index({ uid: 1, email: 1 });

// Prevent model recompilation in development
const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default UserModel;

