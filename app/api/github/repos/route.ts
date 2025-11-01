import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { fetchGitHubRepos } from '@/app/actions/github.actions';

/**
 * GET /api/github/repos - Get all GitHub repositories for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin is not initialized' },
        { status: 500 }
      );
    }

    // Verify the Firebase ID token
    await adminAuth.verifyIdToken(idToken);

    // Fetch repositories from GitHub
    const repos = await fetchGitHubRepos(idToken);

    return NextResponse.json({
      success: true,
      repos,
    });
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch GitHub repositories',
      },
      { status: 500 }
    );
  }
}

