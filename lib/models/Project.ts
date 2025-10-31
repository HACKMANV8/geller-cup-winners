import mongoose, { Schema, Model, Document } from "mongoose";

export interface IProject extends Document {
  userId: string;
  name: string;
  repoUrl: string;
  branch?: string;
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    repoUrl: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      default: "main",
    },
    url: {
      type: String,
      default: "test.ghstmail.me",
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
ProjectSchema.index({ userId: 1, createdAt: -1 });

// Prevent model recompilation in development
const ProjectModel: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default ProjectModel;
