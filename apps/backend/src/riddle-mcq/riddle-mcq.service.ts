import { randomUUID } from 'crypto';

import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { BulkActionResult } from '../common/interfaces/bulk-action-result.interface';

import { RiddleCategory } from './entities/riddle-category.entity';
import { RiddleMcq, RiddleMcqLevel, RiddleStatus } from './entities/riddle-mcq.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import {
  CreateRiddleCategoryDto,
  CreateRiddleMcqDto,
  CreateRiddleMcqSubjectDto,
  RiddleMcqPaginationDto,
  UpdateRiddleCategoryDto,
  UpdateRiddleMcqDto,
  UpdateRiddleMcqSubjectDto,
} from './dto/riddle-mcq.dto';

@Injectable()
export class RiddleMcqService {
  private readonly logger = new Logger(RiddleMcqService.name);

  private readonly CACHE_KEYS = {
    FILTER_COUNTS: (subject: string, level: string) =>
      `riddle-mcq:filter-counts:${subject || 'all'}:${level || 'all'}`,
    SUBJECTS: (active: boolean) => `riddle-mcq:subjects:${active ? 'active' : 'all'}`,
    MCQS: (subject: string, level: string, page: number, limit: number) =>
      `riddle-mcq:mcqs:${subject || 'all'}:${level || 'all'}:${page}:${limit}`,
  };

  private readonly CACHE_TTL = {
    FILTER_COUNTS: 300,
    SUBJECTS: 600,
    MCQS: 600,
  };

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const uuidPart = randomUUID().replace(/-/g, '').slice(0, 8);
      const j = Math.floor(parseInt(uuidPart, 16) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
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
    private dataSource: DataSource,
  ) {}

  // ==================== CATEGORIES ====================

  async findAllCategories(includeInactive: boolean = false): Promise<RiddleCategory[]> {
    let query = this.categoryRepo.createQueryBuilder('category')
      .orderBy('category.order', 'ASC')
      .addOrderBy('category.name', 'ASC');

    if (!includeInactive) {
      query = query.where('category.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  async findCategoryById(id: string): Promise<RiddleCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async createCategory(dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
    if (dto.slug) {
      const existing = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException(`Category with slug "${dto.slug}" already exists`);
      }
    } else {
      dto.slug = this.generateSlug(dto.name);
    }

    const category = this.categoryRepo.create({
      slug: dto.slug,
      name: dto.name,
      emoji: dto.emoji,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.delPattern('riddle-mcq:*');
    return saved;
  }

  async updateCategory(id: string, dto: UpdateRiddleCategoryDto): Promise<RiddleCategory> {
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
    await this.cacheService.delPattern('riddle-mcq:*');
    return saved;
  }

  async deleteCategory(id: string): Promise<void> {
    const result = await this.categoryRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Category not found');
    }
    await this.cacheService.delPattern('riddle-mcq:*');
  }

  // ==================== SUBJECTS ====================

  async findAllSubjects(
    includeInactive: boolean = false,
    hasContentOnly: boolean = false,
  ): Promise<RiddleSubject[]> {
    const cacheKey = this.CACHE_KEYS.SUBJECTS(includeInactive);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        let query = this.subjectRepo.createQueryBuilder('subject')
          .orderBy('subject.order', 'ASC')
          .addOrderBy('subject.name', 'ASC');

        if (!includeInactive) {
          query = query.where('subject.isActive = :isActive', { isActive: true });
        }

        if (hasContentOnly) {
          query = query.innerJoin('subject.riddles', 'riddle');
        }

        return query.getMany();
      },
      this.CACHE_TTL.SUBJECTS
    );
  }

  async findSubjectBySlug(slug: string): Promise<RiddleSubject> {
    const subject = await this.subjectRepo.findOne({
      where: { slug },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  async createSubject(dto: CreateRiddleMcqSubjectDto): Promise<RiddleSubject> {
    if (dto.slug) {
      const existing = await this.subjectRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException(`Subject with slug "${dto.slug}" already exists`);
      }
    } else {
      dto.slug = this.generateSlug(dto.name);
    }

    const subject = this.subjectRepo.create({
      slug: dto.slug,
      name: dto.name,
      emoji: dto.emoji,
      categoryId: dto.categoryId || null,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.delPattern('riddle-mcq:*');
    return saved;
  }

  async updateSubject(id: string, dto: UpdateRiddleMcqSubjectDto): Promise<RiddleSubject> {
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
    await this.cacheService.delPattern('riddle-mcq:*');
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
      await this.cacheService.delPattern('riddle-mcq:*');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== MCQs ====================

  async findRiddleMcqsBySubject(
    subjectId: string,
    pagination: RiddleMcqPaginationDto,
    level?: string,
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    let query = this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.subject', 'subject')
      .where('subject.id = :subjectId', { subjectId })
      .andWhere('subject.isActive = :isActive', { isActive: true });

    if (level) {
      query = query.andWhere('riddle.level = :level', { level });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('riddle.updatedAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findRandomRiddleMcqs(level: string, count: number): Promise<RiddleMcq[]> {
    const validLevels: RiddleMcqLevel[] = [RiddleMcqLevel.EASY, RiddleMcqLevel.MEDIUM, RiddleMcqLevel.HARD, RiddleMcqLevel.EXPERT];
    const levelEnum = level as RiddleMcqLevel;
    if (!validLevels.includes(levelEnum)) {
      throw new BadRequestException(`Invalid level: ${level}. Valid values: ${validLevels.join(', ')}`);
    }

    const totalCount = await this.riddleMcqRepo.count({
      where: { level: levelEnum, status: RiddleStatus.PUBLISHED },
    });

    if (totalCount === 0) {
      return [];
    }

    if (count >= totalCount) {
      return this.riddleMcqRepo.find({
        where: { level: levelEnum, status: RiddleStatus.PUBLISHED },
        relations: ['subject'],
      });
    }

    const allIds = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .where('riddle.level = :level', { level: levelEnum })
      .andWhere('riddle.status = :status', { status: RiddleStatus.PUBLISHED })
      .getMany();

    const shuffled = this.shuffleArray(allIds).slice(0, count);
    const selectedIds = shuffled.map((r) => r.id);

    return this.riddleMcqRepo.find({
      where: { id: In(selectedIds) },
      relations: ['subject'],
    });
  }

  async findMixedRiddleMcqs(count: number): Promise<RiddleMcq[]> {
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

  async findAllRiddleMcqsAdmin(
    filters: {
      subject?: string;
      level?: string;
      status?: string;
      search?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 50;

    let query = this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.subject', 'subject');

    if (filters.subject && filters.subject !== 'all') {
      query = query.where('subject.slug = :subject', { subject: filters.subject });
    }

    if (filters.level && filters.level !== 'all') {
      query = query.andWhere('riddle.level = :level', { level: filters.level });
    }

    if (filters.status && filters.status !== 'all') {
      query = query.andWhere('riddle.status = :status', { status: filters.status });
    }

    if (filters.search) {
      query = query.andWhere('riddle.question ILIKE :search', { search: `%${filters.search}%` });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('riddle.updatedAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async createRiddleMcq(dto: CreateRiddleMcqDto): Promise<RiddleMcq> {
    const isExpert = dto.level === RiddleMcqLevel.EXPERT;

    if (!isExpert && (!dto.options || dto.options.length < 2)) {
      throw new BadRequestException('MCQ requires at least 2 options');
    }

    if (!isExpert && !dto.correctLetter) {
      throw new BadRequestException('MCQ questions require correctLetter (A/B/C/D)');
    }

    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new BadRequestException('Subject not found');
    }

    const riddle = new RiddleMcq();
    riddle.question = dto.question;
    riddle.options = isExpert ? null : (dto.options || null);
    riddle.correctLetter = isExpert ? null : (dto.correctLetter || null);
    riddle.level = dto.level;
    riddle.subjectId = dto.subjectId;
    riddle.explanation = dto.explanation || null;
    riddle.status = dto.status || RiddleStatus.DRAFT;

    const saved = await this.riddleMcqRepo.save(riddle);
    await this.cacheService.delPattern('riddle-mcq:*');
    return saved;
  }

  async createRiddleMcqsBulk(
    dtos: CreateRiddleMcqDto[],
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

      const result = await this.processRiddleMcqChunk(chunk, errors, start);
      totalCreated += result.count;
    }

    await this.cacheService.delPattern('riddle-mcq:*');
    return { count: totalCreated, errors };
  }

  private async processRiddleMcqChunk(
    dtos: CreateRiddleMcqDto[],
    errors: string[],
    offset: number,
  ): Promise<{ count: number; errors: string[] }> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const riddles: RiddleMcq[] = [];

      for (let i = 0; i < dtos.length; i++) {
        const dto = dtos[i];
        const isExpert = dto.level === RiddleMcqLevel.EXPERT;

        const validLevels = [RiddleMcqLevel.EASY, RiddleMcqLevel.MEDIUM, RiddleMcqLevel.HARD, RiddleMcqLevel.EXPERT];
        if (!validLevels.includes(dto.level)) {
          errors.push(`Row ${offset + i + 1}: Invalid level '${dto.level}'`);
          continue;
        }

        if (!isExpert && !dto.correctLetter) {
          errors.push(`Row ${offset + i + 1}: MCQ requires correctLetter`);
          continue;
        }

        if (!isExpert && (!dto.options || dto.options.length < 2)) {
          errors.push(`Row ${offset + i + 1}: MCQ requires at least 2 options`);
          continue;
        }

        const riddle = new RiddleMcq();
        riddle.question = dto.question;
        riddle.options = isExpert ? null : (dto.options ?? null);
        riddle.correctLetter = isExpert ? null : (dto.correctLetter ?? null);
        riddle.level = dto.level;
        riddle.subjectId = dto.subjectId;
        riddle.explanation = dto.explanation ?? null;
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

  async updateRiddleMcq(id: string, dto: UpdateRiddleMcqDto): Promise<RiddleMcq> {
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
      riddle.level = dto.level;
    }
    if (dto.subjectId !== undefined) {
      riddle.subjectId = dto.subjectId;
    }
    if (dto.explanation !== undefined) {
      riddle.explanation = dto.explanation || null;
    }
    if (dto.status !== undefined) {
      riddle.status = dto.status;
    }

    const saved = await this.riddleMcqRepo.save(riddle);
    await this.cacheService.delPattern('riddle-mcq:*');
    return saved;
  }

  async deleteRiddleMcq(id: string): Promise<void> {
    const result = await this.riddleMcqRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Riddle not found');
    }
    await this.cacheService.delPattern('riddle-mcq:*');
  }

  // ==================== BULK ACTIONS ====================

  async bulkActionRiddleMcqs(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
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
      await this.cacheService.delPattern('riddle-mcq:*');
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
    totalRiddleMcqs: number;
    totalSubjects: number;
    mcqsByLevel: Record<string, number>;
  }> {
    const [totalMcqs, totalSubjects] = await Promise.all([
      this.riddleMcqRepo.count(),
      this.subjectRepo.count(),
    ]);

    const levelCounts = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('riddle.level')
      .getRawMany();

    const mcqsByLevel: Record<string, number> = {};
    levelCounts.forEach((row: { level: string; count: string }) => {
      mcqsByLevel[row.level] = parseInt(row.count, 10);
    });

    return {
      totalRiddleMcqs: totalMcqs,
      totalSubjects,
      mcqsByLevel,
    };
  }

  async getFilterCounts(filters: { subject?: string; level?: string } = {}): Promise<{
    subjectCounts: { id: string; name: string; count: number }[];
    levelCounts: { level: string; count: number }[];
    total: number;
  }> {
    const cacheKey = this.CACHE_KEYS.FILTER_COUNTS(filters.subject || 'all', filters.level || 'all');

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const allSubjects = await this.subjectRepo.find();
        const subjectCountMap = new Map<string, number>();
        allSubjects.forEach((s) => subjectCountMap.set(s.id, 0));

        let subjectQuery = this.riddleMcqRepo
          .createQueryBuilder('riddle')
          .leftJoin('riddle.subject', 'subject')
          .select('subject.id', 'id')
          .addSelect('subject.name', 'name')
          .addSelect('COUNT(*)', 'count')
          .where('subject.id IS NOT NULL')
          .groupBy('subject.id');

        if (filters.subject && filters.subject !== 'all') {
          subjectQuery = subjectQuery.andWhere('subject.slug = :subject', { subject: filters.subject });
        }

        if (filters.level && filters.level !== 'all') {
          subjectQuery = subjectQuery.andWhere('riddle.level = :level', { level: filters.level });
        }

        const subjectResults = await subjectQuery.getRawMany();
        subjectResults.forEach((r: { id: string; name: string; count: string }) => {
          subjectCountMap.set(r.id, parseInt(r.count, 10));
        });

        const subjectCounts = Array.from(subjectCountMap.entries()).map(([id, count]) => {
          const subject = allSubjects.find((s) => s.id === id);
          return { id, name: subject?.name || '', count };
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
