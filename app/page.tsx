'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Rocket, Loader } from 'lucide-react';
import LoginButton from '@/components/LoginButton';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-[#0a0a0a]">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-[#0a0a0a] to-black" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-indigo-900/20 via-purple-900/10 to-blue-900/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tl from-blue-900/10 via-cyan-900/5 to-indigo-900/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/20">
              <Rocket className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
            Vercel for Minecraft Plugins
          </h1>
          <p className="text-base md:text-lg text-gray-400">
            Deploy your Minecraft plugins with ease using GitHub integration
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#111111]/80 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] p-6 md:p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-4">
              Get Started
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Connect your GitHub account to import and deploy your repositories
            </p>
            <LoginButton />
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Import repositories from GitHub
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Automatic build and deployment
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Real-time deployment status
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          By continuing, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}
