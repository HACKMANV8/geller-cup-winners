import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IGitHubToken extends Document {
  userId: string;
  accessToken: string;
  tokenType?: string;
  scope?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GitHubTokenSchema = new Schema<IGitHubToken>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    tokenType: {
      type: String,
      default: 'bearer',
    },
    scope: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
const GitHubTokenModel: Model<IGitHubToken> = 
  mongoose.models.GitHubToken || mongoose.model<IGitHubToken>('GitHubToken', GitHubTokenSchema);

export default GitHubTokenModel;
