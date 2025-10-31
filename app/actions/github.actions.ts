/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { adminAuth } from '@/lib/firebase/admin';
import { connectToDatabase } from '@/lib/mongodb';
import GitHubTokenModel from '@/lib/models/GitHubToken';
import ProjectModel from '@/lib/models/Project';
import { storeFiles } from './file.actions';
import { FileData } from '@/types/file';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  clone_url: string;
  html_url: string;
  url: string;
  private: boolean;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
  default_branch: string;
}

/**
 * Store GitHub access token in MongoDB
 */
export async function storeGitHubToken(
  idToken: string,
  accessToken: string,
  tokenType?: string,
  scope?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectToDatabase();

    // Store or update the GitHub token
    await GitHubTokenModel.findOneAndUpdate(
      { userId },
      {
        userId,
        accessToken,
        tokenType: tokenType || 'bearer',
        scope,
      },
      { upsert: true, new: true }
    );

    return { success: true };
  } catch (error) {
    console.error('Error storing GitHub token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store GitHub token',
    };
  }
}

/**
 * Fetch the authenticated user's GitHub repositories
 */
export async function fetchGitHubRepos(idToken: string): Promise<GitHubRepo[]> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized. Please configure your environment variables in .env.local');
    }
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Connect to MongoDB
    await connectToDatabase();

    // Retrieve the GitHub access token from MongoDB
    const tokenDoc = await GitHubTokenModel.findOne({ userId: uid });

    if (!tokenDoc) {
      throw new Error('GitHub token not found. Please reconnect your GitHub account.');
    }

    const accessToken = tokenDoc.accessToken;

    // Fetch repositories from GitHub API
    const response = await fetch('https://api.github.com/user/repos?type=all&per_page=100&sort=updated', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
    }

    const repos: GitHubRepo[] = await response.json();
    return repos;
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    throw error;
  }
}

/**
 * Import a repository as a project
 */
export async function importRepository(
  idToken: string,
  repoData: {
    repoName: string;
    githubRepoId: number;
    cloneUrl: string;
    description: string | null;
    defaultBranch: string;
  }
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized. Please configure your environment variables in .env.local');
    }
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Connect to MongoDB
    await connectToDatabase();

    // Create a new project document in MongoDB
    const project = await ProjectModel.create({
      userId: uid,
      name: repoData.repoName,
      repoUrl: repoData.cloneUrl,
      branch: repoData.defaultBranch,
    });

    return {
      success: true,
      projectId: String(project._id),
    };
  } catch (error) {
    console.error('Error importing repository:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import repository',
    };
  }
}

/**
 * Get all projects for the authenticated user
 */
export async function getUserProjects(idToken: string) {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized. Please configure your environment variables in .env.local');
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Connect to MongoDB
    await connectToDatabase();

    const projects = await ProjectModel.find({ userId: uid })
      .sort({ createdAt: -1 })
      .lean();

    return projects.map((project) => ({
      ...project,
      _id: String(project._id),
    }));
  } catch (error) {
    console.error('Error fetching user projects:', error);
    throw error;
  }
}

/**
 * Fetch repository files from GitHub and store in MongoDB
 */
export async function fetchAndStoreRepoFiles(
  idToken: string,
  projectId: string,
  owner: string,
  repo: string,
  branch?: string
): Promise<{ success: boolean; fileCount?: number; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Connect to MongoDB
    await connectToDatabase();

    // Get GitHub access token
    const tokenDoc = await GitHubTokenModel.findOne({ userId: uid });

    if (!tokenDoc) {
      throw new Error('GitHub token not found');
    }

    const accessToken = tokenDoc.accessToken;

    // Get repository tree (all files)
    const branchToUse = branch || 'main';
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branchToUse}?recursive=1`;
    
    const treeResponse = await fetch(treeUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!treeResponse.ok) {
      throw new Error(`Failed to fetch repository tree: ${treeResponse.status}`);
    }

    const treeData = await treeResponse.json();
    const files: FileData[] = [];

    // Filter for blob (file) types and fetch content
    const fileItems = treeData.tree.filter((item: any) => item.type === 'blob');
    
    // Limit to reasonable number of files to avoid overwhelming MongoDB
    const maxFiles = 100;
    const filesToFetch = fileItems.slice(0, maxFiles);

    for (const item of filesToFetch) {
      try {
        // Fetch file content
        const contentResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}?ref=${branchToUse}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          
          // Decode base64 content
          const content = Buffer.from(contentData.content, 'base64').toString('utf-8');
          
          // Determine MIME type based on file extension
          const mimeType = getMimeType(item.path);

          files.push({
            filename: item.path.split('/').pop() || item.path,
            filepath: `/${item.path}`,
            content,
            size: item.size,
            mimeType,
            encoding: 'utf-8',
            githubUrl: contentData.html_url,
            branch: branchToUse,
            commitSha: item.sha,
          });
        }
      } catch (error) {
        console.error(`Error fetching file ${item.path}:`, error);
        // Continue with other files
      }
    }

    // Store files in MongoDB
    if (files.length > 0) {
      const result = await storeFiles(idToken, projectId, files);
      if (!result.success) {
        throw new Error(result.error || 'Failed to store files');
      }
    }

    return {
      success: true,
      fileCount: files.length,
    };
  } catch (error) {
    console.error('Error fetching and storing repo files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch repository files',
    };
  }
}

/**
 * Fetch and store repository files from a GitHub URL
 * Uses authenticated requests if GitHub token is available (higher rate limit)
 * Falls back to unauthenticated requests for public repos
 */
export async function fetchPublicRepoFiles(
  idToken: string,
  projectId: string,
  repoUrl: string,
  branch?: string
): Promise<{ success: boolean; fileCount?: number; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    await connectToDatabase();

    // Try to get GitHub access token for authenticated requests (higher rate limit)
    const tokenDoc = await GitHubTokenModel.findOne({ userId: uid });
    const accessToken = tokenDoc?.accessToken;
    
    console.log(`[GitHub API] User ${uid} - Token found: ${!!accessToken}`);

    // Parse GitHub URL to extract owner and repo
    // Supports: https://github.com/owner/repo or https://github.com/owner/repo.git
    const urlMatch = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+?)(\.git)?$/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = urlMatch;
    const branchToUse = branch || 'main';

    // Get repository tree (all files) - use auth token if available for higher rate limit
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branchToUse}?recursive=1`;
    
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    
    const treeResponse = await fetch(treeUrl, { headers });

    if (!treeResponse.ok) {
      // Try 'master' branch if 'main' fails
      if (branchToUse === 'main') {
        return fetchPublicRepoFiles(idToken, projectId, repoUrl, 'master');
      }
      throw new Error(`Failed to fetch repository tree: ${treeResponse.status} - ${await treeResponse.text()}`);
    }

    const treeData = await treeResponse.json();
    const files: FileData[] = [];

    // Filter for blob (file) types
    const fileItems = treeData.tree.filter((item: any) => item.type === 'blob');
    
    // Limit to reasonable number of files
    const maxFiles = 200;
    const filesToFetch = fileItems.slice(0, maxFiles);

    console.log(`Fetching ${filesToFetch.length} files from ${owner}/${repo}...`);

    // Fetch files in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < filesToFetch.length; i += batchSize) {
      const batch = filesToFetch.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (item: any) => {
          try {
            // Fetch file content - use auth token if available
            const contentResponse = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}?ref=${branchToUse}`,
              { headers }
            );

            if (contentResponse.ok) {
              const contentData = await contentResponse.json();
              
              // Decode base64 content
              const content = Buffer.from(contentData.content, 'base64').toString('utf-8');
              
              // Determine MIME type
              const mimeType = getMimeType(item.path);

              files.push({
                filename: item.path.split('/').pop() || item.path,
                filepath: `/${item.path}`,
                content,
                size: item.size,
                mimeType,
                encoding: 'utf-8',
                githubUrl: contentData.html_url,
                branch: branchToUse,
                commitSha: item.sha,
              });
            }
          } catch (error) {
            console.error(`Error fetching file ${item.path}:`, error);
            // Continue with other files
          }
        })
      );
    }

    // Store files in MongoDB
    if (files.length > 0) {
      const result = await storeFiles(idToken, projectId, files);
      if (!result.success) {
        throw new Error(result.error || 'Failed to store files');
      }
    }

    return {
      success: true,
      fileCount: files.length,
    };
  } catch (error) {
    console.error('Error fetching public repo files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch repository files',
    };
  }
}

/**
 * Helper function to determine MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Text
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
    
    // Code
    js: 'text/javascript',
    jsx: 'text/javascript',
    ts: 'text/typescript',
    tsx: 'text/typescript',
    py: 'text/x-python',
    java: 'text/x-java',
    c: 'text/x-c',
    cpp: 'text/x-c++',
    h: 'text/x-c',
    css: 'text/css',
    scss: 'text/x-scss',
    html: 'text/html',
    php: 'text/x-php',
    rb: 'text/x-ruby',
    go: 'text/x-go',
    rs: 'text/x-rust',
    
    // Config
    yaml: 'text/yaml',
    yml: 'text/yaml',
    toml: 'text/x-toml',
    ini: 'text/plain',
    env: 'text/plain',
    
    // Documentation
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return mimeTypes[ext || ''] || 'text/plain';
}
