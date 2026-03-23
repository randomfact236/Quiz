import { randomUUID } from 'crypto';

import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, In, ILike } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { CreateQuestionDto, CreateSubjectDto, PaginationDto } from '../common/dto/base.dto';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { ContentStatus } from '../common/enums/content-status.enum';
import { BulkActionResult, StatusCountResponse } from '../common/interfaces/bulk-action-result.interface';
import { BulkActionService } from '../common/services/bulk-action.service';
import { settings } from '../config/settings';

import { ChapterSlugHistory } from './entities/chapter-slug-history.entity';
import { Chapter } from './entities/chapter.entity';
import { Question } from './entities/question.entity';
import { Subject } from './entities/subject.entity';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  private shuffleArray<T>(array: T[]): T[] {
    // Fisher-Yates shuffle with crypto UUID for better randomness
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const uuidPart = randomUUID().replace(/-/g, '').slice(0, 8);
      const j = Math.floor(parseInt(uuidPart, 16) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
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
    @InjectRepository(ChapterSlugHistory)
    private chapterSlugHistoryRepo: Repository<ChapterSlugHistory>,
    private cacheService: CacheService,
    private dataSource: DataSource,
    private bulkActionService: BulkActionService,
  ) { }

  /** Helper to invalidate specific caches based on the operation */
  private async clearQuizCaches(subjectId?: string) {
    if (subjectId) {
      await this.cacheService.delPattern(`chapters:${subjectId}*`);
    } else {
      await this.cacheService.delPattern(`chapters:*`);
    }
    await this.cacheService.delPattern(`questions:*`);
    await this.cacheService.delPattern(`filter-counts:*`);
    await this.cacheService.delPattern(`${settings.quiz.cache.allSubjectsKey}*`);
    await this.cacheService.delPattern(`subjects:all*`); // Just in case
  }

  // ==================== SUBJECTS ====================

  async findAllSubjects(pagination?: PaginationDto, hasContentOnly: boolean = false): Promise<{ data: Subject[]; total: number }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 100;
    const cacheKey = `subjects:all:${page}:${limit}:${hasContentOnly}`;

    return this.cacheService.getOrSet(cacheKey, async () => {
      const query = this.subjectRepo.createQueryBuilder('subject')
        .leftJoin('subject.chapters', 'chapter')
        .leftJoin('chapter.questions', 'question', 'question.status = :status', { status: ContentStatus.PUBLISHED })
        .select([
          'subject.id',
          'subject.slug',
          'subject.name',
          'subject.emoji',
          'subject.category',
          'subject.isActive',
          'subject.order',
        ])
        .addSelect('COUNT(DISTINCT question.id)', 'questionCount')
        .groupBy('subject.id')
        .orderBy('subject.order', 'ASC')
        .addOrderBy('subject.name', 'ASC')
        .skip((page - 1) * limit)
        .take(limit);

      if (hasContentOnly) {
        query.andHaving('COUNT(question.id) > 0');
      }

      const rawAndEntities = await query.getRawAndEntities();
      const data = rawAndEntities.entities.map((entity, index) => {
        const raw = rawAndEntities.raw.find(r => r.subject_id === entity.id);
        return {
          ...entity,
          questionCount: raw ? parseInt(raw.questionCount, 10) : 0,
        };
      }) as (Subject & { questionCount: number })[];

      const total = await query.getCount();
      return { data, total };
    }, 30 * 60); // 30 minutes TTL
  }

  async findSubjectBySlug(slug: string): Promise<Subject & { chapters: (Chapter & { questionCount: number })[] }> {
    const subject = await this.subjectRepo.findOne({
      where: { slug },
      relations: ['chapters'],
    });
    
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Get question counts and distinct levels for all chapters in this subject
    const chapterIds = subject.chapters.map(c => c.id);
    if (chapterIds.length > 0) {
      const chapterMetadata = await this.questionRepo.createQueryBuilder('question')
        .select('question.chapterId', 'chapterId')
        .addSelect('COUNT(question.id)', 'count')
        .addSelect('ARRAY_AGG(DISTINCT question.level)', 'levels')
        .where('question.chapterId IN (:...chapterIds)', { chapterIds })
        .andWhere('question.status = :status', { status: ContentStatus.PUBLISHED })
        .groupBy('question.chapterId')
        .getRawMany();

      const metadataMap = new Map(chapterMetadata.map(m => [m.chapterId, {
        count: parseInt(m.count, 10),
        levels: m.levels || []
      }]));

      subject.chapters = subject.chapters.map(chapter => {
        const metadata = metadataMap.get(chapter.id);
        return {
          ...chapter,
          questionCount: metadata?.count || 0,
          levels: metadata?.levels || [],
        };
      });
    }

    return subject as any;
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
    const cacheKey = `chapters:${subjectId}`;
    return this.cacheService.getOrSet(cacheKey, async () => {
      return this.chapterRepo.find({
        where: { subject: { id: subjectId } },
        order: { id: 'ASC' },
      });
    }, 30 * 60); // 30 minutes TTL
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

    // Generate unique slug per subject
    const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let slug = baseSlug || 'chapter';
    let counter = 1;
    while (await this.chapterRepo.findOne({ where: { slug, subjectId } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get the next chapter number for this subject
    const existingChapters = await this.chapterRepo.find({ where: { subjectId } });
    const chapterNumber = existingChapters.length + 1;

    const chapter = this.chapterRepo.create({ name, slug, subject, subjectId, chapterNumber });
    const saved = await this.chapterRepo.save(chapter);
    await this.clearQuizCaches(subjectId);
    return saved;
  }

  async updateChapter(id: string, dto: { name?: string; slug?: string; subjectId?: string }): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (!chapter) { throw new NotFoundException('Chapter not found'); }

    if (dto.name && dto.name !== chapter.name) {
      chapter.name = dto.name;
    }

    if (dto.slug && dto.slug !== chapter.slug) {
      // Check for uniqueness
      const existing = await this.chapterRepo.findOne({ where: { slug: dto.slug, subjectId: chapter.subjectId } });
      if (existing) {
        throw new BadRequestException(`Chapter slug "${dto.slug}" already exists`);
      }
      // Save history
      const history = this.chapterSlugHistoryRepo.create({
        chapterId: chapter.id,
        oldSlug: chapter.slug,
        newSlug: dto.slug
      });
      await this.chapterSlugHistoryRepo.save(history);
      
      chapter.slug = dto.slug;
    }
    
    if (dto.subjectId) {
      chapter.subjectId = dto.subjectId;
    }

    const saved = await this.chapterRepo.save(chapter);
    await this.clearQuizCaches(saved.subjectId);
    return saved;
  }

  // Phase 5 Step 3: Resolve Chapter UUID across legacy identifiers (name, slug, old_slug, UUID)
  public async resolveChapterId(identifier: string, subjectSlug?: string): Promise<string | null> {
    // 1. Directly a UUID?
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)) {
      return identifier;
    }

    // Prepare subject filter if provided
    let subjectId: string | undefined;
    if (subjectSlug) {
      const subject = await this.subjectRepo.findOne({ where: { slug: subjectSlug } });
      if (subject) subjectId = subject.id;
    }

    // 2. Try by exact slug or exact name
    const chapterQuery = this.chapterRepo.createQueryBuilder('chapter')
      .where('(chapter.slug = :identifier OR chapter.name = :identifier)', { identifier });
    
    if (subjectId) {
      chapterQuery.andWhere('chapter.subjectId = :subjectId', { subjectId });
    }

    const chapter = await chapterQuery.getOne();
    if (chapter) return chapter.id;

    // 3. Try slug history
    const historyQuery = this.chapterSlugHistoryRepo.createQueryBuilder('history')
      .where('history.oldSlug = :identifier', { identifier })
      .orderBy('history.createdAt', 'DESC');

    const history = await historyQuery.getOne();
    if (history) {
      // Ensure the history's chapter belongs to the subject if subject passed
      if (subjectId) {
        const histChap = await this.chapterRepo.findOne({ where: { id: history.chapterId, subjectId } });
        if (histChap) return histChap.id;
      } else {
        return history.chapterId;
      }
    }

    return null;
  }

  async deleteChapter(id: string): Promise<void> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    const result = await this.chapterRepo.delete(id);
    if (result.affected === 0) { throw new NotFoundException('Chapter not found'); }
    await this.clearQuizCaches(chapter.subjectId);
  }

  // ==================== QUESTIONS ====================

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

    const cacheKey = `questions:${filters.subjectSlug || 'all'}:${filters.chapter || 'all'}:${filters.level || 'all'}:${filters.status || 'all'}:${limit}:${page}${filters.search ? `:${filters.search}` : ''}`;

    return this.cacheService.getOrSet(cacheKey, async () => {
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
        const chapterId = await this.resolveChapterId(filters.chapter, filters.subjectSlug);
        if (chapterId) {
          query.andWhere('question.chapterId = :chapterId', { chapterId });
        } else {
          query.andWhere('1 = 0'); // Invalid slug/name forces zero results
        }
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
    }, 10 * 60); // 10 minutes TTL
  }

  async getFilterCounts(filters: {
    subject?: string;
    status?: string;
    level?: string;
    chapter?: string;
    search?: string;
  }): Promise<{
    subjectCounts: { slug: string; count: number }[];
    chapterCounts: { id: string; name: string; count: number; subjectId: string }[];
    levelCounts: { level: string; count: number }[];
    statusCounts: { status: string; count: number }[];
    total: number;
  }> {
    const cacheKey = `filter-counts:${filters.subject || 'all'}:${filters.chapter || 'all'}:${filters.level || 'all'}:${filters.status || 'all'}${filters.search ? `:${filters.search}` : ''}`;

    return this.cacheService.getOrSet(cacheKey, async () => {
      // Parent-only cascading rule:
      // Subject counts: No filters (always show totals)
      // Chapter counts: Subject filter only
      // Level counts: Subject + Chapter filters
      // Status counts: Subject + Chapter + Level filters
      
      // Phase 5 Step 3: Pre-resolve the chapter identifier to UUID for use in the filtering block
      let resolvedChapterId: string | null = null;
      let isInvalidChapter = false;
      if (filters.chapter) {
        resolvedChapterId = await this.resolveChapterId(filters.chapter, filters.subject);
        if (!resolvedChapterId) isInvalidChapter = true;
      }

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
          if (resolvedChapterId) {
            query.andWhere('question.chapterId = :chapterId', { chapterId: resolvedChapterId });
          } else if (isInvalidChapter) {
            query.andWhere('1 = 0');
          }
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
      let subjectResults: { slug: string; count: number }[] = [];
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
      subjectResults = Array.from(subjectCountMap.entries()).map(([slug, count]) => ({ slug, count }));

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
        subjectCounts: subjectResults,
        chapterCounts: chapterResults,
        levelCounts,
        statusCounts,
        total,
      };
    }, 5 * 60); // 5 minutes TTL
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
    await this.clearQuizCaches(chapter.subjectId);
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

    await this.clearQuizCaches();
    return { count: totalCreated, errors };
  }

  /**
   * Process a single chunk of questions within a transaction
   */
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
    const updatedChapter = await this.chapterRepo.findOne({ where: { id: saved.chapterId } });
    if (updatedChapter) {
      await this.clearQuizCaches(updatedChapter.subjectId);
    }
    return saved;
  }

  async deleteQuestion(id: string): Promise<void> {
    const question = await this.questionRepo.findOne({ where: { id }, relations: ['chapter'] });
    if (!question) { throw new NotFoundException('Question not found'); }
    const result = await this.questionRepo.delete(id);
    if (result.affected === 0) { throw new NotFoundException('Question not found'); }
    if (question.chapter) {
      await this.clearQuizCaches(question.chapter.subjectId);
    }
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
      await this.clearQuizCaches();
      this.logger.log(`[QuizService] Cache invalidated after bulk ${action}`);
    }

    return result;
  }

  /**
   * Get status counts for questions
   * @returns StatusCountResponse with counts by status
   */
  async getStatusCounts(): Promise<StatusCountResponse> {
    return this.bulkActionService.getStatusCounts(this.questionRepo);
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
