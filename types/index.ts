export enum DeploymentStatus {
  QUEUED = 'QUEUED',
  BUILDING = 'BUILDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DEPLOYING = 'DEPLOYING',
  READY = 'READY',
  CANCELLED = 'CANCELLED',
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface Project {
  _id: string;
  name: string;
  repoUrl: string;
  branch?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deployments?: Deployment[];
}

export interface Deployment {
  _id: string;
  projectId: string;
  commitHash: string;
  commitMessage?: string;
  branch?: string;
  status: DeploymentStatus;
  imageUri?: string;
  buildLogs?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  repoUrl: string;
  branch?: string;
}

export interface CreateDeploymentInput {
  projectId: string;
  commitHash: string;
  commitMessage?: string;
  branch?: string;
}
