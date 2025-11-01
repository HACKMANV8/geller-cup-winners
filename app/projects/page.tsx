"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Project } from "@/types";
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
  RefreshCw,
  Rocket,
  Trash2,
} from "lucide-react";
import GitHubConnect from "@/components/GitHubConnect";

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
  const [showDeployModal, setShowDeployModal] = React.useState(false);
  const [selectedRepo, setSelectedRepo] = React.useState<GitHubRepo | null>(
    null
  );
  const [deployForm, setDeployForm] = React.useState({
    port: 8080,
    rootDir: ".",
    runCommand: "python server.py",
    containerPort: 8080,
    envVars: [] as Array<{ key: string; value: string }>,
    envInput: "",
  });
  const [deploying, setDeploying] = React.useState(false);
  const [deployError, setDeployError] = React.useState<string | null>(null);

  // Check GitHub connection status
  const { data: githubStatus } = useQuery<{
    connected: boolean;
    username: string | null;
  }>({
    queryKey: ["github-status"],
    queryFn: async () => {
      if (!user) return { connected: false, username: null };
      const response = await fetch(
        `/api/auth/github/status?firebaseUid=${user.uid}`
      );
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
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Use the API client which handles authentication automatically
      return api.getProjects();
    },
    enabled: !!user && !authLoading,
  });

  // Fetch GitHub repositories
  const {
    data: githubRepos = [],
    isLoading: loadingRepos,
  } = useQuery<GitHubRepo[]>({
    queryKey: ["github-repos"],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/api/github/repos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch GitHub repositories");
      }

      const data = await response.json();
      return data.repos || [];
    },
    enabled: !!user && !authLoading && githubConnected,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !user) return;

    try {
      setDeploying(true);
      setDeployError(null);

      const token = await getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetRepo: selectedRepo.clone_url,
          targetBranch: selectedRepo.default_branch,
          port: deployForm.port,
          rootDir: deployForm.rootDir,
          runCommand: deployForm.runCommand,
          containerPort: deployForm.containerPort,
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Deployment failed");
      }

      // Success - close modal and refresh projects
      closeDeployModal();
      refetch();
      alert(
        `MCP Server deployed successfully!\n\nURL: ${result.url}\nSubdomain: ${result.subdomain}`
      );
    } catch (err) {
      console.error("Deploy error:", err);
      setDeployError(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setDeploying(false);
    }
  };

  const handleImportClick = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setShowDeployModal(true);
    setDeployError(null);
  };

  const parseEnvVars = (envString: string) => {
    const lines = envString.split('\n');
    const vars = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^([^=#]+?)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1].trim();
        const value = (match[2] || '').trim();
        // Remove surrounding quotes if present
        const cleanValue = value.replace(/^['"](.*)['"]$/, '$1');
        vars.push({ key, value: cleanValue });
      }
    }
    
    return vars;
  };

  const handleEnvInputChange = (value: string) => {
    const vars = parseEnvVars(value);
    setDeployForm(prev => ({
      ...prev,
      envInput: value,
      envVars: vars
    }));
  };

  const handleAddEnvVar = () => {
    setDeployForm(prev => ({
      ...prev,
      envVars: [...prev.envVars, { key: '', value: '' }]
    }));
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', newValue: string) => {
    setDeployForm(prev => {
      const newEnvVars = [...prev.envVars];
      newEnvVars[index] = { ...newEnvVars[index], [field]: newValue };
      return { ...prev, envVars: newEnvVars };
    });
  };

  const removeEnvVar = (index: number) => {
    setDeployForm(prev => ({
      ...prev,
      envVars: prev.envVars.filter((_, i) => i !== index)
    }));
  };

  const closeDeployModal = () => {
    setShowDeployModal(false);
    setSelectedRepo(null);
    setDeployError(null);
    setDeployForm({
      port: 8080,
      rootDir: ".",
      runCommand: "python server.py",
      containerPort: 8080,
      envVars: [],
      envInput: "",
    });
  };

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
                {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"}
              </p>
            </div>
            <button
              onClick={() => router.push("/projects/new")}
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
                  {showGitHubRepos ? "Hide" : "Show"} GitHub Repositories
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
                        <GitHubRepoCard
                          key={repo.id}
                          repo={repo}
                          onImport={handleImportClick}
                        />
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
                Get started by creating a new project or importing a repository
                from GitHub
              </p>
              <button
                onClick={() => router.push("/projects/new")}
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

        {/* Deploy Modal */}
        {showDeployModal && selectedRepo && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Deploy MCP Server</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Configure deployment for {selectedRepo.name}
                  </p>
                </div>
                <button
                  onClick={closeDeployModal}
                  className="p-2 text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleDeploySubmit} className="p-6 space-y-6">
                {deployError && (
                  <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {deployError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Root Directory
                    </label>
                    <input
                      type="text"
                      value={deployForm.rootDir}
                      onChange={(e) =>
                        setDeployForm({
                          ...deployForm,
                          rootDir: e.target.value,
                        })
                      }
                      placeholder="."
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                      disabled={deploying}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Path to your application root (e.g., &apos;.&apos; or
                      &apos;app&apos;)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Start Command
                    </label>
                    <input
                      type="text"
                      value={deployForm.runCommand}
                      onChange={(e) =>
                        setDeployForm({
                          ...deployForm,
                          runCommand: e.target.value,
                        })
                      }
                      placeholder="python server.py"
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                      disabled={deploying}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Command to start your application
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Host Port
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      value={deployForm.port}
                      onChange={(e) =>
                        setDeployForm({
                          ...deployForm,
                          port: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                      disabled={deploying}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Port on your machine
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Container Port
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      value={deployForm.containerPort}
                      onChange={(e) =>
                        setDeployForm({
                          ...deployForm,
                          containerPort: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                      disabled={deploying}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Port inside container
                    </p>
                  </div>
                </div>

                {/* Environment Variables Section */}
                <div className="col-span-2 mt-6">
                  <h3 className="text-sm font-medium mb-4">Environment Variables</h3>
                  
                  {/* Env Input Textarea */}
                  <div className="mb-6">
                    <label htmlFor="envInput" className="block text-sm font-medium mb-2">
                      Paste .env file content
                    </label>
                    <textarea
                      id="envInput"
                      value={deployForm.envInput}
                      onChange={(e) => handleEnvInputChange(e.target.value)}
                      placeholder="DATABASE_URL=your-db-url&#10;API_KEY=your-api-key"
                      className="w-full h-32 px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm font-mono"
                      disabled={deploying}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Paste your .env file content here or add variables below
                    </p>
                  </div>

                  {/* Env Variables List */}
                  <div className="space-y-4">
                    {deployForm.envVars.map((env, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Variable name"
                            value={env.key}
                            onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                            className="w-full px-3 py-2 bg-black border border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent text-sm"
                            disabled={deploying}
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Value"
                            value={env.value}
                            onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 bg-black border border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent text-sm"
                            disabled={deploying}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEnvVar(index)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          disabled={deploying}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddEnvVar}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      disabled={deploying}
                    >
                      <Plus className="h-4 w-4" />
                      Add Variable
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeDeployModal}
                    disabled={deploying}
                    className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deploying}
                    className="flex-1 px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deploying ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4" />
                        Deploy MCP Server
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
        return `${match[1]}/${match[2].replace(/\.git$/, "")}`;
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

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
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
            <span>{project.branch || "main"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>

        {project.repoUrl && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-3 w-3 text-gray-400" />
            <a
              href={`https://${project.repoUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
            >
              {project.repoUrl}
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

function GitHubRepoCard({
  repo,
  onImport,
}: {
  repo: GitHubRepo;
  onImport: (repo: GitHubRepo) => void;
}) {
  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 truncate">{repo.name}</h3>
          {repo.description && (
            <p className="text-xs text-gray-400 line-clamp-2">
              {repo.description}
            </p>
          )}
        </div>
        {repo.private && (
          <span className="px-2 py-0.5 bg-gray-800 text-xs text-gray-400 rounded">
            Private
          </span>
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
          onClick={() => onImport(repo)}
          className="px-3 py-1.5 bg-white text-black rounded hover:bg-gray-200 transition text-xs font-medium flex items-center gap-1"
        >
          <Rocket className="h-3 w-3" />
          Deploy
        </button>
      </div>
    </div>
  );
}
