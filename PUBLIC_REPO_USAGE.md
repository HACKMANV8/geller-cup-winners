# Fetching Public Repository Code

## Function: `fetchPublicRepoFiles`

This function fetches all files from a **public** GitHub repository and stores them in MongoDB. No GitHub authentication required.

## Usage

```typescript
import { fetchPublicRepoFiles } from '@/app/actions/github.actions';

const result = await fetchPublicRepoFiles(
  firebaseIdToken,
  projectId,
  'https://github.com/vercel/next.js',
  'main' // optional, defaults to 'main'
);

if (result.success) {
  console.log(`Successfully fetched ${result.fileCount} files`);
} else {
  console.error(`Error: ${result.error}`);
}
```

## Parameters

- **`idToken`** (string) - Firebase ID token for authentication
- **`projectId`** (string) - MongoDB project ID where files will be stored
- **`repoUrl`** (string) - Public GitHub repository URL
  - Supports: `https://github.com/owner/repo`
  - Supports: `https://github.com/owner/repo.git`
- **`branch`** (string, optional) - Branch name (defaults to `main`, falls back to `master`)

## Features

- ✅ **No GitHub authentication required** - Uses public GitHub API
- ✅ **Automatic branch detection** - Tries `main` first, falls back to `master`
- ✅ **Batch processing** - Fetches files in batches of 10 to avoid rate limiting
- ✅ **File limit** - Fetches up to 200 files (configurable)
- ✅ **MIME type detection** - Automatically detects file types
- ✅ **Error handling** - Continues fetching even if individual files fail
- ✅ **MongoDB storage** - Stores all files in MongoDB with metadata

## Example: Complete Flow

```typescript
// 1. Create a project
const project = await ProjectModel.create({
  userId: 'user123',
  name: 'Next.js',
  repoUrl: 'https://github.com/vercel/next.js',
  branch: 'main',
});

// 2. Fetch all files from the public repo
const result = await fetchPublicRepoFiles(
  firebaseIdToken,
  String(project._id),
  'https://github.com/vercel/next.js',
  'main'
);

// 3. Check results
console.log(`Fetched ${result.fileCount} files`);

// 4. Query files from MongoDB
import { getProjectFiles } from '@/app/actions/file.actions';

const filesResult = await getProjectFiles(firebaseIdToken, String(project._id));
console.log(`Stored files:`, filesResult.files);
```

## API Endpoint Example

You can also create an API endpoint to trigger this:

```typescript
// app/api/projects/[id]/fetch-files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchPublicRepoFiles } from '@/app/actions/github.actions';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(idToken);

    const { repoUrl, branch } = await request.json();
    
    const result = await fetchPublicRepoFiles(
      idToken,
      params.id,
      repoUrl,
      branch
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
```

## Rate Limits

GitHub's public API has rate limits:
- **Unauthenticated**: 60 requests per hour per IP
- **Authenticated**: 5,000 requests per hour

This function uses the **unauthenticated** API, so:
- Fetching 200 files = ~21 API calls (1 for tree + 20 batches)
- You can fetch ~2-3 repos per hour without hitting limits

## Supported Repository URLs

✅ `https://github.com/facebook/react`
✅ `https://github.com/vercel/next.js.git`
✅ `https://github.com/microsoft/vscode`

❌ Private repositories (use `fetchAndStoreRepoFiles` with authentication instead)

## Error Handling

The function handles common errors:
- Invalid GitHub URL format
- Repository not found (404)
- Branch not found (tries `master` if `main` fails)
- Rate limit exceeded
- Individual file fetch failures (logs but continues)

## What Gets Stored

Each file is stored in MongoDB with:
- `filename` - File name
- `filepath` - Full path in repo
- `content` - File content (decoded from base64)
- `size` - File size in bytes
- `mimeType` - Detected MIME type
- `encoding` - Character encoding (utf-8)
- `githubUrl` - Direct GitHub URL to file
- `branch` - Branch name
- `commitSha` - Git commit SHA
- `userId` - User ID (from Firebase token)
- `projectId` - Project ID
- `createdAt` - Timestamp
- `updatedAt` - Timestamp
