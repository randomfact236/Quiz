import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { QuizRiddle } from './entities/quiz-riddle.entity';
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
  CreateQuizRiddleDto,
  UpdateQuizRiddleDto,
  SearchRiddlesDto,
  // Domain enums
  RiddleDifficulty,
  QuizRiddleLevel,
  // Common enums
  ContentStatus,
  BulkActionType,
} from '../common';
import { PaginationDto } from '../common/dto/base.dto';
import { BulkActionResult, StatusCountResponse } from '../common/interfaces/bulk-action-result.interface';
import { DEFAULT_CACHE_TTL_S } from '../common/constants/app.constants';
import { CacheService } from '../common/cache/cache.service';
import { settings } from '../config/settings';
import { BulkActionService } from '../common/services/bulk-action.service';
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
    @InjectRepository(QuizRiddle)
    private quizRiddleRepo: Repository<QuizRiddle>,
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
    if (riddle === null) throw new NotFoundException('Riddle not found');

    // Apply scalar fields safely — only overwrite when explicitly provided
    if (dto.question !== undefined) riddle.question = dto.question;
    if (dto.answer !== undefined) riddle.answer = dto.answer;
    if (dto.difficulty !== undefined) riddle.difficulty = dto.difficulty;

    // Update category if a new categoryId is provided
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (category === null) throw new NotFoundException(`Category with id "${dto.categoryId}" not found`);
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
          relations: ['riddles'],
        });
      },
      DEFAULT_CACHE_TTL_S,
    );
  }

  async findCategoryById(id: string): Promise<RiddleCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['riddles'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async createCategory(dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
    const category = this.categoryRepo.create({
      name: dto.name,
      emoji: dto.emoji ?? settings.riddles.defaults.categoryEmoji,
    });
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('riddles:categories');
    return saved;
  }

  async updateCategory(id: string, dto: UpdateRiddleCategoryDto): Promise<RiddleCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (category === null) throw new NotFoundException('Category not found');
    // H-1 fix: use !== undefined so empty strings can explicitly clear the field
    if (dto.name !== undefined) category.name = dto.name;
    if (dto.emoji !== undefined) category.emoji = dto.emoji;
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('riddles:categories');
    return saved;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['riddles'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }

    if (category.riddles !== undefined && category.riddles !== null && category.riddles.length > 0) {
      await this.riddleRepo.remove(category.riddles);
    }

    await this.categoryRepo.remove(category);
    // H-3 fix: invalidate the full riddles:* pattern — paginated riddle lists
    // cache category relations and will serve stale data if only the narrow
    // 'riddles:categories' key is busted.
    await this.cacheService.delPattern('riddles:*');
  }

  // ==================== QUIZ FORMAT - SUBJECTS ====================

  async findAllSubjects(includeInactive = false): Promise<RiddleSubject[]> {
    return this.cacheService.getOrSet(
      `riddles:subjects:${includeInactive ? 'all' : 'active'}`,
      async () => {
        return this.subjectRepo.find({
          where: includeInactive ? {} : { isActive: true },
          order: { order: 'ASC', name: 'ASC' },
          relations: ['chapters'],
        });
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
    const subject = this.subjectRepo.create({
      ...dto,
      isActive: true,
    });
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.del('riddles:subjects:active');
    await this.cacheService.del('riddles:subjects:all');
    return saved;
  }

  async updateSubject(id: string, dto: UpdateRiddleSubjectDto): Promise<RiddleSubject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (subject === null) throw new NotFoundException('Subject not found');
    Object.assign(subject, dto);
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.del('riddles:subjects:active');
    await this.cacheService.del('riddles:subjects:all');
    return saved;
  }


  /**
   * Delete a subject and ALL its child chapters and quiz riddles.
   * Deletion is performed in dependency order to respect FK constraints:
   * quiz_riddles → riddle_chapters → riddle_subjects.
   */
  async deleteSubject(id: string): Promise<void> {
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ['chapters', 'chapters.riddles'],
    });
    if (subject === null) {
      throw new NotFoundException(`Subject with id "${id}" not found`);
    }

    // Remove quiz riddles first, then chapters, then the subject
    for (const chapter of subject.chapters ?? []) {
      if (chapter.riddles?.length) {
        await this.quizRiddleRepo.remove(chapter.riddles);
      }
    }
    if (subject.chapters?.length) {
      await this.chapterRepo.remove(subject.chapters);
    }
    await this.subjectRepo.remove(subject);
    await this.cacheService.del('riddles:subjects:active');
    await this.cacheService.del('riddles:subjects:all');
  }

  // ==================== QUIZ FORMAT - CHAPTERS ====================

  async findChaptersBySubject(subjectId: string): Promise<RiddleChapter[]> {
    // Verify subject exists before querying chapters
    const subjectExists = await this.subjectRepo.count({ where: { id: subjectId } });
    if (subjectExists === 0) {
      throw new NotFoundException(`Subject with id "${subjectId}" not found`);
    }
    return this.chapterRepo.find({
      where: { subject: { id: subjectId } },
      order: { chapterNumber: 'ASC' },
      relations: ['subject', 'riddles'],
    });
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
    if (chapter === null) throw new NotFoundException(`Chapter with id "${id}" not found`);
    if (dto.name !== undefined) chapter.name = dto.name;
    if (dto.chapterNumber !== undefined) chapter.chapterNumber = dto.chapterNumber;
    const saved = await this.chapterRepo.save(chapter);
    await this.cacheService.del('riddles:subjects:active'); // Chapter updated — invalidate subject caches
    await this.cacheService.del('riddles:subjects:all');
    return saved;
  }

  /**
   * Delete a chapter and ALL its child quiz riddles.
   * Quiz riddles are removed first to satisfy FK constraints.
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
      await this.quizRiddleRepo.remove(chapter.riddles);
    }
    await this.chapterRepo.remove(chapter);
    // C-2 fix: invalidate subjects cache after chapter deletion — the cached
    // subjects response embeds chapter data and must be refreshed.
    await this.cacheService.del('riddles:subjects:active');
    await this.cacheService.del('riddles:subjects:all');
  }

  // ==================== QUIZ FORMAT - RIDDLES ====================

  async findQuizRiddlesByChapter(
    chapterId: string,
    pagination: PaginationDto,
  ): Promise<{ data: QuizRiddle[]; total: number }> {
    // Verify chapter exists before querying to return a meaningful 404
    const chapterExists = await this.chapterRepo.count({ where: { id: chapterId } });
    if (chapterExists === 0) {
      throw new NotFoundException(`Chapter with id "${chapterId}" not found`);
    }
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.quizRiddleRepo.findAndCount({
      where: { chapter: { id: chapterId } },
      relations: ['chapter'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return { data, total };
  }

  async findRandomQuizRiddles(level: string, count: number): Promise<QuizRiddle[]> {
    // Validate level parameter
    const validLevels = ['easy', 'medium', 'hard', 'expert', 'extreme'];
    if (!validLevels.includes(level)) {
      throw new BadRequestException(`Invalid level: ${level}. Valid values: ${validLevels.join(', ')}`);
    }

    const totalCount = await this.quizRiddleRepo.count({ where: { level } });
    if (totalCount === 0) {
      return [];
    }

    // If requesting more than available, return all
    if (count >= totalCount) {
      return this.quizRiddleRepo.find({ where: { level }, relations: ['chapter'] });
    }

    // Fetch only IDs, apply proper Fisher-Yates shuffle, then load selected records
    const allIds = await this.quizRiddleRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .where('riddle.level = :level', { level })
      .getMany();

    const selectedIds = this.fisherYatesSample(allIds.map(r => r.id), count);

    return this.quizRiddleRepo.find({
      where: { id: In(selectedIds) },
      relations: ['chapter'],
    });
  }

  async findMixedQuizRiddles(count: number): Promise<QuizRiddle[]> {
    const totalCount = await this.quizRiddleRepo.count();
    if (totalCount === 0) {
      return [];
    }

    // If requesting more than available, return all
    if (count >= totalCount) {
      return this.quizRiddleRepo.find({ relations: ['chapter'] });
    }

    // Fetch only IDs, apply Fisher-Yates sample, then load selected records
    const allIds = await this.quizRiddleRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .getMany();

    const selectedIds = this.fisherYatesSample(allIds.map(r => r.id), count);

    return this.quizRiddleRepo.find({
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

  async createQuizRiddle(dto: CreateQuizRiddleDto): Promise<QuizRiddle> {
    const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
    if (chapter === null) {
      throw new NotFoundException(`Chapter with id "${dto.chapterId}" not found`);
    }
    const riddle = this.quizRiddleRepo.create({
      question: dto.question,
      options: dto.options,
      correctAnswer: dto.correctAnswer,
      level: dto.level,
      explanation: dto.explanation,
      hint: dto.hint,
      chapter,
    });
    const saved = await this.quizRiddleRepo.save(riddle);
    await this.cacheService.delPattern('riddles:*'); // Invalidate after create
    return saved;
  }

  async createQuizRiddlesBulk(dto: CreateQuizRiddleDto[]): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];

    // Validate input
    if (!dto || dto.length === 0) {
      throw new BadRequestException('No quiz riddles provided for bulk creation');
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

      const riddles: QuizRiddle[] = [];
      for (let i = 0; i < dto.length; i++) {
        const r = dto[i];
        const chapter = chapterMap.get(r.chapterId);

        if (!chapter) {
          errors.push(`Row ${i + 1}: Chapter not found (ID: ${r.chapterId})`);
          continue;
        }

        const riddle = transactionalEntityManager.create(QuizRiddle, {
          question: r.question,
          options: r.options,
          correctAnswer: r.correctAnswer,
          level: r.level,
          explanation: r.explanation,
          hint: r.hint,
          chapter,
        });
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
   * Update a quiz riddle.
   * Uses explicit per-field assignment to allow clearing optional fields (null/empty).
   * Invalidates the riddles cache after a successful save.
   */
  async updateQuizRiddle(id: string, dto: UpdateQuizRiddleDto): Promise<QuizRiddle> {
    const riddle = await this.quizRiddleRepo.findOne({ where: { id }, relations: ['chapter'] });
    if (riddle === null) throw new NotFoundException('Quiz riddle not found');

    if (dto.question !== undefined) riddle.question = dto.question;
    if (dto.correctAnswer !== undefined) riddle.correctAnswer = dto.correctAnswer;
    if (dto.level !== undefined) riddle.level = dto.level;
    if (dto.explanation !== undefined) riddle.explanation = dto.explanation ?? '';
    if (dto.hint !== undefined) riddle.hint = dto.hint ?? '';
    if (dto.options !== undefined) riddle.options = dto.options;

    if (dto.chapterId !== undefined) {
      const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
      if (chapter === null) throw new NotFoundException(`Chapter with id "${dto.chapterId}" not found`);
      riddle.chapter = chapter;
    }

    const saved = await this.quizRiddleRepo.save(riddle);
    await this.cacheService.delPattern('riddles:*');  // Invalidate cache after mutation
    return saved;
  }

  /**
   * Delete a quiz riddle by ID.
   * Invalidates cache after successful deletion.
   */
  async deleteQuizRiddle(id: string): Promise<void> {
    const result = await this.quizRiddleRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Quiz riddle not found');
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
    return computeRiddleStats(this.riddleRepo, this.categoryRepo, this.quizRiddleRepo, this.subjectRepo, this.chapterRepo);
  }
}
