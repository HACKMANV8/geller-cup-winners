"use client";
import React, { useState } from 'react';
import { Github, ChevronRight, Plus, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface Secret {
  key: string;
  value: string;
}

interface FormData {
  repository: string;
  language: string;
  branch: string;
  rootDir: string;
  port: string;
  buildCommand: string;
  startCommand: string;
  secrets: Secret[];
}

interface Language {
  id: string;
  name: string;
  icon: string;
  buildCmd: string;
  startCmd: string;
}

export default function NewProjectPage() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    repository: '',
    language: 'node',
    branch: 'main',
    rootDir: './',
    port: '3000',
    buildCommand: '',
    startCommand: '',
    secrets: []
  });
  const [envText, setEnvText] = useState<string>('');
  const [githubConnected, setGithubConnected] = useState<boolean>(false);
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});

  const languages: Language[] = [
    { id: 'node', name: 'Node.js', icon: '⬢', buildCmd: 'npm install', startCmd: 'npm start' },
    { id: 'python', name: 'Python', icon: '', buildCmd: 'pip install -r requirements.txt', startCmd: 'python app.py' }
  ];

  const handleLanguageChange = (langId: string) => {
    const lang = languages.find(l => l.id === langId);
    if (!lang) return; // ✅ fix for 'lang' possibly undefined

    setFormData({
      ...formData,
      language: langId,
      buildCommand: lang.buildCmd,
      startCommand: lang.startCmd,
      port: langId === 'node' ? '3000' : '8000'
    });
  };

  const handleEnvTextChange = (text: string) => { // ✅ added explicit type
    setEnvText(text);
  };

  const handleAddEnvVariables = () => {
    if (!envText.trim()) return;

    const lines = envText.split('\n').filter(line => line.trim() && line.includes('='));
    const newSecrets: Secret[] = lines.map(line => {
      const equalIndex = line.indexOf('=');
      return {
        key: line.substring(0, equalIndex).trim(),
        value: line.substring(equalIndex + 1).trim()
      };
    }).filter(s => s.key);

    setFormData({
      ...formData,
      secrets: [...formData.secrets, ...newSecrets]
    });
    setEnvText('');
  };

  const handleRemoveSecret = (index: number) => {
    setFormData({
      ...formData,
      secrets: formData.secrets.filter((_, i) => i !== index)
    });
  };

  const toggleShowValue = (index: number) => {
    setShowValues(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSubmit = () => {
    console.log('Submitting project:', formData);
    alert('Project created! Check console for data.');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      {/* Header */}
      <header className="bg-[#161b22] border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Create New Project</h1>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-[#161b22] border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>
                1
              </div>
              <span className="font-medium text-sm">Repository</span>
            </div>
            <ChevronRight className="text-gray-600 h-4 w-4" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>
                2
              </div>
              <span className="font-medium text-sm">Configuration</span>
            </div>
            <ChevronRight className="text-gray-600 h-4 w-4" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-800'}`}>
                3
              </div>
              <span className="font-medium text-sm">Environment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Step 1: GitHub Connection */}
        {step === 1 && (
          <div className="bg-[#161b22] rounded-lg border border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-6">Connect GitHub Repository</h2>

            {!githubConnected ? (
              <div className="space-y-4">
                <div className="bg-[#1c2432] border border-blue-900 rounded-lg p-6 text-center">
                  <Github className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">Connect your GitHub account</h3>
                  <p className="text-gray-400 mb-4">
                    We'll need access to your repositories to deploy your project
                  </p>
                  <button
                    onClick={() => setGithubConnected(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium"
                  >
                    <Github className="h-5 w-5" />
                    Connect GitHub
                  </button>
                </div>
                <div className="text-center text-sm text-gray-500">
                  Or provide a public repository URL directly below
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-800 rounded-lg flex items-center gap-3">
                <Github className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">GitHub Connected</span>
              </div>
            )}

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2 text-gray-300">Repository URL</label>
              <input
                type="url"
                value={formData.repository}
                onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
                placeholder="https://github.com/username/repository.git"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter the URL of your GitHub repository
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!formData.repository}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Configuration */}
        {step === 2 && (
          <div className="bg-[#161b22] rounded-lg border border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-6">Project Configuration</h2>
            
            <div className="space-y-6">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-300">Language</label>
                <div className="grid grid-cols-2 gap-4">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        formData.language === lang.id
                          ? 'border-blue-600 bg-blue-900/20'
                          : 'border-gray-700 hover:border-gray-600 bg-[#0d1117]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{lang.icon}</span>
                        <span className="font-semibold">{lang.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
                  placeholder="main"
                />
              </div>

              {/* Root Directory */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Root Directory</label>
                <input
                  type="text"
                  value={formData.rootDir}
                  onChange={(e) => setFormData({ ...formData, rootDir: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
                  placeholder="./"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Path to the directory containing your application code
                </p>
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Port</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
                  placeholder="3000"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Port your application listens on
                </p>
              </div>

              {/* Build Command */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Build Command</label>
                <input
                  type="text"
                  value={formData.buildCommand}
                  onChange={(e) => setFormData({ ...formData, buildCommand: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 font-mono text-sm"
                  placeholder="npm install"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Command to build your application
                </p>
              </div>

              {/* Start Command */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Start Command</label>
                <input
                  type="text"
                  value={formData.startCommand}
                  onChange={(e) => setFormData({ ...formData, startCommand: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 font-mono text-sm"
                  placeholder="npm start"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Command to start your application
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-700 rounded-lg hover:bg-[#0d1117] transition font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}
    {/* Step 3: Environment Variables */}
    {step === 3 && (
    <div className="bg-[#161b22] rounded-lg border border-gray-800 p-5">
        <h2 className="text-xl font-semibold mb-4">Environment Variables & Secrets</h2>

        <div className="space-y-4">
        {/* Paste Environment Variables */}
        <div>
            <label className="block text-xs font-medium mb-1 text-gray-300">
            Paste Environment Variables
            </label>
            <textarea
                value={envText}
                onChange={(e) => {
                    handleEnvTextChange(e.target.value);
                    // auto-resize logic
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                className="w-full px-4 py-3 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-100 overflow-hidden"
                rows={8}
                placeholder={`DATABASE_URL=postgres://user:pass@localhost/db
                API_KEY=your-api-key-here
                NODE_ENV=production
                SECRET_TOKEN=abc123xyz`}
                />
            <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
                Paste your environment variables (KEY=value format)
            </p>
            <button
                onClick={handleAddEnvVariables}
                disabled={!envText.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
            >
                Add
            </button>
            </div>
        </div>

        {/* Secrets List */}
        {formData.secrets.length > 0 && (
            <div className="border border-gray-800 rounded-md overflow-hidden">
            <div className="bg-[#0d1117] px-3 py-2 flex items-center gap-2 border-b border-gray-800">
                <AlertCircle className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-medium text-gray-300">
                {formData.secrets.length} variable
                {formData.secrets.length !== 1 ? "s" : ""} configured
                </span>
            </div>

            {/* Editable Key-Value List */}
            <div className="divide-y divide-gray-800">
                {formData.secrets.map((secret, index) => (
                <div
                    key={index}
                    className="grid grid-cols-[1fr_2fr_auto] gap-2 px-3 py-2 items-center bg-[#161b22] hover:bg-[#1c2128] transition"
                >
                    {/* Key Input */}
                    <input
                    type="text"
                    value={secret.key}
                    onChange={(e) => {
                        const newSecrets = [...formData.secrets];
                        newSecrets[index].key = e.target.value;
                        setFormData({ ...formData, secrets: newSecrets });
                    }}
                    className="bg-[#0d1117] border border-gray-700 rounded-md px-2 py-1 text-xs text-blue-400 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="KEY"
                    />

                    {/* Value Input */}
                    <div className="flex items-center gap-1.5">
                    <input
                        type={showValues[index] ? "text" : "password"}
                        value={secret.value}
                        onChange={(e) => {
                        const newSecrets = [...formData.secrets];
                        newSecrets[index].value = e.target.value;
                        setFormData({ ...formData, secrets: newSecrets });
                        }}
                        className="w-full bg-[#0d1117] border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="value"
                    />
                    <button
                        onClick={() => toggleShowValue(index)}
                        className="text-gray-500 hover:text-gray-300 transition"
                    >
                        {showValues[index] ? (
                        <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                        <Eye className="h-3.5 w-3.5" />
                        )}
                    </button>
                    </div>

                    {/* Remove Button */}
                    <button
                    onClick={() => handleRemoveSecret(index)}
                    className="text-gray-500 hover:text-red-500 transition ml-1"
                    >
                    <X className="h-4 w-4" />
                    </button>
                </div>
                ))}
            </div>

            {/* Add New Variable Button */}
            <button
                onClick={() =>
                setFormData({
                    ...formData,
                    secrets: [...formData.secrets, { key: "", value: "" }],
                })
                }
                className="text-xs px-3 py-1 bg-gray-800 text-gray-200 hover:bg-gray-700 transition w-fit m-2 rounded-md"
            >
                + Add new
            </button>
            </div>
        )}

        {/* Empty State */}
        {formData.secrets.length === 0 && (
            <div className="bg-[#0d1117] border border-gray-800 rounded-md p-6 text-center">
            <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-xs">
                No variables added yet. Paste above and click “Add”.
            </p>
            </div>
        )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
        <button
            onClick={() => setStep(2)}
            className="px-4 py-2 border border-gray-700 rounded-md hover:bg-[#0d1117] transition text-sm font-medium"
        >
            Back
        </button>
        <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
        >
            Create
        </button>
        </div>
    </div>
    )}

      </main>
    </div>
  );
}