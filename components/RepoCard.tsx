'use client';

import { GitHubRepo } from '@/app/actions/github.actions';
import { GitBranch, Star, Lock, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RepoCardProps {
  repo: GitHubRepo;
  onImport: (repo: GitHubRepo) => void;
  importing: boolean;
}

export default function RepoCard({ repo, onImport, importing }: RepoCardProps) {
  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-5 hover:border-gray-600 hover:shadow-[0_0_20px_-10px_rgba(255,255,255,0.1)] transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate mb-1">
            {repo.name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">
            {repo.description || 'No description provided'}
          </p>
        </div>
        <div className="ml-3 flex-shrink-0">
          {repo.private ? (
            <span title="Private">
              <Lock className="h-4 w-4 text-yellow-500" />
            </span>
          ) : (
            <span title="Public">
              <Globe className="h-4 w-4 text-green-500" />
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        {repo.language && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>{repo.language}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          <span>{repo.stargazers_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>{repo.default_branch}</span>
        </div>
      </div>

      <div className="text-xs text-gray-600 mb-4">
        Updated {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}
      </div>

      <button
        onClick={() => onImport(repo)}
        disabled={importing}
        className="w-full px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {importing ? 'Importing...' : 'Import'}
      </button>
    </div>
  );
}
