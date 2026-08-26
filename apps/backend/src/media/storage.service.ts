/**
 * ============================================================================
 * Storage Service
 * ============================================================================
 * Local-disk file storage for the media library. Ported from the
 * affiliate-website project (common/services/storage.service.ts).
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { getUploadsDir } from './storage-path.util';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  /** Write a buffer into /uploads and return its public URL path. */
  uploadFile(buffer: Buffer, filename: string): string {
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  }

  /** Read a previously stored file back by URL path. */
  downloadFile(url: string): Buffer {
    return fs.readFileSync(this.resolvePath(url));
  }

  deleteFile(url: string): void {
    try {
      const filePath = this.resolvePath(url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      // Orphaned-file cleanup is best-effort; DB record removal must not fail.
      this.logger.warn(`Failed to delete file for ${url}: ${(err as Error).message}`);
    }
  }

  fileExists(url: string): boolean {
    return fs.existsSync(this.resolvePath(url));
  }

  /** Map a public URL path (/uploads/<file>) to an absolute disk path. */
  private resolvePath(url: string): string {
    const relative = url.replace(/^\/uploads\//, '');
    return path.join(getUploadsDir(), path.basename(relative));
  }
}
