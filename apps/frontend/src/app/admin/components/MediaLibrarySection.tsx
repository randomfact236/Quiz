'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Trash2, Upload, Search, Image as ImageIcon } from 'lucide-react';

import {
  deleteMedia,
  getMediaStats,
  listMedia,
  resolveMediaUrl,
  uploadMedia,
  type MediaAsset,
  type MediaStats,
} from '@/lib/media-api';

export function MediaLibrarySection() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, s] = await Promise.all([
        listMedia({ search: search || undefined, page, limit: 24 }),
        getMediaStats(),
      ]);
      setAssets(list.data);
      setTotalPages(list.totalPages);
      setStats(s);
    } catch {
      setError('Failed to load media library. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await uploadMedia(file);
      await load();
    } catch {
      setError('Upload failed. Allowed: JPEG/PNG/WebP/GIF up to 5 MB.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media asset?')) return;
    await deleteMedia(id);
    await load();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Media Library</h2>
          <p className="text-sm text-gray-500 mt-1">Manage uploaded images and assets</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Assets', value: stats.total },
            { label: 'Converted', value: stats.converted },
            { label: 'Pending', value: stats.pending },
            { label: 'Storage Saved', value: formatSize(stats.storageSavedBytes) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by filename..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No media assets yet. Upload your first image.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {assets.map((a) => (
            <div
              key={a.id}
              className="group relative rounded-lg overflow-hidden border dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(a.url)}
                  alt={a.alt || a.filename}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-xs truncate text-gray-700 dark:text-gray-300" title={a.filename}>
                  {a.filename}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {formatSize(a.fileSize)}
                  {a.width && a.height ? ` · ${a.width}×${a.height}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 dark:border-gray-700"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 dark:border-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
