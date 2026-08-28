/**
 * ============================================================================
 * Image Riddles Service
 * ============================================================================
 * Public read queries + shared bulk status operations + stats. Canonical
 * CRUD (create/update/delete/categories) lives in AdminImageRiddlesService
 * (/admin/image-riddles/*) — see docs/features/image-riddles.md.
 * ============================================================================
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { PaginationDto, SearchImageRiddlesDto } from '../common/dto/base.dto';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { ContentStatus } from '../common/enums/content-status.enum';
import {
  BulkActionResult,
  StatusCountResponse,
} from '../common/interfaces/bulk-action-result.interface';
import { BulkActionService } from '../common/services/bulk-action.service';
import { settings } from '../config/settings';

import { ImageRiddleCategory } from './entities/image-riddle-category.entity';
import { ImageRiddle } from './entities/image-riddle.entity';

@Injectable()
export class ImageRiddlesService {
  private readonly logger = new Logger(ImageRiddlesService.name);

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

  /** Public list — always PUBLISHED only (admins use /admin/image-riddles for all statuses). */
  async findAllRiddles(pagination: PaginationDto): Promise<{ data: ImageRiddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const where: FindOptionsWhere<ImageRiddle> = {
      isActive: true,
      status: ContentStatus.PUBLISHED,
    };

    const [data, total] = await this.imageRiddleRepo.findAndCount({
      where,
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

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

  async findRiddlesByCategory(
    categoryId: string,
    pagination: PaginationDto
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.imageRiddleRepo.findAndCount({
      where: { category: { id: categoryId }, isActive: true, status: ContentStatus.PUBLISHED },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findRiddlesByDifficulty(
    difficulty: string,
    pagination: PaginationDto
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.imageRiddleRepo.findAndCount({
      where: { difficulty, isActive: true, status: ContentStatus.PUBLISHED },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
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

    return { data, total };
  }

  // ==================== BULK STATUS ACTIONS ====================
  // Single canonical status-change surface (publish/draft/trash/restore/delete).

  async bulkAction(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(
      `[ImageRiddlesService] Executing bulk ${action} on ${ids.length} image riddles`
    );

    return this.bulkActionService.executeBulkAction(
      this.imageRiddleRepo,
      'image-riddle',
      ids,
      action
    );
  }

  async getStatusCounts(): Promise<StatusCountResponse> {
    return this.bulkActionService.getStatusCounts(this.imageRiddleRepo);
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
}
