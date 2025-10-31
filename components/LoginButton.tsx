'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Github, Loader, LogOut } from 'lucide-react';

export default function LoginButton() {
  const { user, signInWithGitHub, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGitHub();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {loading ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Github className="h-5 w-5" />
            Login with GitHub
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-500 max-w-xs text-center">{error}</p>
      )}
    </div>
  );
}
