'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { 
  Plus, 
  GitBranch, 
  Globe, 
  MoreVertical, 
  ExternalLink,
  Clock,
  Loader,
  FolderPlus,
  ArrowRight,
  Github,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import GitHubConnect from '@/components/GitHubConnect';

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
  updated_at: string;
  pushed_at: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading, getIdToken } = useAuth();
  const [showGitHubRepos, setShowGitHubRepos] = React.useState(false);
  const [githubConnected, setGithubConnected] = React.useState(false);

  // Check GitHub connection status
  const { data: githubStatus } = useQuery<{ connected: boolean; username: string | null }>({
    queryKey: ['github-status'],
    queryFn: async () => {
      if (!user) return { connected: false, username: null };
      const response = await fetch(`/api/auth/github/status?firebaseUid=${user.uid}`);
      if (!response.ok) return { connected: false, username: null };
      return response.json();
    },
    enabled: !!user && !authLoading,
    refetchInterval: 30000, // Check every 30 seconds
  });

  React.useEffect(() => {
    if (githubStatus?.connected) {
      setGithubConnected(true);
    }
  }, [githubStatus]);

  // Fetch projects from MongoDB via API
  const { data: projects = [], isLoading, error, refetch } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Use the API client which handles authentication automatically
      return api.getProjects();
    },
    enabled: !!user && !authLoading,
  });

  // Fetch GitHub repositories
  const { data: githubRepos = [], isLoading: loadingRepos, refetch: refetchRepos } = useQuery<GitHubRepo[]>({
    queryKey: ['github-repos'],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/github/repos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub repositories');
      }

      const data = await response.json();
      return data.repos || [];
    },
    enabled: !!user && !authLoading && githubConnected,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading projects</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition"
          >
            Retry
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Projects</h1>
              <p className="text-sm text-gray-400">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </p>
            </div>
            <button
              onClick={() => router.push('/projects/new')}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* GitHub Connection Section */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold">GitHub Integration</h2>
            </div>
            {githubConnected && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Connected@{githubStatus?.username}</span>
              </div>
            )}
          </div>
          
          {!githubConnected ? (
            <div className="mt-4">
              <GitHubConnect />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Import repositories from GitHub to create projects
                </p>
                <button
                  onClick={() => setShowGitHubRepos(!showGitHubRepos)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2 text-sm"
                >
                  {showGitHubRepos ? 'Hide' : 'Show'} GitHub Repositories
                  <Github className="h-4 w-4" />
                </button>
              </div>

              {showGitHubRepos && (
                <div className="mt-4">
                  {loadingRepos ? (
                    <div className="flex justify-center py-8">
                      <Loader className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : githubRepos.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>No repositories found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {githubRepos.map((repo) => (
                        <GitHubRepoCard key={repo.id} repo={repo} onImport={refetch} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2 text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0a0a0a] border border-gray-800 rounded-lg">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <FolderPlus className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
              <p className="text-gray-400 mb-6 text-center max-w-md">
                Get started by creating a new project or importing a repository from GitHub
              </p>
              <button
                onClick={() => router.push('/projects/new')}
                className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/projects/${project._id}`);
  };

  // Extract repository name from URL
  const getRepoName = (url: string) => {
    try {
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return `${match[1]}/${match[2].replace(/\.git$/, '')}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const repoName = getRepoName(project.repoUrl);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div
      onClick={handleClick}
      className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1 group-hover:text-white transition">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <GitBranch className="h-3 w-3" />
            <span className="font-mono truncate">{repoName}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Add menu for project actions
          }}
          className="p-1 text-gray-400 hover:text-gray-200 transition opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <GitBranch className="h-3 w-3" />
            <span>{project.branch || 'main'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>

        {project.url && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-3 w-3 text-gray-400" />
            <a
              href={`https://${project.url}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
            >
              {project.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Updated {formatDate(project.updatedAt)}
          </span>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition" />
        </div>
      </div>
    </div>
  );
}

function GitHubRepoCard({ repo, onImport }: { repo: GitHubRepo; onImport: () => void }) {
  const { getIdToken } = useAuth();
  const [importing, setImporting] = React.useState(false);

  const handleImport = async () => {
    try {
      setImporting(true);
      const token = await getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Import repository using the importRepository action
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repo.name,
          repoUrl: repo.clone_url,
          branch: repo.default_branch,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import repository');
      }

      // Refresh projects list
      onImport();
      alert(`Repository "${repo.name}" imported successfully!`);
    } catch (error) {
      console.error('Import error:', error);
      alert(error instanceof Error ? error.message : 'Failed to import repository');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 truncate">{repo.name}</h3>
          {repo.description && (
            <p className="text-xs text-gray-400 line-clamp-2">{repo.description}</p>
          )}
        </div>
        {repo.private && (
          <span className="px-2 py-0.5 bg-gray-800 text-xs text-gray-400 rounded">Private</span>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <GitBranch className="h-3 w-3" />
        <span>{repo.default_branch}</span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 transition text-xs text-center"
        >
          View on GitHub
        </a>
        <button
          onClick={handleImport}
          disabled={importing}
          className="px-3 py-1.5 bg-white text-black rounded hover:bg-gray-200 transition text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {importing ? (
            <>
              <Loader className="h-3 w-3 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" />
              Import
            </>
          )}
        </button>
      </div>
    </div>
  );
}

