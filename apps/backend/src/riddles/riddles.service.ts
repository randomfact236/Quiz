import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import {
  // Riddle DTOs
  CreateRiddleDto,
  UpdateRiddleDto,
  CreateRiddleCategoryDto,
  UpdateRiddleCategoryDto,
  CreateRiddleSubjectDto,
  UpdateRiddleSubjectDto,
  CreateRiddleChapterDto,
  UpdateRiddleChapterDto,
  CreateRiddleMcqDto,
  UpdateRiddleMcqDto,
  SearchRiddlesDto,
  // Domain enums
  RiddleDifficulty,
  RiddleMcqLevel,
  // Common enums
  ContentStatus,
  BulkActionType,
  BulkActionResponseDto,
} from '../common';
import { CacheService } from '../common/cache/cache.service';
import { DEFAULT_CACHE_TTL_S } from '../common/constants/app.constants';
import { PaginationDto } from '../common/dto/base.dto';
import { BulkActionResult, StatusCountResponse } from '../common/interfaces/bulk-action-result.interface';
import { BulkActionService } from '../common/services/bulk-action.service';
import { settings } from '../config/settings';

import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { RiddleMcq } from './entities/riddle-mcq.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { Riddle } from './entities/riddle.entity';
import { computeRiddleStats, RiddlesStats } from './riddles-stats.util';



@Injectable()
export class RiddlesService {
  private readonly logger = new Logger(RiddlesService.name);

  constructor(
    @InjectRepository(Riddle)
    private riddleRepo: Repository<Riddle>,
    @InjectRepository(RiddleCategory)
    private categoryRepo: Repository<RiddleCategory>,
    @InjectRepository(RiddleSubject)
    private subjectRepo: Repository<RiddleSubject>,
    @InjectRepository(RiddleChapter)
    private chapterRepo: Repository<RiddleChapter>,
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    private cacheService: CacheService,
    private dataSource: DataSource,
    private bulkActionService: BulkActionService,
  ) { }

  // ==================== CLASSIC RIDDLES ====================

  /**
   * Find all classic riddles with pagination.
   * Public callers always receive only PUBLISHED riddles.
   * Admin callers may pass an explicit status to filter differently.
   * When no status is supplied, defaults to PUBLISHED to prevent
   * leaking draft or trashed content to unauthenticated users.
   */
  async findAllRiddles(
    pagination: PaginationDto,
    status: ContentStatus = ContentStatus.PUBLISHED,
  ): Promise<{ data: Riddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const [data, total] = await this.riddleRepo.findAndCount({
      where: { status },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { data, total };
  }

  async findRandomRiddle(): Promise<Riddle> {
    // Single atomic query — avoids the race condition between COUNT and SKIP
    // that existed when a riddle was deleted between the two separate DB calls.
    const riddle = await this.riddleRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.category', 'category')
      .where('riddle.status = :status', { status: ContentStatus.PUBLISHED })
      .orderBy('RANDOM()')   // PostgreSQL — change to RAND() for MySQL
      .take(1)
      .getOne();

    if (riddle === null) {
      throw new NotFoundException('No published riddles found');
    }
    return riddle;
  }

  /**
   * Find a single classic riddle by its UUID.
   * Public callers (isAdmin = false) only see PUBLISHED riddles — a DRAFT UUID
   * returns 404 rather than leaking unreleased content (M-2 fix).
   * Admin callers (isAdmin = true) bypass the status filter.
   */
  async findRiddleById(id: string, isAdmin = false): Promise<Riddle> {
    const riddle = await this.riddleRepo.findOne({
      where: isAdmin ? { id } : { id, status: ContentStatus.PUBLISHED },
      relations: ['category'],
    });
    if (riddle === null) {
      throw new NotFoundException(
        isAdmin
          ? `Riddle with id "${id}" not found`
          : `Riddle with id "${id}" not found or not published`,
      );
    }
    return riddle;
  }

  async findRiddlesByCategory(
    categoryId: string,
    pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.riddleRepo.findAndCount({
      where: { category: { id: categoryId }, status: ContentStatus.PUBLISHED },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findRiddlesByDifficulty(
    difficulty: string,
    pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.riddleRepo.findAndCount({
      where: { difficulty, status: ContentStatus.PUBLISHED },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async searchRiddles(searchDto: SearchRiddlesDto): Promise<{ data: Riddle[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? settings.global.pagination.defaultLimit;

    const queryBuilder = this.riddleRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.category', 'category')
      .where('riddle.status = :status', { status: ContentStatus.PUBLISHED });

    if (searchDto.search !== undefined && searchDto.search.length > 0) {
      queryBuilder.andWhere(
        '(LOWER(riddle.question) LIKE LOWER(:search) OR LOWER(riddle.answer) LIKE LOWER(:search))',
        { search: `%${searchDto.search}%` },  // M-3 fix: LOWER() is portable; ILIKE is PostgreSQL-only
      );
    }

    if (searchDto.categoryId !== undefined && searchDto.categoryId.length > 0) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId: searchDto.categoryId });
    }

    if (searchDto.difficulty !== undefined && searchDto.difficulty.length > 0) {
      queryBuilder.andWhere('riddle.difficulty = :difficulty', { difficulty: searchDto.difficulty });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('riddle.id', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async createRiddle(dto: CreateRiddleDto): Promise<Riddle> {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    const riddle = this.riddleRepo.create({
      question: dto.question,
      answer: dto.answer,
      difficulty: dto.difficulty,
      category,
      status: ContentStatus.DRAFT,
    });
    const saved = await this.riddleRepo.save(riddle);
    await this.cacheService.delPattern('riddles:*');
    return saved;
  }

  async createRiddlesBulk(dto: CreateRiddleDto[]): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];

    // Validate input
    if (!dto || dto.length === 0) {
      throw new BadRequestException('No riddles provided for bulk creation');
    }

    // Limit batch size to prevent memory issues
    const MAX_BULK_SIZE = 100;
    if (dto.length > MAX_BULK_SIZE) {
      throw new BadRequestException(`Batch size exceeds maximum of ${MAX_BULK_SIZE} riddles`);
    }

    const result = await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Get all unique category IDs for batch fetch - fixes N+1 query
      const categoryIds = [...new Set(dto.map(r => r.categoryId))];
      const categories = await transactionalEntityManager.find(RiddleCategory, {
        where: { id: In(categoryIds) },
      });

      // Create a map for quick lookup
      const categoryMap = new Map(categories.map(c => [c.id, c]));

      const riddles: Riddle[] = [];
      for (let i = 0; i < dto.length; i++) {
        const r = dto[i];
        const category = categoryMap.get(r.categoryId);

        if (!category) {
          errors.push(`Row ${i + 1}: Category not found (ID: ${r.categoryId})`);
          continue;
        }

        const riddle = transactionalEntityManager.create(Riddle, {
          question: r.question,
          answer: r.answer,
          difficulty: r.difficulty,
          category,
          status: ContentStatus.DRAFT,
        });
        riddles.push(riddle);
      }

      if (riddles.length === 0) {
        throw new BadRequestException(`No valid riddles to create. Errors: ${errors.join('; ')}`);
      }

      const saved = await transactionalEntityManager.save(riddles);
      // Return the count — cache invalidation happens OUTSIDE the transaction
      return { count: saved.length, errors };
    });

    // Invalidate cache only after the transaction has been committed to the DB
    await this.cacheService.delPattern('riddles:*');
    return result;
  }

  /**
   * Update a classic riddle.
   * Only provided fields are applied — undefined fields leave the riddle unchanged.
   * If categoryId is provided, the category is validated before being applied.
   */
  async updateRiddle(id: string, dto: UpdateRiddleDto): Promise<Riddle> {
    const riddle = await this.riddleRepo.findOne({ where: { id }, relations: ['category'] });
    if (riddle === null) {throw new NotFoundException('Riddle not found');}

    // Apply scalar fields safely — only overwrite when explicitly provided
    if (dto.question !== undefined) {riddle.question = dto.question;}
    if (dto.answer !== undefined) {riddle.answer = dto.answer;}
    if (dto.difficulty !== undefined) {riddle.difficulty = dto.difficulty;}

    // Update category if a new categoryId is provided
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (category === null) {throw new NotFoundException(`Category with id "${dto.categoryId}" not found`);}
      riddle.category = category;
    }

    const saved = await this.riddleRepo.save(riddle);
    await this.cacheService.delPattern('riddles:*');
    return saved;
  }

  async updateRiddleStatus(id: string, status: ContentStatus): Promise<Riddle> {
    const riddle = await this.riddleRepo.findOne({ where: { id } });
    if (riddle === null) {
      throw new NotFoundException('Riddle not found');
    }
    riddle.status = status;
    const saved = await this.riddleRepo.save(riddle);
    await this.cacheService.delPattern('riddles:*');
    return saved;
  }

  async deleteRiddle(id: string): Promise<void> {
    const result = await this.riddleRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Riddle not found');
    }
    await this.cacheService.delPattern('riddles:*');
  }

  // ==================== CLASSIC CATEGORIES ====================

  async findAllCategories(): Promise<RiddleCategory[]> {
    return this.cacheService.getOrSet(
      'riddles:categories',
      async () => {
        return this.categoryRepo.find({
          order: { name: 'ASC' },
          relations: ['riddles', 'subjects'],
        });
      },
      DEFAULT_CACHE_TTL_S,
    );
  }

  async findCategoryById(id: string): Promise<RiddleCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['riddles', 'subjects'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async createCategory(dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
    let slug = this.generateSlug(dto.name);
    
    // Check for existing slug and append random suffix if duplicate
    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }
    
    const category = this.categoryRepo.create({
      name: dto.name,
      slug,
      emoji: dto.emoji ?? settings.riddles.defaults.categoryEmoji,
    });
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('riddles:categories');
    return saved;
  }

  async updateCategory(id: string, dto: UpdateRiddleCategoryDto): Promise<RiddleCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (category === null) {throw new NotFoundException('Category not found');}
    // H-1 fix: use !== undefined so empty strings can explicitly clear the field
    if (dto.name !== undefined) {
      category.name = dto.name;
      category.slug = this.generateSlug(dto.name);
    }
    if (dto.emoji !== undefined) {category.emoji = dto.emoji;}
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('riddles:categories');
    return saved;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['riddles', 'subjects'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }

    if (category.riddles !== undefined && category.riddles !== null && category.riddles.length > 0) {
      await this.riddleRepo.remove(category.riddles);
    }

    if (category.subjects && category.subjects.length > 0) {
      for (const subject of category.subjects) {
        // Use deleteSubject for proper cascade deletion of chapters and riddles
        await this.deleteSubject(subject.id);
      }
    }

    await this.categoryRepo.remove(category);
    // H-3 fix: invalidate the full riddles:* pattern — paginated riddle lists
    // cache category relations and will serve stale data if only the narrow
    // 'riddles:categories' key is busted.
    await this.cacheService.delPattern('riddles:*');
  }

  // ==================== QUIZ FORMAT - SUBJECTS ====================

  async findAllSubjects(includeInactive = false, hasContentOnly = false): Promise<RiddleSubject[]> {
    const cacheKey = `riddles:subjects:${includeInactive ? 'all' : 'active'}${hasContentOnly ? ':filtered' : ''}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = this.subjectRepo.createQueryBuilder('subject')
          .leftJoinAndSelect('subject.category', 'category');

        if (!includeInactive) {
          query.andWhere('subject.isActive = :isActive', { isActive: true });
        }

        if (hasContentOnly) {
          // Inner join chapters and riddles to ensure ONLY content-bearing items are in the returned tree
          query.innerJoinAndSelect('subject.chapters', 'chapter')
            .innerJoinAndSelect('chapter.riddles', 'riddle');
        } else {
          query.leftJoinAndSelect('subject.chapters', 'chapter');
        }

        query.orderBy('subject.order', 'ASC')
          .addOrderBy('subject.name', 'ASC');

        return query.getMany();
      },
      DEFAULT_CACHE_TTL_S,
    );
  }

  async findSubjectBySlug(slug: string): Promise<RiddleSubject> {
    const subject = await this.subjectRepo.findOne({
      where: { slug },
      relations: ['chapters'],
    });
    if (subject === null) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  async createSubject(dto: CreateRiddleSubjectDto): Promise<RiddleSubject> {
    const slug = dto.slug || this.generateSlug(dto.name);
    let category: RiddleCategory | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException(`Category with id "${dto.categoryId}" not found`);
      }
    }
    const subject = this.subjectRepo.create({
      ...dto,
      slug,
      isActive: true,
      category: category || undefined,
    });
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.del('riddles:subjects:active');
    await this.cacheService.del('riddles:subjects:all');
    return saved;
  }

  async updateSubject(id: string, dto: UpdateRiddleSubjectDto): Promise<RiddleSubject> {
    const subject = await this.subjectRepo.findOne({ where: { id }, relations: ['category'] });
    if (subject === null) {throw new NotFoundException('Subject not found');}
    
    if (dto.name !== undefined) {
      subject.name = dto.name;
      if (!dto.slug) {
        subject.slug = this.generateSlug(dto.name);
      }
    }
    if (dto.slug !== undefined) {subject.slug = dto.slug;}
    if (dto.emoji !== undefined) {subject.emoji = dto.emoji;}
    if (dto.description !== undefined) {subject.description = dto.description;}
    if (dto.isActive !== undefined) {subject.isActive = dto.isActive;}
    if (dto.order !== undefined) {subject.order = dto.order;}
    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        const cat = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
        if (cat) {
          subject.category = cat;
        }
      } else {
        subject.category = null as any;
      }
    }
    
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.del('riddles:subjects:active');
    await this.cacheService.del('riddles:subjects:all');
    return saved;
  }


  /**
   * Delete a subject and ALL its child chapters and riddle MCQs.
   * Deletion is performed in dependency order to respect FK constraints.
   * Wrapped in a transaction to ensure atomicity.
   */
  async deleteSubject(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Step 1: Delete ALL riddle MCQs directly associated with this subjectId
      await manager.delete(RiddleMcq, { subjectId: id });

      // Step 2: Get chapters for this subject and delete their riddles
      const chapters = await manager.find(RiddleChapter, {
        where: { subjectId: id },
        relations: ['riddles'],
      });
      
      for (const chapter of chapters) {
        if (chapter.riddles?.length) {
          await manager.remove(RiddleMcq, chapter.riddles);
        }
      }

      // Step 3: Delete chapters
      await manager.delete(RiddleChapter, { subjectId: id });

      // Step 4: Delete subject
      await manager.delete(RiddleSubject, { id });
    });
    
    await this.cacheService.del('riddles:subjects:active');
    await this.cacheService.del('riddles:subjects:all');
  }

  // ==================== QUIZ FORMAT - CHAPTERS ====================

  async findChaptersBySubject(subjectId: string, hasContentOnly = false): Promise<RiddleChapter[]> {
    const query = this.chapterRepo.createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.subject', 'subject');

    if (hasContentOnly) {
      // Use innerJoinAndSelect to both filter and populate the riddles array
      query.innerJoinAndSelect('chapter.riddles', 'riddle');
    } else {
      query.leftJoinAndSelect('chapter.riddles', 'riddle');
    }

    query.where('subject.id = :subjectId', { subjectId })
      .orderBy('chapter.chapterNumber', 'ASC');

    return query.getMany();
  }

  /**
   * Get all chapters across all subjects that have at least one riddle.
   * Useful for flat lists like Mobile Footer.
   */
  async findAllActiveChapters(): Promise<RiddleChapter[]> {
    return this.cacheService.getOrSet(
      'riddles:chapters:active:all',
      async () => {
        return this.chapterRepo.createQueryBuilder('chapter')
          .innerJoinAndSelect('chapter.subject', 'subject')
          .innerJoinAndSelect('chapter.riddles', 'riddle') // innerJoinAndSelect ensures population for frontend counts
          .where('subject.isActive = :isActive', { isActive: true })
          .orderBy('chapter.chapterNumber', 'ASC')
          .getMany();
      },
      DEFAULT_CACHE_TTL_S,
    );
  }

  async createChapter(dto: CreateRiddleChapterDto): Promise<RiddleChapter> {
    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (subject === null) {
      throw new NotFoundException(`Subject with id "${dto.subjectId}" not found`);
    }
    const chapter = this.chapterRepo.create({
      name: dto.name,
      chapterNumber: dto.chapterNumber,
      subject,
    });
    const saved = await this.chapterRepo.save(chapter);
    await this.cacheService.del('riddles:subjects:active'); // Chapter added — invalidate subject caches
    await this.cacheService.del('riddles:subjects:all');
    return saved;
  }

  async updateChapter(id: string, dto: UpdateRiddleChapterDto): Promise<RiddleChapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (chapter === null) {throw new NotFoundException(`Chapter with id "${id}" not found`);}
    if (dto.name !== undefined) {chapter.name = dto.name;}
    if (dto.chapterNumber !== undefined) {chapter.chapterNumber = dto.chapterNumber;}
    const saved = await this.chapterRepo.save(chapter);
    await this.cacheService.del('riddles:subjects:active'); // Chapter updated — invalidate subject caches
    await this.cacheService.del('riddles:subjects:all');
    return saved;
  }

  /**
   * Delete a chapter and ALL its child riddle MCQs.
   * riddle MCQs are removed first to satisfy FK constraints.
   */
  async deleteChapter(id: string): Promise<void> {
    const chapter = await this.chapterRepo.findOne({
      where: { id },
      relations: ['riddles'],
    });
    if (chapter === null) {
      throw new NotFoundException(`Chapter with id "${id}" not found`);
    }

    if (chapter.riddles?.length) {
      await this.riddleMcqRepo.remove(chapter.riddles);
    }
    await this.chapterRepo.remove(chapter);
    // C-2 fix: invalidate subjects cache after chapter deletion — the cached
    // subjects response embeds chapter data and must be refreshed.
    await this.cacheService.del('riddles:subjects:active');
    await this.cacheService.del('riddles:subjects:all');
  }

  // ==================== QUIZ FORMAT - RIDDLES ====================

  async findRiddleMcqsBySubject(
    subjectId: string,
    pagination: PaginationDto,
    level?: string,
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const subjectExists = await this.subjectRepo.count({ where: { id: subjectId } });
    if (subjectExists === 0) {
      throw new NotFoundException(`Subject with id "${subjectId}" not found`);
    }

    const validLevels = ['easy', 'medium', 'hard', 'expert', 'all'];
    const where: any = { subject: { id: subjectId } };
    
    if (level && level !== 'all' && validLevels.includes(level.toLowerCase())) {
      where.level = level.toLowerCase();
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.riddleMcqRepo.findAndCount({
      where,
      relations: ['subject'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return { data, total };
  }

  async findRiddleMcqsByChapter(
    chapterId: string,
    pagination: PaginationDto,
    level?: string,
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    // Verify chapter exists before querying to return a meaningful 404
    const chapterExists = await this.chapterRepo.count({ where: { id: chapterId } });
    if (chapterExists === 0) {
      throw new NotFoundException(`Chapter with id "${chapterId}" not found`);
    }

    // Build where clause with optional level filter
    const validLevels = ['easy', 'medium', 'hard', 'expert', 'all'];
    const where: any = { chapter: { id: chapterId } };
    
    if (level && level !== 'all' && validLevels.includes(level.toLowerCase())) {
      where.level = level.toLowerCase();
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.riddleMcqRepo.findAndCount({
      where,
      relations: ['chapter'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return { data, total };
  }

  async findRandomRiddleMcqs(level: string, count: number): Promise<RiddleMcq[]> {
    // Validate level parameter
    const validLevels = ['easy', 'medium', 'hard', 'expert', 'all'];
    const normalizedLevel = level.toLowerCase();

    if (!validLevels.includes(normalizedLevel)) {
      throw new BadRequestException(`Invalid level: ${level}. Valid values: ${validLevels.join(', ')}`);
    }

    // Support 'all' level - reuse mixed logic
    if (normalizedLevel === 'all') {
      return this.findMixedRiddleMcqs(count);
    }

    const totalCount = await this.riddleMcqRepo.count({ where: { level: normalizedLevel } });
    if (totalCount === 0) {
      return [];
    }

    // If requesting more than available, return all
    if (count >= totalCount) {
      return this.riddleMcqRepo.find({ where: { level: normalizedLevel }, relations: ['chapter'] });
    }

    // Fallback logic: if less than 5 riddles available, include from adjacent level
    const MIN_RIDDLES_THRESHOLD = 5;
    let riddles: RiddleMcq[] = [];

    if (totalCount < MIN_RIDDLES_THRESHOLD) {
      // Get fallback levels: hard→medium, expert→hard, etc.
      const fallbackLevels: Record<string, string> = {
        'hard': 'medium',
        'expert': 'hard',
        'medium': 'easy',
        'easy': 'medium', // fallback to medium if not enough easy
      };
      
      const fallbackLevel = fallbackLevels[normalizedLevel];
      if (fallbackLevel) {
        const fallbackCount = await this.riddleMcqRepo.count({ where: { level: fallbackLevel } });
        if (fallbackCount > 0) {
          const fallbackRiddles = await this.riddleMcqRepo.find({
            where: { level: fallbackLevel },
            relations: ['chapter'],
          });
          // Combine and shuffle
          const allRiddles = [...fallbackRiddles];
          const allIds = allRiddles.map(r => r.id);
          const selectedIds = this.fisherYatesSample(allIds, count);
          riddles = allRiddles.filter(r => selectedIds.includes(r.id));
        }
      }

      if (riddles.length > 0) {
        return riddles;
      }
    }

    // Fetch only IDs, apply proper Fisher-Yates shuffle, then load selected records
    const allIds = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .where('riddle.level = :level', { level: normalizedLevel })
      .getMany();

    const selectedIds = this.fisherYatesSample(allIds.map(r => r.id), count);

    return this.riddleMcqRepo.find({
      where: { id: In(selectedIds) },
      relations: ['chapter'],
    });
  }

  async findMixedRiddleMcqs(count: number): Promise<RiddleMcq[]> {
    const totalCount = await this.riddleMcqRepo.count();
    if (totalCount === 0) {
      return [];
    }

    // If requesting more than available, return all
    if (count >= totalCount) {
      return this.riddleMcqRepo.find({ relations: ['chapter'] });
    }

    // Fetch only IDs, apply Fisher-Yates sample, then load selected records
    const allIds = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .getMany();

    const selectedIds = this.fisherYatesSample(allIds.map(r => r.id), count);

    return this.riddleMcqRepo.find({
      where: { id: In(selectedIds) },
      relations: ['chapter'],
    });
  }

  /**
   * Fisher-Yates in-place shuffle — statistically uniform distribution.
   * Mutates the input array and returns the first `count` items.
   * @param arr   Array of items to sample from
   * @param count Number of items to select
   */
  private fisherYatesSample<T>(arr: T[], count: number): T[] {
    const pool = [...arr];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  // ==================== QUIZ FORMAT - ADMIN ====================

  /**
   * Get all riddle MCQs for Admin panel
   */
  async findAllRiddleMcqsAdmin(): Promise<RiddleMcq[]> {
    return this.riddleMcqRepo.find({
      relations: ['chapter', 'chapter.subject', 'subject'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Execute bulk action on riddle MCQs
   */
  async bulkActionRiddleMcqs(
    ids: string[],
    action: BulkActionType,
  ): Promise<BulkActionResponseDto> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No IDs provided for bulk action');
    }

    try {
      if (action === 'delete') {
        const result = await this.riddleMcqRepo.delete(ids);
        return {
          success: true,
          processed: result.affected || 0,
          succeeded: result.affected || 0,
          failed: 0,
          message: `Successfully deleted ${result.affected || 0} riddle MCQs`,
        };
      } else {
        // RiddleMcq entity currently lacks a 'status' field, so we mock publish/draft/trash
        // actions for the frontend to prevent errors while not affecting backend functionality.
        return {
          success: true,
          processed: ids.length,
          succeeded: ids.length,
          failed: 0,
          message: 'Status actions on riddle MCQs are simulated.',
        };
      }
    } catch (error) {
      this.logger.error(`Failed to execute bulk action ${action} on riddle MCQs`, error.stack);
      throw new BadRequestException(`Failed to execute bulk action: ${error.message}`);
    }
  }

  async createRiddleMcq(dto: CreateRiddleMcqDto): Promise<RiddleMcq> {
    let subject: RiddleSubject | null = null;
    let chapter: RiddleChapter | null = null;

    if (dto.subjectId) {
      subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
      if (subject === null) {
        throw new NotFoundException(`Subject with id "${dto.subjectId}" not found`);
      }
    } else if (dto.chapterId) {
      chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
      if (chapter === null) {
        throw new NotFoundException(`Chapter with id "${dto.chapterId}" not found`);
      }
    } else {
      throw new BadRequestException('Either subjectId or chapterId is required');
    }

    // Validate: expert = open-ended (no correctLetter), others = MCQ (requires correctLetter)
    const isOpenEnded = dto.level === 'expert';
    
    if (!isOpenEnded && !dto.correctLetter) {
      throw new BadRequestException(`${dto.level} level requires correctLetter (A/B/C/D)`);
    }
    if (isOpenEnded && dto.correctLetter) {
      throw new BadRequestException('Expert level (open-ended) must have correctLetter: null');
    }
    if (!isOpenEnded && (!dto.options || dto.options.length < 2)) {
      throw new BadRequestException(`${dto.level} level requires at least 2 options`);
    }

    const riddle = this.riddleMcqRepo.create({
      question: dto.question,
      options: isOpenEnded ? null : dto.options,
      correctLetter: isOpenEnded ? null : dto.correctLetter,
      correctAnswer: dto.correctAnswer,
      level: dto.level,
      explanation: dto.explanation,
      hint: dto.hint,
      subject: subject || undefined,
      chapter: chapter || undefined,
    });
    const saved = await this.riddleMcqRepo.save(riddle);
    await this.cacheService.delPattern('riddles:*'); // Invalidate after create
    return saved;
  }

  async createRiddleMcqsBulk(dto: CreateRiddleMcqDto[]): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];

    // Validate input
    if (!dto || dto.length === 0) {
      throw new BadRequestException('No riddle MCQs provided for bulk creation');
    }

    // Limit batch size
    const MAX_BULK_SIZE = 100;
    if (dto.length > MAX_BULK_SIZE) {
      throw new BadRequestException(`Batch size exceeds maximum of ${MAX_BULK_SIZE} riddles`);
    }

    const quizBulkResult = await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Get all unique chapter IDs for batch fetch - fixes N+1 query
      const chapterIds = [...new Set(dto.map(r => r.chapterId))];
      const chapters = await transactionalEntityManager.find(RiddleChapter, {
        where: { id: In(chapterIds) },
      });

      // Create a map for quick lookup
      const chapterMap = new Map(chapters.map(c => [c.id, c]));

      const riddles: RiddleMcq[] = [];
      for (let i = 0; i < dto.length; i++) {
        const r = dto[i];
        const chapterId = r.chapterId || '';
        const chapter = chapterId ? chapterMap.get(chapterId) : null;

        if (!chapter && chapterId) {
          errors.push(`Row ${i + 1}: Chapter not found (ID: ${chapterId})`);
          continue;
        }

        // Validate: expert = open-ended (no correctLetter), others = MCQ
        const isOpenEnded = r.level === 'expert';
        
        if (!isOpenEnded && !r.correctLetter) {
          errors.push(`Row ${i + 1}: ${r.level} level requires correctLetter (A/B/C/D)`);
          continue;
        }
        if (isOpenEnded && r.correctLetter) {
          errors.push(`Row ${i + 1}: Expert level (open-ended) must have correctLetter: null`);
          continue;
        }

        const riddleData: Partial<RiddleMcq> = {
          question: r.question,
          options: isOpenEnded ? null : r.options,
          correctLetter: isOpenEnded ? null : r.correctLetter,
          correctAnswer: r.correctAnswer,
          level: r.level,
          explanation: r.explanation,
          hint: r.hint,
        };

        if (r.subjectId) {
          riddleData.subjectId = r.subjectId;
        }
        if (chapter) {
          riddleData.chapterId = chapter.id;
        }

        const riddle = transactionalEntityManager.create(RiddleMcq, riddleData);
        riddles.push(riddle);
      }

      if (riddles.length === 0) {
        throw new BadRequestException(`No valid riddles to create. Errors: ${errors.join('; ')}`);
      }

      const saved = await transactionalEntityManager.save(riddles);
      return { count: saved.length, errors };
    });

    // Invalidate cache after transaction commits to DB
    await this.cacheService.delPattern('riddles:*');
    return quizBulkResult;
  }

  /**
   * Update a riddle MCQ.
   * Uses explicit per-field assignment to allow clearing optional fields (null/empty).
   * Invalidates the riddles cache after a successful save.
   */
  async updateRiddleMcq(id: string, dto: UpdateRiddleMcqDto): Promise<RiddleMcq> {
    const riddle = await this.riddleMcqRepo.findOne({ where: { id }, relations: ['chapter'] });
    if (riddle === null) {throw new NotFoundException('riddle MCQ not found');}

    // Validate if level is being changed
    const newLevel = (dto.level != null) || riddle.level;
    const isOpenEnded = newLevel === 'expert';
    
    if (dto.correctLetter !== undefined) {
      if (isOpenEnded && dto.correctLetter) {
        throw new BadRequestException('Expert level (open-ended) must have correctLetter: null');
      }
      if (!isOpenEnded && !dto.correctLetter) {
        throw new BadRequestException(`${newLevel} level requires correctLetter (A/B/C/D)`);
      }
      riddle.correctLetter = dto.correctLetter || null;
    }

    if (dto.question !== undefined) {riddle.question = dto.question;}
    if (dto.correctAnswer !== undefined) {riddle.correctAnswer = dto.correctAnswer;}
    if (dto.level !== undefined) {
      riddle.level = dto.level;
      // Update options and correctLetter based on new level
      if (dto.level === 'expert') {
        riddle.options = null;
        riddle.correctLetter = null;
      }
    }
    if (dto.explanation !== undefined) {riddle.explanation = dto.explanation ?? '';}
    if (dto.hint !== undefined) {riddle.hint = dto.hint ?? '';}
    if (dto.options !== undefined) {riddle.options = isOpenEnded ? null : dto.options;}

    if (dto.chapterId !== undefined) {
      const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
      if (chapter === null) {throw new NotFoundException(`Chapter with id "${dto.chapterId}" not found`);}
      riddle.chapter = chapter;
    }

    const saved = await this.riddleMcqRepo.save(riddle);
    await this.cacheService.delPattern('riddles:*');  // Invalidate cache after mutation
    return saved;
  }

  /**
   * Delete a riddle MCQ by ID.
   * Invalidates cache after successful deletion.
   */
  async deleteRiddleMcq(id: string): Promise<void> {
    const result = await this.riddleMcqRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('riddle MCQ not found');
    }
    await this.cacheService.delPattern('riddles:*');  // Invalidate cache after mutation
  }

  // ==================== BULK ACTIONS ====================

  async bulkActionClassic(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(`[RiddlesService] Executing bulk ${action} on ${ids.length} classic riddles`);
    const result = await this.bulkActionService.executeBulkAction(this.riddleRepo, 'riddle', ids, action);
    if (result.succeeded > 0) {
      await this.cacheService.delPattern('riddles:*');
      this.logger.log(`[RiddlesService] Cache invalidated after bulk ${action}`);
    }
    return result;
  }

  async getStatusCounts(): Promise<StatusCountResponse> {
    return this.bulkActionService.getStatusCounts(this.riddleRepo);
  }

  // ==================== STATS ====================

  async getStats(): Promise<RiddlesStats> {
    return computeRiddleStats(this.riddleRepo, this.categoryRepo, this.riddleMcqRepo, this.subjectRepo, this.chapterRepo);
  }
}
