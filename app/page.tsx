'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Rocket, Loader, Sun, Moon } from 'lucide-react';

export default function Home() {
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = (stored === 'dark' || (!stored && prefersDark)) ? 'dark' : 'light';
      setTheme(initial);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', initial === 'dark');
      }
    } catch {
      // noop
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
    try {
      localStorage.setItem('theme', next);
    } catch {
      // noop
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          throw new Error('Display name is required');
        }
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ fontFamily: "'Poppins','ui-sans-serif','system-ui','Segoe UI',Arial,'Noto Sans',sans-serif" }}
      >
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden"
      style={{ fontFamily: "'Poppins','ui-sans-serif','system-ui','Segoe UI',Arial,'Noto Sans',sans-serif" }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="fixed top-4 right-4 z-20 inline-flex items-center justify-center h-10 w-10 rounded-full border border-black/10 bg-white/70 backdrop-blur-md shadow-sm text-gray-700 hover:bg-white transition dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Subtle layered gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 via-white to-indigo-100 dark:from-slate-900 dark:via-slate-950 dark:to-black" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-indigo-200/50 via-sky-200/40 to-purple-200/40 blur-3xl dark:from-indigo-900/30 dark:via-sky-900/20 dark:to-purple-900/20" />
        <div className="absolute -bottom-48 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tl from-blue-200/40 via-cyan-200/30 to-indigo-200/30 blur-3xl dark:from-blue-900/20 dark:via-cyan-900/10 dark:to-indigo-900/10" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/20">
              <Rocket className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1
            className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 dark:text-gray-100"
            style={{ fontFamily: "'Apple Garamond ITC','Apple Garamond','Garamond','ui-serif',serif" }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300">MCP Deploy</span>
          </h1>
          <p
            className="mt-2 text-base md:text-lg text-gray-600 dark:text-gray-300"
            style={{ fontFamily: "'Apple Garamond ITC','Apple Garamond','Garamond','ui-serif',serif" }}
          >
            Deploy your applications with elegance and ease
          </p>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] p-6 md:p-8 dark:border-white/10 dark:bg-white/10">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-100/70 p-1 dark:bg-white/5">
            <button
              onClick={() => setIsSignUp(false)}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isSignUp
                  ? 'bg-white shadow-sm text-gray-900 dark:bg-white/10 dark:text-gray-100'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isSignUp
                  ? 'bg-white shadow-sm text-gray-900 dark:bg-white/10 dark:text-gray-100'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5 dark:text-gray-200">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300/80 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm outline-none ring-0 transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5 dark:text-gray-200">Display Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300/80 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm outline-none ring-0 transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
                    placeholder="Your name"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-1.5 dark:text-gray-200">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300/80 bg-white/90 px-4 py-2.5 text-gray-900 shadow-sm outline-none ring-0 transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-400/10">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-white font-medium shadow-lg shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>{isSignUp ? 'Create Account' : 'Sign In'}</>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By continuing, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}