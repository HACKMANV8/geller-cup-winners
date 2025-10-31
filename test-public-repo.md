# Test Public Repository Fetch

## Quick Test Command

You can test the `fetchPublicRepoFiles` function with this example:

```typescript
// In your frontend or API route:
import { fetchPublicRepoFiles } from '@/app/actions/github.actions';

// Test with a small public repo
const result = await fetchPublicRepoFiles(
  firebaseIdToken,
  projectId,
  'https://github.com/vercel/next.js',
  'canary'
);

console.log(result);
// Expected output:
// { success: true, fileCount: 200 }
```

## Test Repositories (Small & Fast)

Good repos for testing (small file count):

1. **Hello World Repos**
   - `https://github.com/octocat/Hello-World`
   - ~5 files, very fast

2. **Simple Examples**
   - `https://github.com/vercel/next.js/tree/canary/examples/hello-world`
   - Note: Use main repo URL, specify branch

3. **Your Own Public Repos**
   - Any public GitHub repository you own

## Manual Test via API

If you create the API endpoint, test with curl:

```bash
# Get your Firebase ID token first (from browser console)
TOKEN="your-firebase-id-token"
PROJECT_ID="your-project-id"

curl -X POST http://localhost:3001/api/projects/$PROJECT_ID/fetch-files \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/octocat/Hello-World",
    "branch": "master"
  }'
```

## Expected Response

```json
{
  "success": true,
  "fileCount": 5
}
```

## Verify Files in MongoDB

After fetching, verify files were stored:

```typescript
import { getProjectFiles } from '@/app/actions/file.actions';

const files = await getProjectFiles(firebaseIdToken, projectId);
console.log(`Total files stored: ${files.files?.length}`);
console.log('Files:', files.files?.map(f => f.filepath));
```

## Common Issues

1. **"Invalid GitHub repository URL"**
   - Check URL format: `https://github.com/owner/repo`
   - Remove trailing slashes

2. **"Failed to fetch repository tree: 404"**
   - Repository doesn't exist or is private
   - Try with a known public repo first

3. **"Failed to fetch repository tree: 403"**
   - Rate limit exceeded (60 requests/hour)
   - Wait an hour or use authenticated API

4. **Branch not found**
   - Function auto-retries with `master` if `main` fails
   - Specify correct branch explicitly
