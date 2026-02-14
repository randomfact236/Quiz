import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { ImageRiddle } from '../../image-riddles/entities/image-riddle.entity';
import { ImageRiddleCategory } from '../../image-riddles/entities/image-riddle-category.entity';
import {
  CreateImageRiddleDto,
  UpdateImageRiddleDto,
  CreateImageRiddleCategoryDto,
  UpdateImageRiddleCategoryDto,
} from '../../common/dto/base.dto';
import { CacheService } from '../../common/cache/cache.service';

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
    private readonly cacheService: CacheService,
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
    },
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
      hint: dto.hint ?? null,
      difficulty: dto.difficulty,
      timerSeconds: dto.timerSeconds ?? null,
      showTimer: dto.showTimer ?? true,
      altText: dto.altText ?? null,
      categoryId: dto.categoryId ?? null,
      isActive: true,
    });

    const saved = await this.riddleRepo.save(riddle);
    this.logger.log(`Created riddle: ${saved.id}`);

    await this.invalidateCache();
    return saved;
  }

  /**
   * Bulk create riddles
   */
  async createRiddlesBulk(
    dtos: CreateImageRiddleDto[],
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

    const saved = await this.riddleRepo.save(riddle);
    this.logger.log(`Updated riddle: ${id}`);

    await this.invalidateCache();
    return saved;
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
    dto: UpdateImageRiddleCategoryDto,
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

    // Check if category has active riddles
    const activeRiddles = category.riddles?.filter((r) => r.isActive) ?? [];
    if (activeRiddles.length > 0) {
      // Soft delete all riddles in this category
      for (const riddle of activeRiddles) {
        riddle.isActive = false;
        await this.riddleRepo.save(riddle);
      }
      this.logger.log(`Soft deleted ${activeRiddles.length} riddles in category: ${id}`);
    }

    await this.categoryRepo.remove(category);
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
  }> {
    const [totalRiddles, activeRiddles, totalCategories] = await Promise.all([
      this.riddleRepo.count(),
      this.riddleRepo.count({ where: { isActive: true } }),
      this.categoryRepo.count(),
    ]);

    const riddlesByDifficulty: Record<string, number> = {
      easy: await this.riddleRepo.count({ where: { difficulty: 'easy' } }),
      medium: await this.riddleRepo.count({ where: { difficulty: 'medium' } }),
      hard: await this.riddleRepo.count({ where: { difficulty: 'hard' } }),
      expert: await this.riddleRepo.count({ where: { difficulty: 'expert' } }),
    };

    const categories = await this.categoryRepo.find({ relations: ['riddles'] });
    const riddlesByCategory = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      count: cat.riddles?.length ?? 0,
    }));

    const recentRiddles = await this.getRecentRiddles(5);

    const averageTimer = 90; // All riddles default to 90s

    return {
      totalRiddles,
      activeRiddles,
      totalCategories,
      riddlesByDifficulty,
      riddlesByCategory,
      recentRiddles,
      averageTimer,
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
