/**
 * ============================================================================
 * Image Riddles Service
 * ============================================================================
 * Public read queries + shared bulk status operations + stats. Canonical
 * CRUD (create/update/delete/categories) lives in AdminImageRiddlesService
 * (/admin/image-riddles/*) — see plan/04-image-riddles.md.
 * ============================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { SearchImageRiddlesDto } from '../common/dto/base.dto';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { ContentStatus } from '../common/enums/content-status.enum';
import { BulkActionResult } from '../common/interfaces/bulk-action-result.interface';
import { BulkActionService } from '../common/services/bulk-action.service';
import { settings } from '../config/settings';

import { ImageRiddleCategory } from './entities/image-riddle-category.entity';
import { ImageRiddle } from './entities/image-riddle.entity';

@Injectable()
export class ImageRiddlesService {
  constructor(
    @InjectRepository(ImageRiddle)
    private imageRiddleRepo: Repository<ImageRiddle>,
    @InjectRepository(ImageRiddleCategory)
    private categoryRepo: Repository<ImageRiddleCategory>,
    private cacheService: CacheService,
    private bulkActionService: BulkActionService
  ) {}

  // ==================== CATEGORIES ====================

  async findAllCategories(): Promise<ImageRiddleCategory[]> {
    return this.cacheService.getOrSet(
      'image-riddles:categories',
      async () => {
        return this.categoryRepo.find({
          order: { name: 'ASC' },
          relations: ['riddles'],
        });
      },
      settings.imageRiddles.cache.categoriesTtl
    );
  }

  async findCategoryById(id: string): Promise<ImageRiddleCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['riddles'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  // ==================== IMAGE RIDDLES ====================

  /** Public single read — always PUBLISHED only (mirrors riddle-mcq). */
  async findRiddleById(id: string): Promise<ImageRiddle> {
    const riddle = await this.imageRiddleRepo.findOne({
      where: { id, isActive: true, status: ContentStatus.PUBLISHED },
      relations: ['category'],
    });
    if (riddle === null) {
      throw new NotFoundException('Image riddle not found');
    }
    return riddle;
  }

  async findRandomRiddle(): Promise<ImageRiddle> {
    // More efficient random selection using offset with count
    const count = await this.imageRiddleRepo.count({
      where: { isActive: true, status: ContentStatus.PUBLISHED },
    });

    if (count === 0) {
      throw new NotFoundException('No image riddles found');
    }

    const randomOffset = Math.floor(Math.random() * count);
    const riddle = await this.imageRiddleRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.category', 'category')
      .where('riddle.isActive = :isActive', { isActive: true })
      .andWhere('riddle.status = :status', { status: ContentStatus.PUBLISHED })
      .skip(randomOffset)
      .take(1)
      .getOne();

    if (riddle === null) {
      throw new NotFoundException('No image riddles found');
    }
    return riddle;
  }

  async searchRiddles(
    searchDto: SearchImageRiddlesDto
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? settings.global.pagination.defaultLimit;

    const queryBuilder = this.imageRiddleRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.category', 'category')
      .where('riddle.isActive = :isActive', { isActive: true })
      .andWhere('riddle.status = :status', { status: ContentStatus.PUBLISHED });

    if (searchDto.search !== undefined && searchDto.search.length > 0) {
      // SECURITY: Sanitize search input to prevent SQL injection
      const sanitizedSearch = searchDto.search.replace(/[%_]/g, '\\$&');
      queryBuilder.andWhere('(riddle.title ILIKE :search OR riddle.answer ILIKE :search)', {
        search: `%${sanitizedSearch}%`,
      });
    }

    if (searchDto.categoryId !== undefined && searchDto.categoryId.length > 0) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId: searchDto.categoryId });
    }

    if (searchDto.difficulty !== undefined && searchDto.difficulty.length > 0) {
      queryBuilder.andWhere('riddle.difficulty = :difficulty', {
        difficulty: searchDto.difficulty,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('riddle.createdAt', 'DESC')
      .getManyAndCount();

    // HARD-02/H1: the catalog must not ship the answer key — the game grades
    // server-side and reveals only on a correct guess or explicit reveal.
    const safe = data.map((riddle) => {
      const { answer, alternativeAnswers, ...rest } = riddle as unknown as Record<string, unknown>;
      return { ...rest, answerLength: typeof answer === 'string' ? answer.length : 0 };
    });
    return { data: safe as unknown as ImageRiddle[], total };
  }

  // ==================== BULK STATUS ACTIONS ====================
  // Single canonical status-change surface (publish/draft/trash/restore/delete).

  async bulkAction(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    return this.bulkActionService.executeBulkAction(
      this.imageRiddleRepo,
      'image-riddle',
      ids,
      action
    );
  }

  // ==================== STATS ====================

  async getStats(): Promise<{
    totalRiddles: number;
    totalCategories: number;
    riddlesByDifficulty: Record<string, number>;
    averageTimer: number;
  }> {
    // Get basic counts in parallel
    const [totalRiddles, totalCategories] = await Promise.all([
      this.imageRiddleRepo.count({ where: { isActive: true } }),
      this.categoryRepo.count(),
    ]);

    // Get difficulty counts using a single aggregation query - more efficient
    const difficultyStats = await this.imageRiddleRepo
      .createQueryBuilder('riddle')
      .select('riddle.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .where('riddle.isActive = :isActive', { isActive: true })
      .groupBy('riddle.difficulty')
      .getRawMany<{ difficulty: string; count: string }>();

    // Convert to record format
    const riddlesByDifficulty: Record<string, number> = {};
    for (const stat of difficultyStats) {
      riddlesByDifficulty[stat.difficulty] = parseInt(stat.count, 10);
    }

    // Ensure all standard difficulties are present
    const standardDifficulties = ['easy', 'medium', 'hard', 'expert'];
    for (const difficulty of standardDifficulties) {
      if (!(difficulty in riddlesByDifficulty)) {
        riddlesByDifficulty[difficulty] = 0;
      }
    }

    // Calculate average timer using a single query
    const timerResult = await this.imageRiddleRepo
      .createQueryBuilder('riddle')
      .select('AVG(COALESCE(riddle.timerSeconds, :defaultTimer))', 'average')
      .where('riddle.isActive = :isActive', { isActive: true })
      .setParameter('defaultTimer', settings.imageRiddles.defaults.timerSeconds)
      .getRawOne<{ average: string }>();

    const averageTimer = timerResult?.average ? Math.round(parseFloat(timerResult.average)) : 0;

    return {
      totalRiddles,
      totalCategories,
      riddlesByDifficulty,
      averageTimer,
    };
  }
  /**
   * Engagement counters (plan/04-image-riddles.md P1 #1). Atomic increments;
   * only PUBLISHED riddles count. Unknown types are rejected by the DTO.
   */
  async recordEngagement(id: string, type: 'view' | 'attempt' | 'solve'): Promise<void> {
    const column = type === 'view' ? 'views' : type === 'attempt' ? 'attempts' : 'solves';
    await this.imageRiddleRepo
      .createQueryBuilder()
      .update(ImageRiddle)
      .set({ [column]: () => `${column} + 1` })
      .where('"id" = :id AND "status" = :status', { id, status: ContentStatus.PUBLISHED })
      .execute();
  }
  /**
   * H1 (audit SEC-03): grade an image-riddle guess server-side (forgiving
   * matching: case/whitespace/articles/punctuation ignored + synonyms).
   */
  async checkGuess(
    riddleId: string,
    guess: string
  ): Promise<{ correct: boolean; answer?: string }> {
    const riddle = await this.imageRiddleRepo.findOne({
      where: { id: riddleId, status: ContentStatus.PUBLISHED },
    });
    if (!riddle) {
      throw new NotFoundException('Image riddle not found');
    }
    const normalizedGuess = this.normalizeGuess(guess);
    const candidates = [riddle.answer, ...(riddle.alternativeAnswers ?? [])];
    const correct =
      normalizedGuess.length > 0 &&
      candidates.some((candidate) => this.normalizeGuess(candidate) === normalizedGuess);
    // The answer is revealed once the guess is RIGHT. Wrong guesses get a
    // verdict only — the explicit reveal endpoint serves the give-up flow.
    return correct ? { correct: true, answer: riddle.answer } : { correct: false };
  }

  /**
   * HARD-02 (H1): explicit give-up reveal — serves the answer for ONE
   * published riddle (throttled route).
   */
  async revealAnswer(riddleId: string): Promise<{ answer: string }> {
    const riddle = await this.imageRiddleRepo.findOne({
      where: { id: riddleId, status: ContentStatus.PUBLISHED },
    });
    if (!riddle) {
      throw new NotFoundException('Image riddle not found');
    }
    return { answer: riddle.answer };
  }

  /** Mirrors the frontend image-riddle answer normalization. */
  private normalizeGuess(value: string): string {
    return (value ?? '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^(a|an|the)\s+/, '')
      .replace(/^["'(]+|["'.,!?;:)\]]+$/g, '')
      .trim();
  }
}
