import { randomUUID } from 'crypto';

import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { CreateQuestionDto, CreateSubjectDto, PaginationDto } from '../common/dto/base.dto';
import { BulkQuestionDto, BulkQuestionItemDto } from '../common/dto/bulk-question.dto';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { ContentStatus } from '../common/enums/content-status.enum';
import { BulkActionResult, StatusCountResponse } from '../common/interfaces/bulk-action-result.interface';
import { BulkActionService } from '../common/services/bulk-action.service';
import { settings } from '../config/settings';

import { Chapter } from './entities/chapter.entity';
import { Question } from './entities/question.entity';
import { Subject } from './entities/subject.entity';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  private readonly CACHE_KEYS = {
    FILTER_COUNTS: (subject: string, chapter: string, level: string, status: string) =>
      `quiz:filter-counts:${subject || 'all'}:${chapter || 'all'}:${level || 'all'}:${status || 'all'}`,
    QUESTIONS: (subject: string, chapter: string, level: string, status: string, page: number, limit: number) =>
      `quiz:questions:${subject || 'all'}:${chapter || 'all'}:${level || 'all'}:${status || 'all'}:${page}:${limit}`,
    QUESTIONS_CURSOR: (subject: string, chapter: string, level: string, status: string, cursor: string, limit: number) =>
      `quiz:questions:${subject || 'all'}:${chapter || 'all'}:${level || 'all'}:${status || 'all'}:cursor:${cursor}:${limit}`,
  };

  private readonly CACHE_TTL = {
    FILTER_COUNTS: 300,
    QUESTIONS: 600,
  };

  private shuffleArray<T>(array: T[]): T[] {
    // Fisher-Yates shuffle with crypto UUID for better randomness
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const uuidPart = randomUUID().replace(/-/g, '').slice(0, 8);
      const j = Math.floor(parseInt(uuidPart, 16) % (i + 1));
      const temp = shuffled[j]!;
      shuffled[j] = shuffled[i]!;
      shuffled[i] = temp;
    }
    return shuffled;
  }

  constructor(
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    @InjectRepository(Chapter)
    private chapterRepo: Repository<Chapter>,
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
    private cacheService: CacheService,
    private dataSource: DataSource,
    private bulkActionService: BulkActionService,
  ) { }

  private async clearQuizCaches(_subjectId?: string) {
    await this.cacheService.delPattern(`quiz:*`);
  }

  // ==================== SUBJECTS ====================

  async findAllSubjects(pagination?: PaginationDto, hasContentOnly: boolean = false): Promise<{ data: Subject[]; total: number }> {
    // NOTE: No caching for subjects list — ensures deletions are immediately reflected.
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 100;

    const query = this.subjectRepo.createQueryBuilder('subject')
      .orderBy('subject.order', 'ASC')
      .addOrderBy('subject.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (hasContentOnly) {
      // Filter subjects that have at least one chapter with at least one question
      query.innerJoin('subject.chapters', 'chapter')
        .innerJoin('chapter.questions', 'question');
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findSubjectBySlug(slug: string): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({
      where: { slug },
      relations: ['chapters'],
    });
    if (!subject) { throw new NotFoundException('Subject not found'); }
    return subject;
  }

  async createSubject(dto: CreateSubjectDto): Promise<Subject> {
    const subject = this.subjectRepo.create(dto);
    const saved = await this.subjectRepo.save(subject);
    await this.clearQuizCaches();
    return saved;
  }

  async updateSubject(id: string, dto: Partial<CreateSubjectDto>): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) { throw new NotFoundException('Subject not found'); }
    Object.assign(subject, dto);
    const saved = await this.subjectRepo.save(subject);
    await this.clearQuizCaches();
    return saved;
  }

  async deleteSubject(id: string): Promise<void> {
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ['chapters', 'chapters.questions']
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (subject.chapters && subject.chapters.length > 0) {
        for (const chapter of subject.chapters) {
          await queryRunner.manager.delete(Question, { chapterId: chapter.id });
        }
        await queryRunner.manager.delete(Chapter, { subjectId: id });
      }

      await queryRunner.manager.delete(Subject, { id });

      await queryRunner.commitTransaction();
      await this.clearQuizCaches();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== CHAPTERS ====================

  async findChaptersBySubject(subjectId: string): Promise<Chapter[]> {
    return this.chapterRepo.find({
      where: { subject: { id: subjectId } },
      order: { id: 'ASC' },
    });
  }

  async createChapter(name: string, subjectId: string): Promise<Chapter> {
    const subject = await this.subjectRepo.findOne({ where: { id: subjectId } });
    if (!subject) { throw new NotFoundException('Subject not found'); }

    // Check if chapter already exists in this subject
    const existingChapter = await this.chapterRepo.findOne({
      where: { name, subjectId }
    });
    if (existingChapter) {
      throw new BadRequestException(`Chapter "${name}" already exists in this subject`);
    }

    // Get the next chapter number for this subject
    const existingChapters = await this.chapterRepo.find({ where: { subjectId } });
    const chapterNumber = existingChapters.length + 1;

    const chapter = this.chapterRepo.create({ name, subject, subjectId, chapterNumber });
    const saved = await this.chapterRepo.save(chapter);
    await this.clearQuizCaches(subjectId);
    return saved;
  }

  async updateChapter(id: string, dto: { name?: string; subjectId?: string }): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (!chapter) { throw new NotFoundException('Chapter not found'); }
    if (dto.name !== undefined) { chapter.name = dto.name; }
    if (dto.subjectId !== undefined) { chapter.subjectId = dto.subjectId; }
    const saved = await this.chapterRepo.save(chapter);
    await this.clearQuizCaches(saved.subjectId);
    return saved;
  }

  async deleteChapter(id: string): Promise<void> {
    const queryRunner = this.dataSource
      .createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chapter = await queryRunner
        .manager.findOne(Chapter, { 
          where: { id } 
        });
      
      if (!chapter) {
        throw new NotFoundException(
          'Chapter not found'
        );
      }

      // Delete all questions in chapter first
      await queryRunner.manager.delete(
        Question, 
        { chapter: { id } }
      );

      // Then delete the chapter
      await queryRunner.manager.delete(
        Chapter, 
        { id }
      );

      await queryRunner.commitTransaction();
      
      // Clear cache after successful delete
      await this.clearQuizCaches(
        chapter.subjectId
      );

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findQuestionsByChapter(
    chapterId: string,
    pagination: PaginationDto,
  ): Promise<{ data: Question[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? settings.global.pagination.defaultLimit;
    const [data, total] = await this.questionRepo.findAndCount({
      where: { chapter: { id: chapterId }, status: ContentStatus.PUBLISHED },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findAllQuestions(
    pagination: PaginationDto,
    filters: {
      status?: ContentStatus;
      level?: string;
      chapter?: string;
      search?: string;
      subjectSlug?: string;
    },
  ): Promise<{ data: Question[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? settings.global.pagination.defaultLimit;

    const cacheKey = this.CACHE_KEYS.QUESTIONS(
      filters.subjectSlug || 'all',
      filters.chapter || 'all',
      filters.level || 'all',
      filters.status || 'all',
      page,
      limit
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = this.questionRepo.createQueryBuilder('question')
          .leftJoinAndSelect('question.chapter', 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject');

        if (filters.status != null) {
          query.andWhere('question.status = :status', { status: filters.status });
        }

        if (filters.level) {
          query.andWhere('question.level = :level', { level: filters.level });
        }

        if (filters.chapter) {
          query.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
        }

        if (filters.search) {
          query.andWhere('question.question ILIKE :search', { search: `%${filters.search}%` });
        }

        if (filters.subjectSlug) {
          query.andWhere('subject.slug = :subjectSlug', { subjectSlug: filters.subjectSlug });
        }

        const [data, total] = await query
          .skip((page - 1) * limit)
          .take(limit)
          .orderBy('question.updatedAt', 'DESC')
          .getManyAndCount();

        return { data, total };
      },
      this.CACHE_TTL.QUESTIONS
    );
  }

  async findAllQuestionsWithCursor(
    filters: {
      status?: ContentStatus;
      level?: string;
      chapter?: string;
      search?: string;
      subjectSlug?: string;
    },
    cursor?: string,
    limit: number = 20,
  ): Promise<{ data: Question[]; nextCursor: string | undefined; hasMore: boolean; total: number }> {
    const effectiveLimit = Math.min(limit, 100);

    const cacheKey = this.CACHE_KEYS.QUESTIONS_CURSOR(
      filters.subjectSlug || 'all',
      filters.chapter || 'all',
      filters.level || 'all',
      filters.status || 'all',
      cursor || 'start',
      effectiveLimit
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const queryBuilder = this.questionRepo.createQueryBuilder('question')
          .leftJoinAndSelect('question.chapter', 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject');

        if (filters.status != null) {
          queryBuilder.andWhere('question.status = :status', { status: filters.status });
        }
        if (filters.level) {
          queryBuilder.andWhere('question.level = :level', { level: filters.level });
        }
        if (filters.chapter) {
          queryBuilder.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
        }
        if (filters.search) {
          queryBuilder.andWhere('question.question ILIKE :search', { search: `%${filters.search}%` });
        }
        if (filters.subjectSlug) {
          queryBuilder.andWhere('subject.slug = :subjectSlug', { subjectSlug: filters.subjectSlug });
        }

        if (cursor && cursor !== 'initial') {
          try {
            const decoded = Buffer.from(cursor, 'base64').toString('ascii');
            const [dateStr, id] = decoded.split('::');
            if (dateStr && id) {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                queryBuilder.andWhere(
                  '(question.updatedAt < :cursorDate OR (question.updatedAt = :cursorDate AND question.id < :cursorId))',
                  { cursorDate: date, cursorId: id }
                );
              }
            }
          } catch {
            this.logger.warn(`Invalid cursor format: ${cursor}`);
          }
        }

        const questions = await queryBuilder
          .orderBy('question.updatedAt', 'DESC')
          .addOrderBy('question.id', 'DESC')
          .take(effectiveLimit + 1)
          .getMany();

        const hasMore = questions.length > effectiveLimit;
        const data = hasMore ? questions.slice(0, effectiveLimit) : questions;

        const lastQuestion = data[data.length - 1];
        const nextCursor = hasMore && lastQuestion
          ? Buffer.from(`${lastQuestion.updatedAt.toISOString()}::${lastQuestion.id}`).toString('base64')
          : undefined;

        // Get total count for pagination info
        const total = await this.getTotalQuestionsCount(filters);

        return { data, nextCursor, hasMore, total };
      },
      this.CACHE_TTL.QUESTIONS
    );
  }

  private async getTotalQuestionsCount(filters: {
    status?: ContentStatus;
    level?: string;
    chapter?: string;
    search?: string;
    subjectSlug?: string;
  }): Promise<number> {
    const queryBuilder = this.questionRepo.createQueryBuilder('question')
      .leftJoin('question.chapter', 'chapter')
      .leftJoin('chapter.subject', 'subject');

    if (filters.status != null) {
      queryBuilder.andWhere('question.status = :status', { status: filters.status });
    }
    if (filters.level) {
      queryBuilder.andWhere('question.level = :level', { level: filters.level });
    }
    if (filters.chapter) {
      queryBuilder.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
    }
    if (filters.search) {
      queryBuilder.andWhere('question.question ILIKE :search', { search: `%${filters.search}%` });
    }
    if (filters.subjectSlug) {
      queryBuilder.andWhere('subject.slug = :subjectSlug', { subjectSlug: filters.subjectSlug });
    }

    return queryBuilder.getCount();
  }

  async getFilterCounts(filters: {
    subject?: string;
    status?: string;
    level?: string;
    chapter?: string;
    search?: string;
  }): Promise<{
    subjects: { id: string; name: string; slug: string; emoji: string; category: string; count: number }[];
    chapterCounts: { id: string; name: string; count: number; subjectId: string }[];
    levelCounts: { level: string; count: number }[];
    statusCounts: { status: string; count: number }[];
    total: number;
  }> {
    const cacheKey = this.CACHE_KEYS.FILTER_COUNTS(
      filters.subject || 'all',
      filters.chapter || 'all',
      filters.level || 'all',
      filters.status || 'all'
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Parent-only cascading rule:
        // Subject counts: No filters (always show totals)
        // Chapter counts: Subject filter only
        // Level counts: Subject + Chapter filters
        // Status counts: Subject + Chapter + Level filters
        
        // Helper to apply filters based on hierarchy position
        const applyParentFilters = (
          query: any, 
          includeSubject: boolean, 
          includeChapter: boolean, 
          includeLevel: boolean,
          includeStatus: boolean
        ) => {
          if (includeSubject && filters.subject && filters.subject !== 'all') {
            query.andWhere('subject.slug = :subjectSlug', { subjectSlug: filters.subject });
          }
          if (includeChapter && filters.chapter) {
            query.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
          }
          if (includeLevel && filters.level && filters.level !== 'all') {
            query.andWhere('question.level = :level', { level: filters.level });
          }
          if (includeStatus && filters.status && filters.status !== 'all') {
            query.andWhere('question.status = :status', { status: filters.status });
          }
          if (filters.search) {
            query.andWhere('question.question ILIKE :search', { search: `%${filters.search}%` });
          }
        };

        // 1. SUBJECT COUNTS: No parent filters (always show totals)
        let subjectResults: { id: string; name: string; slug: string; emoji: string; category: string; count: number }[] = [];
        const allSubjects = await this.subjectRepo.find();
        const subjectCountMap = new Map<string, number>();
        allSubjects.forEach(s => subjectCountMap.set(s.slug, 0));

        const subjectQuery = this.questionRepo.createQueryBuilder('question')
          .leftJoin('question.chapter', 'chapter')
          .leftJoin('chapter.subject', 'subject')
          .select('subject.slug', 'slug')
          .addSelect('COUNT(*)', 'count')
          .where('subject.slug IS NOT NULL');
        
        // Subject counts: NO parent filters applied
        const subjectRaw = await subjectQuery.groupBy('subject.slug').getRawMany();
        subjectRaw.forEach((r: { slug: string; count: string }) => {
          subjectCountMap.set(r.slug, parseInt(r.count, 10));
        });
        // Build full subject data with counts
        subjectResults = allSubjects.map(s => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          emoji: s.emoji,
          category: s.category,
          count: subjectCountMap.get(s.slug) || 0
        }));

        // 2. CHAPTER COUNTS: Subject filter only
        // Return ALL chapters with their question counts (0 if no questions)
        let chapterResults: { id: string; name: string; count: number; subjectId: string }[] = [];
        
        // Get all chapters first
        let chaptersToShow: Chapter[] = [];
        if (filters.subject && filters.subject !== 'all') {
          const subject = await this.subjectRepo.findOne({ where: { slug: filters.subject } });
          if (subject) {
            chaptersToShow = await this.chapterRepo.find({ where: { subjectId: subject.id } });
          }
        } else {
          chaptersToShow = await this.chapterRepo.find({ relations: ['subject'] });
        }
        
        // Create a map of all chapters with initial count of 0
        const chapterCountMap = new Map<string, { name: string; subjectId: string; count: number }>();
        chaptersToShow.forEach(c => {
          chapterCountMap.set(c.id, { name: c.name, subjectId: c.subjectId, count: 0 });
        });
        
        // Get question counts for chapters that have questions
        if (chaptersToShow.length > 0) {
          const chapterIds = chaptersToShow.map(c => c.id);
          const chapterQuery = this.questionRepo.createQueryBuilder('question')
            .select('question.chapterId', 'id')
            .addSelect('COUNT(*)', 'count')
            .where('question.chapterId IN (:...chapterIds)', { chapterIds });
          
          // Chapter counts: Subject filter only (no chapter, level, status filters)
          applyParentFilters(chapterQuery, false, false, false, false);
          
          const chapterRaw = await chapterQuery
            .groupBy('question.chapterId')
            .getRawMany();
          
          // Update counts for chapters that have questions
          chapterRaw.forEach((r: { id: string; count: string }) => {
            const existing = chapterCountMap.get(r.id);
            if (existing) {
              existing.count = parseInt(r.count, 10);
            }
          });
        }
        
        // Convert map to array
        chapterResults = Array.from(chapterCountMap.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          count: data.count,
          subjectId: data.subjectId
        }));

        // 3. LEVEL COUNTS: Subject + Chapter filters
        const levelQuery = this.questionRepo.createQueryBuilder('question')
          .leftJoinAndSelect('question.chapter', 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject')
          .select('question.level', 'level')
          .addSelect('COUNT(*)', 'count');
        
        // Level counts: Subject + Chapter filters only
        applyParentFilters(levelQuery, true, true, false, false);
        
        const levelResults = await levelQuery.groupBy('question.level').getRawMany();

        // 4. STATUS COUNTS: Subject + Chapter + Level filters
        const statusQuery = this.questionRepo.createQueryBuilder('question')
          .leftJoinAndSelect('question.chapter', 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject')
          .select('question.status', 'status')
          .addSelect('COUNT(*)', 'count');
        
        // Status counts: Subject + Chapter + Level filters only
        applyParentFilters(statusQuery, true, true, true, false);
        
        const statusResults = await statusQuery.groupBy('question.status').getRawMany();

        // Calculate total with all filters (for table data count)
        const totalQuery = this.questionRepo.createQueryBuilder('question')
          .leftJoinAndSelect('question.chapter', 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject');
        applyParentFilters(totalQuery, true, true, true, true);
        const total = await totalQuery.getCount();

        const statusCounts = statusResults.map((r: { status: string; count: string }) => ({ 
          status: r.status, 
          count: parseInt(r.count, 10) 
        }));
        const levelCounts = levelResults.map((r: { level: string; count: string }) => ({ 
          level: r.level, 
          count: parseInt(r.count, 10) 
        }));

        return {
          subjects: subjectResults,
          chapterCounts: chapterResults,
          levelCounts,
          statusCounts,
          total,
        };
      },
      this.CACHE_TTL.FILTER_COUNTS
    );
  }

  async findRandomQuestions(level: string, count: number): Promise<Question[]> {
    // Validate level parameter
    const validLevels = ['easy', 'medium', 'hard', 'expert', 'extreme'];
    if (!validLevels.includes(level)) {
      throw new BadRequestException(`Invalid level: ${level}. Valid values: ${validLevels.join(', ')}`);
    }

    // More efficient random selection using offset-based approach
    const totalCount = await this.questionRepo.count({
      where: { level, status: ContentStatus.PUBLISHED }
    });

    if (totalCount === 0) {
      return [];
    }

    // If requesting more than available, return all
    if (count >= totalCount) {
      return this.questionRepo.find({
        where: { level, status: ContentStatus.PUBLISHED }
      });
    }

    // Use Fisher-Yates shuffle approach: get all IDs, shuffle, then fetch selected
    const allIds = await this.questionRepo
      .createQueryBuilder('question')
      .select('question.id')
      .where('question.level = :level', { level })
      .andWhere('question.status = :status', { status: ContentStatus.PUBLISHED })
      .getMany();

    // Shuffle and pick count items using secure Fisher-Yates shuffle
    const shuffled = this.shuffleArray(allIds).slice(0, count);
    const selectedIds = shuffled.map(q => q.id);

    return this.questionRepo.find({
      where: { id: In(selectedIds) },
      relations: ['chapter'],
    });
  }

  async findMixedQuestions(count: number): Promise<Question[]> {
    // More efficient random selection
    const totalCount = await this.questionRepo.count({
      where: { status: ContentStatus.PUBLISHED }
    });

    if (totalCount === 0) {
      return [];
    }

    // If requesting more than available, return all
    if (count >= totalCount) {
      return this.questionRepo.find({
        where: { status: ContentStatus.PUBLISHED },
        relations: ['chapter'],
      });
    }

    // Get all IDs, shuffle, then fetch selected
    const allIds = await this.questionRepo
      .createQueryBuilder('question')
      .select('question.id')
      .where('question.status = :status', { status: ContentStatus.PUBLISHED })
      .getMany();

    // Shuffle and pick count items using secure Fisher-Yates shuffle
    const shuffled = this.shuffleArray(allIds).slice(0, count);
    const selectedIds = shuffled.map(q => q.id);

    return this.questionRepo.find({
      where: { id: In(selectedIds) },
      relations: ['chapter'],
    });
  }

  async createQuestion(dto: CreateQuestionDto): Promise<Question> {
    const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
    if (!chapter) { throw new NotFoundException('Chapter not found'); }

    // Derive question type from level: extreme = open-ended, others = mcq
    const levelStr = String(dto.level);
    const isOpenEnded = levelStr === 'extreme';
    
    // Validate based on level
    if (!isOpenEnded && !dto.correctLetter) {
      throw new BadRequestException('MCQ questions require correctLetter (A/B/C/D)');
    }
    if (isOpenEnded && dto.correctLetter) {
      throw new BadRequestException('Open-ended questions must have correctLetter: null');
    }
    if (!isOpenEnded && (!dto.options || dto.options.length < 2)) {
      throw new BadRequestException('MCQ requires at least 2 options');
    }

    const question = this.questionRepo.create({
      question: dto.question,
      correctAnswer: dto.correctAnswer,
      correctLetter: isOpenEnded ? null : dto.correctLetter,
      options: isOpenEnded ? null : (dto.options || []),
      level: dto.level,
      chapter,
      status: dto.status || ContentStatus.PUBLISHED,
    });
    const saved = await this.questionRepo.save(question);
    await this.cacheService.delPattern('quiz:*');
    return saved;
  }

  async createQuestionsBulk(dto: CreateQuestionDto[]): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];

    // Validate input
    if (!dto || dto.length === 0) {
      throw new BadRequestException('No questions provided for bulk creation');
    }

    // Chunk size to prevent memory issues and database timeouts
    const CHUNK_SIZE = 100;
    const totalChunks = Math.ceil(dto.length / CHUNK_SIZE);
    let totalCreated = 0;

    // Process in chunks to prevent memory exhaustion
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, dto.length);
      const chunk = dto.slice(start, end);

      const result = await this.processQuestionChunk(chunk, errors, start);
      totalCreated += result.count;
    }

    // Invalidate cache after bulk create
    await this.cacheService.delPattern('quiz:*');

    return { count: totalCreated, errors };
  }
  private async processQuestionChunk(
    dto: CreateQuestionDto[],
    errors: string[],
    offset: number,
  ): Promise<{ count: number; errors: string[] }> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Get all unique chapter IDs for batch fetch - fixes N+1 query
      const chapterIds = [...new Set(dto.map(q => q.chapterId))];
      const chapters = await transactionalEntityManager.find(Chapter, {
        where: { id: In(chapterIds) },
      });

      // Create a map for quick lookup
      const chapterMap = new Map(chapters.map(c => [c.id, c]));

      const questions: Question[] = [];
      for (let i = 0; i < dto.length; i++) {
        const q = dto[i];
        if (!q) continue;
        const chapter = chapterMap.get(q.chapterId);

        if (!chapter) {
          errors.push(`Row ${offset + i + 1}: Chapter not found (ID: ${q.chapterId})`);
          continue;
        }

        // Validate level
        const validLevels = ['easy', 'medium', 'hard', 'expert', 'extreme'];
        if (!validLevels.includes(q.level)) {
          errors.push(`Row ${offset + i + 1}: Invalid level '${q.level}'. Valid: ${validLevels.join(', ')}`);
          continue;
        }

        // Validate question type - derive from level
        const levelStr = String(q.level);
        const isOpenEnded = levelStr === 'extreme';
        const correctLetter = q.correctLetter || null;

        if (!isOpenEnded && !correctLetter) {
          errors.push(`Row ${offset + i + 1}: MCQ requires correctLetter (A/B/C/D)`);
          continue;
        }
        if (isOpenEnded && correctLetter) {
          errors.push(`Row ${offset + i + 1}: Open-ended must have correctLetter: null`);
          continue;
        }

        const question = transactionalEntityManager.create(Question, {
          question: q.question,
          correctAnswer: q.correctAnswer,
          correctLetter: isOpenEnded ? null : correctLetter,
          options: isOpenEnded ? null : (q.options || []),
          level: q.level,
          chapter,
          status: q.status || ContentStatus.PUBLISHED,
          order: q.order || i,
        });
        questions.push(question);
      }

      if (questions.length === 0) {
        throw new BadRequestException(`No valid questions to create. Errors: ${errors.join('; ')}`);
      }

      const saved = await transactionalEntityManager.save(questions);
      return { count: saved.length, errors };
    });
  }

  async createQuestionsBulkFromImport(dto: BulkQuestionDto): Promise<{ count: number; errors: string[] }> {
    const { subjectName: defaultSubjectName, questions } = dto;
    const errors: string[] = [];

    if (!questions || questions.length === 0) {
      throw new BadRequestException('No questions provided for bulk creation');
    }

    const CHUNK_SIZE = 100;
    let totalCreated = 0;

    for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
      const chunk = questions.slice(i, i + CHUNK_SIZE);
      const result = await this.processBulkImportChunk(chunk, defaultSubjectName, errors, i);
      totalCreated += result.count;
    }

    await this.cacheService.delPattern('quiz:*');
    return { count: totalCreated, errors };
  }

  private async processBulkImportChunk(
    items: BulkQuestionItemDto[],
    defaultSubjectName: string | undefined,
    errors: string[],
    offset: number,
  ): Promise<{ count: number }> {
    return await this.dataSource.transaction(async (manager) => {
      const allSubjectNames = [...new Set(items.map(q => q.subjectName || defaultSubjectName || 'General'))];
      const subjectMap = new Map<string, Subject>();

      for (const name of allSubjectNames) {
        let subject = await manager.findOne(Subject, { where: { name } });
        if (!subject) {
          subject = await manager.save(Subject, {
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            emoji: '📚',
            isActive: true,
          });
        }
        subjectMap.set(name, subject);
      }

      const chapterKeys = [...new Set(items.map(q => `${q.chapterName}|${q.subjectName || defaultSubjectName || 'General'}`))];
      const chapterMap = new Map<string, Chapter>();

      for (const key of chapterKeys) {
        const [chapterName, subjectName] = key.split('|');
        const subject = subjectMap.get(subjectName || 'General');
        if (!subject) continue;

        let chapter = await manager.findOne(Chapter, {
          where: { name: chapterName, subjectId: subject.id },
        });
        if (!chapter) {
          chapter = await manager.save(Chapter, {
            name: chapterName,
            subjectId: subject.id,
            chapterNumber: 0,
          });
        }
        chapterMap.set(key, chapter);
      }

      let count = 0;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.question || !item.chapterName) {
          errors.push(`Row ${offset + i + 1}: Missing question or chapter`);
          continue;
        }

        const subjectName = item.subjectName || defaultSubjectName || 'General';
        const subject = subjectMap.get(subjectName);
        const chapterKey = `${item.chapterName}|${subjectName}`;
        const chapter = chapterMap.get(chapterKey);

        if (!subject || !chapter) {
          errors.push(`Row ${offset + i + 1}: Could not find/create subject or chapter`);
          continue;
        }

        const isExtreme = item.level === 'extreme';
        const validLevels = ['easy', 'medium', 'hard', 'expert', 'extreme'];

        if (item.level && !validLevels.includes(item.level)) {
          errors.push(`Row ${offset + i + 1}: Invalid level '${item.level}'`);
          continue;
        }

        let options: string[] | null = null;
        let correctLetter: string | null = null;
        let correctAnswer = '';

        if (!isExtreme) {
          const letter = item.correctAnswer?.toUpperCase() || 'A';
          correctLetter = ['A', 'B', 'C', 'D'].includes(letter) ? letter : 'A';

          const opts = [item.optionA, item.optionB, item.optionC, item.optionD].filter(Boolean);
          options = opts as string[];

          const letterIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter || '');
          correctAnswer = options[letterIndex] || options[0] || '';
        } else {
          options = null;
          correctLetter = null;
          correctAnswer = item.correctAnswer || '';
        }

        const questionLevel = (item.level || 'easy') as 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
        const questionStatus = item.status === 'draft' ? ContentStatus.DRAFT : ContentStatus.PUBLISHED;

        try {
          await manager.save(Question, {
            question: item.question,
            options,
            correctAnswer,
            correctLetter,
            level: questionLevel,
            status: questionStatus,
            chapterId: chapter.id,
          });
          count++;
        } catch (e: any) {
          errors.push(`Row ${offset + i + 1}: ${e.message}`);
        }
      }

      return { count };
    });
  }

  async updateQuestion(id: string, dto: Partial<CreateQuestionDto>): Promise<Question> {
    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) { throw new NotFoundException('Question not found'); }

    // Update fields with proper empty string handling
    if (dto.question !== undefined) {
      question.question = dto.question;
    }
    if (dto.correctAnswer !== undefined) {
      question.correctAnswer = dto.correctAnswer;
    }
    if (dto.correctLetter !== undefined) {
      question.correctLetter = dto.correctLetter || null;
    }
    if (dto.options !== undefined) {
      // Derive from level to determine if open-ended
      const level = (dto.level != null) || question.level;
      question.options = level === 'extreme' ? null : dto.options;
    }
    if (dto.level !== undefined) {
      // Validate level if provided
      const validLevels = ['easy', 'medium', 'hard', 'expert', 'extreme'];
      if (!validLevels.includes(dto.level)) {
        throw new BadRequestException(`Invalid level: ${dto.level}. Valid values: ${validLevels.join(', ')}`);
      }
      question.level = dto.level;
      // Also update options based on new level
      if (String(dto.level) === 'extreme') {
        question.options = null;
        question.correctLetter = null;
      }
    }
    if (dto.chapterId !== undefined) {
      const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
      if (!chapter) { throw new NotFoundException('Chapter not found'); }
      question.chapter = chapter;
    }

    const saved = await this.questionRepo.save(question);
    // Invalidate cache after update
    await this.cacheService.delPattern('quiz:*');
    return saved;
  }

  async deleteQuestion(id: string): Promise<void> {
    const result = await this.questionRepo.delete(id);
    if (result.affected === 0) { throw new NotFoundException('Question not found'); }
    // Invalidate cache after delete
    await this.cacheService.delPattern('quiz:*');
  }

  // ==================== BULK ACTIONS ====================

  /**
   * Execute bulk action on questions
   * @param ids - Array of question IDs
   * @param action - Bulk action type
   * @returns BulkActionResult with operation results
   */
  async bulkAction(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(`[QuizService] Executing bulk ${action} on ${ids.length} questions`);

    const result = await this.bulkActionService.executeBulkAction(
      this.questionRepo,
      'question',
      ids,
      action,
    );

    // Invalidate cache if any changes were made
    if (result.succeeded > 0) {
      await this.cacheService.delPattern('quiz:*');
      this.logger.log(`[QuizService] Cache invalidated after bulk ${action}`);
    }

    return result;
  }

  /**
   * Get status counts for a specific subject
   * @param subjectSlug - The subject slug
   * @returns StatusCountResponse with counts by status for the subject
   */
  async getStatusCountsBySubject(subjectSlug: string): Promise<StatusCountResponse> {
    const subject = await this.subjectRepo.findOne({ where: { slug: subjectSlug } });
    if (!subject) {
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }

    const chapters = await this.chapterRepo.find({ where: { subjectId: subject.id } });
    const chapterIds = chapters.map(c => c.id);

    if (chapterIds.length === 0) {
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }

    // Single query with GROUP BY for all status counts
    const statusCounts = await this.questionRepo
      .createQueryBuilder('question')
      .select('question.status', 'status')
      .addSelect('CAST(COUNT(*) AS INT)', 'count')
      .where('question.chapterId IN (:...chapterIds)', { chapterIds })
      .groupBy('question.status')
      .getRawMany();

    // Initialize with defaults
    const counts = { total: 0, published: 0, draft: 0, trash: 0 };
    
    // Sum up total and populate individual statuses
    statusCounts.forEach((row: { status: string; count: number }) => {
      counts.total += row.count;
      if (row.status in counts) {
        (counts as any)[row.status] = row.count;
      }
    });

    return counts;
  }
}
