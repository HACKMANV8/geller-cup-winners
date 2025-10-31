/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { fetchPublicRepoFiles } from "@/app/actions/github.actions";
import GitHubConnect from "@/components/GitHubConnect";
import {
  Home,
  Boxes,
  Rocket,
  Settings,
  LogOut,
  User,
  Github,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, loading: authLoading, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showGitHubConnect, setShowGitHubConnect] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const transferRepository = async (repoUrl: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to transfer repository');
      }
  
      alert('Repository transferred successfully!');
      return result;
    } catch (error: any) {
      console.error('Transfer error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const handleImportRepo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setShowGitHubConnect(false);

      const token = await getIdToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const tempProjectId = `project_${Date.now()}`;
      const result = await fetchPublicRepoFiles(
        token,
        tempProjectId,
        repoUrl,
        branch || "main"
      );

      if (result.success) {
        setSuccess(`Successfully imported ${result.fileCount} files from the repository!`);
        setRepoUrl("");
        setBranch("main");
      } else {
        // Check if it's a rate limit error
        if (result.error?.includes("rate limit")) {
          setShowGitHubConnect(true);
          setError("GitHub API rate limit reached. Please connect your GitHub account for higher limits.");
        } else {
          setError(result.error || "Failed to import repository");
        }
      }
    } catch (err) {
      console.error("Error importing repository:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to import repository";

      // Check if it's a rate limit error
      if (errorMessage.includes("rate limit")) {
        setShowGitHubConnect(true);
        setError("GitHub API rate limit reached. Please connect your GitHub account for higher limits.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

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
          <h2 className="text-lg font-semibold">Import Repository</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-gray-800 rounded-lg">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <Github className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Import GitHub Repository</h1>
              <p className="text-gray-400">
                Enter a public GitHub repository URL to import and deploy
              </p>
            </div>

            {/* GitHub Connect Component */}
            {showGitHubConnect && (
              <div className="mb-6">
                <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Rate Limit Reached</p>
                    <p className="text-yellow-300/80">
                      Connect your GitHub account to get 5,000 requests/hour instead of 60 requests/hour.
                    </p>
                  </div>
                </div>
                <GitHubConnect />
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && !showGitHubConnect && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Import Form */}
            <form onSubmit={handleImportRepo} className="space-y-6">
              <div className="bg-[#111111] border border-gray-800 rounded-lg p-6 space-y-4">
                <div>
                  <label htmlFor="repoUrl" className="block text-sm font-medium mb-2">
                    Repository URL
                  </label>
                  <input
                    id="repoUrl"
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Enter the full URL of a public GitHub repository
                  </p>
                </div>

                <div>
                  <label htmlFor="branch" className="block text-sm font-medium mb-2">
                    Branch (optional)
                  </label>
                  <input
                    id="branch"
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Default: main
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !repoUrl.trim()}
                className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4" />
                    Import Repository
                  </>
                )}

              </button>
              <button
                onClick={() => transferRepository(repoUrl)}
                className="px-4 my-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Transferring...' : 'Transfer Repository'}
              </button>
             
            </form>
            
          </div>
        </main>
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
      className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition ${active
          ? "bg-[#1a1a1a] text-white border-l-2 border-white"
          : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
