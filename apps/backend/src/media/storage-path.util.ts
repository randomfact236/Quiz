/**
 * ============================================================================
 * Storage path helpers
 * ============================================================================
 * Resolves the public/uploads directories for the media library. Ported from
 * the affiliate-website project (storage-path.ts).
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';

/** Root directory served statically by the API. */
export function getPublicDir(): string {
  return process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR, '..')
    : path.join(process.cwd(), 'public');
}

/** Directory where uploads are written: <public>/uploads. */
export function getUploadsDir(): string {
  const uploadsDir = process.env.UPLOADS_DIR || path.join(getPublicDir(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}
