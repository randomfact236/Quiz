/**
 * ============================================================================
 * Media Service
 * ============================================================================
 * Upload + sharp WebP conversion pipeline for the media library. Ported from
 * the affiliate-website project (media.service.ts) and adapted to TypeORM.
 * ============================================================================
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import sharp from 'sharp';

import { QueryMediaDto, ConversionStats, MediaListResponse } from './dto/media.dto';
import { Media, MediaConversionStatus } from './entities/media.entity';
import { ImageRiddle } from '../image-riddles/entities/image-riddle.entity';
import { StorageService } from './storage.service';

/** Allowed upload MIME types — anything else is rejected before decoding. */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_');
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    @InjectRepository(ImageRiddle)
    private readonly imageRiddleRepo: Repository<ImageRiddle>,
    private readonly storageService: StorageService
  ) {}

  /**
   * Store an uploaded image: verify it decodes with sharp, re-encode as WebP
   * (quality 80), persist to /uploads and record metadata.
   */
  async createFromFile(file: Express.Multer.File, alt?: string): Promise<Media> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    let width: number | undefined;
    let height: number | undefined;
    let webpBuffer: Buffer;
    try {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;
      webpBuffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
    } catch {
      throw new BadRequestException('Invalid image file.');
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${sanitizeFilename(
      path.parse(file.originalname).name
    )}.webp`;
    const url = this.storageService.uploadFile(webpBuffer, filename);

    const media = this.mediaRepo.create({
      filename,
      url,
      alt: alt ?? null,
      mimeType: file.mimetype,
      fileSize: file.buffer.length,
      width: width ?? null,
      height: height ?? null,
      isConverted: true,
      conversionStatus: MediaConversionStatus.COMPLETED,
      variants: { webp: { url, fileSize: webpBuffer.length } },
    });

    const saved = await this.mediaRepo.save(media);
    this.logger.log(`Stored media ${saved.id} (${filename}, ${webpBuffer.length}B webp)`);
    return saved;
  }

  async findAll(query: QueryMediaDto): Promise<MediaListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const qb = this.mediaRepo.createQueryBuilder('media').orderBy('media.createdAt', 'DESC');

    if (query.search && query.search.trim().length > 0) {
      qb.where('media.filename ILIKE :search', { search: `%${query.search}%` });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID "${id}" not found`);
    }
    return media;
  }

  async updateAlt(id: string, alt: string | undefined): Promise<Media> {
    const media = await this.findOne(id);
    if (alt !== undefined) {
      media.alt = alt;
    }
    return this.mediaRepo.save(media);
  }

  /** Check if a media asset is referenced by any image riddle. */
  async getUsageCount(mediaUrl: string): Promise<number> {
    // Match by the relative path portion (e.g. /uploads/filename.webp)
    // since image_riddles.imageUrl may store either the relative path or
    // a fully-resolved absolute URL depending on how it was inserted.
    return this.imageRiddleRepo
      .createQueryBuilder('riddle')
      .where('riddle.imageUrl LIKE :pattern', { pattern: `%${mediaUrl}` })
      .getCount();
  }

  /** DB record first, then best-effort file cleanup. */
  async remove(id: string): Promise<void> {
    const media = await this.findOne(id);

    const usageCount = await this.getUsageCount(media.url);
    if (usageCount > 0) {
      throw new ConflictException(
        `Cannot delete media "${media.filename}": it is used by ${usageCount} image riddle(s). Remove the riddle(s) first or update their image URL.`
      );
    }

    await this.mediaRepo.delete(id);
    this.storageService.deleteFile(media.url);
  }

  async getStats(): Promise<ConversionStats> {
    const [total, converted, pending] = await Promise.all([
      this.mediaRepo.count(),
      this.mediaRepo.count({ where: { conversionStatus: MediaConversionStatus.COMPLETED } }),
      this.mediaRepo.count({
        where: [
          { conversionStatus: MediaConversionStatus.PENDING },
          { conversionStatus: MediaConversionStatus.PROCESSING },
        ],
      }),
    ]);

    // Storage saved = original sizes minus stored webp variant sizes.
    const rows = await this.mediaRepo
      .createQueryBuilder('media')
      .select('COALESCE(SUM(media.fileSize), 0)', 'original')
      .getRawOne<{ original: string }>();
    const variantRows = await this.mediaRepo.find({ select: ['variants'] });
    let convertedBytes = 0;
    for (const row of variantRows) {
      if (row.variants?.webp) {
        convertedBytes += row.variants.webp.fileSize;
      }
    }
    const originalBytes = parseInt(rows?.original ?? '0', 10);

    return {
      total,
      converted,
      pending,
      storageSavedBytes: Math.max(0, originalBytes - convertedBytes),
    };
  }
}
