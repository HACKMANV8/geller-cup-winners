'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  storeFile,
  getProjectFiles,
  deleteFile,
  searchFiles,
  getProjectFileStats,
} from '@/app/actions/file.actions';
import { FileData, StoredFile, FileStats } from '@/types/file';
import { File, Trash2, Search, Upload, Loader } from 'lucide-react';

interface FileManagerProps {
  projectId: string;
}

export default function FileManager({ projectId }: FileManagerProps) {
  const { getIdToken } = useAuth();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFiles();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();
      if (!token) return;

      const result = await getProjectFiles(token, projectId);
      if (result.success && result.files) {
        setFiles(result.files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const result = await getProjectFileStats(token, projectId);
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadFiles();
      return;
    }

    try {
      setLoading(true);
      const token = await getIdToken();
      if (!token) return;

      const result = await searchFiles(token, projectId, searchQuery);
      if (result.success && result.files) {
        setFiles(result.files);
      }
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      setUploading(true);
      const token = await getIdToken();
      if (!token) return;

      for (const file of Array.from(fileList)) {
        const content = await file.text();
        const fileData: FileData = {
          filename: file.name,
          filepath: `/${file.name}`,
          content,
          size: file.size,
          mimeType: file.type || 'text/plain',
        };

        await storeFile(token, projectId, fileData);
      }

      await loadFiles();
      await loadStats();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filepath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = await getIdToken();
      if (!token) return;

      const result = await deleteFile(token, projectId, filepath);
      if (result.success) {
        await loadFiles();
        await loadStats();
      } else {
        alert(result.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">File Manager</h2>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            {uploading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Upload Files'}
            </span>
          </div>
        </label>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Files</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.totalFiles}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Size</div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatFileSize(stats.totalSize)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Avg Size</div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatFileSize(stats.avgSize)}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* File List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <File className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No files found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file._id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{file.filename}</div>
                  <div className="text-sm text-gray-500 truncate">{file.filepath}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                <button
                  onClick={() => handleDelete(file.filepath)}
                  className="text-red-600 hover:text-red-800 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
