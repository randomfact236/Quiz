import { randomUUID } from 'crypto';

import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { BulkActionResult } from '../common/interfaces/bulk-action-result.interface';
import { settings } from '../config/settings';

import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleMcq, RiddleStatus } from './entities/riddle-mcq.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';

@Injectable()
export class RiddleMcqService {
  private readonly logger = new Logger(RiddleMcqService.name);

  private readonly CACHE_KEYS = {
    CATEGORIES: (active: boolean) => `riddle-mcq:categories:${active ? 'active' : 'all'}`,
    SUBJECTS: (active: boolean) => `riddle-mcq:subjects:${active ? 'active' : 'all'}`,
    MCQS: (subject: string, level: string, page: number, limit: number) =>
      `riddle-mcq:mcqs:${subject || 'all'}:${level || 'all'}:${page}:${limit}`,
    FILTER_COUNTS: (subject: string, level: string) =>
      `riddle-mcq:filter-counts:${subject || 'all'}:${level || 'all'}`,
  };

  private readonly CACHE_TTL = {
    CATEGORIES: 600,
    SUBJECTS: 600,
    MCQS: 600,
    FILTER_COUNTS: 300,
  };

  private shuffleArray<T>(array: T[]): T[] {
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
    @InjectRepository(RiddleCategory)
    private categoryRepo: Repository<RiddleCategory>,
    @InjectRepository(RiddleSubject)
    private subjectRepo: Repository<RiddleSubject>,
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    private cacheService: CacheService,
    private dataSource: DataSource
  ) {}

  private async clearRiddleCaches() {
    await this.cacheService.delPattern(`riddle-mcq:*`);
  }

  // ==================== CATEGORIES ====================

  async findAllCategories(includeInactive: boolean = false): Promise<RiddleCategory[]> {
    const cacheKey = this.CACHE_KEYS.CATEGORIES(includeInactive);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = this.categoryRepo
          .createQueryBuilder('category')
          .orderBy('category.order', 'ASC')
          .addOrderBy('category.name', 'ASC');

        if (!includeInactive) {
          query.where('category.isActive = :isActive', { isActive: true });
        }

        return query.getMany();
      },
      this.CACHE_TTL.CATEGORIES
    );
  }

  async findCategoryById(id: string): Promise<RiddleCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async createCategory(dto: {
    name: string;
    slug?: string;
    emoji?: string;
    order?: number;
    isActive?: boolean;
  }): Promise<RiddleCategory> {
    if (dto.slug) {
      const existing = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException(`Category with slug "${dto.slug}" already exists`);
      }
    } else {
      dto.slug = this.generateSlug(dto.name);
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      slug: dto.slug,
      emoji: dto.emoji || '📚',
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.categoryRepo.save(category);
    await this.clearRiddleCaches();
    return saved;
  }

  async updateCategory(
    id: string,
    dto: {
      name?: string;
      slug?: string;
      emoji?: string;
      order?: number;
      isActive?: boolean;
    }
  ): Promise<RiddleCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.slug !== undefined && dto.slug !== category.slug) {
      const existing = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException(`Category with slug "${dto.slug}" already exists`);
      }
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.slug !== undefined) category.slug = dto.slug;
    if (dto.emoji !== undefined) category.emoji = dto.emoji;
    if (dto.order !== undefined) category.order = dto.order;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    const saved = await this.categoryRepo.save(category);
    await this.clearRiddleCaches();
    return saved;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['subjects'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (category.subjects && category.subjects.length > 0) {
        for (const subject of category.subjects) {
          await queryRunner.manager.delete(RiddleMcq, { subjectId: subject.id });
        }
        await queryRunner.manager.delete(RiddleSubject, { categoryId: id });
      }

      await queryRunner.manager.delete(RiddleCategory, { id });
      await queryRunner.commitTransaction();
      await this.clearRiddleCaches();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== SUBJECTS ====================

  async findAllSubjects(
    includeInactive: boolean = false,
    hasContentOnly: boolean = false
  ): Promise<RiddleSubject[]> {
    const cacheKey = this.CACHE_KEYS.SUBJECTS(includeInactive);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = this.subjectRepo
          .createQueryBuilder('subject')
          .leftJoinAndSelect('subject.category', 'category')
          .orderBy('subject.order', 'ASC')
          .addOrderBy('subject.name', 'ASC');

        if (!includeInactive) {
          query.where('subject.isActive = :isActive', { isActive: true });
        }

        if (hasContentOnly) {
          query.innerJoin('subject.riddles', 'riddle');
        }

        return query.getMany();
      },
      this.CACHE_TTL.SUBJECTS
    );
  }

  async findSubjectBySlug(slug: string): Promise<RiddleSubject> {
    const subject = await this.subjectRepo.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  async createSubject(dto: {
    name: string;
    slug?: string;
    emoji?: string;
    categoryId?: string | null;
    order?: number;
    isActive?: boolean;
  }): Promise<RiddleSubject> {
    if (dto.slug) {
      const existing = await this.subjectRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException(`Subject with slug "${dto.slug}" already exists`);
      }
    } else {
      dto.slug = this.generateSlug(dto.name);
    }

    const subject = this.subjectRepo.create({
      name: dto.name,
      slug: dto.slug,
      emoji: dto.emoji || '🧩',
      categoryId: dto.categoryId || null,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.subjectRepo.save(subject);
    await this.clearRiddleCaches();
    return saved;
  }

  async updateSubject(
    id: string,
    dto: {
      name?: string;
      slug?: string;
      emoji?: string;
      categoryId?: string | null;
      order?: number;
      isActive?: boolean;
    }
  ): Promise<RiddleSubject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (dto.slug !== undefined && dto.slug !== subject.slug) {
      const existing = await this.subjectRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException(`Subject with slug "${dto.slug}" already exists`);
      }
    }

    if (dto.name !== undefined) subject.name = dto.name;
    if (dto.slug !== undefined) subject.slug = dto.slug;
    if (dto.emoji !== undefined) subject.emoji = dto.emoji;
    if (dto.categoryId !== undefined) subject.categoryId = dto.categoryId;
    if (dto.order !== undefined) subject.order = dto.order;
    if (dto.isActive !== undefined) subject.isActive = dto.isActive;

    const saved = await this.subjectRepo.save(subject);
    await this.clearRiddleCaches();
    return saved;
  }

  async deleteSubject(id: string): Promise<void> {
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ['riddles'],
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (subject.riddles && subject.riddles.length > 0) {
        await queryRunner.manager.delete(RiddleMcq, { subjectId: id });
      }

      await queryRunner.manager.delete(RiddleSubject, { id });
      await queryRunner.commitTransaction();
      await this.clearRiddleCaches();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== RIDDLES ====================

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
      .andWhere('subject.isActive = :isActive', { isActive: true });

    if (level) {
      query.andWhere('riddle.level = :level', { level });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('riddle.updatedAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findAllRiddles(
    filters: {
      subject?: string;
      level?: string;
      status?: string;
      search?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const query = this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.subject', 'subject');

    if (filters.subject && filters.subject !== 'all') {
      query.where('subject.slug = :subject', { subject: filters.subject });
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
      .orderBy('riddle.updatedAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findRandomRiddles(level: string, count: number): Promise<RiddleMcq[]> {
    const validLevels = ['easy', 'medium', 'hard', 'expert'];
    if (!validLevels.includes(level)) {
      throw new BadRequestException(`Invalid level: ${level}`);
    }

    const totalCount = await this.riddleMcqRepo.count({
      where: { level: level as any, status: RiddleStatus.PUBLISHED },
    });

    if (totalCount === 0) {
      return [];
    }

    if (count >= totalCount) {
      return this.riddleMcqRepo.find({
        where: { level: level as any, status: RiddleStatus.PUBLISHED },
        relations: ['subject'],
      });
    }

    const allIds = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .where('riddle.level = :level', { level })
      .andWhere('riddle.status = :status', { status: RiddleStatus.PUBLISHED })
      .getMany();

    const shuffled = this.shuffleArray(allIds).slice(0, count);
    const selectedIds = shuffled.map((r) => r.id);

    return this.riddleMcqRepo.find({
      where: { id: In(selectedIds) },
      relations: ['subject'],
    });
  }

  async findMixedRiddles(count: number = 50): Promise<RiddleMcq[]> {
    const totalCount = await this.riddleMcqRepo.count({
      where: { status: RiddleStatus.PUBLISHED },
    });

    if (totalCount === 0) {
      return [];
    }

    if (count >= totalCount) {
      return this.riddleMcqRepo.find({
        relations: ['subject'],
        where: { status: RiddleStatus.PUBLISHED },
      });
    }

    const allIds = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .where('riddle.status = :status', { status: RiddleStatus.PUBLISHED })
      .getMany();

    const shuffled = this.shuffleArray(allIds).slice(0, count);
    const selectedIds = shuffled.map((r) => r.id);

    return this.riddleMcqRepo.find({
      where: { id: In(selectedIds) },
      relations: ['subject'],
    });
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

    if (!isExpert && (!dto.options || dto.options.length < 2)) {
      throw new BadRequestException('Riddle requires at least 2 options');
    }

    if (!isExpert && !dto.correctLetter) {
      throw new BadRequestException('Riddle questions require correctLetter (A/B/C/D)');
    }

    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new BadRequestException('Subject not found');
    }

    const riddle = new RiddleMcq();
    riddle.question = dto.question;
    riddle.options = isExpert ? null : dto.options || null;
    riddle.correctLetter = isExpert ? null : dto.correctLetter || null;
    riddle.level = dto.level as any;
    riddle.subjectId = dto.subjectId;
    riddle.hint = dto.hint || null;
    riddle.explanation = dto.explanation || null;
    riddle.answer = dto.answer || null;
    riddle.status = dto.status || RiddleStatus.DRAFT;

    const saved = await this.riddleMcqRepo.save(riddle);
    await this.clearRiddleCaches();
    return saved;
  }

  async createRiddlesBulk(
    dtos: Array<{
      question: string;
      options?: string[];
      correctLetter?: string;
      level: string;
      subjectId: string;
      hint?: string;
      explanation?: string;
      answer?: string;
      status?: RiddleStatus;
    }>
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];

    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('No riddles provided for bulk creation');
    }

    const CHUNK_SIZE = 100;
    const totalChunks = Math.ceil(dtos.length / CHUNK_SIZE);
    let totalCreated = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, dtos.length);
      const chunk = dtos.slice(start, end);

      const result = await this.processRiddleChunk(chunk, errors, start);
      totalCreated += result.count;
    }

    await this.clearRiddleCaches();
    return { count: totalCreated, errors };
  }

  private async processRiddleChunk(
    dtos: Array<{
      question: string;
      options?: string[];
      correctLetter?: string;
      level: string;
      subjectId: string;
      hint?: string;
      explanation?: string;
      answer?: string;
      status?: RiddleStatus;
    }>,
    errors: string[],
    offset: number
  ): Promise<{ count: number; errors: string[] }> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const riddles: RiddleMcq[] = [];

      for (let i = 0; i < dtos.length; i++) {
        const dto = dtos[i];
        const isExpert = dto.level === 'expert';

        const validLevels = ['easy', 'medium', 'hard', 'expert'];
        if (!validLevels.includes(dto.level)) {
          errors.push(`Row ${offset + i + 1}: Invalid level '${dto.level}'`);
          continue;
        }

        if (!isExpert && !dto.correctLetter) {
          errors.push(`Row ${offset + i + 1}: Riddle requires correctLetter`);
          continue;
        }

        if (!isExpert && (!dto.options || dto.options.length < 2)) {
          errors.push(`Row ${offset + i + 1}: Riddle requires at least 2 options`);
          continue;
        }

        const riddle = new RiddleMcq();
        riddle.question = dto.question;
        riddle.options = isExpert ? null : (dto.options ?? null);
        riddle.correctLetter = isExpert ? null : (dto.correctLetter ?? null);
        riddle.level = dto.level as any;
        riddle.subjectId = dto.subjectId;
        riddle.hint = dto.hint ?? null;
        riddle.explanation = dto.explanation ?? null;
        riddle.answer = dto.answer ?? null;
        riddle.status = dto.status ?? RiddleStatus.DRAFT;
        riddles.push(riddle);
      }

      if (riddles.length === 0) {
        throw new BadRequestException('No valid riddles to create');
      }

      const saved = await transactionalEntityManager.save(riddles);
      return { count: saved.length, errors };
    });
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
      riddle.level = dto.level as any;
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

  // ==================== BULK ACTIONS ====================

  async bulkActionRiddles(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(`[RiddleMcqService] Executing bulk ${action} on ${ids.length} riddles`);

    let succeeded = 0;
    let failed = 0;
    const failures: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        if (action === BulkActionType.DELETE) {
          const result = await this.riddleMcqRepo.delete(id);
          if (result.affected && result.affected > 0) {
            succeeded++;
          } else {
            failed++;
            failures.push({ id, error: 'Not found' });
          }
        } else if (
          action === BulkActionType.PUBLISH ||
          action === BulkActionType.DRAFT ||
          action === BulkActionType.TRASH
        ) {
          const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
          if (!riddle) {
            failed++;
            failures.push({ id, error: 'Not found' });
          } else {
            riddle.status = RiddleStatus[action.toUpperCase() as keyof typeof RiddleStatus];
            await this.riddleMcqRepo.save(riddle);
            succeeded++;
          }
        } else if (action === BulkActionType.RESTORE) {
          const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
          if (!riddle) {
            failed++;
            failures.push({ id, error: 'Not found' });
          } else {
            riddle.status = RiddleStatus.DRAFT;
            await this.riddleMcqRepo.save(riddle);
            succeeded++;
          }
        } else {
          failed++;
          failures.push({ id, error: `Action ${action} not supported` });
        }
      } catch (err) {
        failed++;
        failures.push({ id, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    if (succeeded > 0) {
      await this.clearRiddleCaches();
    }

    return {
      success: failed === 0,
      processed: ids.length,
      succeeded,
      failed,
      failures: failures.length > 0 ? failures : undefined,
      message: `Bulk ${action} completed: ${succeeded} succeeded, ${failed} failed`,
    };
  }

  // ==================== STATS ====================

  async getStats(): Promise<{
    totalRiddles: number;
    totalSubjects: number;
    totalCategories: number;
    riddlesByLevel: Record<string, number>;
  }> {
    const [totalRiddles, totalSubjects, totalCategories] = await Promise.all([
      this.riddleMcqRepo.count(),
      this.subjectRepo.count(),
      this.categoryRepo.count(),
    ]);

    const levelCounts = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('riddle.level')
      .getRawMany();

    const riddlesByLevel: Record<string, number> = {};
    levelCounts.forEach((row: { level: string; count: string }) => {
      riddlesByLevel[row.level] = parseInt(row.count, 10);
    });

    return {
      totalRiddles,
      totalSubjects,
      totalCategories,
      riddlesByLevel,
    };
  }

  async getFilterCounts(
    filters: {
      category?: string;
      subject?: string;
      level?: string;
    } = {}
  ): Promise<{
    categoryCounts: { id: string; name: string; emoji: string; count: number }[];
    subjectCounts: {
      id: string;
      name: string;
      emoji: string;
      categoryId: string | null;
      count: number;
    }[];
    levelCounts: { level: string; count: number }[];
    total: number;
  }> {
    const cacheKey = this.CACHE_KEYS.FILTER_COUNTS(
      filters.subject || 'all',
      filters.level || 'all'
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const allCategories = await this.categoryRepo.find();
        const allSubjects = await this.subjectRepo.find();

        const categoryCountMap = new Map<string, number>();
        allCategories.forEach((c) => categoryCountMap.set(c.id, 0));

        const subjectCountMap = new Map<string, number>();
        allSubjects.forEach((s) => subjectCountMap.set(s.id, 0));

        let subjectQuery = this.riddleMcqRepo
          .createQueryBuilder('riddle')
          .leftJoin('riddle.subject', 'subject')
          .select('subject.id', 'id')
          .addSelect('subject.name', 'name')
          .addSelect('subject.categoryId', 'categoryId')
          .addSelect('COUNT(*)', 'count')
          .where('subject.id IS NOT NULL')
          .groupBy('subject.id');

        if (filters.subject && filters.subject !== 'all') {
          subjectQuery = subjectQuery.andWhere('subject.slug = :subject', {
            subject: filters.subject,
          });
        }

        if (filters.level && filters.level !== 'all') {
          subjectQuery = subjectQuery.andWhere('riddle.level = :level', { level: filters.level });
        }

        const subjectResults = await subjectQuery.getRawMany();
        subjectResults.forEach(
          (r: { id: string; name: string; categoryId: string | null; count: string }) => {
            subjectCountMap.set(r.id, parseInt(r.count, 10));
            if (r.categoryId) {
              const current = categoryCountMap.get(r.categoryId) || 0;
              categoryCountMap.set(r.categoryId, current + parseInt(r.count, 10));
            }
          }
        );

        const subjectCounts = Array.from(subjectCountMap.entries()).map(([id, count]) => {
          const subject = allSubjects.find((s) => s.id === id);
          return {
            id,
            name: subject?.name || '',
            emoji: subject?.emoji || '🧩',
            categoryId: subject?.categoryId || null,
            count,
          };
        });

        const categoryCounts = Array.from(categoryCountMap.entries()).map(([id, count]) => {
          const category = allCategories.find((c) => c.id === id);
          return {
            id,
            name: category?.name || '',
            emoji: category?.emoji || '📚',
            count,
          };
        });

        let levelQuery = this.riddleMcqRepo
          .createQueryBuilder('riddle')
          .select('riddle.level', 'level')
          .addSelect('COUNT(*)', 'count')
          .groupBy('riddle.level');

        if (filters.subject && filters.subject !== 'all') {
          levelQuery = levelQuery.leftJoin('riddle.subject', 'subject');
          levelQuery = levelQuery.andWhere('subject.slug = :subject', { subject: filters.subject });
        }

        const levelResults = await levelQuery.getRawMany();
        const levelCountsResult = levelResults.map((r: { level: string; count: string }) => ({
          level: r.level,
          count: parseInt(r.count, 10),
        }));

        const total = await this.riddleMcqRepo.count();

        return {
          categoryCounts,
          subjectCounts,
          levelCounts: levelCountsResult,
          total,
        };
      },
      this.CACHE_TTL.FILTER_COUNTS
    );
  }

  // ==================== HELPERS ====================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
