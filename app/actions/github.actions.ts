/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { storeFiles } from './file.actions';
import { FileData } from '@/types/file';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  clone_url: string;
  html_url: string;
  private: boolean;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
  default_branch: string;
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

    // Retrieve the GitHub access token from Firestore
    const tokenDoc = await adminDb
      .collection('users')
      .doc(uid)
      .collection('private')
      .doc('github_token')
      .get();

    if (!tokenDoc.exists) {
      throw new Error('GitHub token not found. Please reconnect your GitHub account.');
    }

    const { accessToken } = tokenDoc.data() as { accessToken: string };

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
    if (!adminAuth || !adminDb) {
      throw new Error('Firebase Admin is not initialized. Please configure your environment variables in .env.local');
    }
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Create a new project document in Firestore
    const projectRef = adminDb.collection('projects').doc();
    
    await projectRef.set({
      userId: uid,
      repoName: repoData.repoName,
      githubRepoId: repoData.githubRepoId.toString(),
      cloneUrl: repoData.cloneUrl,
      description: repoData.description || '',
      branch: repoData.defaultBranch,
      status: 'Imported',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      projectId: projectRef.id,
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
    if (!adminAuth || !adminDb) {
      throw new Error('Firebase Admin is not initialized. Please configure your environment variables in .env.local');
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const projectsSnapshot = await adminDb
      .collection('projects')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const projects = projectsSnapshot.docs.map((doc: { id: any; data: () => any; }) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return projects;
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

    // Get GitHub access token
    const tokenDoc = await adminDb
      .collection('users')
      .doc(uid)
      .collection('private')
      .doc('github_token')
      .get();

    if (!tokenDoc.exists) {
      throw new Error('GitHub token not found');
    }

    const { accessToken } = tokenDoc.data() as { accessToken: string };

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
