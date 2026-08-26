'use client';

/**
 * ============================================================================
 * MediaPicker — media library dialog
 * ============================================================================
 * Ported from the affiliate-website project (components/admin/media-picker.tsx)
 * and adapted to this project's adminApi/Tailwind conventions. Lets the admin
 * browse previously uploaded images, upload new ones (server-side WebP
 * conversion), and insert the selected URL.
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import {
  deleteMedia,
  listMedia,
  resolveMediaUrl,
  uploadMedia,
  type MediaAsset,
} from '@/lib/media-api';

export interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: { id: string; url: string; filename: string }) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
}: MediaPickerProps): JSX.Element | null {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (targetPage = page, searchTerm = search) => {
      setIsLoading(true);
      setError('');
      try {
        const result = await listMedia({
          search: searchTerm || undefined,
          page: targetPage,
          limit: 50,
        });
        setAssets(result.data);
        setTotal(result.total);
        setPage(result.page);
      } catch {
        setError('Failed to load media library.');
      } finally {
        setIsLoading(false);
      }
    },
    [page, search]
  );

  useEffect(() => {
    if (open) void load(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      setIsUploading(true);
      setUploadProgress(`Uploading ${file.name}...`);
      try {
        await uploadMedia(file);
        setUploadProgress('Converting to WebP...');
        await load(1, search);
      } catch {
        setError('Upload failed. Allowed: JPEG/PNG/WebP/GIF up to 5 MB.');
      } finally {
        setIsUploading(false);
        setUploadProgress('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [load, search]
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMedia(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
      setError('Failed to delete asset.');
    }
  }, []);

  if (!open) return null;

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-label="Media library"
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">🖼️ Media Library</h3>
            <p className="text-xs text-gray-500">
              {total} image{total === 1 ? '' : 's'} · uploads converted to WebP
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close media library"
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load(1, search);
            }}
            placeholder="Search by filename..."
            aria-label="Search media by filename"
            className="w-48 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={() => void load(1, search)}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Search
          </button>
          <div className="flex-1" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => void handleUpload(e.target.files)}
            aria-hidden="true"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {isUploading ? uploadProgress || 'Uploading...' : '⬆ Upload Image'}
          </button>
        </div>

        {error && (
          <p className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && !isUploading ? (
            <p className="py-12 text-center text-sm font-bold text-gray-400">Loading...</p>
          ) : assets.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No images yet. Upload one to get started.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative overflow-hidden rounded-xl border border-gray-100 shadow-sm"
                >
                  <button
                    onClick={() => {
                      onSelect({
                        id: asset.id,
                        url: resolveMediaUrl(asset.url),
                        filename: asset.filename,
                      });
                      onOpenChange(false);
                    }}
                    className="block w-full cursor-pointer"
                    title={`Insert ${asset.filename}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(asset.url)}
                      alt={asset.alt ?? asset.filename}
                      className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </button>
                  <div className="bg-white px-2 py-1.5">
                    <p className="truncate text-[10px] font-bold text-gray-700">{asset.filename}</p>
                    <p className="text-[9px] text-gray-400">
                      {formatBytes(asset.variants?.['webp']?.fileSize ?? asset.fileSize)}
                      {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleDelete(asset.id)}
                    aria-label={`Delete ${asset.filename}`}
                    className="absolute right-1 top-1 hidden rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:block hover:bg-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 px-6 py-3">
            <button
              onClick={() => void load(page - 1, search)}
              disabled={page <= 1}
              className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => void load(page + 1, search)}
              disabled={page >= totalPages}
              className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaPicker;
