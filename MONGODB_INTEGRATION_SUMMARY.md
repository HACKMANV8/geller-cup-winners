# MongoDB Integration Summary

MongoDB has been successfully integrated into your MCP Deploy application for storing repository files.

## What Was Added

### 1. Dependencies
- **mongodb** - Official MongoDB driver
- **mongoose** - MongoDB ODM for schema modeling

### 2. Core Files Created

#### `/lib/mongodb.ts`
MongoDB connection utility with connection caching for optimal performance in Next.js.

#### `/lib/models/File.ts`
Mongoose schema for file storage with the following fields:
- User and project identification
- File metadata (name, path, size, MIME type)
- File content
- GitHub integration fields (URL, branch, commit SHA)
- Automatic timestamps

#### `/types/file.ts`
TypeScript type definitions for file operations.

#### `/app/actions/file.actions.ts`
Server actions for file operations:
- `storeFile()` - Store a single file
- `storeFiles()` - Batch store multiple files
- `getFile()` - Retrieve a single file
- `getProjectFiles()` - Get all files for a project
- `deleteFile()` - Delete a single file
- `deleteProjectFiles()` - Delete all project files
- `searchFiles()` - Search files by name/path/content
- `getProjectFileStats()` - Get file statistics

#### `/components/FileManager.tsx`
Complete UI component for file management with:
- File upload functionality
- File listing with metadata
- Search capability
- Delete operations
- Statistics display

### 3. GitHub Integration

Added `fetchAndStoreRepoFiles()` function in `/app/actions/github.actions.ts` that:
- Fetches repository file tree from GitHub
- Downloads file contents
- Automatically determines MIME types
- Stores files in MongoDB with metadata
- Links files to GitHub (URL, branch, commit SHA)

## Environment Setup

Add to your `.env.local`:

```env
MONGODB_URI="mongodb+srv://kaminibanait03_db_user:jRI9ccJAtUkz9a80@cluster0.kluami9.mongodb.net/mcp-deploy?retryWrites=true&w=majority"
```

**Note:** Add a database name (e.g., `mcp-deploy`) to the connection string.

## Usage Examples

### Store Files When Importing a Repository

```typescript
import { fetchAndStoreRepoFiles } from '@/app/actions/github.actions';

// After importing a repository
const result = await fetchAndStoreRepoFiles(
  idToken,
  projectId,
  'owner',
  'repo-name',
  'main' // branch
);

if (result.success) {
  console.log(`Stored ${result.fileCount} files`);
}
```

### Use the FileManager Component

```tsx
import FileManager from '@/components/FileManager';

export default function ProjectPage() {
  return (
    <div>
      <h1>Project Files</h1>
      <FileManager projectId="your-project-id" />
    </div>
  );
}
```

### Manual File Operations

```typescript
import { storeFile, getProjectFiles } from '@/app/actions/file.actions';

// Store a file
await storeFile(idToken, projectId, {
  filename: 'example.txt',
  filepath: '/src/example.txt',
  content: 'File content',
  size: 1024,
  mimeType: 'text/plain',
});

// Get all files
const result = await getProjectFiles(idToken, projectId);
console.log(result.files);
```

## Database Structure

### Collections

**files**
- Stores all file content and metadata
- Indexed by userId and projectId for fast queries
- Unique index on projectId + filepath to prevent duplicates

### Indexes

1. `{ userId: 1, projectId: 1 }` - Fast user/project queries
2. `{ projectId: 1, filepath: 1 }` - Unique constraint and fast lookups

## Features

✅ Store files from GitHub repositories  
✅ Upload files manually  
✅ Search files by name, path, or content  
✅ View file statistics (count, total size, average size)  
✅ Delete individual or all project files  
✅ Automatic MIME type detection  
✅ GitHub metadata tracking (URL, branch, commit)  
✅ Efficient batch operations  
✅ Connection caching for performance  

## Next Steps

1. **Add database name** to your MongoDB connection string
2. **Test the connection** by running the dev server
3. **Import a repository** to automatically store its files
4. **Use FileManager component** in your project pages

## Security Notes

- All operations require Firebase authentication
- Files are scoped to userId and projectId
- MongoDB connection string should never be committed to git
- Consider IP whitelisting in MongoDB Atlas for additional security

## Performance Considerations

- Files are limited to 100 per repository import (configurable)
- Batch operations are used for efficiency
- Connection pooling via Mongoose
- Indexes optimize common queries
- Consider pagination for large file sets

## Documentation

See `MONGODB_SETUP.md` for detailed documentation on all available operations and best practices.
