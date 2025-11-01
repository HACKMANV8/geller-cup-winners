import axios from 'axios';
import { Project, Deployment, CreateProjectInput, CreateDeploymentInput } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Projects
  getProjects: async (): Promise<Project[]> => {
    const { data } = await apiClient.get('/projects');
    return data.projects || data;
  },

  getProject: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get(`/projects/${id}`);
    return data.project || data;
  },

  getProjectDeployments: async (projectId: string): Promise<Deployment[]> => {
    // TODO: Implement when deployment API is ready
    const { data } = await apiClient.get(`/projects/${projectId}/deployments`);
    return data.deployments || [];
  },

  createProject: async (input: CreateProjectInput): Promise<Project> => {
    const { data } = await apiClient.post('/projects', input);
    return data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // Deployments
  getDeployment: async (id: string): Promise<Deployment> => {
    const { data } = await apiClient.get(`/deployments/${id}`);
    return data;
  },

  createDeployment: async (input: CreateDeploymentInput): Promise<Deployment> => {
    const { data } = await apiClient.post('/deployments', input);
    return data;
  },

  cancelDeployment: async (id: string): Promise<void> => {
    await apiClient.post(`/deployments/${id}/cancel`);
  },
};
