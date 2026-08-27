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
/**
 * Server origin — strips the entire API path (`/api`, `/api/v1`, etc.) so that
 * `/uploads/...` files are resolved against the host root, not the API prefix.
 */
const SERVER_ORIGIN = RAW_BASE.replace(/\/api(\/v[0-9]+)?\/?.*$/, '');

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

/** Human-readable byte size, e.g. `66.1 KB`. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

type SizeSource = Pick<MediaAsset, 'fileSize' | 'variants'>;

/** Size to display for an asset: converted WebP bytes when available, else original. */
export function getDisplayFileSize(asset: SizeSource): number {
  return asset.variants?.['webp']?.fileSize ?? asset.fileSize;
}

/** Percentage saved by WebP conversion (1–99), or null when unknown/no gain. */
export function getSavingsPercent(asset: SizeSource): number | null {
  const webp = asset.variants?.['webp']?.fileSize;
  if (!webp || !asset.fileSize || webp >= asset.fileSize) return null;
  const pct = Math.round((1 - webp / asset.fileSize) * 100);
  return pct > 0 ? pct : null;
}

/** Extract a user-presentable message from an unknown thrown value. */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'Unexpected error';
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
