# MongoDB Integration Guide

This application uses MongoDB to store files and project data. Follow this guide to set up and use MongoDB in your project.

## Setup

### 1. Environment Variables

Add your MongoDB connection string to `.env.local`:

```env
MONGODB_URI="mongodb+srv://kaminibanait03_db_user:jRI9ccJAtUkz9a80@cluster0.kluami9.mongodb.net/"
```

**Note:** Make sure to add a database name to the connection string:
```env
MONGODB_URI="mongodb+srv://kaminibanait03_db_user:jRI9ccJAtUkz9a80@cluster0.kluami9.mongodb.net/mcp-deploy?retryWrites=true&w=majority"
```

### 2. Database Structure

The application uses the following collections:

#### Files Collection
Stores file content and metadata for projects.

**Schema:**
- `userId` (String, indexed) - Firebase user ID
- `projectId` (String, indexed) - Project identifier
- `filename` (String) - Name of the file
- `filepath` (String) - Full path of the file
- `content` (String) - File content
- `size` (Number) - File size in bytes
- `mimeType` (String) - MIME type of the file
- `encoding` (String) - File encoding (default: utf-8)
- `githubUrl` (String, optional) - GitHub URL
- `branch` (String, optional) - Git branch
- `commitSha` (String, optional) - Git commit SHA
- `createdAt` (Date) - Creation timestamp
- `updatedAt` (Date) - Last update timestamp

**Indexes:**
- Compound index on `userId` and `projectId`
- Unique compound index on `projectId` and `filepath`

## Usage

### File Operations

The application provides the following file operations through server actions:

#### 1. Store a Single File

```typescript
import { storeFile } from '@/app/actions/file.actions';

const result = await storeFile(idToken, projectId, {
  filename: 'example.txt',
  filepath: '/src/example.txt',
  content: 'File content here',
  size: 1024,
  mimeType: 'text/plain',
  encoding: 'utf-8',
});
```

#### 2. Store Multiple Files (Batch)

```typescript
import { storeFiles } from '@/app/actions/file.actions';

const files = [
  {
    filename: 'file1.txt',
    filepath: '/src/file1.txt',
    content: 'Content 1',
    size: 512,
  },
  {
    filename: 'file2.txt',
    filepath: '/src/file2.txt',
    content: 'Content 2',
    size: 768,
  },
];

const result = await storeFiles(idToken, projectId, files);
```

#### 3. Get a Single File

```typescript
import { getFile } from '@/app/actions/file.actions';

const result = await getFile(idToken, projectId, '/src/example.txt');
if (result.success) {
  console.log(result.file);
}
```

#### 4. Get All Project Files

```typescript
import { getProjectFiles } from '@/app/actions/file.actions';

const result = await getProjectFiles(idToken, projectId);
if (result.success) {
  console.log(result.files);
}
```

#### 5. Delete a File

```typescript
import { deleteFile } from '@/app/actions/file.actions';

const result = await deleteFile(idToken, projectId, '/src/example.txt');
```

#### 6. Delete All Project Files

```typescript
import { deleteProjectFiles } from '@/app/actions/file.actions';

const result = await deleteProjectFiles(idToken, projectId);
```

#### 7. Search Files

```typescript
import { searchFiles } from '@/app/actions/file.actions';

const result = await searchFiles(idToken, projectId, 'search query');
if (result.success) {
  console.log(result.files);
}
```

#### 8. Get File Statistics

```typescript
import { getProjectFileStats } from '@/app/actions/file.actions';

const result = await getProjectFileStats(idToken, projectId);
if (result.success) {
  console.log(result.stats);
  // { totalFiles, totalSize, avgSize, mimeTypes }
}
```

### Using the FileManager Component

The `FileManager` component provides a complete UI for managing files:

```tsx
import FileManager from '@/components/FileManager';

export default function ProjectPage() {
  const projectId = 'your-project-id';
  
  return (
    <div>
      <FileManager projectId={projectId} />
    </div>
  );
}
```

Features:
- Upload multiple files
- View all files with metadata
- Search files by name, path, or content
- Delete files
- View file statistics (total files, total size, average size)

## Integration with GitHub

When importing a repository, you can store all files from GitHub:

```typescript
import { storeFiles } from '@/app/actions/file.actions';

// After cloning/fetching from GitHub
const githubFiles = await fetchFilesFromGitHub(repo);

const fileData = githubFiles.map(file => ({
  filename: file.name,
  filepath: file.path,
  content: file.content,
  size: file.size,
  mimeType: getMimeType(file.name),
  githubUrl: file.url,
  branch: repo.default_branch,
  commitSha: file.sha,
}));

await storeFiles(idToken, projectId, fileData);
```

## Best Practices

1. **Batch Operations**: Use `storeFiles` for multiple files instead of calling `storeFile` in a loop
2. **Error Handling**: Always check the `success` field in the response
3. **File Size**: Be mindful of MongoDB's 16MB document size limit
4. **Indexing**: The schema includes indexes for efficient queries
5. **Security**: All operations require Firebase authentication via ID token

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify your MongoDB URI is correct
2. Check that your IP address is whitelisted in MongoDB Atlas
3. Ensure the database user has proper permissions
4. Check the MongoDB Atlas cluster status

### Performance

For large projects with many files:

1. Use batch operations (`storeFiles`) instead of individual calls
2. Consider pagination for file listings
3. Use search with specific queries instead of loading all files
4. Monitor MongoDB Atlas metrics for performance insights

## Security Notes

- Never commit `.env.local` to version control
- Rotate database credentials regularly
- Use MongoDB Atlas IP whitelist for additional security
- All file operations are scoped to the authenticated user
- Files are isolated by `userId` and `projectId`
