"use client";

import { useAuth } from "@/contexts/AuthContext";
import { fetchGitHubRepos, importRepository, GitHubRepo } from "@/app/actions/github.actions";
import {
  Home,
  Boxes,
  Rocket,
  Settings,
  LogOut,
  User,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RepoCard from "@/components/RepoCard";

export default function DashboardPage() {
  const { user, loading: authLoading, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [importingRepoId, setImportingRepoId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadRepositories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Filter repos based on search query
    if (searchQuery.trim() === "") {
      setFilteredRepos(repos);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRepos(
        repos.filter(
          (repo) =>
            repo.name.toLowerCase().includes(query) ||
            repo.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, repos]);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getIdToken();
      if (!token) {
        throw new Error("No authentication token");
      }
      const fetchedRepos = await fetchGitHubRepos(token);
      setRepos(fetchedRepos);
      setFilteredRepos(fetchedRepos);
    } catch (err) {
      console.error("Error loading repositories:", err);
      setError(err instanceof Error ? err.message : "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (repo: GitHubRepo) => {
    try {
      setImportingRepoId(repo.id);
      const token = await getIdToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      const result = await importRepository(token, {
        repoName: repo.name,
        githubRepoId: repo.id,
        cloneUrl: repo.clone_url,
        description: repo.description,
        defaultBranch: repo.default_branch,
      });

      if (result.success) {
        alert(`Successfully imported ${repo.name}!`);
        // Optionally redirect to the project page
        // router.push(`/projects/${result.projectId}`);
      } else {
        alert(`Failed to import: ${result.error}`);
      }
    } catch (err) {
      console.error("Error importing repository:", err);
      alert("Failed to import repository");
    } finally {
      setImportingRepoId(null);
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
          <h2 className="text-lg font-semibold">GitHub Repositories</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-gray-800 rounded-lg">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        {!loading && !error && repos.length > 0 && (
          <div className="px-8 pt-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 px-8 py-6">
          {error ? (
            <div className="flex flex-col items-center justify-center text-center mt-20">
              <div className="text-red-400 mb-2">Failed to load repositories.</div>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={() => loadRepositories()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition text-sm"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-[#111111] border border-gray-800 rounded-lg p-5 animate-pulse"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-5 w-32 bg-gray-800 rounded" />
                    <div className="h-4 w-4 bg-gray-800 rounded" />
                  </div>
                  <div className="h-4 w-48 bg-gray-800 rounded" />
                  <div className="mt-2 h-3 w-24 bg-gray-900 rounded" />
                </div>
              ))}
            </div>
          ) : filteredRepos && filteredRepos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRepos.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onImport={handleImport}
                  importing={importingRepoId === repo.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center mt-20">
              <Rocket className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No repositories found</h3>
              <p className="text-gray-500 text-sm mb-6">
                {searchQuery ? "No repositories match your search." : "Connect your GitHub account to see your repositories."}
              </p>
            </div>
          )}
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
