'use client';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Deployment, DeploymentStatus } from '@/types';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Rocket,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Play,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [showNewDeployment, setShowNewDeployment] = useState(false);

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!user && !!projectId,
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4" />
                  <span>{project.repoUrl}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Branch: {project.branch || 'main'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewDeployment(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Play className="h-4 w-4" />
              New Deployment
            </button>
          </div>
        </div>
      </header>

      {/* Deployments */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Deployment History</h2>

        {project.deployments && project.deployments.length > 0 ? (
          <div className="space-y-4">
            {project.deployments.map((deployment: Deployment) => (
              <DeploymentCard
                key={deployment._id}
                deployment={deployment}
                onClick={() => router.push(`/deployments/${deployment._id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Rocket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No deployments yet</h3>
            <p className="text-gray-600 mb-6">
              Trigger your first deployment to get started
            </p>
            <button
              onClick={() => setShowNewDeployment(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Play className="h-5 w-5" />
              Create Deployment
            </button>
          </div>
        )}
      </main>

      {/* New Deployment Modal */}
      {showNewDeployment && (
        <NewDeploymentModal
          projectId={projectId}
          onClose={() => setShowNewDeployment(false)}
          onSuccess={() => {
            setShowNewDeployment(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function DeploymentCard({
  deployment,
  onClick,
}: {
  deployment: Deployment;
  onClick: () => void;
}) {
  const getStatusIcon = (status: DeploymentStatus) => {
    switch (status) {
      case DeploymentStatus.COMPLETED:
      case DeploymentStatus.READY:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case DeploymentStatus.FAILED:
      case DeploymentStatus.CANCELLED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case DeploymentStatus.BUILDING:
      case DeploymentStatus.DEPLOYING:
        return <Loader className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DeploymentStatus) => {
    switch (status) {
      case DeploymentStatus.COMPLETED:
      case DeploymentStatus.READY:
        return 'bg-green-100 text-green-700';
      case DeploymentStatus.FAILED:
      case DeploymentStatus.CANCELLED:
        return 'bg-red-100 text-red-700';
      case DeploymentStatus.BUILDING:
      case DeploymentStatus.DEPLOYING:
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(deployment.status)}
          <div>
            <div className="font-mono text-sm text-gray-600">
              {deployment.commitHash.substring(0, 8)}
            </div>
            {deployment.commitMessage && (
              <div className="text-sm text-gray-500 mt-1">
                {deployment.commitMessage}
              </div>
            )}
          </div>
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
            deployment.status
          )}`}
        >
          {deployment.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{formatDistanceToNow(new Date(deployment.createdAt))} ago</span>
        </div>
        {deployment.branch && (
          <div className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            <span>{deployment.branch}</span>
          </div>
        )}
      </div>

      {deployment.imageUri && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-gray-500">Image: {deployment.imageUri}</div>
        </div>
      )}
    </div>
  );
}

function NewDeploymentModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [commitHash, setCommitHash] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('main');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      api.createDeployment({
        projectId,
        commitHash,
        commitMessage,
        branch,
      }),
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deployment';
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">New Deployment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Commit Hash</label>
            <input
              type="text"
              value={commitHash}
              onChange={(e) => setCommitHash(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="abc123def456 or 'main' for latest"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Commit Message (Optional)
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add new feature"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Branch</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="main"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {createMutation.isPending ? 'Deploying...' : 'Deploy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
