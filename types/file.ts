export interface FileData {
  filename: string;
  filepath: string;
  content: string;
  size: number;
  mimeType?: string;
  encoding?: string;
  githubUrl?: string;
  branch?: string;
  commitSha?: string;
}

export interface StoredFile extends FileData {
  _id: string;
  userId: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  avgSize: number;
  mimeTypes: string[];
}
