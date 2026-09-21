import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ShareCount } from './entities/share-count.entity';

export interface ShareCountsMap {
  [contentId: string]: number;
}

const VALID_TYPES = new Set([
  'quiz-question',
  'riddle-question',
  'quiz-subject',
  'riddle-category',
  'image-riddle',
  'joke',
  'game',
  'home',
]);

@Injectable()
export class ShareCountsService {
  private readonly logger = new Logger(ShareCountsService.name);

  constructor(
    @InjectRepository(ShareCount)
    private readonly shareCountsRepository: Repository<ShareCount>,
    private readonly dataSource: DataSource
  ) {}

  /** Atomic upsert-increment; creates the row on the first share. */
  async record(contentType: string, contentId: string, platform = 'other'): Promise<void> {
    if (!VALID_TYPES.has(contentType)) {
      throw new Error(`Unsupported share contentType: ${contentType}`);
    }
    await this.dataSource.query(
      `INSERT INTO "share_counts" ("contentType", "contentId", "platform", "shares", "updatedAt")
       VALUES ($1, $2, $3, 1, now())
       ON CONFLICT ("contentType", "contentId", "platform")
       DO UPDATE SET "shares" = "share_counts"."shares" + 1, "updatedAt" = now()`,
      [contentType, contentId, platform]
    );
  }

  /** Public totals per content id (like the question-likes/counts contract). */
  async counts(contentType: string, contentIds: string[]): Promise<ShareCountsMap> {
    if (contentIds.length === 0) return {};
    const rows: Array<{ contentId: string; total: number }> = await this.dataSource.query(
      `SELECT "contentId", SUM("shares")::int AS total
       FROM "share_counts"
       WHERE "contentType" = $1 AND "contentId" = ANY($2)
       GROUP BY "contentId"`,
      [contentType, contentIds]
    );
    const map: ShareCountsMap = {};
    for (const row of rows) map[row.contentId] = Number(row.total);
    return map;
  }
}
