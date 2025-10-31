'use client';

import { useState, useEffect } from 'react';
import { Github, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function GitHubConnect() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    checkGitHubStatus();
  }, [user]);

  const checkGitHubStatus = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${API_URL}/api/auth/github/status?firebaseUid=${user.uid}`
      );
      const data = await response.json();
      setConnected(data.connected);
      setUsername(data.username);
    } catch (error) {
      console.error('Failed to check GitHub status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${API_URL}/api/auth/github/authorize?firebaseUid=${user.uid}`
      );
      const data = await response.json();
      
      // Redirect to GitHub OAuth
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to initiate GitHub OAuth:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <Loader className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-gray-600">Checking GitHub connection...</span>
        </div>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">GitHub Connected</h3>
              <p className="text-sm text-gray-600">@{username}</p>
            </div>
          </div>
          <Github className="h-8 w-8 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Github className="h-8 w-8" />
          <div>
            <h3 className="font-semibold text-lg">Connect GitHub Account</h3>
            <p className="text-sm text-gray-300">
              Required to deploy from your repositories
            </p>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleConnect}
        className="w-full mt-4 bg-white text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
      >
        <Github className="h-5 w-5" />
        Connect GitHub Account
      </button>
      
      <div className="mt-4 text-xs text-gray-400">
        <p>We&apos;ll request access to:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Read your repositories</li>
          <li>Create webhooks for deployments</li>
        </ul>
      </div>
    </div>
  );
}
