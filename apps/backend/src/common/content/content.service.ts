/**
 * ============================================================================
 * Shared Content Service Base — capacity-plan Track B
 * ============================================================================
 * One shared implementation of list/random/create/update/delete/import for
 * the four content modules (quiz-mcq, riddle-mcq, image-riddles, dad-jokes),
 * extracted from quiz-mcq.service.ts as the reference shape.
 *
 * Modules extend this class and supply:
 *   - repos + entity classes + cache config via ContentServiceDeps
 *   - small hooks for module-specific validation/mapping
 *
 * Cache invalidation is family-scoped (see content-cache.util) — mutations
 * clear only the families a module declares, never '<module>:*'.
 *
 * NOTE: known upstream quirks are intentionally preserved by this base
 * (chapterNumber = length + 1 race, import chapterNumber 0, per-chapter
 * N-delete cascade). They are logged in TODO.md "Quiz MCQ — correctness
 * backlog" and must be fixed there, not silently here.
 * ============================================================================
 */

import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

import { PaginationDto } from '../dto/base.dto';
import { CacheService } from '../cache/cache.service';
import { ContentStatus } from '../enums/content-status.enum';

import { invalidateCacheFamilies } from './content-cache.util';
import { pickRandomByWeight } from './random-selection.util';

export interface ContentListFilters {
  status?: ContentStatus;
  level?: string;
  chapter?: string;
  search?: string;
  subjectSlug?: string;
}

export interface ContentRandomOptions {
  level?: string;
  chapterId?: string;
  subjectSlug?: string;
  count?: number;
}

export interface ContentImportRowTaxonomy {
  subjectName: string;
  chapterName: string;
}

export interface ContentImportResult {
  count: number;
  errors: string[];
}

export interface ContentServiceDeps<
  TSubject extends ObjectLiteral,
  TChapter extends ObjectLiteral,
  TItem extends ObjectLiteral,
> {
  subjectRepo: Repository<TSubject>;
  chapterRepo: Repository<TChapter>;
  itemRepo: Repository<TItem>;
  dataSource: DataSource;
  cacheService: CacheService;
  /** Cache-key module prefix, e.g. 'quiz'. */
  moduleKey: string;
  /** Cache families cleared on mutation, e.g. ['quiz:questions', 'quiz:filter-counts']. */
  cacheFamilies: string[];
  /** Query-builder alias for the item entity, e.g. 'question'. */
  itemAlias: string;
  /** Subject -> chapters relation name on the subject entity. */
  chaptersRelation: string;
  /** Chapter -> items relation name on the chapter entity. */
  chapterItemsRelation: string;
  /** TTL (s) for cached paginated item lists. */
  itemsCacheTtlS?: number;
}

export abstract class ContentServiceBase<
  TSubject extends ObjectLiteral,
  TChapter extends ObjectLiteral,
  TItem extends ObjectLiteral,
> {
  protected readonly logger: Logger = new Logger(this.constructor.name);

  protected readonly itemsCacheTtlS: number;

  /** Noun used in not-found messages for items (override per module). */
  protected get itemNoun(): string {
    return 'Item';
  }

  constructor(protected readonly deps: ContentServiceDeps<TSubject, TChapter, TItem>) {
    this.itemsCacheTtlS = deps.itemsCacheTtlS ?? 600;
  }

  protected get cache(): CacheService {
    return this.deps.cacheService;
  }

  /**
   * Track B: targeted invalidation — clears only this module's declared
   * cache families (was delPattern('<module>:*')).
   */
  protected async invalidateContentCaches(): Promise<void> {
    await invalidateCacheFamilies(this.deps.cacheService, this.deps.cacheFamilies);
  }

  /** Default key format; override to keep legacy per-module formats. */
  protected listCacheKey(filters: ContentListFilters, page: number, limit: number): string {
    const m = this.deps.moduleKey;
    return `${m}:items:${filters.subjectSlug || 'all'}:${filters.chapter || 'all'}:${
      filters.level || 'all'
    }:${filters.status || 'all'}:${page}:${limit}`;
  }

  // ==================== SUBJECTS ====================

  async findAllSubjects(
    pagination?: PaginationDto,
    hasContentOnly: boolean = false
  ): Promise<{ data: TSubject[]; total: number }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 100;

    const alias = 'subject';
    const query = this.deps.subjectRepo.createQueryBuilder(alias).orderBy(`${alias}.name`, 'ASC');

    if (hasContentOnly) {
      const ch = `${alias}_chapter`;
      query
        .innerJoin(`${alias}.${this.deps.chaptersRelation}`, ch)
        .innerJoin(`${ch}.${this.deps.chapterItemsRelation}`, `${ch}_item`);
    }

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async createSubject(dto: Partial<TSubject>): Promise<TSubject> {
    const subject = this.deps.subjectRepo.create(dto as any) as unknown as TSubject;
    const saved = await this.deps.subjectRepo.save(subject);
    await this.invalidateContentCaches();
    return saved;
  }

  async updateSubject(id: string, dto: Partial<TSubject>): Promise<TSubject> {
    const subject = await this.deps.subjectRepo.findOne({ where: { id } as any });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    Object.assign(subject, dto);
    const saved = await this.deps.subjectRepo.save(subject);
    await this.invalidateContentCaches();
    return saved;
  }

  /**
   * Transactional cascade delete. Preserves the legacy per-chapter loop
   * (logged as [P1] N-delete in TODO.md — do not optimize here).
   */
  async deleteSubjectCascade(id: string): Promise<void> {
    const subject = await this.deps.subjectRepo.findOne({
      where: { id } as any,
      relations: [this.deps.chaptersRelation],
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const queryRunner = this.deps.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chapters = (subject as any)[this.deps.chaptersRelation] as TChapter[] | undefined;
      if (chapters && chapters.length > 0) {
        for (const chapter of chapters) {
          // Legacy per-chapter loop preserved ([P1] N-delete, see TODO.md).
          await queryRunner.manager.delete(this.deps.itemRepo.target, {
            chapterId: (chapter as any).id,
          } as any);
        }
        await queryRunner.manager.delete(this.deps.chapterRepo.target, {
          subjectId: id,
        } as any);
      }

      await queryRunner.manager.delete(this.deps.subjectRepo.target, { id });

      await queryRunner.commitTransaction();
      await this.invalidateContentCaches();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== ITEMS (list / random / CRUD) ====================

  async findItems(
    pagination: PaginationDto,
    filters: ContentListFilters
  ): Promise<{ data: TItem[]; total: number; totalPages: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 0;

    const cacheKey = this.listCacheKey(filters, page, limit);

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const alias = this.deps.itemAlias;
        const query = this.deps.itemRepo
          .createQueryBuilder(alias)
          .leftJoinAndSelect(`${alias}.chapter`, 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject');

        this.applyListFilters(query, filters);

        if (limit > 0) {
          query.skip((page - 1) * limit).take(limit);
        }

        const [data, total] = await query.orderBy(`${alias}.updatedAt`, 'DESC').getManyAndCount();

        const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
        return { data, total, totalPages };
      },
      this.itemsCacheTtlS
    );
  }

  /**
   * Capacity-plan A2/B: index-seek random selection via random_weight with
   * wrap-around; PUBLISHED-only by default.
   */
  async findRandomItems(opts: ContentRandomOptions): Promise<{ data: TItem[]; total: number }> {
    const count = Math.min(Math.max(opts.count ?? 20, 1), 50);
    const alias = this.deps.itemAlias;

    const data = await pickRandomByWeight(this.deps.itemRepo, alias, {
      count,
      filters: (qb) => {
        qb.leftJoinAndSelect(`${alias}.chapter`, 'chapter')
          .leftJoinAndSelect('chapter.subject', 'subject')
          .where(`${alias}.status = :status`, { status: ContentStatus.PUBLISHED });
        this.applyRandomFilters(qb, opts);
      },
    });

    return { data, total: data.length };
  }

  async createItem(dto: Record<string, any>): Promise<TItem> {
    const built = await this.validateAndBuildCreate(dto);
    const chapter = await this.deps.chapterRepo.findOne({ where: { id: built.chapterId } as any });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const item = this.deps.itemRepo.create({
      ...built.data,
      chapter,
      chapterId: built.chapterId,
    } as any) as unknown as TItem;
    const saved = await this.deps.itemRepo.save(item);
    await this.invalidateContentCaches();
    return saved;
  }

  async updateItem(id: string, dto: Record<string, any>): Promise<TItem> {
    const item = await this.deps.itemRepo.findOne({ where: { id } as any });
    if (!item) {
      throw new NotFoundException(`${this.itemNoun} not found`);
    }

    if (dto.chapterId !== undefined) {
      const chapter = await this.deps.chapterRepo.findOne({ where: { id: dto.chapterId } as any });
      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }
      (item as any).chapter = chapter;
    }

    await this.applyUpdate(item as any, dto);

    const saved = await this.deps.itemRepo.save(item);
    await this.invalidateContentCaches();
    return saved;
  }

  async deleteItem(id: string): Promise<void> {
    const result = await this.deps.itemRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`${this.itemNoun} not found`);
    }
    await this.invalidateContentCaches();
  }

  // ==================== BULK IMPORT ====================

  /**
   * Chunked transactional import with auto-created subjects/chapters.
   * Mirrors quiz-mcq's reference behavior row-for-row (including known
   * quirks logged in TODO.md).
   */
  async importItems(
    rows: Record<string, any>[],
    defaultSubjectName?: string
  ): Promise<ContentImportResult> {
    const errors: string[] = [];

    if (!rows || rows.length === 0) {
      throw new BadRequestException(`No ${this.deps.moduleKey} rows provided for bulk creation`);
    }

    const CHUNK_SIZE = 100;
    let totalCreated = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const result = await this.processImportChunk(chunk, defaultSubjectName, errors, i);
      totalCreated += result.count;
    }

    await this.invalidateContentCaches();
    return { count: totalCreated, errors };
  }

  private async processImportChunk(
    items: Record<string, any>[],
    defaultSubjectName: string | undefined,
    errors: string[],
    offset: number
  ): Promise<{ count: number }> {
    return await this.deps.dataSource.transaction(async (manager) => {
      const validItems: { row: Record<string, any>; index: number }[] = [];
      items.forEach((row, i) => {
        const taxonomy = this.getImportRowTaxonomy(row, defaultSubjectName);
        if (taxonomy) {
          validItems.push({ row, index: offset + i });
        } else {
          errors.push(`Row ${offset + i + 1}: Missing question or chapter name`);
        }
      });

      const subjectMap = new Map<string, TSubject>();
      const subjectNames = [
        ...new Set(
          validItems.map(
            ({ row }) => this.getImportRowTaxonomy(row, defaultSubjectName)!.subjectName
          )
        ),
      ];
      for (const name of subjectNames) {
        let subject = await manager.findOne(this.deps.subjectRepo.target, {
          where: { name } as any,
        });
        if (!subject) {
          subject = (await manager.save(this.deps.subjectRepo.target, {
            name,
            slug: name
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, ''),
            emoji: '📚',
            isActive: true,
          } as any)) as TSubject;
        }
        subjectMap.set(name, subject);
      }

      const chapterMap = new Map<string, TChapter>();
      const chapterKeys = [
        ...new Set(
          validItems.map(({ row }) => {
            const t = this.getImportRowTaxonomy(row, defaultSubjectName)!;
            return `${t.chapterName}|${t.subjectName}`;
          })
        ),
      ];
      for (const key of chapterKeys) {
        const [chapterName, subjectName] = key.split('|');
        const subject = subjectMap.get(subjectName);
        if (!subject) continue;

        let chapter = await manager.findOne(this.deps.chapterRepo.target, {
          where: { name: chapterName, subjectId: (subject as any).id } as any,
        });
        if (!chapter) {
          chapter = (await manager.save(this.deps.chapterRepo.target, {
            name: chapterName,
            subjectId: (subject as any).id,
            chapterNumber: 0,
          } as any)) as TChapter;
        }
        chapterMap.set(key, chapter);
      }

      let count = 0;
      for (const { row, index } of validItems) {
        const taxonomy = this.getImportRowTaxonomy(row, defaultSubjectName)!;
        const subject = subjectMap.get(taxonomy.subjectName);
        const chapter = chapterMap.get(`${taxonomy.chapterName}|${taxonomy.subjectName}`);

        if (!subject || !chapter) {
          errors.push(`Row ${index + 1}: Could not find/create subject or chapter`);
          continue;
        }

        try {
          const payload = this.buildImportItem(row, { chapterId: (chapter as any).id }, index);
          if (typeof payload === 'string') {
            errors.push(`Row ${index + 1}: ${payload}`);
            continue;
          }
          await manager.save(this.deps.itemRepo.target, payload as any);
          count++;
        } catch (e: any) {
          errors.push(`Row ${index + 1}: ${e.message}`);
        }
      }

      return { count };
    });
  }

  // ==================== HOOKS (module-specific) ====================

  /** Module-specific WHERE clauses for paginated admin lists. */
  protected abstract applyListFilters(
    qb: SelectQueryBuilder<any>,
    filters: ContentListFilters
  ): void;

  /** Extra filters for random pools beyond the default PUBLISHED filter. */
  protected abstract applyRandomFilters(
    qb: SelectQueryBuilder<any>,
    opts: ContentRandomOptions
  ): void;

  /** Validate create DTO and produce the raw entity payload (+ its chapterId). */
  protected abstract validateAndBuildCreate(
    dto: Record<string, any>
  ): Promise<{ data: Record<string, unknown>; chapterId: string }>;

  /** Mutate `item` in place from a partial update DTO. */
  protected abstract applyUpdate(item: any, dto: Record<string, any>): Promise<void>;

  /** Taxonomy for an import row, or null when the row is unusable. */
  protected abstract getImportRowTaxonomy(
    row: Record<string, any>,
    defaultSubjectName?: string
  ): ContentImportRowTaxonomy | null;

  /** Map an import row to an entity payload; return an error message string to reject. */
  protected abstract buildImportItem(
    row: Record<string, any>,
    ids: { chapterId: string },
    order: number
  ): Record<string, unknown> | string;
}
