'use client';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { DeploymentStatus } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader,
  Clock,
  GitBranch,
  Hash,
  Calendar,
  FileText,
  StopCircle,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function DeploymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const deploymentId = params.id as string;
  const queryClient = useQueryClient();

  const { data: deployment, isLoading } = useQuery({
    queryKey: ['deployment', deploymentId],
    queryFn: () => api.getDeployment(deploymentId),
    enabled: !!user && !!deploymentId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Refetch every 3 seconds if building or deploying
      if (
        data &&
        (data.status === DeploymentStatus.BUILDING ||
          data.status === DeploymentStatus.DEPLOYING ||
          data.status === DeploymentStatus.QUEUED)
      ) {
        return 3000;
      }
      return false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelDeployment(deploymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment', deploymentId] });
    },
  });

  const getStatusIcon = (status: DeploymentStatus) => {
    switch (status) {
      case DeploymentStatus.COMPLETED:
      case DeploymentStatus.READY:
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case DeploymentStatus.FAILED:
      case DeploymentStatus.CANCELLED:
        return <XCircle className="h-8 w-8 text-red-600" />;
      case DeploymentStatus.BUILDING:
      case DeploymentStatus.DEPLOYING:
        return <Loader className="h-8 w-8 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DeploymentStatus) => {
    switch (status) {
      case DeploymentStatus.COMPLETED:
      case DeploymentStatus.READY:
        return 'bg-green-100 text-green-700 border-green-200';
      case DeploymentStatus.FAILED:
      case DeploymentStatus.CANCELLED:
        return 'bg-red-100 text-red-700 border-red-200';
      case DeploymentStatus.BUILDING:
      case DeploymentStatus.DEPLOYING:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Deployment not found</h2>
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

  const canCancel =
    deployment.status === DeploymentStatus.QUEUED ||
    deployment.status === DeploymentStatus.BUILDING ||
    deployment.status === DeploymentStatus.DEPLOYING;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/projects/${deployment.projectId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </button>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {getStatusIcon(deployment.status)}
              <div>
                <h1 className="text-3xl font-bold mb-2">Deployment Details</h1>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                    deployment.status
                  )}`}
                >
                  {deployment.status}
                </span>
              </div>
            </div>
            {canCancel && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                <StopCircle className="h-4 w-4" />
                Cancel Deployment
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Details Card */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Commit Hash</div>
                  <div className="font-mono text-sm">{deployment.commitHash}</div>
                </div>
              </div>

              {deployment.commitMessage && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Commit Message</div>
                    <div className="text-sm">{deployment.commitMessage}</div>
                  </div>
                </div>
              )}

              {deployment.branch && (
                <div className="flex items-start gap-3">
                  <GitBranch className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Branch</div>
                    <div className="text-sm">{deployment.branch}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(deployment.createdAt))} ago
                  </div>
                </div>
              </div>

              {deployment.imageUri && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Image URI</div>
                    <div className="font-mono text-xs break-all">{deployment.imageUri}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Status Timeline</h2>
            <div className="space-y-4">
              <StatusTimelineItem
                status="QUEUED"
                label="Queued"
                active={deployment.status === DeploymentStatus.QUEUED}
                completed={
                  deployment.status !== DeploymentStatus.QUEUED &&
                  deployment.status !== DeploymentStatus.CANCELLED
                }
              />
              <StatusTimelineItem
                status="BUILDING"
                label="Building Image"
                active={deployment.status === DeploymentStatus.BUILDING}
                completed={
                  deployment.status === DeploymentStatus.COMPLETED ||
                  deployment.status === DeploymentStatus.DEPLOYING ||
                  deployment.status === DeploymentStatus.READY
                }
                failed={deployment.status === DeploymentStatus.FAILED}
              />
              <StatusTimelineItem
                status="COMPLETED"
                label="Build Completed"
                active={deployment.status === DeploymentStatus.COMPLETED}
                completed={
                  deployment.status === DeploymentStatus.DEPLOYING ||
                  deployment.status === DeploymentStatus.READY
                }
                failed={deployment.status === DeploymentStatus.FAILED}
              />
            </div>
          </div>
        </div>

        {/* Build Logs */}
        {deployment.buildLogs && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Build Logs</h2>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
              {deployment.buildLogs}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusTimelineItem({
  status,
  label,
  active,
  completed,
  failed,
}: {
  status: string;
  label: string;
  active?: boolean;
  completed?: boolean;
  failed?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          failed
            ? 'bg-red-100'
            : completed
            ? 'bg-green-100'
            : active
            ? 'bg-blue-100'
            : 'bg-gray-100'
        }`}
      >
        {failed ? (
          <XCircle className="h-5 w-5 text-red-600" />
        ) : completed ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : active ? (
          <Loader className="h-5 w-5 text-blue-600 animate-spin" />
        ) : (
          <Clock className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <div>
        <div className={`font-medium ${active ? 'text-blue-600' : 'text-gray-700'}`}>
          {label}
        </div>
        <div className="text-xs text-gray-500">{status}</div>
      </div>
    </div>
  );
}
