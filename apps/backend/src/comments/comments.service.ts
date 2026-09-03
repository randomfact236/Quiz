/**
 * ============================================================================
 * Comments Service — shared guess/chip/comment feed
 * ============================================================================
 * Implements comments-system plan §2: polymorphic feed (image riddles +
 * dad jokes), server-side correct-guess masking, chip aggregates, guest
 * ownership for delete-own, admin moderation, and family-scoped cache
 * invalidation on every write.
 *
 * Security invariants:
 * - `isCorrect` is computed server-side only and NEVER leaves the service;
 *   correct guesses are returned as `text: null, masked: true` so the raw
 *   answer can never leak through the feed.
 * - Guests may only delete comments whose `guestId` matches their own.
 * ============================================================================
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository, FindOptionsWhere } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { invalidateCacheFamilies } from '../common/content/content-cache.util';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { ContentStatus } from '../common/enums/content-status.enum';
import {
  BulkActionResult,
  StatusCountResponse,
} from '../common/interfaces/bulk-action-result.interface';
import { BulkActionService } from '../common/services/bulk-action.service';
import { GuestUsersService } from '../guest-users/guest-users.service';
import { DadJoke } from '../dad-jokes/entities/dad-joke.entity';
import { ImageRiddle } from '../image-riddles/entities/image-riddle.entity';

import { COMMENT_PAGINATION_DEFAULTS } from './dto/comments.dto';
import { Comment, CommentChip, CommentContentType, CommentKind } from './entities/comment.entity';

/** Public feed entry — masked shape, no isCorrect, no raw answer. */
export interface PublicComment {
  id: string;
  kind: CommentKind;
  /** null when masked (correct guess) or when the entry is a chip tap. */
  text: string | null;
  chip: string | null;
  /** Display name (guest-typed or logged-in user); null renders as "Guest". */
  authorName: string | null;
  masked: boolean;
  createdAt: string;
  /** Present on the caller's own entries (via guestId-scoped queries). */
  mine?: boolean;
}

export interface CommentFeed {
  items: PublicComment[];
  total: number;
  page: number;
  limit: number;
  chipCounts: Record<string, number>;
  guessesToday: number;
}

const FEED_CACHE_FAMILY = 'comments';
const FEED_CACHE_TTL_S = 30; // short TTL — feeds are social proof, staleness should stay tiny

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,
    @InjectRepository(ImageRiddle)
    private imageRiddleRepo: Repository<ImageRiddle>,
    @InjectRepository(DadJoke)
    private jokeRepo: Repository<DadJoke>,
    private guestUsersService: GuestUsersService,
    private cacheService: CacheService,
    private bulkActionService: BulkActionService
  ) {}

  // ==================== PUBLIC FEED ====================

  async findFeed(
    contentType: CommentContentType,
    contentId: string,
    page: number = COMMENT_PAGINATION_DEFAULTS.page,
    limit: number = COMMENT_PAGINATION_DEFAULTS.limit
  ): Promise<CommentFeed> {
    const cacheKey = `${FEED_CACHE_FAMILY}:${contentType}:${contentId}:feed:p${page}:l${limit}`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.loadFeed(contentType, contentId, page, limit),
      FEED_CACHE_TTL_S
    );
  }

  private async loadFeed(
    contentType: CommentContentType,
    contentId: string,
    page: number,
    limit: number
  ): Promise<CommentFeed> {
    const [rows, total, chipRows, guessesToday] = await Promise.all([
      this.commentRepo.find({
        where: {
          contentType,
          contentId,
          status: ContentStatus.PUBLISHED,
          kind: In([CommentKind.GUESS, CommentKind.COMMENT]),
        },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      }),
      this.commentRepo.count({
        where: {
          contentType,
          contentId,
          status: ContentStatus.PUBLISHED,
          kind: In([CommentKind.GUESS, CommentKind.COMMENT]),
        },
      }),
      // Chip tallies (aggregate over all pages, not just the current one)
      this.commentRepo
        .createQueryBuilder('comment')
        .select('comment.chip', 'chip')
        .addSelect('COUNT(*)', 'count')
        .where('comment.contentType = :contentType', { contentType })
        .andWhere('comment.contentId = :contentId', { contentId })
        .andWhere('comment.status = :status', { status: ContentStatus.PUBLISHED })
        .andWhere('comment.kind = :kind', { kind: CommentKind.CHIP })
        .groupBy('comment.chip')
        .getRawMany<{ chip: string; count: string }>(),
      // Social-proof line: guesses posted today
      this.commentRepo.count({
        where: {
          contentType,
          contentId,
          status: ContentStatus.PUBLISHED,
          kind: CommentKind.GUESS,
          createdAt: MoreThanOrEqual(startOfToday()),
        },
      }),
    ]);

    const items: PublicComment[] = rows.map((row) =>
      this.toPublicComment(row, { masked: row.isCorrect })
    );

    const chipCounts: Record<string, number> = {};
    for (const chipRow of chipRows) {
      if (chipRow.chip !== null) {
        chipCounts[chipRow.chip] = parseInt(chipRow.count, 10);
      }
    }

    return { items, total, page, limit, chipCounts, guessesToday };
  }

  /** Server-decided masking: correct guesses never expose their text. */
  private toPublicComment(
    comment: Comment,
    opts: { masked: boolean; mine?: boolean }
  ): PublicComment {
    return {
      id: comment.id,
      kind: comment.kind,
      text: opts.masked ? null : comment.text,
      chip: comment.chip,
      authorName: comment.authorName ?? null,
      masked: opts.masked,
      createdAt: comment.createdAt.toISOString(),
      ...(opts.mine !== undefined ? { mine: opts.mine } : {}),
    };
  }

  // ==================== CREATE ====================

  async create(
    guestId: string,
    dto: {
      contentType: CommentContentType;
      contentId: string;
      kind: CommentKind;
      text?: string;
      chip?: CommentChip;
      authorName?: string;
    },
    userId?: string | null
  ): Promise<PublicComment> {
    this.validateKindForContentType(dto.contentType, dto.kind);

    const text = dto.text?.trim() ?? '';
    const chip = dto.chip ?? null;

    if (dto.kind === CommentKind.CHIP) {
      if (chip === null) {
        throw new BadRequestException('Chip comments require a chip value');
      }
      if (text.length > 0) {
        throw new BadRequestException('Chip comments must not include text');
      }
    } else if (text.length === 0) {
      throw new BadRequestException('Text is required');
    }

    // Persist the guest (bootstrap) so admin panels can see the author.
    await this.guestUsersService.findOrCreate(guestId);

    let isCorrect = false;
    if (dto.contentType === CommentContentType.IMAGE_RIDDLE) {
      const riddle = await this.imageRiddleRepo.findOne({ where: { id: dto.contentId } });
      if (riddle === null) {
        throw new NotFoundException('Image riddle not found');
      }
      if (dto.kind === CommentKind.GUESS) {
        isCorrect = this.isGuessCorrect(riddle, text);
      }
    } else {
      const joke = await this.jokeRepo.findOne({ where: { id: dto.contentId } });
      if (joke === null) {
        throw new NotFoundException('Joke not found');
      }
    }

    const comment = this.commentRepo.create({
      contentType: dto.contentType,
      contentId: dto.contentId,
      guestId,
      userId: userId ?? null,
      kind: dto.kind,
      text: dto.kind === CommentKind.CHIP ? null : text,
      chip: dto.kind === CommentKind.CHIP ? chip : null,
      authorName: dto.authorName?.trim() || null,
      isCorrect,
      status: ContentStatus.PUBLISHED,
    });
    const saved = await this.commentRepo.save(comment);
    await this.invalidateFeedCache(dto.contentType, dto.contentId);

    return this.toPublicComment(saved, { masked: saved.isCorrect });
  }

  /** Same normalized compare as gameplay (case, articles, punctuation). */
  private isGuessCorrect(riddle: ImageRiddle, guess: string): boolean {
    const normalize = (value: string): string =>
      value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/^(a|an|the)\s+/, '')
        .replace(/^["'(]+|["'.,!?;:)\]]+$/g, '')
        .trim();

    const normalizedGuess = normalize(guess);
    if (normalizedGuess.length === 0) return false;
    const candidates = [riddle.answer, ...(riddle.alternativeAnswers ?? [])];
    return candidates.some((candidate) => normalize(candidate) === normalizedGuess);
  }

  /**
   * kind vs contentType matrix: jokes accept free-text comments only;
   * riddles accept guesses, chip taps, and comments.
   */
  private validateKindForContentType(contentType: CommentContentType, kind: CommentKind): void {
    if (contentType === CommentContentType.JOKE && kind !== CommentKind.COMMENT) {
      throw new BadRequestException(`Jokes accept kind='${CommentKind.COMMENT}' only`);
    }
  }

  // ==================== MY COMMENTS / DELETE-OWN ====================

  async findMyComments(
    contentType: CommentContentType,
    contentId: string,
    guestId: string,
    userId?: string | null
  ): Promise<PublicComment[]> {
    const identityFilter = userId ? [{ guestId, userId }, { userId }] : [{ guestId }];
    const rows = await this.commentRepo.find({
      where: identityFilter.map((identity) => ({
        contentType,
        contentId,
        status: ContentStatus.PUBLISHED,
        kind: In([CommentKind.GUESS, CommentKind.COMMENT]),
        ...identity,
      })),
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return rows.map((row) => this.toPublicComment(row, { masked: row.isCorrect, mine: true }));
  }

  /**
   * Public flag path (plan/07-comments.md P2): sets `flagged` so admin
   * moderation can surface it. Idempotent; hides nothing by itself.
   */
  async flag(id: string): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (comment === null) {
      throw new NotFoundException('Comment not found');
    }
    if (!comment.flagged) {
      comment.flagged = true;
      await this.commentRepo.save(comment);
    }
  }

  /** Delete own comment as a logged-in user (plan/07-comments.md P1 #1). */
  async removeAsUser(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (comment === null) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.commentRepo.remove(comment);
    await this.invalidateFeedCache(comment.contentType, comment.contentId);
  }

  async removeAsGuest(id: string, guestId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (comment === null) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.guestId !== guestId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.commentRepo.remove(comment);
    await this.invalidateFeedCache(comment.contentType, comment.contentId);
  }

  // ==================== ADMIN MODERATION ====================

  async findAllAdmin(params: {
    status?: ContentStatus;
    contentType?: CommentContentType;
    flagged?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<
      PublicComment & {
        isCorrect: boolean;
        status: ContentStatus;
        guestId: string;
        contentType: string;
        contentId: string;
      }
    >;
    total: number;
  }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const where: FindOptionsWhere<Comment> = {};
    if (params.status !== undefined) where.status = params.status;
    if (params.contentType !== undefined) where.contentType = params.contentType;
    if (params.flagged !== undefined) where.flagged = params.flagged;

    const [rows, total] = await this.commentRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        text: row.isCorrect ? null : row.text,
        chip: row.chip,
        authorName: row.authorName ?? null,
        masked: row.isCorrect,
        isCorrect: row.isCorrect,
        status: row.status,
        guestId: row.guestId,
        contentType: row.contentType,
        contentId: row.contentId,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
    };
  }

  async bulkAction(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(`[CommentsService] Executing bulk ${action} on ${ids.length} comments`);
    const result = await this.bulkActionService.executeBulkAction(
      this.commentRepo,
      'comment',
      ids,
      action
    );
    if (result.succeeded > 0) {
      await this.invalidateAllFeedCaches();
    }
    return result;
  }

  async getStatusCounts(): Promise<StatusCountResponse> {
    return this.bulkActionService.getStatusCounts(this.commentRepo);
  }

  /** Counts per content ID for 💬 chips on card backs (jokes grid). */
  async countByContentIds(
    contentType: CommentContentType,
    contentIds: string[]
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    if (contentIds.length === 0) return counts;

    return this.cacheService.getOrSet(
      // NOTE: the `:all` suffix matters — family invalidation clears
      // `comments:{type}:counts:*`, which must match this key.
      `${FEED_CACHE_FAMILY}:${contentType}:counts:all`,
      async () => {
        const rows = await this.commentRepo
          .createQueryBuilder('comment')
          .select('comment.contentId', 'contentId')
          .addSelect('COUNT(*)', 'count')
          .where('comment.contentType = :contentType', { contentType })
          .andWhere('comment.status = :status', { status: ContentStatus.PUBLISHED })
          .andWhere('comment.contentId IN (:...ids)', { ids: contentIds })
          .groupBy('comment.contentId')
          .getRawMany<{ contentId: string; count: string }>();

        const map: Record<string, number> = {};
        for (const row of rows) {
          map[row.contentId] = parseInt(row.count, 10);
        }
        return map;
      },
      FEED_CACHE_TTL_S
    );
  }

  // ==================== CACHE ====================

  private async invalidateFeedCache(
    contentType: CommentContentType,
    contentId: string
  ): Promise<void> {
    await invalidateCacheFamilies(this.cacheService, [
      `${FEED_CACHE_FAMILY}:${contentType}:${contentId}`,
    ]);
    // Counts are aggregated across content — cheap to just drop the bucket.
    await invalidateCacheFamilies(this.cacheService, [
      `${FEED_CACHE_FAMILY}:${contentType}:counts`,
    ]);
  }

  private async invalidateAllFeedCaches(): Promise<void> {
    await invalidateCacheFamilies(this.cacheService, [FEED_CACHE_FAMILY]);
  }
}
