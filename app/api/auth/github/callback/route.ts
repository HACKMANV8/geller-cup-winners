import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GitHubTokenModel from '@/lib/models/GitHubToken';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the Firebase UID

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_params', request.url)
      );
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      console.error('GitHub OAuth credentials not configured');
      return NextResponse.redirect(
        new URL('/dashboard?error=oauth_not_configured', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token');
      return NextResponse.redirect(
        new URL('/dashboard?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData.error);
      return NextResponse.redirect(
        new URL(`/dashboard?error=${tokenData.error}`, request.url)
      );
    }

    const accessToken = tokenData.access_token;
    const tokenType = tokenData.token_type;
    const scope = tokenData.scope;

    // Store the token in MongoDB
    await connectToDatabase();
    await GitHubTokenModel.findOneAndUpdate(
      { userId: state },
      {
        userId: state,
        accessToken,
        tokenType,
        scope,
      },
      { upsert: true, new: true }
    );

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      new URL('/dashboard?github_connected=true', request.url)
    );
  } catch (error) {
    console.error('Error in GitHub OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=callback_failed', request.url)
    );
  }
}
