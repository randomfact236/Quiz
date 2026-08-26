import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { CreateQuestionDto, CreateSubjectDto, PaginationDto } from '../common/dto/base.dto';
import { BulkQuestionDto } from '../common/dto/bulk-question.dto';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { ContentStatus } from '../common/enums/content-status.enum';
import {
  BulkActionResult,
  StatusCountResponse,
} from '../common/interfaces/bulk-action-result.interface';
import { BulkActionService } from '../common/services/bulk-action.service';
import {
  ContentListFilters,
  ContentRandomOptions,
  ContentImportRowTaxonomy,
  ContentServiceBase,
} from '../common/content/content.service';

import { Chapter } from './entities/chapter.entity';
import { Question } from './entities/question.entity';
import { Subject } from './entities/subject.entity';

type QuestionLevel = 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';

const VALID_LEVELS: QuestionLevel[] = ['easy', 'medium', 'hard', 'expert', 'extreme'];

/**
 * Quiz MCQ content service — Track B reference implementation.
 *
 * Shared list/random/create/update/delete/import machinery lives in
 * ContentServiceBase; everything below is either delegation or quiz-specific
 * logic (filter counts, chapter taxonomy rules, CSV export).
 */
@Injectable()
export class QuizMcqService extends ContentServiceBase<Subject, Chapter, Question> {
  private readonly CACHE_KEYS = {
    FILTER_COUNTS: (subject: string, chapter: string, level: string, status: string) =>
      `quiz:filter-counts:${subject || 'all'}:${chapter || 'all'}:${level || 'all'}:${
        status || 'all'
      }`,
  };

  private readonly FILTER_COUNTS_TTL_S = 300;
  private readonly PUBLIC_COUNTS_TTL_S = 300;

  protected get itemNoun(): string {
    return 'Question';
  }

  constructor(
    @InjectRepository(Subject)
    subjectRepo: Repository<Subject>,
    @InjectRepository(Chapter)
    chapterRepo: Repository<Chapter>,
    @InjectRepository(Question)
    questionRepo: Repository<Question>,
    cacheService: CacheService,
    dataSource: DataSource,
    private bulkActionService: BulkActionService
  ) {
    super({
      subjectRepo,
      chapterRepo,
      itemRepo: questionRepo,
      dataSource,
      cacheService,
      moduleKey: 'quiz',
      // Track B: family-scoped invalidation (was sledgehammer 'quiz:*').
      cacheFamilies: ['quiz:questions', 'quiz:filter-counts', 'quiz:public-level-counts'],
      itemAlias: 'question',
      chaptersRelation: 'chapters',
      chapterItemsRelation: 'questions',
      itemsCacheTtlS: 600,
    });
  }

  /** Legacy key format kept so existing Redis entries stay valid. */
  protected override listCacheKey(
    filters: ContentListFilters,
    page: number,
    limit: number
  ): string {
    return `quiz:questions:${filters.subjectSlug || 'all'}:${filters.chapter || 'all'}:${
      filters.level || 'all'
    }:${filters.status || 'all'}:${page}:${limit}`;
  }

  // ==================== SUBJECTS ====================

  async findAllSubjects(
    pagination?: PaginationDto,
    hasContentOnly: boolean = false
  ): Promise<{ data: Subject[]; total: number }> {
    // NOTE: No caching for subjects list — ensures deletions are immediately reflected.
    return super.findAllSubjects(pagination, hasContentOnly);
  }

  async findSubjectMeta(slug: string): Promise<{ name: string; emoji: string; slug: string }> {
    const subject = await this.deps.subjectRepo.findOne({
      where: { slug },
      select: ['name', 'emoji', 'slug'],
    });
    if (!subject) {
      throw new NotFoundException(`Subject not found: ${slug}`);
    }
    return { name: subject.name, emoji: subject.emoji, slug: subject.slug };
  }

  async findSubjectBySlug(slug: string): Promise<Subject> {
    const subject = await this.deps.subjectRepo.findOne({
      where: { slug },
      relations: [this.deps.chaptersRelation],
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  createSubject(dto: CreateSubjectDto) {
    return super.createSubject(dto);
  }

  updateSubject(id: string, dto: Partial<CreateSubjectDto>) {
    return super.updateSubject(id, dto);
  }

  deleteSubject(id: string): Promise<void> {
    return this.deleteSubjectCascade(id);
  }

  // ==================== PUBLIC LEVEL COUNTS ====================

  /**
   * Public per-level published counts for challenge hubs — one grouped query
   * (replaces the client-side whole-subject fetch loop). Cached; invalidated
   * with the other quiz families on any mutation.
   */
  async getPublicLevelCounts(): Promise<{
    subjectWise: Record<string, Record<string, number>>;
    allSubject: Record<string, number>;
    completeMix: number;
  }> {
    return this.cache.getOrSet(
      'quiz:public-level-counts',
      async () => {
        const rows: { slug: string | null; level: string; count: string }[] =
          await this.deps.itemRepo
            .createQueryBuilder('question')
            .leftJoin('question.chapter', 'chapter')
            .leftJoin('chapter.subject', 'subject')
            .select('subject.slug', 'slug')
            .addSelect('question.level', 'level')
            .addSelect('COUNT(*)', 'count')
            .where('question.status = :status', { status: ContentStatus.PUBLISHED })
            .andWhere('subject.slug IS NOT NULL')
            .groupBy('subject.slug')
            .addGroupBy('question.level')
            .getRawMany();

        const subjectWise: Record<string, Record<string, number>> = {};
        const allSubject: Record<string, number> = {};
        let completeMix = 0;

        for (const row of rows) {
          const count = parseInt(row.count, 10);
          const slug = row.slug as string;
          const level = row.level.toLowerCase();

          subjectWise[slug] = subjectWise[slug] || {};
          subjectWise[slug][level] = count;
          allSubject[level] = (allSubject[level] || 0) + count;
          completeMix += count;
        }

        return { subjectWise, allSubject, completeMix };
      },
      this.PUBLIC_COUNTS_TTL_S
    );
  }

  // ==================== CHAPTERS ====================

  async findChaptersBySubject(subjectId: string): Promise<Chapter[]> {
    return this.deps.chapterRepo.find({
      where: { subject: { id: subjectId } },
      order: { name: 'ASC' },
    });
  }

  async findAllChapters(): Promise<Chapter[]> {
    return this.deps.chapterRepo.find({
      order: { id: 'ASC' },
    });
  }

  async createChapter(name: string, subjectId: string): Promise<Chapter> {
    const subject = await this.deps.subjectRepo.findOne({ where: { id: subjectId } });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const existingChapter = await this.deps.chapterRepo.findOne({
      where: { name, subjectId },
    });
    if (existingChapter) {
      throw new BadRequestException(`Chapter "${name}" already exists in this subject`);
    }

    // P1 fix (TODO.md backlog): was `existingChapters.length + 1`, which drifts
    // after deletions; use MAX(chapterNumber) + 1.
    const lastChapter = await this.deps.chapterRepo.findOne({
      where: { subjectId },
      order: { chapterNumber: 'DESC' },
    });
    const chapterNumber = (lastChapter?.chapterNumber ?? 0) + 1;

    const chapter = this.deps.chapterRepo.create({ name, subject, subjectId, chapterNumber });
    const saved = await this.deps.chapterRepo.save(chapter);
    await this.invalidateContentCaches();
    return saved;
  }

  async updateChapter(id: string, dto: { name?: string; subjectId?: string }): Promise<Chapter> {
    const chapter = await this.deps.chapterRepo.findOne({ where: { id } });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    if (dto.name !== undefined) {
      chapter.name = dto.name;
    }
    if (dto.subjectId !== undefined) {
      chapter.subjectId = dto.subjectId;
    }
    const saved = await this.deps.chapterRepo.save(chapter);
    await this.invalidateContentCaches();
    return saved;
  }

  async deleteChapter(id: string): Promise<void> {
    const queryRunner = this.deps.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chapter = await queryRunner.manager.findOne(Chapter, {
        where: { id },
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      await queryRunner.manager.delete(Question, { chapter: { id } });
      await queryRunner.manager.delete(Chapter, { id });

      await queryRunner.commitTransaction();
      await this.invalidateContentCaches();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllQuestionsByChapter(chapterId: string): Promise<{ data: Question[]; total: number }> {
    const data = await this.deps.itemRepo.find({
      where: { chapter: { id: chapterId }, status: ContentStatus.PUBLISHED },
      order: { updatedAt: 'DESC' },
    });
    return { data, total: data.length };
  }

  // ==================== QUESTIONS ====================

  findAllQuestions(
    pagination: PaginationDto,
    filters: {
      status?: ContentStatus;
      level?: string;
      chapter?: string;
      search?: string;
      subjectSlug?: string;
    }
  ) {
    return this.findItems(pagination, filters);
  }

  findRandomQuestions(opts: {
    level?: string;
    chapterId?: string;
    subjectSlug?: string;
    count?: number;
  }) {
    return this.findRandomItems(opts);
  }

  async findAllRandomQuestionsByLevel(level: string): Promise<{ data: Question[]; total: number }> {
    if (!VALID_LEVELS.includes(level as QuestionLevel)) {
      throw new BadRequestException(`Invalid level: ${level}`);
    }
    return this.findRandomItems({ level, count: 50 });
  }

  async findAllMixedQuestions(limit: number = 50): Promise<{ data: Question[]; total: number }> {
    return this.findRandomItems({ count: limit });
  }

  createQuestion(dto: CreateQuestionDto) {
    return this.createItem(dto as unknown as Record<string, any>);
  }

  createQuestionsBulkFromImport(dto: BulkQuestionDto) {
    if (!dto.questions || dto.questions.length === 0) {
      throw new BadRequestException('No questions provided for bulk creation');
    }
    return this.importItems(dto.questions as unknown as Record<string, any>[], dto.subjectName);
  }

  updateQuestion(id: string, dto: Partial<CreateQuestionDto>) {
    return this.updateItem(id, dto as Record<string, any>);
  }

  deleteQuestion(id: string): Promise<void> {
    return this.deleteItem(id);
  }

  // ==================== BULK ACTIONS ====================

  async bulkAction(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(`[QuizMcqService] Executing bulk ${action} on ${ids.length} questions`);

    const result = await this.bulkActionService.executeBulkAction(
      this.deps.itemRepo,
      this.deps.itemAlias,
      ids,
      action
    );

    if (result.succeeded > 0) {
      await this.invalidateContentCaches();
      this.logger.log(`[QuizMcqService] Cache invalidated after bulk ${action}`);
    }

    return result;
  }

  async getStatusCountsBySubject(subjectSlug: string): Promise<StatusCountResponse> {
    const subject = await this.deps.subjectRepo.findOne({ where: { slug: subjectSlug } });
    if (!subject) {
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }

    const chapters = await this.deps.chapterRepo.find({ where: { subjectId: subject.id } });
    const chapterIds = chapters.map((c) => c.id);

    if (chapterIds.length === 0) {
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }

    const statusCounts = await this.deps.itemRepo
      .createQueryBuilder('question')
      .select('question.status', 'status')
      .addSelect('CAST(COUNT(*) AS INT)', 'count')
      .where('question.chapterId IN (:...chapterIds)', { chapterIds })
      .groupBy('question.status')
      .getRawMany();

    const counts = { total: 0, published: 0, draft: 0, trash: 0 };
    statusCounts.forEach((row: { status: string; count: number }) => {
      counts.total += row.count;
      if (row.status in counts) {
        (counts as any)[row.status] = row.count;
      }
    });

    return counts;
  }

  async getFilterCounts(filters: {
    subject?: string;
    status?: string;
    level?: string;
    chapter?: string;
    search?: string;
  }): Promise<{
    subjects: {
      id: string;
      name: string;
      slug: string;
      emoji: string;
      category: string;
      count: number;
    }[];
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

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Parent-only cascading rule:
        // Subject counts: No filters (always show totals)
        // Chapter counts: Subject filter only
        // Level counts: Subject + Chapter filters
        // Status counts: Subject + Chapter + Level filters

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
        const allSubjects = await this.deps.subjectRepo.find();
        const subjectCountMap = new Map<string, number>();
        allSubjects.forEach((s) => subjectCountMap.set(s.slug, 0));

        const subjectQuery = this.deps.itemRepo
          .createQueryBuilder('question')
          .leftJoin('question.chapter', 'chapter')
          .leftJoin('chapter.subject', 'subject')
          .select('subject.slug', 'slug')
          .addSelect('COUNT(*)', 'count')
          .where('subject.slug IS NOT NULL');

        const subjectRaw = await subjectQuery.groupBy('subject.slug').getRawMany();
        subjectRaw.forEach((r: { slug: string; count: string }) => {
          subjectCountMap.set(r.slug, parseInt(r.count, 10));
        });

        const subjectResults = allSubjects.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          emoji: s.emoji,
          category: s.category,
          count: subjectCountMap.get(s.slug) || 0,
        }));

        // 2. CHAPTER COUNTS: Subject filter only
        let chaptersToShow: Chapter[] = [];
        if (filters.subject && filters.subject !== 'all') {
          const subject = await this.deps.subjectRepo.findOne({ where: { slug: filters.subject } });
          if (subject) {
            chaptersToShow = await this.deps.chapterRepo.find({
              where: { subjectId: subject.id },
            });
          }
        } else {
          chaptersToShow = await this.deps.chapterRepo.find({ relations: ['subject'] });
        }

        const chapterCountMap = new Map<
          string,
          { name: string; subjectId: string; count: number }
        >();
        chaptersToShow.forEach((c) => {
          chapterCountMap.set(c.id, { name: c.name, subjectId: c.subjectId, count: 0 });
        });

        if (chaptersToShow.length > 0) {
          const chapterIds = chaptersToShow.map((c) => c.id);
          const chapterQuery = this.deps.itemRepo
            .createQueryBuilder('question')
            .select('question.chapterId', 'id')
            .addSelect('COUNT(*)', 'count')
            .where('question.chapterId IN (:...chapterIds)', { chapterIds });

          applyParentFilters(chapterQuery, false, false, false, false);

          const chapterRaw = await chapterQuery.groupBy('question.chapterId').getRawMany();
          chapterRaw.forEach((r: { id: string; count: string }) => {
            const existing = chapterCountMap.get(r.id);
            if (existing) {
              existing.count = parseInt(r.count, 10);
            }
          });
        }

        const chapterResults = Array.from(chapterCountMap.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          count: data.count,
          subjectId: data.subjectId,
        }));

        // 3. LEVEL COUNTS: Subject + Chapter filters
        const levelQuery = this.deps.itemRepo
          .createQueryBuilder('question')
          .leftJoinAndSelect('question.chapter', 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject')
          .select('question.level', 'level')
          .addSelect('COUNT(*)', 'count');

        applyParentFilters(levelQuery, true, true, false, false);
        const levelResults = await levelQuery.groupBy('question.level').getRawMany();

        // 4. STATUS COUNTS: Subject + Chapter + Level filters
        const statusQuery = this.deps.itemRepo
          .createQueryBuilder('question')
          .leftJoinAndSelect('question.chapter', 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject')
          .select('question.status', 'status')
          .addSelect('COUNT(*)', 'count');

        applyParentFilters(statusQuery, true, true, true, false);
        const statusResults = await statusQuery.groupBy('question.status').getRawMany();

        const totalQuery = this.deps.itemRepo
          .createQueryBuilder('question')
          .leftJoinAndSelect('question.chapter', 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject');
        applyParentFilters(totalQuery, true, true, true, true);
        const total = await totalQuery.getCount();

        const statusCounts = statusResults.map((r: { status: string; count: string }) => ({
          status: r.status,
          count: parseInt(r.count, 10),
        }));
        const levelCounts = levelResults.map((r: { level: string; count: string }) => ({
          level: r.level,
          count: parseInt(r.count, 10),
        }));

        return {
          subjects: subjectResults,
          chapterCounts: chapterResults,
          levelCounts,
          statusCounts,
          total,
        };
      },
      this.FILTER_COUNTS_TTL_S
    );
  }

  async exportQuestionsToCSV(filters: {
    subjectSlug?: string;
    level?: string;
    chapter?: string;
    status?: ContentStatus;
  }): Promise<{ csv: string; filename: string }> {
    const queryBuilder = this.deps.itemRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.chapter', 'chapter')
      .leftJoinAndSelect('chapter.subject', 'subject');

    if (filters.status) {
      queryBuilder.andWhere('question.status = :status', { status: filters.status });
    }
    if (filters.level) {
      queryBuilder.andWhere('question.level = :level', { level: filters.level });
    }
    if (filters.chapter) {
      queryBuilder.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
    }
    if (filters.subjectSlug) {
      queryBuilder.andWhere('subject.slug = :subjectSlug', { subjectSlug: filters.subjectSlug });
    }

    const questions = await queryBuilder.orderBy('question.order', 'ASC').getMany();

    const subjectName = filters.subjectSlug
      ? (await this.deps.subjectRepo.findOne({ where: { slug: filters.subjectSlug } }))?.name ||
        'All'
      : 'All';

    const escapeCsvValue = (val: string): string => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const headers = [
      'ID',
      'Question',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Answer',
      'Level',
      'Chapter',
    ];

    const rows = questions.map((q, index) => {
      const isExtreme = q.level === 'extreme';
      const opts = q.options || [];

      const correctAnswer = isExtreme ? q.correctAnswer || '' : q.correctLetter || 'A';

      return [
        index + 1,
        escapeCsvValue(q.question || ''),
        escapeCsvValue(isExtreme ? q.correctAnswer || '' : opts[0] || ''),
        escapeCsvValue(isExtreme ? '' : opts[1] || ''),
        escapeCsvValue(isExtreme ? '' : opts[2] || ''),
        escapeCsvValue(isExtreme ? '' : opts[3] || ''),
        escapeCsvValue(correctAnswer),
        q.level,
        escapeCsvValue(q.chapter?.name || ''),
      ].join(',');
    });

    const subjectHeader = `# Subject: ${subjectName}`;
    const csv = [subjectHeader, headers.join(','), ...rows].join('\n');
    const filename = `questions_export_${subjectName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    return { csv, filename };
  }

  // ==================== CONTENT-SERVICE HOOKS ====================

  protected applyListFilters(qb: SelectQueryBuilder<any>, filters: ContentListFilters): void {
    if (filters.status != null) {
      qb.andWhere('question.status = :status', { status: filters.status });
    }
    if (filters.level) {
      qb.andWhere('question.level = :level', { level: filters.level });
    }
    if (filters.chapter) {
      qb.andWhere('chapter.name = :chapter', { chapter: filters.chapter });
    }
    if (filters.search) {
      qb.andWhere('question.question ILIKE :search', { search: `%${filters.search}%` });
    }
    if (filters.subjectSlug) {
      qb.andWhere('subject.slug = :subjectSlug', { subjectSlug: filters.subjectSlug });
    }
  }

  protected applyRandomFilters(qb: SelectQueryBuilder<any>, opts: ContentRandomOptions): void {
    if (opts.level) {
      qb.andWhere('question.level = :level', { level: opts.level });
    }
    if (opts.chapterId) {
      qb.andWhere('question.chapterId = :chapterId', { chapterId: opts.chapterId });
    }
    if (opts.subjectSlug) {
      qb.andWhere('subject.slug = :subjectSlug', { subjectSlug: opts.subjectSlug });
    }
  }

  protected async validateAndBuildCreate(dto: Record<string, any>): Promise<{
    data: Record<string, unknown>;
    chapterId: string;
  }> {
    const chapterId = dto.chapterId as string;
    if (!chapterId) {
      throw new BadRequestException('chapterId is required');
    }

    // Derive question type from level: extreme = open-ended, others = mcq
    const isOpenEnded = String(dto.level) === 'extreme';

    if (!isOpenEnded && !dto.correctLetter) {
      throw new BadRequestException('MCQ questions require correctLetter (A/B/C/D)');
    }
    if (isOpenEnded && dto.correctLetter) {
      throw new BadRequestException('Open-ended questions must have correctLetter: null');
    }
    if (!isOpenEnded && (!dto.options || dto.options.length < 2)) {
      throw new BadRequestException('MCQ requires at least 2 options');
    }

    return {
      chapterId,
      data: {
        question: dto.question,
        correctAnswer: dto.correctAnswer,
        correctLetter: isOpenEnded ? null : dto.correctLetter,
        options: isOpenEnded ? null : dto.options || [],
        level: dto.level,
        status: dto.status || ContentStatus.PUBLISHED,
      },
    };
  }

  protected async applyUpdate(item: Question, dto: Record<string, any>): Promise<void> {
    if (dto.question !== undefined) {
      item.question = dto.question;
    }
    if (dto.correctAnswer !== undefined) {
      item.correctAnswer = dto.correctAnswer;
    }
    if (dto.correctLetter !== undefined) {
      item.correctLetter = dto.correctLetter || null;
    }
    if (dto.options !== undefined) {
      // P0 fix (TODO.md backlog): was `dto.level != null || item.level`, which
      // is always truthy, so extreme open-ended questions kept their options.
      const effectiveLevel = (dto.level ?? item.level) as string;
      item.options = effectiveLevel === 'extreme' ? null : dto.options;
    }
    if (dto.level !== undefined) {
      if (!VALID_LEVELS.includes(dto.level)) {
        throw new BadRequestException(
          `Invalid level: ${dto.level}. Valid values: ${VALID_LEVELS.join(', ')}`
        );
      }
      item.level = dto.level;
      if (String(dto.level) === 'extreme') {
        item.options = null;
        item.correctLetter = null;
      }
    }
  }

  protected getImportRowTaxonomy(
    row: Record<string, any>,
    defaultSubjectName?: string
  ): ContentImportRowTaxonomy | null {
    if (!row.question || !row.chapterName) {
      return null;
    }
    return {
      subjectName: row.subjectName || defaultSubjectName || 'General',
      chapterName: row.chapterName,
    };
  }

  protected buildImportItem(
    row: Record<string, any>,
    ids: { chapterId: string },
    order: number
  ): Record<string, unknown> | string {
    const isExtreme = row.level === 'extreme';

    if (row.level && !VALID_LEVELS.includes(row.level)) {
      return `Invalid level '${row.level}'`;
    }

    let options: string[] | null = null;
    let correctLetter: string | null = null;
    let correctAnswer = '';

    if (!isExtreme) {
      const letter = row.correctAnswer?.toUpperCase() || 'A';
      correctLetter = ['A', 'B', 'C', 'D'].includes(letter) ? letter : 'A';

      const opts = [row.optionA, row.optionB, row.optionC, row.optionD].filter(Boolean);
      options = opts as string[];

      const letterIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter || '');
      correctAnswer = options[letterIndex] || options[0] || '';
    } else {
      options = null;
      correctLetter = null;
      correctAnswer = row.correctAnswer || '';
    }

    const questionLevel = (row.level || 'easy') as QuestionLevel;
    const questionStatus = row.status === 'draft' ? ContentStatus.DRAFT : ContentStatus.PUBLISHED;

    return {
      question: row.question,
      options,
      correctAnswer,
      correctLetter,
      level: questionLevel,
      status: questionStatus,
      chapterId: ids.chapterId,
      order,
    };
  }
}
