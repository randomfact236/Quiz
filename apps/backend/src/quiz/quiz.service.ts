import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, In } from 'typeorm';
import { randomUUID } from 'crypto';

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

  async updateChapter(id: string, name: string): Promise<Chapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (!chapter) { throw new NotFoundException('Chapter not found'); }
    chapter.name = name;
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
    status?: ContentStatus,
    subjectSlug?: string,
  ): Promise<{ data: Question[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? settings.global.pagination.defaultLimit;

    const query = this.questionRepo.createQueryBuilder('question')
      .leftJoinAndSelect('question.chapter', 'chapter')
      .leftJoinAndSelect('chapter.subject', 'subject');

    if (status) {
      query.andWhere('question.status = :status', { status });
    }

    if (subjectSlug) {
      query.andWhere('subject.slug = :subjectSlug', { subjectSlug });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('question.updatedAt', 'DESC')
      .getManyAndCount();

    return { data, total };
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

    const question = this.questionRepo.create({
      question: dto.question,
      correctAnswer: dto.correctAnswer,
      options: dto.options || [],
      level: dto.level,
      explanation: dto.explanation,
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

        const question = transactionalEntityManager.create(Question, {
          question: q.question,
          correctAnswer: q.correctAnswer,
          options: q.options || [],
          level: q.level,
          explanation: q.explanation,
          chapter,
          status: q.status || ContentStatus.PUBLISHED,
          order: q.order || i, // Use CSV row index as order if not provided
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
    if (dto.options !== undefined) {
      question.options = dto.options;
    }
    if (dto.level !== undefined) {
      // Validate level if provided
      const validLevels = ['easy', 'medium', 'hard', 'expert', 'extreme'];
      if (!validLevels.includes(dto.level)) {
        throw new BadRequestException(`Invalid level: ${dto.level}. Valid values: ${validLevels.join(', ')}`);
      }
      question.level = dto.level;
    }
    if (dto.explanation !== undefined) {
      question.explanation = dto.explanation;
    }
    if (dto.chapterId !== undefined) {
      const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
      if (!chapter) { throw new NotFoundException('Chapter not found'); }
      question.chapter = chapter;
    }

    return this.questionRepo.save(question);
  }

  async updateQuestionStatus(id: string, status: ContentStatus): Promise<Question> {
    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) { throw new NotFoundException('Question not found'); }
    question.status = status;
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
}
