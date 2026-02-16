import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, In } from 'typeorm';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import { RiddleChapter } from './entities/riddle-chapter.entity';
import { QuizRiddle } from './entities/quiz-riddle.entity';
import {
  CreateRiddleDto,
  CreateRiddleCategoryDto,
  UpdateRiddleCategoryDto,
  CreateRiddleSubjectDto,
  UpdateRiddleSubjectDto,
  CreateRiddleChapterDto,
  UpdateRiddleChapterDto,
  CreateQuizRiddleDto,
  UpdateQuizRiddleDto,
  PaginationDto,
  SearchRiddlesDto,
} from '../common/dto/base.dto';
import { CacheService } from '../common/cache/cache.service';
import { settings } from '../config/settings';
import { BulkActionService } from '../common/services/bulk-action.service';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { BulkActionResult, StatusCountResponse } from '../common/interfaces/bulk-action-result.interface';
import { ContentStatus } from '../common/enums/content-status.enum';
import { DEFAULT_CACHE_TTL_S } from '../common/constants/app.constants';
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

  async findAllRiddles(
    pagination: PaginationDto,
    status?: ContentStatus,
  ): Promise<{ data: Riddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    
    const where: FindOptionsWhere<Riddle> = {};
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.riddleRepo.findAndCount({
      where,
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { data, total };
  }

  async findRandomRiddle(): Promise<Riddle> {
    // More efficient random selection using offset with count
    const count = await this.riddleRepo.count({
      where: { status: ContentStatus.PUBLISHED },
    });
    
    if (count === 0) {
      throw new NotFoundException('No riddles found');
    }

    const randomOffset = Math.floor(Math.random() * count);
    const riddle = await this.riddleRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.category', 'category')
      .where('riddle.status = :status', { status: ContentStatus.PUBLISHED })
      .skip(randomOffset)
      .take(1)
      .getOne();
      
    if (riddle === null) {
      throw new NotFoundException('No riddles found');
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
      queryBuilder.andWhere('(riddle.question ILIKE :search OR riddle.answer ILIKE :search)', {
        search: `%${searchDto.search}%`,
      });
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

    return await this.dataSource.transaction(async (transactionalEntityManager) => {
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
      
      // Only invalidate cache if transaction succeeds
      await this.cacheService.delPattern('riddles:*');
      
      return { count: saved.length, errors };
    });
  }

  async updateRiddle(id: string, dto: Partial<CreateRiddleDto>): Promise<Riddle> {
    const riddle = await this.riddleRepo.findOne({ where: { id }, relations: ['category'] });
    if (riddle === null) throw new NotFoundException('Riddle not found');
    const fields: (keyof CreateRiddleDto)[] = ['question', 'answer', 'difficulty'];
    fields.forEach(field => {
      const value = dto[field];
      if (value?.length) (riddle[field] as string) = value;
    });
    if (dto.categoryId?.length) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (category === null) throw new NotFoundException('Category not found');
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
    if (dto.name?.length) category.name = dto.name;
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
    await this.cacheService.del('riddles:categories');
  }

  // ==================== QUIZ FORMAT - SUBJECTS ====================

  async findAllSubjects(): Promise<RiddleSubject[]> {
    return this.cacheService.getOrSet(
      'riddles:subjects',
      async () => {
        return this.subjectRepo.find({
          where: { isActive: true },
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
    await this.cacheService.del('riddles:subjects');
    return saved;
  }

  async updateSubject(id: string, dto: UpdateRiddleSubjectDto): Promise<RiddleSubject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (subject === null) throw new NotFoundException('Subject not found');
    Object.assign(subject, dto);
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.del('riddles:subjects');
    return saved;
  }

  async deleteSubject(id: string): Promise<void> {
    const result = await this.subjectRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Subject not found');
    }
    await this.cacheService.del('riddles:subjects');
  }

  // ==================== QUIZ FORMAT - CHAPTERS ====================

  async findChaptersBySubject(subjectId: string): Promise<RiddleChapter[]> {
    return this.chapterRepo.find({
      where: { subject: { id: subjectId } },
      order: { chapterNumber: 'ASC' },
      relations: ['subject'],
    });
  }

  async createChapter(dto: CreateRiddleChapterDto): Promise<RiddleChapter> {
    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (subject === null) {
      throw new NotFoundException('Subject not found');
    }
    const chapter = this.chapterRepo.create({
      name: dto.name,
      chapterNumber: dto.chapterNumber,
      subject,
    });
    return this.chapterRepo.save(chapter);
  }

  async updateChapter(id: string, dto: UpdateRiddleChapterDto): Promise<RiddleChapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (chapter === null) throw new NotFoundException('Chapter not found');
    if (dto.name?.length) chapter.name = dto.name;
    if (dto.chapterNumber !== undefined) chapter.chapterNumber = dto.chapterNumber;
    return this.chapterRepo.save(chapter);
  }

  async deleteChapter(id: string): Promise<void> {
    const result = await this.chapterRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Chapter not found');
    }
  }

  // ==================== QUIZ FORMAT - RIDDLES ====================

  async findQuizRiddlesByChapter(
    chapterId: string,
    pagination: PaginationDto,
  ): Promise<{ data: QuizRiddle[]; total: number }> {
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

    // More efficient random selection using offset-based approach
    const totalCount = await this.quizRiddleRepo.count({ where: { level } });
    
    if (totalCount === 0) {
      return [];
    }

    // If requesting more than available, return all
    if (count >= totalCount) {
      return this.quizRiddleRepo.find({ where: { level } });
    }

    // Use Fisher-Yates shuffle approach: get all IDs, shuffle, then fetch selected
    const allIds = await this.quizRiddleRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .where('riddle.level = :level', { level })
      .getMany();
    
    // Shuffle and pick count items
    const shuffled = allIds.sort(() => Math.random() - 0.5).slice(0, count);
    const selectedIds = shuffled.map(r => r.id);

    return this.quizRiddleRepo.find({
      where: { id: In(selectedIds) },
      relations: ['chapter'],
    });
  }

  async findMixedQuizRiddles(count: number): Promise<QuizRiddle[]> {
    // More efficient random selection
    const totalCount = await this.quizRiddleRepo.count();
    
    if (totalCount === 0) {
      return [];
    }

    // If requesting more than available, return all
    if (count >= totalCount) {
      return this.quizRiddleRepo.find({ relations: ['chapter'] });
    }

    // Get all IDs, shuffle, then fetch selected
    const allIds = await this.quizRiddleRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .getMany();
    
    // Shuffle and pick count items
    const shuffled = allIds.sort(() => Math.random() - 0.5).slice(0, count);
    const selectedIds = shuffled.map(r => r.id);

    return this.quizRiddleRepo.find({
      where: { id: In(selectedIds) },
      relations: ['chapter'],
    });
  }

  async createQuizRiddle(dto: CreateQuizRiddleDto): Promise<QuizRiddle> {
    const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
    if (chapter === null) {
      throw new NotFoundException('Chapter not found');
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
    return this.quizRiddleRepo.save(riddle);
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

    return await this.dataSource.transaction(async (transactionalEntityManager) => {
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
  }

  async updateQuizRiddle(id: string, dto: Partial<CreateQuizRiddleDto>): Promise<QuizRiddle> {
    const riddle = await this.quizRiddleRepo.findOne({ where: { id } });
    if (riddle === null) throw new NotFoundException('Quiz riddle not found');
    const stringFields = ['question', 'correctAnswer', 'level', 'explanation', 'hint'] as const;
    stringFields.forEach(field => {
      const value = dto[field];
      if (value !== undefined && (field === 'explanation' || field === 'hint' || value.length > 0)) {
        (riddle[field] as string | undefined) = value;
      }
    });
    if (dto.options !== undefined) riddle.options = dto.options;
    if (dto.chapterId?.length) {
      const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
      if (chapter === null) throw new NotFoundException('Chapter not found');
      riddle.chapter = chapter;
    }
    return this.quizRiddleRepo.save(riddle);
  }

  async deleteQuizRiddle(id: string): Promise<void> {
    const result = await this.quizRiddleRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Quiz riddle not found');
    }
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
