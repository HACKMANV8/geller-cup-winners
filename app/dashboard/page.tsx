"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Project, CreateProjectInput } from "@/types";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Home,
  Boxes,
  Rocket,
  Settings,
  LogOut,
  Plus,
  GitBranch,
  Trash2,
  Loader,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-[#111111] border-r border-gray-800 flex flex-col justify-between fixed left-0 top-0 bottom-0">
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-gray-800">
            <Rocket className="h-6 w-6 text-white" />
            <h1 className="text-lg font-semibold">MCP Deploy</h1>
          </div>
          <nav className="mt-6 space-y-1">
            <SidebarItem icon={<Home className="h-4 w-4" />} label="Dashboard" active />
            <SidebarItem icon={<Boxes className="h-4 w-4" />} label="Projects" />
            <SidebarItem icon={<Rocket className="h-4 w-4" />} label="Deployments" />
            <SidebarItem icon={<Settings className="h-4 w-4" />} label="Settings" />
          </nav>
        </div>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition text-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 ml-60 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 backdrop-blur-md bg-[#0a0a0acc] border-b border-gray-800 px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Projects</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-gray-800 rounded-lg">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 py-10">
          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onClick={() => router.push(`/projects/${project._id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center mt-20">
              <Rocket className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-gray-500 text-sm mb-6">
                Create your first project to get started with deployments.
              </p>
              <button
                onClick={() => router.push("/projects/new")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-md hover:bg-gray-200 transition font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>
          )}
        </main>

        {/* Floating New Project Button */}
        <button
          onClick={() => router.push("/projects/new")}
          className="fixed bottom-8 right-8 bg-white text-black hover:bg-gray-200 transition rounded-full shadow-lg p-4"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/* --- Sidebar Item --- */
function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-[#1a1a1a] text-white border-l-2 border-white"
          : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* --- Project Card --- */
function ProjectCard({
  project,
  onDelete,
  onClick,
}: {
  project: Project;
  onDelete: (id: string) => void;
  onClick: () => void;
}) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete project "${project.name}"?`)) {
      onDelete(project._id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#111111] border border-gray-800 rounded-lg p-5 hover:border-gray-600 hover:shadow-[0_0_20px_-10px_rgba(255,255,255,0.1)] transition cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-base font-semibold group-hover:text-white transition">
          {project.name}
        </h3>
        <button
          onClick={handleDelete}
          className="text-gray-500 hover:text-red-500 transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <GitBranch className="h-3.5 w-3.5" />
        <span className="truncate">{project.repoUrl}</span>
      </div>
      {project.branch && (
        <div className="mt-1 text-xs text-gray-600">
          Branch: {project.branch}
        </div>
      )}
    </div>
  );
}

/* --- New Project Modal --- */
function NewProjectModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => api.createProject(input),
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: unknown) => {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create project";
      setError(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate({ name, repoUrl, branch });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-4">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              placeholder="my-awesome-app"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Repository URL</label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              placeholder="https://github.com/user/repo.git"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Branch</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              placeholder="main"
            />
          </div>
          {error && (
            <div className="p-2 bg-red-900/30 text-red-400 rounded-md text-xs">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-700 rounded-md text-sm hover:bg-[#1a1a1a] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-3 py-1.5 bg-white text-black rounded-md hover:bg-gray-200 transition text-sm disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
