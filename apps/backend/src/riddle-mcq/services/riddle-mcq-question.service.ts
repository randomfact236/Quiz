import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import {
  ContentListFilters,
  ContentRandomOptions,
  ContentServiceBase,
} from '../../common/content/content.service';

import { RiddleMcq, RiddleStatus } from '../entities/riddle-mcq.entity';
import { RiddleMcqSubject } from '../entities/riddle-subject.entity';

/**
 * Riddle MCQ question service — flat-mode Track B implementation.
 *
 * Shared list/random/CRUD machinery lives in ContentServiceBase (flat mode:
 * Subject -> riddles, no chapter layer). Everything below is delegation or
 * riddle-specific rules (level option counts, published-only reads).
 */
@Injectable()
export class RiddleMcqQuestionService extends ContentServiceBase<
  RiddleMcqSubject,
  RiddleMcqSubject,
  RiddleMcq
> {
  /** Minimum option count and allowed correct letters per MCQ level (mirrors FE zod schema). */
  private static readonly LEVEL_RULES: Record<string, { minOptions: number; maxLetter: string }> = {
    easy: { minOptions: 2, maxLetter: 'B' },
    medium: { minOptions: 3, maxLetter: 'C' },
    hard: { minOptions: 4, maxLetter: 'D' },
  };

  protected get itemNoun(): string {
    return 'Riddle';
  }

  constructor(
    @InjectRepository(RiddleMcq)
    riddleMcqRepo: Repository<RiddleMcq>,
    @InjectRepository(RiddleMcqSubject)
    subjectRepo: Repository<RiddleMcqSubject>,
    cacheService: CacheService,
    dataSource: DataSource
  ) {
    super({
      subjectRepo,
      // Flat mode has no chapter layer; the repo is required by the deps shape
      // but never queried.
      chapterRepo: subjectRepo,
      itemRepo: riddleMcqRepo,
      dataSource,
      cacheService,
      moduleKey: 'riddle-mcq',
      // Track B: family-scoped invalidation (was sledgehammer 'riddle-mcq:*').
      cacheFamilies: [
        'riddle-mcq:questions',
        'riddle-mcq:subjects',
        'riddle-mcq:filter-counts',
        'riddle-mcq:stats',
      ],
      itemAlias: 'riddle',
      flat: true,
      randomMax: 100,
      itemsCacheTtlS: 600,
    });
  }

  /** Legacy key format kept so existing Redis entries stay valid. */
  protected override listCacheKey(
    filters: ContentListFilters,
    page: number,
    limit: number
  ): string {
    const category = filters.categorySlug || 'all';
    const subject = filters.subjectSlug || 'all';
    const level = filters.level || 'all';
    const status = filters.status || 'all';
    const search = filters.search || 'none';
    return `riddle-mcq:questions:${category}:${subject}:${level}:${status}:${search}:${page}:${limit}`;
  }

  protected override getListOrder(alias: string): Array<[string, 'ASC' | 'DESC']> {
    return [
      [`${alias}.createdAt`, 'DESC'],
      [`${alias}.id`, 'DESC'],
    ];
  }

  // ==================== PUBLIC READS ====================

  async findRiddlesBySubject(
    subjectId: string,
    pagination: { page?: number; limit?: number } = {},
    level?: string
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const query = this.deps.itemRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.subject', 'subject')
      .where('subject.id = :subjectId', { subjectId })
      .andWhere('subject.isActive = :isActive', { isActive: true })
      .andWhere('riddle.status = :status', { status: RiddleStatus.PUBLISHED });

    if (level) {
      query.andWhere('riddle.level = :level', { level });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('riddle.createdAt', 'DESC')
      .addOrderBy('riddle.id', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findAllRiddles(
    filters: {
      category?: string;
      subject?: string;
      level?: string;
      status?: string;
      search?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const result = await this.findItems({ page, limit }, {
      categorySlug: filters.category,
      subjectSlug: filters.subject,
      level: filters.level,
      status: filters.status as unknown as ContentListFilters['status'],
      search: filters.search,
    } as ContentListFilters);

    return { data: result.data, total: result.total };
  }

  async findRandomRiddles(level: string, count: number): Promise<RiddleMcq[]> {
    const validLevels = ['easy', 'medium', 'hard', 'expert'];
    if (!validLevels.includes(level)) {
      throw new BadRequestException(`Invalid level: ${level}`);
    }
    return (await this.findRandomItems({ level, count })).data;
  }

  async findMixedRiddles(count: number = 50): Promise<RiddleMcq[]> {
    return (await this.findRandomItems({ count })).data;
  }

  async findRiddleById(id: string): Promise<RiddleMcq> {
    const riddle = await this.deps.itemRepo.findOne({
      where: { id },
      relations: ['subject'],
    });
    if (!riddle) {
      throw new NotFoundException('Riddle not found');
    }
    return riddle;
  }

  /** Public single read — always PUBLISHED only. */
  async findPublishedRiddleById(id: string): Promise<RiddleMcq> {
    const riddle = await this.deps.itemRepo.findOne({
      where: { id, status: RiddleStatus.PUBLISHED },
      relations: ['subject'],
    });
    if (!riddle) {
      throw new NotFoundException('Riddle not found');
    }
    return riddle;
  }

  // ==================== CRUD (delegation) ====================

  createRiddle(dto: {
    question: string;
    options?: string[];
    correctLetter?: string;
    level: string;
    subjectId: string;
    hint?: string;
    explanation?: string;
    answer?: string;
    status?: RiddleStatus;
  }): Promise<RiddleMcq> {
    return this.createItem(dto as unknown as Record<string, any>);
  }

  updateRiddle(
    id: string,
    dto: {
      question?: string;
      options?: string[];
      correctLetter?: string;
      level?: string;
      subjectId?: string;
      hint?: string;
      explanation?: string;
      answer?: string;
      status?: RiddleStatus;
    }
  ): Promise<RiddleMcq> {
    return this.updateItem(id, dto as Record<string, any>);
  }

  deleteRiddle(id: string): Promise<void> {
    return this.deleteItem(id);
  }

  // ==================== LEVEL ANSWER RULES ====================

  /**
   * Enforce level-based option/correctLetter/answer rules server-side.
   * MCQ levels require a minimum option count and an in-range correctLetter;
   * expert requires a non-empty text answer.
   */
  private validateLevelAnswerRules(
    level: string,
    values: { options?: string[] | null; correctLetter?: string | null; answer?: string | null }
  ): void {
    if (level === 'expert') {
      if (!values.answer || !values.answer.trim()) {
        throw new BadRequestException('Expert riddles require a text answer');
      }
      return;
    }

    const rule = RiddleMcqQuestionService.LEVEL_RULES[level];
    if (!rule) {
      throw new BadRequestException(`Invalid level: ${level}`);
    }

    if (!values.options || values.options.length < rule.minOptions) {
      throw new BadRequestException(`${level} riddles require at least ${rule.minOptions} options`);
    }

    if (
      !values.correctLetter ||
      !/^[A-D]$/.test(values.correctLetter) ||
      values.correctLetter > rule.maxLetter
    ) {
      throw new BadRequestException(
        `${level} riddles require correctLetter between A and ${rule.maxLetter}`
      );
    }
  }

  // ==================== CONTENT-SERVICE HOOKS ====================

  protected applyListFilters(qb: SelectQueryBuilder<any>, filters: ContentListFilters): void {
    if (filters.categorySlug && filters.categorySlug !== 'all') {
      qb.andWhere('category.slug = :category', { category: filters.categorySlug });
    }

    if (filters.subjectSlug && filters.subjectSlug !== 'all') {
      qb.andWhere('subject.slug = :subject', { subject: filters.subjectSlug });
    }

    if (filters.level && filters.level !== 'all') {
      qb.andWhere('riddle.level = :level', { level: filters.level });
    }

    if (filters.status && (filters.status as string) !== 'all') {
      qb.andWhere('riddle.status = :status', { status: filters.status });
    }

    if (filters.search) {
      qb.andWhere('riddle.question ILIKE :search', { search: `%${filters.search}%` });
    }
  }

  protected applyRandomFilters(qb: SelectQueryBuilder<any>, opts: ContentRandomOptions): void {
    if (opts.level) {
      qb.andWhere('riddle.level = :level', { level: opts.level });
    }
    if (opts.subjectSlug) {
      qb.andWhere('subject.slug = :subjectSlug', { subjectSlug: opts.subjectSlug });
    }
  }

  protected async validateAndBuildCreate(dto: Record<string, any>): Promise<{
    data: Record<string, unknown>;
    subjectId?: string;
  }> {
    const isExpert = dto.level === 'expert';

    if (!dto.question) {
      throw new BadRequestException('Question is required');
    }

    this.validateLevelAnswerRules(dto.level, dto);

    if (!dto.subjectId) {
      throw new BadRequestException('subjectId is required');
    }

    return {
      subjectId: dto.subjectId,
      data: {
        question: dto.question,
        options: isExpert ? null : dto.options || null,
        correctLetter: isExpert ? null : dto.correctLetter || null,
        level: dto.level,
        hint: dto.hint || null,
        explanation: dto.explanation || null,
        answer: dto.answer || null,
        status: dto.status || RiddleStatus.DRAFT,
      },
    };
  }

  protected async applyUpdate(item: RiddleMcq, dto: Record<string, any>): Promise<void> {
    if (
      dto.level !== undefined ||
      dto.options !== undefined ||
      dto.correctLetter !== undefined ||
      dto.answer !== undefined
    ) {
      this.validateLevelAnswerRules(dto.level ?? item.level, {
        options: dto.options !== undefined ? dto.options : item.options,
        correctLetter: dto.correctLetter !== undefined ? dto.correctLetter : item.correctLetter,
        answer: dto.answer !== undefined ? dto.answer : item.answer,
      });
    }

    if (dto.question !== undefined) {
      item.question = dto.question;
    }
    if (dto.correctLetter !== undefined) {
      item.correctLetter = dto.correctLetter || null;
    }
    if (dto.options !== undefined) {
      item.options = dto.options || null;
    }
    if (dto.level !== undefined) {
      item.level = dto.level as RiddleMcq['level'];
    }
    if (dto.hint !== undefined) {
      item.hint = dto.hint || null;
    }
    if (dto.explanation !== undefined) {
      item.explanation = dto.explanation || null;
    }
    if (dto.answer !== undefined) {
      item.answer = dto.answer || null;
    }
    if (dto.status !== undefined) {
      item.status = dto.status;
    }
    if (dto.subjectId !== undefined) {
      item.subjectId = dto.subjectId;
    }
  }
}
