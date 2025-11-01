/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { fetchPublicRepoFiles } from "@/app/actions/github.actions";
import GitHubConnect from "@/components/GitHubConnect";
import { Home, Boxes, Rocket, Settings, LogOut, Github, AlertCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const auth = useAuth();
  const { user, loading: authLoading, logout, getIdToken } = auth;
  const router = useRouter();
  const [formData, setFormData] = useState({
    repoUrl: "",
    branch: "main",
    port: 8080,
    rootDir: ".",
    runCommand: "python server.py",
    mcpName: "",
    containerPort: 8080,
    envVars: [] as Array<{ key: string; value: string }>,
    envInput: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{message: string; url?: string} | null>(null);
  const [showGitHubConnect, setShowGitHubConnect] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' || name === 'containerPort' ? Number(value) : value
    }));
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

  const handleEnvInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    const vars = parseEnvVars(value);
    
    setFormData(prev => ({
      ...prev,
      envInput: value,
      envVars: vars
    }));
  };

  const handleAddEnvVar = () => {
    setFormData(prev => ({
      ...prev,
      envVars: [...prev.envVars, { key: '', value: '' }]
    }));
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', newValue: string) => {
    setFormData(prev => {
      const newEnvVars = [...prev.envVars];
      newEnvVars[index] = { ...newEnvVars[index], [field]: newValue };
      return { ...prev, envVars: newEnvVars };
    });
  };

  const removeEnvVar = (index: number) => {
    setFormData(prev => ({
      ...prev,
      envVars: prev.envVars.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const transferRepository = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData }),
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
  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.repoUrl.trim()) {
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

 

      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetRepo: formData.repoUrl,
          targetBranch: formData.branch,
          port: formData.port,
          rootDir: formData.rootDir,
          runCommand: formData.runCommand,
          containerPort: formData.containerPort,
          userId: user?.uid
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Deployment failed');
      }

      setSuccess({
        message: "Deployment started successfully!",
        url: result.url || null
      });
      setDeploymentUrl(result.url || null);
      // Reset form but keep the deployment URL
      setFormData({
        repoUrl: "",
        branch: "main",
        port: 8080,
        rootDir: ".",
        runCommand: "python server.py",
        mcpName: "",
        containerPort: 8080,
        envVars: [],
        envInput: ""
      });
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
            <button
              onClick={() => router.push('/projects')}
              className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <Boxes className="h-4 w-4" />
              Projects
            </button>
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
                <p className="font-medium mb-2">{success.message}</p>
                {success.url && (
                  <div className="mt-2">
                    <p className="text-sm text-green-300 mb-1">Your application will be available at:</p>
                    <a 
                      href={success.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 break-all"
                    >
                      {success.url}
                    </a>
                    <p className="text-xs text-green-500/80 mt-2">
                      Note: It may take a few minutes for the deployment to complete.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && !showGitHubConnect && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Import Form */}
            <form onSubmit={handleDeploy} className="space-y-6">
              <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Repository URL */}
                  <div className="col-span-2">
                    <label htmlFor="repoUrl" className="block text-sm font-medium mb-2">
                      Repository URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="repoUrl"
                      type="text"
                      name="repoUrl"
                      value={formData.repoUrl}
                      onChange={handleInputChange}
                      placeholder="https://github.com/username/repository"
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                      disabled={loading}
                      required
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Enter the full URL of a public GitHub repository
                    </p>
                  </div>

                  {/* Project Name */}
                  <div>
                    <label htmlFor="mcpName" className="block text-sm font-medium mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="mcpName"
                      name="mcpName"
                      type="text"
                      value={formData.mcpName}
                      onChange={handleInputChange}
                      placeholder="my-awesome-project"
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                      disabled={loading}
                      required
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      A name for your project
                    </p>
                  </div>

                  {/* Branch */}
                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium mb-2">
                      Branch
                    </label>
                    <input
                      id="branch"
                      name="branch"
                      type="text"
                      value={formData.branch}
                      onChange={handleInputChange}
                      placeholder="main"
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                      disabled={loading}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Default: main
                    </p>
                  </div>

                  {/* Root Directory */}
                  <div>
                    <label htmlFor="rootDir" className="block text-sm font-medium mb-2">
                      Root Directory
                    </label>
                    <input
                      id="rootDir"
                      name="rootDir"
                      type="text"
                      value={formData.rootDir}
                      onChange={handleInputChange}
                      placeholder="."
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                      disabled={loading}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Path to your application root (e.g., &apos;src&apos; or &apos;app&apos;)
                    </p>
                  </div>

                  {/* Run Command */}
                  <div className="col-span-2">
                    <label htmlFor="runCommand" className="block text-sm font-medium mb-2">
                      Start Command
                    </label>
                    <input
                      id="runCommand"
                      name="runCommand"
                      type="text"
                      value={formData.runCommand}
                      onChange={handleInputChange}
                      placeholder="python server.py"
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                      disabled={loading}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Command to start your application
                    </p>
                  </div>

                  {/* Port Configuration */}
                  <div className="grid grid-cols-2 gap-4 col-span-2">
                    <div>
                      <label htmlFor="port" className="block text-sm font-medium mb-2">
                        Host Port
                      </label>
                      <input
                        id="port"
                        name="port"
                        type="number"
                        min="1"
                        max="65535"
                        value={formData.port}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                        disabled={loading}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Port on your machine
                      </p>
                    </div>
                    <div>
                      <label htmlFor="containerPort" className="block text-sm font-medium mb-2">
                        Container Port
                      </label>
                      <input
                        id="containerPort"
                        name="containerPort"
                        type="number"
                        min="1"
                        max="65535"
                        value={formData.containerPort}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                        disabled={loading}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Port inside container
                      </p>
                    </div>
                  </div>

                  {/* Environment Variables */}
                  <div className="col-span-2 mt-6">
                    <h3 className="text-sm font-medium mb-4">Environment Variables</h3>
                    
                    {/* Env Input Textarea */}
                    <div className="mb-6">
                      <label htmlFor="envInput" className="block text-sm font-medium mb-2">
                        Paste .env file content
                      </label>
                      <textarea
                        id="envInput"
                        name="envInput"
                        value={formData.envInput}
                        onChange={handleEnvInputChange}
                        placeholder="DATABASE_URL=your-db-url\nAPI_KEY=your-api-key"
                        className="w-full h-32 px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm font-mono"
                        disabled={loading}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Paste your .env file content here or add variables below
                      </p>
                    </div>

                    {/* Env Variables List */}
                    <div className="space-y-4">
                      {formData.envVars.map((env, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Variable name"
                              value={env.key}
                              onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                              className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Value"
                              value={env.value}
                              onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                              className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEnvVar(index)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            disabled={loading}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddEnvVar}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Variable
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.repoUrl.trim()}
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
