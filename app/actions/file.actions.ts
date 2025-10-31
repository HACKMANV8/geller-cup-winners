/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import FileModel from '@/lib/models/File';
import { adminAuth } from '@/lib/firebase/admin';
import { FileData } from '@/types/file';

/**
 * Store a file in MongoDB
 */
export async function storeFile(
  idToken: string,
  projectId: string,
  fileData: FileData
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Connect to MongoDB
    await connectToDatabase();

    // Create or update the file
    const file = await FileModel.findOneAndUpdate(
      { projectId, filepath: fileData.filepath },
      {
        userId,
        projectId,
        ...fileData,
      },
      { upsert: true, new: true }
    );

    if (!file) {
      throw new Error('Failed to create or update file');
    }

    return {
      success: true,
      fileId: String(file._id),
    };
  } catch (error) {
    console.error('Error storing file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store file',
    };
  }
}

/**
 * Store multiple files in MongoDB (batch operation)
 */
export async function storeFiles(
  idToken: string,
  projectId: string,
  files: FileData[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectToDatabase();

    // Use bulkWrite for efficient batch operations
    const operations = files.map((fileData) => ({
      updateOne: {
        filter: { projectId, filepath: fileData.filepath },
        update: {
          $set: {
            userId,
            projectId,
            ...fileData,
          },
        },
        upsert: true,
      },
    }));

    const result = await FileModel.bulkWrite(operations);

    return {
      success: true,
      count: result.upsertedCount + result.modifiedCount,
    };
  } catch (error) {
    console.error('Error storing files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store files',
    };
  }
}

/**
 * Get a single file by filepath
 */
export async function getFile(
  idToken: string,
  projectId: string,
  filepath: string
): Promise<{ success: boolean; file?: any; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectToDatabase();

    const file = await FileModel.findOne({
      userId,
      projectId,
      filepath,
    }).lean();

    if (!file) {
      return {
        success: false,
        error: 'File not found',
      };
    }

    return {
      success: true,
      file: {
        ...file,
        _id: file._id.toString(),
      },
    };
  } catch (error) {
    console.error('Error getting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file',
    };
  }
}

/**
 * Get all files for a project
 */
export async function getProjectFiles(
  idToken: string,
  projectId: string
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectToDatabase();

    const files = await FileModel.find({
      userId,
      projectId,
    })
      .sort({ filepath: 1 })
      .lean();

    return {
      success: true,
      files: files.map((file) => ({
        ...file,
        _id: file._id.toString(),
      })),
    };
  } catch (error) {
    console.error('Error getting project files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project files',
    };
  }
}

/**
 * Delete a file
 */
export async function deleteFile(
  idToken: string,
  projectId: string,
  filepath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectToDatabase();

    const result = await FileModel.deleteOne({
      userId,
      projectId,
      filepath,
    });

    if (result.deletedCount === 0) {
      return {
        success: false,
        error: 'File not found',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * Delete all files for a project
 */
export async function deleteProjectFiles(
  idToken: string,
  projectId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectToDatabase();

    const result = await FileModel.deleteMany({
      userId,
      projectId,
    });

    return {
      success: true,
      count: result.deletedCount,
    };
  } catch (error) {
    console.error('Error deleting project files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project files',
    };
  }
}

/**
 * Search files by filename or content
 */
export async function searchFiles(
  idToken: string,
  projectId: string,
  query: string
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectToDatabase();

    const files = await FileModel.find({
      userId,
      projectId,
      $or: [
        { filename: { $regex: query, $options: 'i' } },
        { filepath: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
      ],
    })
      .sort({ filepath: 1 })
      .lean();

    return {
      success: true,
      files: files.map((file) => ({
        ...file,
        _id: file._id.toString(),
      })),
    };
  } catch (error) {
    console.error('Error searching files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search files',
    };
  }
}

/**
 * Get file statistics for a project
 */
export async function getProjectFileStats(
  idToken: string,
  projectId: string
): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin is not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    await connectToDatabase();

    const stats = await FileModel.aggregate([
      {
        $match: { userId, projectId },
      },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' },
          mimeTypes: { $addToSet: '$mimeType' },
        },
      },
    ]);

    return {
      success: true,
      stats: stats[0] || {
        totalFiles: 0,
        totalSize: 0,
        avgSize: 0,
        mimeTypes: [],
      },
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file stats',
    };
  }
}
