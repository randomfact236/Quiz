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
    private cacheService: CacheService,
    private dataSource: DataSource,
    private bulkActionService: BulkActionService,
  ) { }

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
    // Clear all subjects cache variants
    await this.cacheService.delPattern(`${settings.quiz.cache.allSubjectsKey}*`);
    return saved;
  }

  async updateSubject(id: string, dto: Partial<CreateSubjectDto>): Promise<Subject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) { throw new NotFoundException('Subject not found'); }
    Object.assign(subject, dto);
    const saved = await this.subjectRepo.save(subject);
    // Clear all subjects cache variants
    await this.cacheService.delPattern(`${settings.quiz.cache.allSubjectsKey}*`);
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
      await this.cacheService.delPattern(`${settings.quiz.cache.allSubjectsKey}*`);
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

    // Get the next chapter number for this subject
    const existingChapters = await this.chapterRepo.find({ where: { subjectId } });
    const chapterNumber = existingChapters.length + 1;

    const chapter = this.chapterRepo.create({ name, subject, subjectId, chapterNumber });
    return this.chapterRepo.save(chapter);
  }

  async deleteChapter(id: string): Promise<void> {
    const result = await this.chapterRepo.delete(id);
    if (result.affected === 0) { throw new NotFoundException('Chapter not found'); }
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
  }

  async getAllQuestionsStatusCounts(): Promise<{ total: number; published: number; draft: number; trash: number }> {
    const [total, published, draft, trash] = await Promise.all([
      this.questionRepo.count(),
      this.questionRepo.count({ where: { status: ContentStatus.PUBLISHED } }),
      this.questionRepo.count({ where: { status: ContentStatus.DRAFT } }),
      this.questionRepo.count({ where: { status: ContentStatus.TRASH } }),
    ]);
    return { total, published, draft, trash };
  }

  async getAllQuestionsChapterCounts(): Promise<Record<string, number>> {
    const questions = await this.questionRepo.find({
      relations: ['chapter'],
      where: { status: ContentStatus.PUBLISHED },
    });
    
    const counts: Record<string, number> = {};
    questions.forEach(q => {
      if (q.chapter && q.chapter.name) {
        counts[q.chapter.name] = (counts[q.chapter.name] || 0) + 1;
      }
    });
    return counts;
  }

  async getAllQuestionsLevelCounts(): Promise<Record<string, number>> {
    const [easy, medium, hard, expert, extreme] = await Promise.all([
      this.questionRepo.count({ where: { level: 'easy', status: ContentStatus.PUBLISHED } }),
      this.questionRepo.count({ where: { level: 'medium', status: ContentStatus.PUBLISHED } }),
      this.questionRepo.count({ where: { level: 'hard', status: ContentStatus.PUBLISHED } }),
      this.questionRepo.count({ where: { level: 'expert', status: ContentStatus.PUBLISHED } }),
      this.questionRepo.count({ where: { level: 'extreme', status: ContentStatus.PUBLISHED } }),
    ]);
    return { easy, medium, hard, expert, extreme };
  }

  async getFilterCounts(filters: {
    subject?: string;
    status?: string;
    level?: string;
    chapter?: string;
    search?: string;
  }): Promise<{
    subjectCounts: { slug: string; count: number }[];
    chapterCounts: { id: string; name: string; count: number }[];
    levelCounts: { level: string; count: number }[];
    statusCounts: { status: string; count: number }[];
    total: number;
  }> {
    const baseQuery = this.questionRepo.createQueryBuilder('question')
      .leftJoinAndSelect('question.chapter', 'chapter')
      .leftJoinAndSelect('chapter.subject', 'subject');

    if (filters.subject && filters.subject !== 'all') {
      baseQuery.andWhere('subject.slug = :subjectSlug', { subjectSlug: filters.subject });
    }
    if (filters.status && filters.status !== 'all') {
      baseQuery.andWhere('question.status = :status', { status: filters.status });
    }
    if (filters.level && filters.level !== 'all') {
      baseQuery.andWhere('question.level = :level', { level: filters.level });
    }
    if (filters.chapter) {
      baseQuery.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
    }
    if (filters.search) {
      baseQuery.andWhere('question.question ILIKE :search', { search: `%${filters.search}%` });
    }

    const [total, statusResults, levelResults] = await Promise.all([
      baseQuery.clone().getCount(),
      baseQuery.clone()
        .select('question.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('question.status')
        .getRawMany(),
      baseQuery.clone()
        .select('question.level', 'level')
        .addSelect('COUNT(*)', 'count')
        .groupBy('question.level')
        .getRawMany(),
    ]);

    let subjectResults: { slug: string; count: number }[] = [];
    let chapterResults: { id: string; name: string; count: number }[] = [];

    if (!filters.subject || filters.subject === 'all') {
      const subjectRaw = await this.questionRepo.createQueryBuilder('question')
        .leftJoin('question.chapter', 'chapter')
        .leftJoin('chapter.subject', 'subject')
        .select('subject.slug', 'slug')
        .addSelect('COUNT(*)', 'count')
        .where('subject.slug IS NOT NULL')
        .groupBy('subject.slug')
        .getRawMany();
      subjectResults = subjectRaw.map(r => ({ slug: r.slug, count: parseInt(r.count, 10) }));
    }

    if (filters.subject && filters.subject !== 'all') {
      const subject = await this.subjectRepo.findOne({ where: { slug: filters.subject } });
      if (subject) {
        const chapters = await this.chapterRepo.find({ where: { subjectId: subject.id } });
        const chapterIds = chapters.map(c => c.id);
        if (chapterIds.length > 0) {
          const chapterRaw = await this.questionRepo.createQueryBuilder('question')
            .select('question.chapterId', 'id')
            .addSelect('chapter.name', 'name')
            .addSelect('COUNT(*)', 'count')
            .leftJoin('question.chapter', 'chapter')
            .where('question.chapterId IN (:...chapterIds)', { chapterIds })
            .groupBy('question.chapterId')
            .addGroupBy('chapter.name')
            .getRawMany();
          chapterResults = chapterRaw.map(r => ({ id: r.id, name: r.name, count: parseInt(r.count, 10) }));
        }
      }
    } else {
      const allChapters = await this.chapterRepo.find({ relations: ['subject'] });
      const chapterMap = new Map(allChapters.map(c => [c.id, c.name]));
      const chapterRaw = await baseQuery.clone()
        .select('question.chapterId', 'id')
        .addSelect('COUNT(*)', 'count')
        .where('question.chapterId IS NOT NULL')
        .groupBy('question.chapterId')
        .getRawMany();
      chapterResults = chapterRaw.map(r => ({
        id: r.id,
        name: chapterMap.get(r.id) || 'Unknown',
        count: parseInt(r.count, 10)
      }));
    }

    const statusCounts = statusResults.map(r => ({ status: r.status, count: parseInt(r.count, 10) }));
    const levelCounts = levelResults.map(r => ({ level: r.level, count: parseInt(r.count, 10) }));

    return {
      subjectCounts: subjectResults,
      chapterCounts: chapterResults,
      levelCounts,
      statusCounts,
      total,
    };
  }

  async getAllQuestionsFilterCounts(filters: { level?: string; chapter?: string; status?: string; search?: string }): Promise<{ status: { total: number; published: number; draft: number; trash: number }; chapters: Record<string, number>; levels: Record<string, number> }> {
    const baseQuery = this.questionRepo.createQueryBuilder('question')
      .leftJoinAndSelect('question.chapter', 'chapter');

    if (filters.level && filters.level !== 'all') {
      baseQuery.andWhere('question.level = :level', { level: filters.level });
    }
    if (filters.chapter) {
      baseQuery.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
    }
    if (filters.search) {
      baseQuery.andWhere('question.question ILIKE :search', { search: `%${filters.search}%` });
    }

    const [statusResults, chapterResults, levelResults] = await Promise.all([
      baseQuery.clone()
        .select('question.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('question.status')
        .getRawMany(),
      baseQuery.clone()
        .select('chapter.name', 'chapterName')
        .addSelect('COUNT(*)', 'count')
        .groupBy('chapter.name')
        .getRawMany(),
      baseQuery.clone()
        .select('question.level', 'level')
        .addSelect('COUNT(*)', 'count')
        .groupBy('question.level')
        .getRawMany(),
    ]);

    const statusCounts = { total: 0, published: 0, draft: 0, trash: 0 };
    statusResults.forEach(r => {
      const count = parseInt(r.count, 10);
      statusCounts.total += count;
      if (r.status === 'published') statusCounts.published = count;
      if (r.status === 'draft') statusCounts.draft = count;
      if (r.status === 'trash') statusCounts.trash = count;
    });

    const chapters: Record<string, number> = {};
    chapterResults.forEach(r => {
      chapters[r.chapterName || 'Unassigned'] = parseInt(r.count, 10);
    });

    const levels: Record<string, number> = { easy: 0, medium: 0, hard: 0, expert: 0, extreme: 0 };
    levelResults.forEach(r => {
      if (r.level) {
        levels[r.level] = parseInt(r.count, 10);
      }
    });

    return {
      status: statusCounts,
      chapters,
      levels,
    };
  }

  async getSubjectFilterCounts(subjectSlug: string, filters: { level?: string; chapter?: string; status?: string; search?: string }): Promise<{ status: { total: number; published: number; draft: number; trash: number }; chapters: Record<string, number>; levels: Record<string, number> }> {
    const subject = await this.subjectRepo.findOne({ where: { slug: subjectSlug } });
    if (!subject) {
      throw new NotFoundException(`Subject with slug ${subjectSlug} not found`);
    }

    const baseQuery = this.questionRepo.createQueryBuilder('question')
      .leftJoinAndSelect('question.chapter', 'chapter')
      .leftJoinAndSelect('chapter.subject', 'subject')
      .where('subject.id = :subjectId', { subjectId: subject.id });

    if (filters.level && filters.level !== 'all') {
      baseQuery.andWhere('question.level = :level', { level: filters.level });
    }
    if (filters.chapter) {
      baseQuery.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
    }
    if (filters.status && filters.status !== 'all') {
      baseQuery.andWhere('question.status = :status', { status: filters.status });
    }
    if (filters.search) {
      baseQuery.andWhere('question.question ILIKE :search', { search: `%${filters.search}%` });
    }

    const [statusResults, chapterResults, levelResults] = await Promise.all([
      baseQuery.clone()
        .select('question.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('question.status')
        .getRawMany(),
      baseQuery.clone()
        .select('chapter.name', 'chapterName')
        .addSelect('COUNT(*)', 'count')
        .groupBy('chapter.name')
        .getRawMany(),
      baseQuery.clone()
        .select('question.level', 'level')
        .addSelect('COUNT(*)', 'count')
        .groupBy('question.level')
        .getRawMany(),
    ]);

    const statusCounts = { total: 0, published: 0, draft: 0, trash: 0 };
    statusResults.forEach(r => {
      const count = parseInt(r.count, 10);
      statusCounts.total += count;
      if (r.status === 'published') statusCounts.published = count;
      if (r.status === 'draft') statusCounts.draft = count;
      if (r.status === 'trash') statusCounts.trash = count;
    });

    const chapters: Record<string, number> = {};
    chapterResults.forEach(r => {
      chapters[r.chapterName || 'Unassigned'] = parseInt(r.count, 10);
    });

    const levels: Record<string, number> = { easy: 0, medium: 0, hard: 0, expert: 0, extreme: 0 };
    levelResults.forEach(r => {
      if (r.level) {
        levels[r.level] = parseInt(r.count, 10);
      }
    });

    return {
      status: statusCounts,
      chapters,
      levels,
    };
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
    return this.questionRepo.save(question);
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

    return this.questionRepo.save(question);
  }

  async deleteQuestion(id: string): Promise<void> {
    const result = await this.questionRepo.delete(id);
    if (result.affected === 0) { throw new NotFoundException('Question not found'); }
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

    const total = await this.questionRepo
      .createQueryBuilder('question')
      .where('question.chapterId IN (:...chapterIds)', { chapterIds })
      .getCount();

    const published = await this.questionRepo
      .createQueryBuilder('question')
      .where('question.chapterId IN (:...chapterIds)', { chapterIds })
      .andWhere('question.status = :status', { status: 'published' })
      .getCount();

    const draft = await this.questionRepo
      .createQueryBuilder('question')
      .where('question.chapterId IN (:...chapterIds)', { chapterIds })
      .andWhere('question.status = :status', { status: 'draft' })
      .getCount();

    const trash = await this.questionRepo
      .createQueryBuilder('question')
      .where('question.chapterId IN (:...chapterIds)', { chapterIds })
      .andWhere('question.status = :status', { status: 'trash' })
      .getCount();

    return { total, published, draft, trash };
  }

  /**
   * Get question counts by chapter for a specific subject
   * @param subjectSlug - The subject slug
   * @returns Record of chapter names to counts
   */
  async getChapterCountsBySubject(subjectSlug: string): Promise<Record<string, number>> {
    const subject = await this.subjectRepo.findOne({ where: { slug: subjectSlug } });
    if (!subject) {
      return {};
    }

    const chapters = await this.chapterRepo.find({ where: { subjectId: subject.id } });
    const chapterMap = new Map(chapters.map(c => [c.id, c.name]));

    if (chapters.length === 0) {
      return {};
    }

    const chapterIds = chapters.map(c => c.id);

    const results = await this.questionRepo
      .createQueryBuilder('question')
      .select('question.chapterId', 'chapterId')
      .addSelect('COUNT(*)', 'count')
      .where('question.chapterId IN (:...chapterIds)', { chapterIds })
      .groupBy('question.chapterId')
      .getRawMany();

    const counts: Record<string, number> = {};
    chapters.forEach(c => {
      counts[c.name] = 0;
    });
    results.forEach(r => {
      const chapterName = chapterMap.get(r.chapterId);
      if (chapterName) {
        counts[chapterName] = parseInt(r.count, 10);
      }
    });

    return counts;
  }

  /**
   * Get question counts by level for a specific subject
   * @param subjectSlug - The subject slug
   * @returns Record of levels to counts
   */
  async getLevelCountsBySubject(subjectSlug: string): Promise<Record<string, number>> {
    const subject = await this.subjectRepo.findOne({ where: { slug: subjectSlug } });
    if (!subject) {
      return {};
    }

    const chapters = await this.chapterRepo.find({ where: { subjectId: subject.id } });
    const chapterIds = chapters.map(c => c.id);

    if (chapterIds.length === 0) {
      return {};
    }

    const results = await this.questionRepo
      .createQueryBuilder('question')
      .select('question.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .where('question.chapterId IN (:...chapterIds)', { chapterIds })
      .groupBy('question.level')
      .getRawMany();

    const counts: Record<string, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0,
      extreme: 0
    };
    results.forEach(r => {
      counts[r.level] = parseInt(r.count, 10);
    });

    return counts;
  }
}
