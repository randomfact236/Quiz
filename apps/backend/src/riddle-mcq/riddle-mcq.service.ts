import { randomUUID } from 'crypto';

import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { BulkActionResult, StatusCountResponse } from '../common/interfaces/bulk-action-result.interface';

import { RiddleChapter } from './entities/riddle-chapter.entity';
import { RiddleMcq, RiddleMcqLevel, RiddleStatus } from './entities/riddle-mcq.entity';
import { RiddleSubject } from './entities/riddle-subject.entity';
import {
  CreateRiddleMcqChapterDto,
  CreateRiddleMcqDto,
  CreateRiddleMcqSubjectDto,
  RiddleMcqPaginationDto,
  UpdateRiddleMcqChapterDto,
  UpdateRiddleMcqDto,
  UpdateRiddleMcqSubjectDto,
} from './dto/riddle-mcq.dto';

@Injectable()
export class RiddleMcqService {
  private readonly logger = new Logger(RiddleMcqService.name);

  private readonly CACHE_KEYS = {
    FILTER_COUNTS: (subject: string, chapter: string, level: string) =>
      `riddle-mcq:filter-counts:${subject || 'all'}:${chapter || 'all'}:${level || 'all'}`,
    SUBJECTS: (active: boolean) => `riddle-mcq:subjects:${active ? 'active' : 'all'}`,
    CHAPTERS: `riddle-mcq:chapters`,
    MCQS: (chapter: string, level: string, page: number, limit: number) =>
      `riddle-mcq:mcqs:${chapter || 'all'}:${level || 'all'}:${page}:${limit}`,
  };

  private readonly CACHE_TTL = {
    FILTER_COUNTS: 300,
    SUBJECTS: 600,
    CHAPTERS: 600,
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
    @InjectRepository(RiddleSubject)
    private subjectRepo: Repository<RiddleSubject>,
    @InjectRepository(RiddleChapter)
    private chapterRepo: Repository<RiddleChapter>,
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    private cacheService: CacheService,
    private dataSource: DataSource,
  ) {}

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
          query = query
            .innerJoin('subject.chapters', 'chapter')
            .innerJoin('chapter.riddles', 'riddle');
        }

        return query.getMany();
      },
      this.CACHE_TTL.SUBJECTS
    );
  }

  async findSubjectBySlug(slug: string): Promise<RiddleSubject> {
    const subject = await this.subjectRepo.findOne({
      where: { slug },
      relations: ['chapters'],
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

    const subject = this.subjectRepo.create(dto);
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

    Object.assign(subject, dto);
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.delPattern('riddle-mcq:*');
    return saved;
  }

  async deleteSubject(id: string): Promise<void> {
    const subject = await this.subjectRepo.findOne({
      where: { id },
      relations: ['chapters', 'chapters.riddles'],
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
          await queryRunner.manager.delete(RiddleMcq, { chapterId: chapter.id });
        }
        await queryRunner.manager.delete(RiddleChapter, { subjectId: id });
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

  // ==================== CHAPTERS ====================

  async findAllActiveChapters(): Promise<RiddleChapter[]> {
    const cacheKey = `${this.CACHE_KEYS.CHAPTERS}:active`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.chapterRepo
          .createQueryBuilder('chapter')
          .leftJoinAndSelect('chapter.subject', 'subject')
          .where('subject.isActive = :isActive', { isActive: true })
          .orderBy('chapter.id', 'ASC')
          .getMany();
      },
      this.CACHE_TTL.CHAPTERS
    );
  }

  async findChaptersBySubject(
    subjectId: string,
    hasContentOnly: boolean = false,
  ): Promise<RiddleChapter[]> {
    let query = this.chapterRepo
      .createQueryBuilder('chapter')
      .where('chapter.subjectId = :subjectId', { subjectId })
      .orderBy('chapter.chapterNumber', 'ASC');

    if (hasContentOnly) {
      query = query.innerJoinAndSelect('chapter.riddles', 'riddle');
    }

    return query.getMany();
  }

  async createChapter(dto: CreateRiddleMcqChapterDto): Promise<RiddleChapter> {
    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const existingChapter = await this.chapterRepo.findOne({
      where: { name: dto.name, subjectId: dto.subjectId },
    });
    if (existingChapter) {
      throw new BadRequestException(`Chapter "${dto.name}" already exists in this subject`);
    }

    const chapter = this.chapterRepo.create({
      name: dto.name,
      chapterNumber: dto.chapterNumber,
      subject,
      subjectId: dto.subjectId,
    });
    const saved = await this.chapterRepo.save(chapter);
    await this.cacheService.delPattern('riddle-mcq:*');
    return saved;
  }

  async updateChapter(id: string, dto: UpdateRiddleMcqChapterDto): Promise<RiddleChapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (dto.name !== undefined) {
      chapter.name = dto.name;
    }
    if (dto.chapterNumber !== undefined) {
      chapter.chapterNumber = dto.chapterNumber;
    }

    const saved = await this.chapterRepo.save(chapter);
    await this.cacheService.delPattern('riddle-mcq:*');
    return saved;
  }

  async deleteChapter(id: string): Promise<void> {
    const result = await this.chapterRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Chapter not found');
    }
    await this.cacheService.delPattern('riddle-mcq:*');
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
      .leftJoinAndSelect('riddle.chapter', 'chapter')
      .leftJoinAndSelect('chapter.subject', 'subject')
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

  async findRiddleMcqsByChapter(
    chapterId: string,
    pagination: RiddleMcqPaginationDto,
    level?: string,
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    let query = this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.chapter', 'chapter')
      .leftJoinAndSelect('chapter.subject', 'subject')
      .where('riddle.chapterId = :chapterId', { chapterId });

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
    const validLevels: RiddleMcqLevel[] = [RiddleMcqLevel.EASY, RiddleMcqLevel.MEDIUM, RiddleMcqLevel.HARD, RiddleMcqLevel.EXPERT, RiddleMcqLevel.EXTREME];
    const levelEnum = level as RiddleMcqLevel;
    if (!validLevels.includes(levelEnum)) {
      throw new BadRequestException(`Invalid level: ${level}. Valid values: ${validLevels.join(', ')}`);
    }

    const totalCount = await this.riddleMcqRepo.count({
      where: { level: levelEnum },
    });

    if (totalCount === 0) {
      return [];
    }

    if (count >= totalCount) {
      return this.riddleMcqRepo.find({
        where: { level: levelEnum },
        relations: ['chapter', 'chapter.subject'],
      });
    }

    const allIds = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .where('riddle.level = :level', { level: levelEnum })
      .getMany();

    const shuffled = this.shuffleArray(allIds).slice(0, count);
    const selectedIds = shuffled.map((r) => r.id);

    return this.riddleMcqRepo.find({
      where: { id: In(selectedIds) },
      relations: ['chapter', 'chapter.subject'],
    });
  }

  async findMixedRiddleMcqs(count: number): Promise<RiddleMcq[]> {
    const totalCount = await this.riddleMcqRepo.count();

    if (totalCount === 0) {
      return [];
    }

    if (count >= totalCount) {
      return this.riddleMcqRepo.find({
        relations: ['chapter', 'chapter.subject'],
      });
    }

    const allIds = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .getMany();

    const shuffled = this.shuffleArray(allIds).slice(0, count);
    const selectedIds = shuffled.map((r) => r.id);

    return this.riddleMcqRepo.find({
      where: { id: In(selectedIds) },
      relations: ['chapter', 'chapter.subject'],
    });
  }

  async findAllRiddleMcqsAdmin(): Promise<RiddleMcq[]> {
    return this.riddleMcqRepo.find({
      relations: ['chapter', 'chapter.subject'],
      order: { updatedAt: 'DESC' },
    });
  }

  async createRiddleMcq(dto: CreateRiddleMcqDto): Promise<RiddleMcq> {
    const isExpert = dto.level === 'expert';

    if (!isExpert && (!dto.options || dto.options.length < 2)) {
      throw new BadRequestException('MCQ requires at least 2 options');
    }

    if (!isExpert && !dto.correctLetter) {
      throw new BadRequestException('MCQ questions require correctLetter (A/B/C/D)');
    }

    const riddle = new RiddleMcq();
    riddle.question = dto.question;
    riddle.options = isExpert ? null : (dto.options || null);
    riddle.correctLetter = isExpert ? null : (dto.correctLetter || null);
    riddle.correctAnswer = dto.correctAnswer || null;
    riddle.level = dto.level;
    riddle.subjectId = dto.subjectId || null;
    riddle.chapterId = dto.chapterId || null;
    riddle.explanation = dto.explanation || null;
    riddle.hint = dto.hint || null;
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
        const isExpert = dto.level === 'expert';

        const validLevels = ['easy', 'medium', 'hard', 'expert'];
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

        const riddle = transactionalEntityManager.create(RiddleMcq, {
          question: dto.question,
          options: isExpert ? null : dto.options,
          correctLetter: isExpert ? null : dto.correctLetter,
          correctAnswer: dto.correctAnswer,
          level: dto.level,
          subjectId: dto.subjectId || null,
          chapterId: dto.chapterId || null,
          explanation: dto.explanation || null,
          hint: dto.hint || null,
        });
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
    if (dto.correctAnswer !== undefined) {
      riddle.correctAnswer = dto.correctAnswer;
    }
    if (dto.correctLetter !== undefined) {
      riddle.correctLetter = dto.correctLetter || null;
    }
    if (dto.options !== undefined) {
      riddle.options = dto.options || null;
    }
    if (dto.level !== undefined) {
      const isExpert = dto.level === 'expert';
      riddle.level = dto.level;
      if (isExpert) {
        riddle.options = null;
        riddle.correctLetter = null;
      }
    }
    if (dto.subjectId !== undefined) {
      riddle.subjectId = dto.subjectId || null;
    }
    if (dto.chapterId !== undefined) {
      riddle.chapterId = dto.chapterId || null;
    }
    if (dto.explanation !== undefined) {
      riddle.explanation = dto.explanation || null;
    }
    if (dto.hint !== undefined) {
      riddle.hint = dto.hint || null;
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
        } else {
          this.logger.warn(`[RiddleMcqService] Action ${action} not supported - RiddleMcq has no status field`);
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
    totalChapters: number;
    mcqsByLevel: Record<string, number>;
  }> {
    const [totalMcqs, totalSubjects, totalChapters] = await Promise.all([
      this.riddleMcqRepo.count(),
      this.subjectRepo.count(),
      this.chapterRepo.count(),
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
      totalChapters,
      mcqsByLevel,
    };
  }

  async getFilterCounts(): Promise<{
    subjectCounts: { id: string; name: string; count: number }[];
    chapterCounts: { id: string; name: string; count: number; subjectId: string }[];
    levelCounts: { level: string; count: number }[];
    total: number;
  }> {
    const cacheKey = this.CACHE_KEYS.FILTER_COUNTS('all', 'all', 'all');

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const allSubjects = await this.subjectRepo.find();
        const subjectCountMap = new Map<string, number>();
        allSubjects.forEach((s) => subjectCountMap.set(s.id, 0));

        const subjectQuery = this.riddleMcqRepo
          .createQueryBuilder('riddle')
          .leftJoin('riddle.subject', 'subject')
          .select('subject.id', 'id')
          .addSelect('subject.name', 'name')
          .addSelect('COUNT(*)', 'count')
          .where('subject.id IS NOT NULL')
          .groupBy('subject.id');

        const subjectResults = await subjectQuery.getRawMany();
        subjectResults.forEach((r: { id: string; name: string; count: string }) => {
          subjectCountMap.set(r.id, parseInt(r.count, 10));
        });

        const subjectCounts = Array.from(subjectCountMap.entries()).map(([id, count]) => {
          const subject = allSubjects.find((s) => s.id === id);
          return { id, name: subject?.name || '', count };
        });

        const allChapters = await this.chapterRepo.find({ relations: ['subject'] });
        const chapterCountMap = new Map<string, number>();
        allChapters.forEach((c) => chapterCountMap.set(c.id, 0));

        const chapterQuery = this.riddleMcqRepo
          .createQueryBuilder('riddle')
          .select('riddle.chapterId', 'id')
          .addSelect('COUNT(*)', 'count')
          .where('riddle.chapterId IS NOT NULL')
          .groupBy('riddle.chapterId');

        const chapterResults = await chapterQuery.getRawMany();
        chapterResults.forEach((r: { id: string; count: string }) => {
          chapterCountMap.set(r.id, parseInt(r.count, 10));
        });

        const chapterCounts = Array.from(chapterCountMap.entries()).map(([id, count]) => {
          const chapter = allChapters.find((c) => c.id === id);
          return {
            id,
            name: chapter?.name || '',
            count,
            subjectId: chapter?.subjectId || '',
          };
        });

        const levelQuery = this.riddleMcqRepo
          .createQueryBuilder('riddle')
          .select('riddle.level', 'level')
          .addSelect('COUNT(*)', 'count')
          .groupBy('riddle.level');

        const levelResults = await levelQuery.getRawMany();
        const levelCounts = levelResults.map((r: { level: string; count: string }) => ({
          level: r.level,
          count: parseInt(r.count, 10),
        }));

        const total = await this.riddleMcqRepo.count();

        return {
          subjectCounts,
          chapterCounts,
          levelCounts,
          total,
        };
      },
      this.CACHE_TTL.FILTER_COUNTS
    );
  }

  async getStatusCountsBySubject(subjectSlug: string): Promise<StatusCountResponse> {
    const subject = await this.subjectRepo.findOne({ where: { slug: subjectSlug } });
    if (!subject) {
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }

    const chapters = await this.chapterRepo.find({ where: { subjectId: subject.id } });
    const chapterIds = chapters.map((c) => c.id);

    if (chapterIds.length === 0) {
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }

    const statusCounts = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.level', 'level')
      .addSelect('CAST(COUNT(*) AS INT)', 'count')
      .where('riddle.chapterId IN (:...chapterIds)', { chapterIds })
      .groupBy('riddle.level')
      .getRawMany();

    const counts = { total: 0, published: 0, draft: 0, trash: 0 };
    statusCounts.forEach((row: { level: string; count: number }) => {
      counts.total += row.count;
    });

    return counts;
  }

  // ==================== HELPERS ====================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
