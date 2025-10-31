# MongoDB Quick Start Guide

## 1. Add Environment Variable

Add this line to your `.env.local` file:

```env
MONGODB_URI="mongodb+srv://kaminibanait03_db_user:jRI9ccJAtUkz9a80@cluster0.kluami9.mongodb.net/mcp-deploy?retryWrites=true&w=majority"
```

**Important:** Replace `mcp-deploy` with your preferred database name.

## 2. Start Your Application

```bash
npm run dev
```

The MongoDB connection will be established automatically when needed.

## 3. Test File Storage

### Option A: Use the FileManager Component

Add to any page (e.g., `/app/projects/[id]/page.tsx`):

```tsx
import FileManager from '@/components/FileManager';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <FileManager projectId={params.id} />
    </div>
  );
}
```

### Option B: Store Files from GitHub

When importing a repository, add this code:

```typescript
import { fetchAndStoreRepoFiles } from '@/app/actions/github.actions';

// After successful repository import
const [owner, repo] = repoData.repoName.split('/');
await fetchAndStoreRepoFiles(
  idToken,
  projectId,
  owner,
  repo,
  repoData.defaultBranch
);
```

## 4. Verify in MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to your cluster
3. Click "Browse Collections"
4. You should see a `files` collection with your stored files

## Common Operations

### Store a File
```typescript
import { storeFile } from '@/app/actions/file.actions';

await storeFile(idToken, projectId, {
  filename: 'test.txt',
  filepath: '/test.txt',
  content: 'Hello World',
  size: 11,
  mimeType: 'text/plain',
});
```

### Get All Files
```typescript
import { getProjectFiles } from '@/app/actions/file.actions';

const result = await getProjectFiles(idToken, projectId);
console.log(result.files);
```

### Search Files
```typescript
import { searchFiles } from '@/app/actions/file.actions';

const result = await searchFiles(idToken, projectId, 'search term');
console.log(result.files);
```

## Troubleshooting

### Connection Error
- Verify your MongoDB URI is correct in `.env.local`
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure the database user has read/write permissions

### Files Not Showing
- Check browser console for errors
- Verify Firebase authentication is working
- Ensure projectId is correct

### Performance Issues
- Use batch operations (`storeFiles`) for multiple files
- Consider adding pagination for large file lists
- Monitor MongoDB Atlas metrics

## Next Steps

- Read `MONGODB_SETUP.md` for detailed documentation
- Check `MONGODB_INTEGRATION_SUMMARY.md` for complete feature list
- Customize the FileManager component for your needs
