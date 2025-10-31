import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GitHubTokenModel from '@/lib/models/GitHubToken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const firebaseUid = searchParams.get('firebaseUid');

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'Firebase UID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user has a GitHub token
    const tokenDoc = await GitHubTokenModel.findOne({ userId: firebaseUid });

    if (!tokenDoc) {
      return NextResponse.json({
        connected: false,
        username: null,
      });
    }

    // Verify the token is still valid by making a request to GitHub
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenDoc.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return NextResponse.json({
          connected: true,
          username: userData.login,
        });
      } else {
        // Token is invalid, delete it
        await GitHubTokenModel.deleteOne({ userId: firebaseUid });
        return NextResponse.json({
          connected: false,
          username: null,
        });
      }
    } catch (error) {
      console.error('Error verifying GitHub token:', error);
      return NextResponse.json({
        connected: false,
        username: null,
      });
    }
  } catch (error) {
    console.error('Error checking GitHub status:', error);
    return NextResponse.json(
      { error: 'Failed to check GitHub status' },
      { status: 500 }
    );
  }
}
