/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { adminAuth, adminDb } from '@/lib/firebase/admin';

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
