import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import {
  CreateImageRiddleDto,
  UpdateImageRiddleDto,
  CreateImageRiddleCategoryDto,
  UpdateImageRiddleCategoryDto,
} from '../../common/dto/base.dto';
import { ImageRiddleCategory } from '../../image-riddles/entities/image-riddle-category.entity';
import { ImageRiddle } from '../../image-riddles/entities/image-riddle.entity';

/** Mirrors settings.imageRiddles.defaults.timerSeconds (entity getDefaultTimer). */
const DEFAULT_TIMER_SECONDS = 90;

/**
 * Admin Image Riddles Service
 * Enterprise-grade service for admin operations
 */
@Injectable()
export class AdminImageRiddlesService {
  private readonly logger = new Logger(AdminImageRiddlesService.name);

  constructor(
    @InjectRepository(ImageRiddle)
    private readonly riddleRepo: Repository<ImageRiddle>,
    @InjectRepository(ImageRiddleCategory)
    private readonly categoryRepo: Repository<ImageRiddleCategory>,
    private readonly cacheService: CacheService
  ) {}

  // ============================================================================
  // RIDDLE OPERATIONS
  // ============================================================================

  /**
   * Find all riddles with pagination and filters
   */
  async findAllRiddles(
    page: number,
    limit: number,
    filters: {
      difficulty?: string;
      categoryId?: string;
      isActive?: boolean;
      search?: string;
    }
  ): Promise<{
    data: ImageRiddle[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: Record<string, unknown> = {};

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search && filters.search.trim().length > 0) {
      where.title = Like(`%${filters.search}%`);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.riddleRepo.findAndCount({
      where,
      relations: ['category'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    this.logger.debug(`Found ${total} riddles, returning page ${page} of ${totalPages}`);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find riddle by ID
   */
  async findRiddleById(id: string): Promise<ImageRiddle> {
    const riddle = await this.riddleRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (riddle === null) {
      this.logger.warn(`Riddle not found: ${id}`);
      throw new NotFoundException(`Image riddle with ID "${id}" not found`);
    }

    return riddle;
  }

  /**
   * Create new riddle
   */
  async createRiddle(dto: CreateImageRiddleDto): Promise<ImageRiddle> {
    // Validate category if provided
    if (dto.categoryId && dto.categoryId.length > 0) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (category === null) {
        throw new NotFoundException(`Category with ID "${dto.categoryId}" not found`);
      }
    }

    const riddle = this.riddleRepo.create({
      title: dto.title,
      imageUrl: dto.imageUrl,
      answer: dto.answer,
      alternativeAnswers: dto.alternativeAnswers ?? null,
      hint: dto.hint ?? null,
      difficulty: dto.difficulty,
      timerSeconds: dto.timerSeconds ?? null,
      showTimer: dto.showTimer ?? true,
      altText: dto.altText ?? null,
      categoryId: dto.categoryId ?? null,
      isActive: true,
    });

    const saved = await this.saveRiddleSafely(riddle);
    this.logger.log(`Created riddle: ${saved.id}`);

    await this.invalidateCache();
    return saved;
  }

  /**
   * Bulk create riddles
   */
  async createRiddlesBulk(
    dtos: CreateImageRiddleDto[]
  ): Promise<{ created: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;
    let failed = 0;

    for (const dto of dtos) {
      try {
        await this.createRiddle(dto);
        created++;
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to create "${dto.title}": ${message}`);
        this.logger.error(`Bulk create failed for "${dto.title}":`, error);
      }
    }

    this.logger.log(`Bulk create completed: ${created} created, ${failed} failed`);
    return { created, failed, errors };
  }

  /**
   * Update riddle
   */
  async updateRiddle(id: string, dto: UpdateImageRiddleDto): Promise<ImageRiddle> {
    const riddle = await this.findRiddleById(id);

    // Validate category if changing
    if (dto.categoryId !== undefined && dto.categoryId.length > 0) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (category === null) {
        throw new NotFoundException(`Category with ID "${dto.categoryId}" not found`);
      }
    }

    // Apply updates
    if (dto.title !== undefined) {
      riddle.title = dto.title;
    }
    if (dto.imageUrl !== undefined) {
      riddle.imageUrl = dto.imageUrl;
    }
    if (dto.answer !== undefined) {
      riddle.answer = dto.answer;
    }
    if (dto.alternativeAnswers !== undefined) {
      riddle.alternativeAnswers = dto.alternativeAnswers;
    }
    if (dto.hint !== undefined) {
      riddle.hint = dto.hint ?? null;
    }
    if (dto.difficulty !== undefined) {
      riddle.difficulty = dto.difficulty;
    }
    if (dto.timerSeconds !== undefined) {
      riddle.timerSeconds = dto.timerSeconds ?? null;
    }
    if (dto.showTimer !== undefined) {
      riddle.showTimer = dto.showTimer;
    }
    if (dto.altText !== undefined) {
      riddle.altText = dto.altText ?? null;
    }
    if (dto.categoryId !== undefined) {
      riddle.categoryId = dto.categoryId && dto.categoryId.length > 0 ? dto.categoryId : null;
    }
    if (dto.isActive !== undefined) {
      riddle.isActive = dto.isActive;
    }

    const saved = await this.saveRiddleSafely(riddle);
    this.logger.log(`Updated riddle: ${id}`);

    await this.invalidateCache();
    return saved;
  }

  /**
   * Save a riddle, mapping entity-level validation failures (action option
   * structure/duplicate IDs raised in BeforeInsert/BeforeUpdate hooks) to
   * 400 responses instead of bare 500s.
   */
  private async saveRiddleSafely(riddle: ImageRiddle): Promise<ImageRiddle> {
    try {
      return await this.riddleRepo.save(riddle);
    } catch (error) {
      if (error instanceof Error && this.isEntityValidationMessage(error.message)) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private isEntityValidationMessage(message: string): boolean {
    return (
      message.startsWith('Action options validation failed') || message.startsWith('Action with ID')
    );
  }

  /**
   * Soft delete riddle (set isActive to false)
   */
  async deleteRiddle(id: string): Promise<void> {
    const riddle = await this.findRiddleById(id);
    riddle.isActive = false;
    await this.riddleRepo.save(riddle);
    this.logger.log(`Soft deleted riddle: ${id}`);
    await this.invalidateCache();
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string): Promise<{ isActive: boolean }> {
    const riddle = await this.findRiddleById(id);
    riddle.isActive = !riddle.isActive;
    const saved = await this.riddleRepo.save(riddle);
    this.logger.log(`Toggled active status for riddle: ${id} -> ${saved.isActive}`);
    await this.invalidateCache();
    return { isActive: saved.isActive };
  }

  // ============================================================================
  // CATEGORY OPERATIONS
  // ============================================================================

  /**
   * Find all categories with riddle counts
   */
  async findAllCategories(): Promise<ImageRiddleCategory[]> {
    const categories = await this.categoryRepo.find({
      relations: ['riddles'],
      order: { name: 'ASC' },
    });

    return categories.map((cat) => ({
      ...cat,
      riddles: cat.riddles?.filter((r) => r.isActive) ?? [],
    }));
  }

  /**
   * Find category by ID
   */
  async findCategoryById(id: string): Promise<ImageRiddleCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['riddles'],
    });

    if (category === null) {
      this.logger.warn(`Category not found: ${id}`);
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  /**
   * Create category
   */
  async createCategory(dto: CreateImageRiddleCategoryDto): Promise<ImageRiddleCategory> {
    // Check for duplicate name
    const existing = await this.categoryRepo.findOne({
      where: { name: dto.name },
    });

    if (existing !== null) {
      throw new ConflictException(`Category with name "${dto.name}" already exists`);
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      emoji: dto.emoji ?? '🖼️',
      description: dto.description ?? null,
    });

    const saved = await this.categoryRepo.save(category);
    this.logger.log(`Created category: ${saved.id}`);

    await this.invalidateCache();
    return saved;
  }

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    dto: UpdateImageRiddleCategoryDto
  ): Promise<ImageRiddleCategory> {
    const category = await this.findCategoryById(id);

    // Check for duplicate name if changing
    if (dto.name !== undefined && dto.name !== category.name) {
      const existing = await this.categoryRepo.findOne({
        where: { name: dto.name },
      });
      if (existing !== null) {
        throw new ConflictException(`Category with name "${dto.name}" already exists`);
      }
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }
    if (dto.emoji !== undefined) {
      category.emoji = dto.emoji;
    }
    if (dto.description !== undefined) {
      category.description = dto.description;
    }

    const saved = await this.categoryRepo.save(category);
    this.logger.log(`Updated category: ${id}`);

    await this.invalidateCache();
    return saved;
  }

  /**
   * Delete category (and optionally its riddles)
   */
  async deleteCategory(id: string): Promise<void> {
    const category = await this.findCategoryById(id);

    const activeRiddleCount = category.riddles?.filter((r) => r.isActive).length ?? 0;

    // Entity FK is SET NULL, so deleting the category is safe; the only extra
    // work is soft-deleting its active riddles. Done as a single bulk UPDATE
    // inside a transaction instead of a per-row save loop.
    await this.riddleRepo.manager.transaction(async (manager) => {
      if (activeRiddleCount > 0) {
        await manager
          .getRepository(ImageRiddle)
          .createQueryBuilder()
          .update(ImageRiddle)
          .set({ isActive: false })
          .where('"categoryId" = :id AND "isActive" = true', { id })
          .execute();
      }
      await manager.remove(category);
    });

    if (activeRiddleCount > 0) {
      this.logger.log(`Soft deleted ${activeRiddleCount} riddles in category: ${id}`);
    }
    this.logger.log(`Deleted category: ${id}`);

    await this.invalidateCache();
  }

  // ============================================================================
  // DASHBOARD & ANALYTICS
  // ============================================================================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    totalRiddles: number;
    activeRiddles: number;
    totalCategories: number;
    riddlesByDifficulty: Record<string, number>;
    riddlesByCategory: Array<{ categoryId: string; categoryName: string; count: number }>;
    recentRiddles: ImageRiddle[];
    averageTimer: number;
    engagement: { views: number; attempts: number; solves: number };
  }> {
    const [totalRiddles, activeRiddles, totalCategories, recentRiddles] = await Promise.all([
      this.riddleRepo.count(),
      this.riddleRepo.count({ where: { isActive: true } }),
      this.categoryRepo.count(),
      this.getRecentRiddles(5),
    ]);

    // Single GROUP BY per dimension instead of one COUNT query per difficulty.
    const difficultyRows = await this.riddleRepo
      .createQueryBuilder('riddle')
      .select('riddle.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .groupBy('riddle.difficulty')
      .getRawMany<{ difficulty: string; count: string }>();

    const riddlesByDifficulty: Record<string, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0,
    };
    for (const row of difficultyRows) {
      riddlesByDifficulty[row.difficulty] = Number(row.count);
    }

    // Count via JOIN + GROUP BY so categories load without their riddle relations.
    const categoryRows = await this.categoryRepo
      .createQueryBuilder('category')
      .leftJoin('category.riddles', 'riddle')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('COUNT(riddle.id)', 'count')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .getRawMany<{ categoryId: string; categoryName: string; count: string }>();

    const riddlesByCategory = categoryRows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      count: Number(row.count),
    }));

    // AVG over the effective timer: custom value when set, otherwise the
    // settings default (entity `getDefaultTimer()` mirror).
    const timerRow = await this.riddleRepo
      .createQueryBuilder('riddle')
      .select('AVG(COALESCE(riddle.timerSeconds, :defaultTimer))', 'avg')
      .setParameter('defaultTimer', DEFAULT_TIMER_SECONDS)
      .getRawOne<{ avg: string | null }>();

    const averageTimer = timerRow?.avg ? Math.round(Number(timerRow.avg)) : DEFAULT_TIMER_SECONDS;

    // Engagement totals (plan/04-image-riddles.md P1 #1) — one aggregate query.
    const engagementRow = await this.riddleRepo
      .createQueryBuilder('riddle')
      .select('COALESCE(SUM(riddle.views), 0)', 'views')
      .addSelect('COALESCE(SUM(riddle.attempts), 0)', 'attempts')
      .addSelect('COALESCE(SUM(riddle.solves), 0)', 'solves')
      .getRawOne<{ views: string; attempts: string; solves: string }>();

    return {
      totalRiddles,
      activeRiddles,
      totalCategories,
      riddlesByDifficulty,
      riddlesByCategory,
      recentRiddles,
      averageTimer,
      engagement: {
        views: Number(engagementRow?.views ?? 0),
        attempts: Number(engagementRow?.attempts ?? 0),
        solves: Number(engagementRow?.solves ?? 0),
      },
    };
  }

  /**
   * Get recent riddles
   */
  async getRecentRiddles(limit: number): Promise<ImageRiddle[]> {
    return this.riddleRepo.find({
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Invalidate all image riddle caches
   */
  private async invalidateCache(): Promise<void> {
    await this.cacheService.delPattern('image-riddles:*');
    this.logger.debug('Invalidated image riddles cache');
  }
}
