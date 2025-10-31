'use client';

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Settings, 
  GitBranch, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Globe,
  TrendingUp,
  Users,
  Eye,
  BarChart3,
  Trash2,
  Key,
  Bell,
  Loader
} from 'lucide-react';

// Types
type DeploymentStatus = 'success' | 'failed' | 'building';

type Deployment = {
  id: string;
  status: DeploymentStatus;
  branch: string;
  commit: string;
  commitHash: string;
  url: string | null;
  timestamp: string;
  duration: string;
  creator: string;
};

type Project = {
  id: string;
  name: string;
  repository: string;
  branch: string;
  domain: string;
  framework: string;
  lastDeployed: string;
  status: string;
};

type Analytics = {
  visitors: {
    total: number;
    change: string;
    data: number[];
  };
  pageviews: {
    total: number;
    change: string;
    data: number[];
  };
  topPages: Array<{ path: string; views: number; percentage: number }>;
  countries: Array<{ name: string; views: number; percentage: number }>;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch project data (replace with your API)
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      // Replace with: return api.getProject(projectId);
      throw new Error('Connect to backend');
    },
    enabled: false // Set to true when backend is ready
  });

  // Fetch deployments (replace with your API)
  const { data: deployments, isLoading: deploymentsLoading } = useQuery<Deployment[]>({
    queryKey: ['deployments', projectId],
    queryFn: async () => {
      // Replace with: return api.getDeployments(projectId);
      throw new Error('Connect to backend');
    },
    enabled: false // Set to true when backend is ready
  });

  // Fetch analytics (replace with your API)
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['analytics', projectId],
    queryFn: async () => {
      // Replace with: return api.getAnalytics(projectId);
      throw new Error('Connect to backend');
    },
    enabled: false // Set to true when backend is ready
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'deployments', label: 'Deployments', icon: GitBranch },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-100 mb-2">Project not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-400 hover:text-blue-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <span 
              onClick={() => router.push('/dashboard')}
              className="hover:text-gray-200 cursor-pointer"
            >
              Projects
            </span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-200">{project.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">{project.name}</h1>
              <div className="flex items-center gap-4 text-sm">
                <a 
                  href={`https://${project.domain}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition"
                >
                  <Globe className="h-4 w-4" />
                  {project.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex items-center gap-2 text-gray-400">
                  <GitBranch className="h-4 w-4" />
                  {project.repository}
                </div>
              </div>
            </div>
            <a
              href={`https://${project.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Visit
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-6">
          <div className="flex gap-6 border-b border-gray-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <OverviewTab 
            project={project} 
            deployments={deployments || []} 
            loading={deploymentsLoading}
          />
        )}
        {activeTab === 'deployments' && (
          <DeploymentsTab 
            deployments={deployments || []} 
            loading={deploymentsLoading}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            analytics={analytics} 
            loading={analyticsLoading}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab project={project} />
        )}
      </main>
    </div>
  );
}

// === Tabs ===

function OverviewTab({ project, deployments, loading }: { 
  project: Project; 
  deployments: Deployment[];
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Production Deployment</h2>
          <span className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            {project.status === 'active' ? 'Ready' : project.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Domain</div>
              <a 
                href={`https://${project.domain}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
              >
                {project.domain}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Branch</div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                {project.branch}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Last deployed</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {project.lastDeployed}
              </div>
            </div>
          </div>
          <a
            href={`https://${project.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Visit
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <StatCard title="Total Deployments" value={deployments.length} change="" positive />
        <StatCard title="Success Rate" value="—" change="" positive />
        <StatCard title="Avg Build Time" value="—" change="" positive />
      </div>

      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Deployments</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : deployments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No deployments yet
          </div>
        ) : (
          <div className="space-y-3">
            {deployments.slice(0, 3).map((deployment) => (
              <DeploymentRow key={deployment.id} deployment={deployment} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeploymentsTab({ deployments, loading }: { 
  deployments: Deployment[];
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Deployments</h2>
        <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium">
          Trigger Deploy
        </button>
      </div>

      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : deployments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No deployments yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {deployments.map((deployment) => (
              <DeploymentRow key={deployment.id} deployment={deployment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsTab({ analytics, loading }: { 
  analytics?: Analytics;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-600" />
        <h3 className="text-lg font-semibold mb-2">No analytics data</h3>
        <p className="text-gray-400">Analytics will appear once your project receives traffic</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Analytics</h2>
        <p className="text-gray-400">Last 7 days</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <MetricCard
          title="Visitors"
          value={analytics.visitors.total.toLocaleString()}
          change={analytics.visitors.change}
          icon={Users}
          data={analytics.visitors.data}
        />
        <MetricCard
          title="Page Views"
          value={analytics.pageviews.total.toLocaleString()}
          change={analytics.pageviews.change}
          icon={Eye}
          data={analytics.pageviews.data}
        />
      </div>

      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
        <div className="space-y-4">
          {analytics.topPages.map((page, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm">{page.path}</span>
                  <span className="text-sm text-gray-400">{page.views.toLocaleString()} views</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${page.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
        <div className="space-y-4">
          {analytics.countries.map((country, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{country.name}</span>
                  <span className="text-sm text-gray-400">{country.views.toLocaleString()} views</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${country.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ project }: { project: Project }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <SettingSection title="General" description="Basic project information and configuration">
        <SettingItem label="Project Name" value={project.name} />
        <SettingItem label="Framework" value={project.framework} />
        <SettingItem label="Branch" value={project.branch} />
      </SettingSection>

      <SettingSection title="Environment Variables" description="Manage environment variables for your project" icon={Key}>
        <div className="space-y-3">
          <div className="text-center py-8 text-gray-400">
            No environment variables configured
          </div>
          <button className="w-full p-3 border border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-gray-200 hover:border-gray-600 transition text-sm">
            + Add Environment Variable
          </button>
        </div>
      </SettingSection>

      <SettingSection title="Notifications" description="Configure deployment and error notifications" icon={Bell}>
        <div className="space-y-3">
          <ToggleItem label="Email on successful deployment" enabled />
          <ToggleItem label="Email on failed deployment" enabled />
          <ToggleItem label="Slack notifications" enabled={false} />
        </div>
      </SettingSection>

      <div className="bg-[#0a0a0a] border border-red-900/50 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-1">Danger Zone</h3>
            <p className="text-sm text-gray-400">Irreversible and destructive actions</p>
          </div>
        </div>
        <div className="space-y-3">
          <button className="w-full p-3 bg-red-950/30 border border-red-900 rounded-lg text-red-400 hover:bg-red-950/50 transition text-sm font-medium flex items-center justify-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}

// === Helper Components ===
type StatCardProps = {
  title: string;
  value: string | number;
  change: string;
  positive?: boolean;
};

function StatCard({ title, value, change, positive }: StatCardProps) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
      <div className="text-sm text-gray-400 mb-2">{title}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      {change && (
        <div className={`text-sm flex items-center gap-1 ${positive ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUp className="h-4 w-4" />
          {change}
        </div>
      )}
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: string | number;
  change: string;
  icon: LucideIcon;
  data: number[];
};

function MetricCard({ title, value, change, icon: Icon, data }: MetricCardProps) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-400">{title}</span>
        </div>
        <span className="text-sm text-green-400">{change}</span>
      </div>
      <div className="text-3xl font-bold mb-4">{value}</div>
      <div className="flex items-end gap-1 h-16">
        {data.map((val: number, i: number) => (
          <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(val / Math.max(...data)) * 100}%` }} />
        ))}
      </div>
    </div>
  );
}

type DeploymentRowProps = {
  deployment: Deployment;
  compact?: boolean;
};

function DeploymentRow({ deployment, compact = false }: DeploymentRowProps) {
  const statusConfig: Record<DeploymentStatus, { icon: LucideIcon; color: string; bg: string }> = {
    success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    building: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' }
  };

  const config = statusConfig[deployment.status];
  const StatusIcon = config.icon;

  return (
    <div className="p-4 hover:bg-[#0a0a0a] transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-2 rounded-full ${config.bg}`}>
            <StatusIcon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{deployment.commit}</span>
              <span className="px-2 py-0.5 bg-gray-800 rounded text-xs font-mono">{deployment.commitHash}</span>
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <GitBranch className="h-3 w-3" />
                {deployment.branch}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{deployment.timestamp}</span>
              <span>•</span>
              <span>{deployment.duration}</span>
              <span>•</span>
              <span>{deployment.creator}</span>
            </div>
          </div>
        </div>
        {deployment.url && !compact && (
          <a 
            href={`https://${deployment.url}`} 
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-[#0a0a0a] transition text-sm flex items-center gap-2"
          >
            Visit
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

type SettingSectionProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: ReactNode;
};

function SettingSection({ title, description, icon: Icon, children }: SettingSectionProps) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        {Icon && <Icon className="h-5 w-5 text-gray-400 mt-0.5" />}
        <div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

type SettingItemProps = { label: string; value: string };

function SettingItem({ label, value }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-gray-800">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

type ToggleItemProps = { label: string; enabled?: boolean };

function ToggleItem({ label, enabled }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-black rounded-lg border border-gray-800">
      <span className="text-sm">{label}</span>
      <button className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-700'}`}>
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}