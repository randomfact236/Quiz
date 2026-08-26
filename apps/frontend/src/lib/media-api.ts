/**
 * ============================================================================
 * Media Library API
 * ============================================================================
 * Client for the backend media library (`/media/*`, admin JWT) plus a
 * `resolveMediaUrl` helper for `/uploads/...` paths served by the API.
 * ============================================================================
 */

import { apiRequest } from './api-client';

const RAW_BASE = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';
/** Server origin (strips a trailing /api) — where /uploads files are hosted. */
const SERVER_ORIGIN = RAW_BASE.replace(/\/api\/?$/, '');

/**
 * Resolve a stored media path to an absolute URL.
 * Absolute http(s) URLs pass through unchanged; `/uploads/...` paths get the
 * API server origin prefix.
 */
export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${SERVER_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  alt: string | null;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  isConverted: boolean;
  conversionStatus: string;
  variants?: Record<string, { url: string; fileSize: number }> | null;
  createdAt: string;
}

export interface MediaListResponse {
  data: MediaAsset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MediaStats {
  total: number;
  converted: number;
  pending: number;
  storageSavedBytes: number;
}

/**
 * Upload an image file; the server re-encodes it to WebP before storing.
 */
export async function uploadMedia(file: File, alt?: string): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);
  if (alt) formData.append('alt', alt);

  const response = await apiRequest<MediaAsset>('/media/upload', {
    method: 'POST',
    isAdmin: true,
    body: formData,
  });
  return response.data;
}

export async function listMedia(
  params: {
    search?: string | undefined;
    page?: number;
    limit?: number;
  } = {}
): Promise<MediaListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.append('search', params.search);
  qs.append('page', String(params.page ?? 1));
  qs.append('limit', String(params.limit ?? 50));

  const response = await apiRequest<MediaListResponse>(`/media?${qs.toString()}`, {
    isAdmin: true,
  });
  return response.data;
}

export async function deleteMedia(id: string): Promise<void> {
  await apiRequest(`/media/${id}`, { method: 'DELETE', isAdmin: true });
}

export async function getMediaStats(): Promise<MediaStats> {
  const response = await apiRequest<MediaStats>('/media/stats', { isAdmin: true });
  return response.data;
}
