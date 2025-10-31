"use client";
import React, { useState } from "react";

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
  buildCmd: string;
  startCmd: string;
}

export default function NewProjectPage() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    repository: "",
    language: "node",
    branch: "main",
    rootDir: "./",
    port: "3000",
    buildCommand: "",
    startCommand: "",
    secrets: [],
  });
  const [envText, setEnvText] = useState<string>("");
  const [githubConnected, setGithubConnected] = useState<boolean>(false);
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});

  const languages: Language[] = [
    {
      id: "node",
      name: "Node.js",
      buildCmd: "npm install",
      startCmd: "npm start",
    },
    {
      id: "python",
      name: "Python",
      buildCmd: "pip install -r requirements.txt",
      startCmd: "python app.py",
    },
  ];

  const handleLanguageChange = (langId: string) => {
    const lang = languages.find((l) => l.id === langId);
    if (!lang) return;
    setFormData({
      ...formData,
      language: langId,
      buildCommand: lang.buildCmd,
      startCommand: lang.startCmd,
      port: langId === "node" ? "3000" : "8000",
    });
  };

  const handleAddEnvVariables = () => {
    if (!envText.trim()) return;
    const lines = envText
      .split("\n")
      .filter((line) => line.trim() && line.includes("="));
    const newSecrets: Secret[] = lines
      .map((line) => {
        const equalIndex = line.indexOf("=");
        return {
          key: line.substring(0, equalIndex).trim(),
          value: line.substring(equalIndex + 1).trim(),
        };
      })
      .filter((s) => s.key);
    setFormData({
      ...formData,
      secrets: [...formData.secrets, ...newSecrets],
    });
    setEnvText("");
  };

  const handleRemoveSecret = (index: number) => {
    setFormData({
      ...formData,
      secrets: formData.secrets.filter((_, i) => i !== index),
    });
  };

  const toggleShowValue = (index: number) => {
    setShowValues((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSubmit = () => {
    console.log("Submitting project:", formData);
    alert("Project created! Check console for data.");
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <header className="border-b border-neutral-800 sticky top-0 z-10 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-wide text-gray-200">
            Create New Project
          </h1>
        </div>
      </header>

      {/* Steps */}
      <div className="border-b border-neutral-900 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4 text-sm text-gray-500">
          <span
            className={`${
              step >= 1 ? "text-white" : "text-gray-500"
            } font-medium`}
          >
            1. Repository
          </span>
          <span>›</span>
          <span
            className={`${
              step >= 2 ? "text-white" : "text-gray-500"
            } font-medium`}
          >
            2. Configuration
          </span>
          <span>›</span>
          <span
            className={`${
              step >= 3 ? "text-white" : "text-gray-500"
            } font-medium`}
          >
            3. Environment
          </span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6">
              Connect GitHub Repository
            </h2>

            {!githubConnected ? (
              <div className="text-center mb-8">
                <p className="text-gray-400 mb-4">
                  Connect your GitHub to continue
                </p>
                <button
                  onClick={() => setGithubConnected(true)}
                  className="bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-gray-200 transition"
                >
                  Connect GitHub
                </button>
              </div>
            ) : (
              <div className="text-sm mb-4 text-green-400">
                GitHub Connected
              </div>
            )}

            <label className="block text-sm font-medium mb-2 text-gray-300">
              Repository URL
            </label>
            <input
              type="url"
              value={formData.repository}
              onChange={(e) =>
                setFormData({ ...formData, repository: e.target.value })
              }
              className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-md text-gray-100 focus:outline-none focus:border-gray-500"
              placeholder="https://github.com/username/repository.git"
            />

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!formData.repository}
                className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-8 space-y-6">
            <h2 className="text-xl font-semibold">Project Configuration</h2>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Language
              </label>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`p-3 rounded-md border text-left ${
                      formData.language === lang.id
                        ? "border-gray-400 bg-[#111]"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="font-medium text-gray-200">{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {["branch", "rootDir", "port"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-2 text-gray-300 capitalize">
                  {field === "rootDir" ? "Root Directory" : field}
                </label>
                <input
                  type={field === "port" ? "number" : "text"}
                  value={
                    (formData as unknown as Record<string, string | number>)[
                      field
                    ]
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-md text-gray-100 focus:outline-none focus:border-gray-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Build Command
              </label>
              <input
                type="text"
                value={formData.buildCommand}
                onChange={(e) =>
                  setFormData({ ...formData, buildCommand: e.target.value })
                }
                className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-md text-gray-100 focus:outline-none focus:border-gray-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Start Command
              </label>
              <input
                type="text"
                value={formData.startCommand}
                onChange={(e) =>
                  setFormData({ ...formData, startCommand: e.target.value })
                }
                className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-md text-gray-100 focus:outline-none focus:border-gray-500 font-mono text-sm"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-neutral-800 rounded-md hover:bg-[#111] transition text-gray-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6">
              Environment Variables
            </h2>

            <textarea
              value={envText}
              onChange={(e) => {
                setEnvText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-md text-gray-100 font-mono text-sm focus:outline-none focus:border-gray-500 overflow-hidden"
              rows={5}
              placeholder={`KEY=value\nANOTHER_KEY=value2`}
            />

            <div className="flex justify-between mt-3">
              <p className="text-xs text-gray-500">
                Paste your variables (KEY=value)
              </p>
              <button
                onClick={handleAddEnvVariables}
                disabled={!envText.trim()}
                className="px-3 py-1 bg-white text-black rounded-md text-xs font-medium hover:bg-gray-200 transition disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {formData.secrets.length > 0 && (
              <div className="mt-6 border border-neutral-800 rounded-md">
                {formData.secrets.map((secret, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 border-b border-neutral-800"
                  >
                    <input
                      type="text"
                      value={secret.key}
                      onChange={(e) => {
                        const newSecrets = [...formData.secrets];
                        newSecrets[index].key = e.target.value;
                        setFormData({ ...formData, secrets: newSecrets });
                      }}
                      className="w-1/3 bg-black border border-neutral-800 rounded-md px-2 py-1 text-xs text-gray-300 font-mono focus:outline-none focus:border-gray-500"
                      placeholder="KEY"
                    />
                    <input
                      type={showValues[index] ? "text" : "password"}
                      value={secret.value}
                      onChange={(e) => {
                        const newSecrets = [...formData.secrets];
                        newSecrets[index].value = e.target.value;
                        setFormData({ ...formData, secrets: newSecrets });
                      }}
                      className="w-2/3 bg-black border border-neutral-800 rounded-md px-2 py-1 text-xs text-gray-300 font-mono focus:outline-none focus:border-gray-500"
                      placeholder="value"
                    />
                    <button
                      onClick={() => toggleShowValue(index)}
                      className="text-gray-500 text-xs hover:text-gray-300 transition"
                    >
                      {showValues[index] ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => handleRemoveSecret(index)}
                      className="text-gray-500 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-neutral-800 rounded-md hover:bg-[#111] transition text-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition font-medium"
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
