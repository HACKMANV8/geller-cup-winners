import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IFile extends Document {
  userId: string;
  projectId: string;
  filename: string;
  filepath: string;
  content: string;
  size: number;
  mimeType: string;
  encoding?: string;
  githubUrl?: string;
  branch?: string;
  commitSha?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'text/plain',
    },
    encoding: {
      type: String,
      default: 'utf-8',
    },
    githubUrl: {
      type: String,
    },
    branch: {
      type: String,
    },
    commitSha: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
FileSchema.index({ userId: 1, projectId: 1 });
FileSchema.index({ projectId: 1, filepath: 1 }, { unique: true });

// Prevent model recompilation in development
const FileModel: Model<IFile> = 
  mongoose.models.File || mongoose.model<IFile>('File', FileSchema);

export default FileModel;
