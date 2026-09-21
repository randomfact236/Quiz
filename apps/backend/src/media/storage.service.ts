/**
 * ============================================================================
 * Storage Service
 * ============================================================================
 * Media storage for the media library. Writes to Cloudflare R2 / any
 * S3-compatible bucket when the R2_* env vars are present; otherwise falls
 * back to local disk under UPLOADS_DIR (unchanged behaviour).
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

import { getUploadsDir } from './storage-path.util';

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor() {
    const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
    const accessKeyId = (process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (
      process.env.R2_SECRET_ACCESS_KEY ||
      process.env.S3_SECRET_ACCESS_KEY ||
      ''
    ).trim();
    const bucket = (process.env.R2_BUCKET || process.env.S3_BUCKET || '').trim();
    const endpoint = (
      process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
    ).trim();
    const publicBase = (process.env.R2_PUBLIC_BASE_URL || process.env.S3_PUBLIC_BASE_URL || '')
      .trim()
      .replace(/\/+$/, '');

    this.bucket = bucket;
    this.publicBase = publicBase;

    if (endpoint && accessKeyId && secretAccessKey && bucket && publicBase) {
      this.client = new S3Client({
        region: (process.env.R2_REGION || 'auto').trim(),
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
      this.logger.log(`Object storage enabled (bucket=${bucket}, publicBase=${publicBase})`);
    } else {
      this.client = null;
      this.logger.log('Object storage disabled - using local disk (UPLOADS_DIR)');
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  /** Store a buffer and return its public URL (absolute R2 URL or /uploads path). */
  async uploadFile(buffer: Buffer, filename: string): Promise<string> {
    if (this.client) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: `uploads/${filename}`,
          Body: buffer,
          ContentType: contentTypeFor(filename),
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      return `${this.publicBase}/uploads/${filename}`;
    }

    const filePath = path.join(getUploadsDir(), filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  }

  async deleteFile(url: string): Promise<void> {
    if (this.client && this.publicBase && url.startsWith(`${this.publicBase}/`)) {
      const key = url.slice(this.publicBase.length + 1);
      try {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      } catch (err) {
        this.logger.warn(`Failed to delete object ${key}: ${(err as Error).message}`);
      }
      return;
    }

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

  /** Map a public URL path (/uploads/<file>) to an absolute disk path. */
  private resolvePath(url: string): string {
    const relative = url.replace(/^\/uploads\//, '');
    return path.join(getUploadsDir(), path.basename(relative));
  }
}
