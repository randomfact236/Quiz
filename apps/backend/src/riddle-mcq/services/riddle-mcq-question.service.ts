import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { invalidateCacheFamilies } from '../../common/content/content-cache.util';
import { pickRandomByWeight } from '../../common/content/random-selection.util';

import { RiddleMcq, RiddleStatus, RiddleMcqLevel } from '../entities/riddle-mcq.entity';
import { RiddleMcqSubject } from '../entities/riddle-subject.entity';

@Injectable()
export class RiddleMcqQuestionService {
  /** Minimum option count and allowed correct letters per MCQ level (mirrors FE zod schema). */
  private static readonly LEVEL_RULES: Record<string, { minOptions: number; maxLetter: string }> = {
    easy: { minOptions: 2, maxLetter: 'B' },
    medium: { minOptions: 3, maxLetter: 'C' },
    hard: { minOptions: 4, maxLetter: 'D' },
  };

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

  constructor(
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    @InjectRepository(RiddleMcqSubject)
    private subjectRepo: Repository<RiddleMcqSubject>,
    private cacheService: CacheService
  ) {}

  // Track B: family-scoped invalidation (was sledgehammer 'riddle-mcq:*')
  private async clearRiddleCaches() {
    await invalidateCacheFamilies(this.cacheService, [
      'riddle-mcq:questions',
      'riddle-mcq:filter-counts',
      'riddle-mcq:stats',
    ]);
  }

  private readonly CACHE_KEYS = {
    QUESTIONS: (
      category: string,
      subject: string,
      level: string,
      status: string,
      search: string,
      page: number,
      limit: number
    ) =>
      `riddle-mcq:questions:${category || 'all'}:${subject || 'all'}:${level || 'all'}:${status || 'all'}:${search || 'none'}:${page}:${limit}`,
  };

  private readonly CACHE_TTL = {
    QUESTIONS: 600,
  };

  async findRiddlesBySubject(
    subjectId: string,
    pagination: { page?: number; limit?: number } = {},
    level?: string
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const query = this.riddleMcqRepo
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

    const cacheKey = this.CACHE_KEYS.QUESTIONS(
      filters.category || 'all',
      filters.subject || 'all',
      filters.level || 'all',
      filters.status || 'all',
      filters.search || 'none',
      page,
      limit
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = this.riddleMcqRepo
          .createQueryBuilder('riddle')
          .leftJoinAndSelect('riddle.subject', 'subject')
          .leftJoinAndSelect('subject.category', 'category');

        if (filters.category && filters.category !== 'all') {
          query.where('category.slug = :category', { category: filters.category });
        }

        if (filters.subject && filters.subject !== 'all') {
          if (filters.category && filters.category !== 'all') {
            query.andWhere('subject.slug = :subject', { subject: filters.subject });
          } else {
            query.where('subject.slug = :subject', { subject: filters.subject });
          }
        }

        if (filters.level && filters.level !== 'all') {
          query.andWhere('riddle.level = :level', { level: filters.level });
        }

        if (filters.status && filters.status !== 'all') {
          query.andWhere('riddle.status = :status', { status: filters.status });
        }

        if (filters.search) {
          query.andWhere('riddle.question ILIKE :search', { search: `%${filters.search}%` });
        }

        const [data, total] = await query
          .skip((page - 1) * limit)
          .take(limit)
          .orderBy('riddle.createdAt', 'DESC')
          .addOrderBy('riddle.importOrder', 'ASC')
          .getManyAndCount();

        return { data, total };
      },
      this.CACHE_TTL.QUESTIONS
    );
  }

  /**
   * Capacity-plan A2 via shared pickRandomByWeight (random_weight + wrap-around;
   * replaces load-all-ids + in-memory shuffle).
   */
  private async findRandomRiddlesInternal(opts: {
    level?: string;
    count: number;
  }): Promise<RiddleMcq[]> {
    return pickRandomByWeight(this.riddleMcqRepo, 'riddle', {
      count: opts.count,
      max: 100,
      filters: (qb) => {
        qb.leftJoinAndSelect('riddle.subject', 'subject').where('riddle.status = :status', {
          status: RiddleStatus.PUBLISHED,
        });
        if (opts.level) {
          qb.andWhere('riddle.level = :level', { level: opts.level });
        }
      },
    });
  }

  async findRandomRiddles(level: string, count: number): Promise<RiddleMcq[]> {
    const validLevels = ['easy', 'medium', 'hard', 'expert'];
    if (!validLevels.includes(level)) {
      throw new BadRequestException(`Invalid level: ${level}`);
    }

    return this.findRandomRiddlesInternal({ level, count });
  }

  async findMixedRiddles(count: number = 50): Promise<RiddleMcq[]> {
    return this.findRandomRiddlesInternal({ count });
  }

  async createRiddle(dto: {
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
    const isExpert = dto.level === 'expert';

    this.validateLevelAnswerRules(dto.level, {
      options: dto.options,
      correctLetter: dto.correctLetter,
      answer: dto.answer,
    });

    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new BadRequestException('Subject not found');
    }

    const riddle = new RiddleMcq();
    riddle.question = dto.question;
    riddle.options = isExpert ? null : dto.options || null;
    riddle.correctLetter = isExpert ? null : dto.correctLetter || null;
    riddle.level = dto.level as RiddleMcqLevel;
    riddle.subjectId = dto.subjectId;
    riddle.hint = dto.hint || null;
    riddle.explanation = dto.explanation || null;
    riddle.answer = dto.answer || null;
    riddle.status = dto.status || RiddleStatus.DRAFT;

    const saved = await this.riddleMcqRepo.save(riddle);
    await this.clearRiddleCaches();
    return saved;
  }

  async updateRiddle(
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
    const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
    if (!riddle) {
      throw new NotFoundException('Riddle not found');
    }

    if (
      dto.level !== undefined ||
      dto.options !== undefined ||
      dto.correctLetter !== undefined ||
      dto.answer !== undefined
    ) {
      this.validateLevelAnswerRules(dto.level ?? riddle.level, {
        options: dto.options !== undefined ? dto.options : riddle.options,
        correctLetter: dto.correctLetter !== undefined ? dto.correctLetter : riddle.correctLetter,
        answer: dto.answer !== undefined ? dto.answer : riddle.answer,
      });
    }

    if (dto.question !== undefined) {
      riddle.question = dto.question;
    }
    if (dto.correctLetter !== undefined) {
      riddle.correctLetter = dto.correctLetter || null;
    }
    if (dto.options !== undefined) {
      riddle.options = dto.options || null;
    }
    if (dto.level !== undefined) {
      riddle.level = dto.level as RiddleMcqLevel;
    }
    if (dto.subjectId !== undefined) {
      riddle.subjectId = dto.subjectId;
    }
    if (dto.hint !== undefined) {
      riddle.hint = dto.hint || null;
    }
    if (dto.explanation !== undefined) {
      riddle.explanation = dto.explanation || null;
    }
    if (dto.answer !== undefined) {
      riddle.answer = dto.answer || null;
    }
    if (dto.status !== undefined) {
      riddle.status = dto.status;
    }

    const saved = await this.riddleMcqRepo.save(riddle);
    await this.clearRiddleCaches();
    return saved;
  }

  async deleteRiddle(id: string): Promise<void> {
    const result = await this.riddleMcqRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Riddle not found');
    }
    await this.clearRiddleCaches();
  }

  async findRiddleById(id: string): Promise<RiddleMcq> {
    const riddle = await this.riddleMcqRepo.findOne({
      where: { id },
      relations: ['subject'],
    });
    if (!riddle) {
      throw new NotFoundException('Riddle not found');
    }
    return riddle;
  }
}
