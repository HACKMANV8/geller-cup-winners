# MongoDB Migration Complete

## What Changed

Successfully migrated from Firestore to MongoDB for storing:
- ✅ GitHub access tokens
- ✅ Projects
- ✅ Files (already implemented)

## New Files Created

1. **`lib/models/GitHubToken.ts`** - MongoDB model for storing GitHub OAuth tokens
2. **`lib/models/Project.ts`** - MongoDB model for storing user projects
3. **`app/api/projects/route.ts`** - REST API endpoints for projects (GET, POST, DELETE)

## Updated Files

1. **`app/actions/github.actions.ts`**
   - Removed Firestore dependencies (`adminDb`)
   - Added MongoDB connection and models
   - New function: `storeGitHubToken()` - Store GitHub OAuth tokens in MongoDB
   - Updated: `fetchGitHubRepos()` - Fetch repos from GitHub using MongoDB-stored token
   - Updated: `importRepository()` - Create projects in MongoDB
   - Updated: `getUserProjects()` - Fetch projects from MongoDB
   - Updated: `fetchAndStoreRepoFiles()` - Use MongoDB for token retrieval

2. **`app/actions/file.actions.ts`**
   - Fixed TypeScript error: Changed `file._id.toString()` to `String(file._id)`

## Benefits

- **Simplified infrastructure**: Single database (MongoDB) instead of Firebase + Firestore
- **No Firestore API required**: Eliminates the "SERVICE_DISABLED" error
- **Consistent data access**: All data operations use MongoDB
- **Better type safety**: Proper TypeScript types for all models

## How to Use

### 1. Store GitHub Token (after OAuth)
```typescript
import { storeGitHubToken } from '@/app/actions/github.actions';

const result = await storeGitHubToken(
  idToken,
  githubAccessToken,
  'bearer',
  'repo,user'
);
```

### 2. Fetch User's GitHub Repositories
```typescript
import { fetchGitHubRepos } from '@/app/actions/github.actions';

const repos = await fetchGitHubRepos(idToken);
// Returns array of GitHubRepo objects
```

### 3. Import Repository as Project
```typescript
import { importRepository } from '@/app/actions/github.actions';

const result = await importRepository(idToken, {
  repoName: 'my-repo',
  githubRepoId: 123456,
  cloneUrl: 'https://github.com/user/repo.git',
  description: 'My awesome project',
  defaultBranch: 'main',
});
```

### 4. Get User Projects
```typescript
import { getUserProjects } from '@/app/actions/github.actions';

const projects = await getUserProjects(idToken);
```

### 5. Projects API (REST)

**GET** `/api/projects` - List all projects
```bash
curl -H "Authorization: Bearer <firebase-id-token>" \
  http://localhost:3001/api/projects
```

**POST** `/api/projects` - Create a project
```bash
curl -X POST -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Project","repoUrl":"https://github.com/user/repo.git","branch":"main"}' \
  http://localhost:3001/api/projects
```

**DELETE** `/api/projects?id=<project-id>` - Delete a project
```bash
curl -X DELETE -H "Authorization: Bearer <firebase-id-token>" \
  http://localhost:3001/api/projects?id=<project-id>
```

## Environment Variables Required

Ensure your `.env.local` has:

```env
# MongoDB
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database"

# Firebase Admin (for authentication only)
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64="<base64-encoded-service-account>"
# OR
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Firebase Client (for frontend auth)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
```

## Next Steps

1. ✅ Start the dev server: `npm run dev`
2. ✅ Test GitHub OAuth flow and token storage
3. ✅ Test fetching repositories
4. ✅ Test importing repositories as projects
5. ✅ Test file storage from GitHub repos

## Notes

- **Firestore is no longer required** - You can disable it in Firebase Console if desired
- Firebase is still used for **authentication only** (Firebase Auth)
- All data storage now happens in MongoDB
