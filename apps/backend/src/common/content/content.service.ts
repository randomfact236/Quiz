/**
 * ============================================================================
 * Shared Content Service Base — plan/STANDARDS.md Track B
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
 * ============================================================================
 */

import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, In, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

import { PaginationDto } from '../dto/base.dto';
import { CacheService } from '../cache/cache.service';
import { ContentStatus } from '../enums/content-status.enum';

import { hashQuestionText } from './content-hash.util';
import { invalidateCacheFamilies } from './content-cache.util';
import { pickRandomByWeight } from './random-selection.util';

export interface ContentListFilters {
  status?: ContentStatus;
  level?: string;
  chapter?: string;
  search?: string;
  subjectSlug?: string;
  /** Flat modules only: category slug filter (e.g. riddle-mcq). */
  categorySlug?: string;
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

export interface ContentImportDuplicate {
  /** 1-based row number in the import payload. */
  row: number;
  /** Question text of the skipped duplicate row. */
  question: string;
  /** 1-based row number of the kept first occurrence within the same import. */
  duplicateOfRow?: number;
}

export interface ContentImportResult {
  count: number;
  errors: string[];
  duplicates: ContentImportDuplicate[];
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
  /** Subject -> chapters relation name on the subject entity (hierarchical mode). */
  chaptersRelation?: string;
  /** Chapter -> items relation name on the chapter entity (hierarchical mode). */
  chapterItemsRelation?: string;
  /**
   * Flat taxonomy mode (e.g. riddle-mcq: Subject -> items, no chapters).
   * When true, list/random/create/update operate directly on the items'
   * subject relation instead of the chapter layer; chaptersRelation /
   * chapterItemsRelation are unused.
   */
  flat?: boolean;
  /** Hard upper bound for random selection count (defaults 50). */
  randomMax?: number;
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
  private readonly randomMax: number;

  /** Noun used in not-found messages for items (override per module). */
  protected get itemNoun(): string {
    return 'Item';
  }

  constructor(protected readonly deps: ContentServiceDeps<TSubject, TChapter, TItem>) {
    this.itemsCacheTtlS = deps.itemsCacheTtlS ?? 600;
    this.randomMax = deps.randomMax ?? 50;
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
    hasContentOnly: boolean = false,
    /**
     * Visibility: public callers should leave this false so INACTIVE subjects
     * never enter responses; admin surfaces pass true.
     */
    includeInactive: boolean = false
  ): Promise<{ data: TSubject[]; total: number }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 100;

    const alias = 'subject';
    const query = this.deps.subjectRepo.createQueryBuilder(alias).orderBy(`${alias}.name`, 'ASC');

    if (!includeInactive) {
      query.where(`${alias}.isActive = :isActive`, { isActive: true });
    }

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
      relations: [this.deps.chaptersRelation!],
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const queryRunner = this.deps.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const chapters = (subject as any)[this.deps.chaptersRelation!] as TChapter[] | undefined;
      if (chapters && chapters.length > 0) {
        // P1 fix (TODO.md backlog): was one DELETE per chapter (N queries);
        // now a single IN query inside the same transaction.
        const chapterIds = chapters.map((c) => (c as any).id);
        await queryRunner.manager.delete(this.deps.itemRepo.target, {
          chapterId: In(chapterIds),
        } as any);
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
        const query = this.deps.itemRepo.createQueryBuilder(alias);

        if (this.deps.flat) {
          query
            .leftJoinAndSelect(`${alias}.subject`, 'subject')
            .leftJoinAndSelect('subject.category', 'category');
        } else {
          query
            .leftJoinAndSelect(`${alias}.chapter`, 'chapter')
            .leftJoinAndSelect('chapter.subject', 'subject');
        }

        this.applyListFilters(query, filters);

        if (limit > 0) {
          query.skip((page - 1) * limit).take(limit);
        }

        this.getListOrder(alias).forEach(([column, direction], i) =>
          i === 0 ? query.orderBy(column, direction) : query.addOrderBy(column, direction)
        );

        const [data, total] = await query.getManyAndCount();

        const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
        return { data, total, totalPages };
      },
      this.itemsCacheTtlS
    );
  }

  /** ORDER BY clauses for cached lists (first clause is primary). */
  protected getListOrder(_alias: string): Array<[string, 'ASC' | 'DESC']> {
    return [[`${_alias}.updatedAt`, 'DESC']];
  }

  /**
   * plan/STANDARDS.md Track A2/B: index-seek random selection via random_weight with
   * wrap-around; PUBLISHED-only by default.
   */
  async findRandomItems(opts: ContentRandomOptions): Promise<{ data: TItem[]; total: number }> {
    const count = Math.min(Math.max(opts.count ?? 20, 1), this.randomMax);
    const alias = this.deps.itemAlias;

    const data = await pickRandomByWeight(this.deps.itemRepo, alias, {
      count,
      max: this.randomMax,
      filters: (qb) => {
        if (this.deps.flat) {
          qb.leftJoinAndSelect(`${alias}.subject`, 'subject');
        } else {
          qb.leftJoinAndSelect(`${alias}.chapter`, 'chapter').leftJoinAndSelect(
            'chapter.subject',
            'subject'
          );
        }
        qb.where(`${alias}.status = :status`, { status: ContentStatus.PUBLISHED });
        this.applyRandomFilters(qb, opts);
      },
    });

    return { data, total: data.length };
  }

  async createItem(dto: Record<string, any>): Promise<TItem> {
    const built = await this.validateAndBuildCreate(dto);
    const contentHash = hashQuestionText(String(built.data.question ?? ''));

    if (this.deps.flat) {
      if (!built.subjectId) {
        throw new BadRequestException('subjectId is required');
      }
      const subject = await this.deps.subjectRepo.findOne({
        where: { id: built.subjectId } as any,
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }

      if (await this.findDuplicate(contentHash, built.subjectId)) {
        throw await this.duplicateConflictFor({ ...built.data, subjectId: built.subjectId });
      }

      const item = this.deps.itemRepo.create({
        ...built.data,
        contentHash,
        subjectId: built.subjectId,
      } as any) as unknown as TItem;
      return this.saveItemGuarded(item);
    }

    if (!built.chapterId) {
      throw new BadRequestException('chapterId is required');
    }
    const chapter = await this.deps.chapterRepo.findOne({ where: { id: built.chapterId } as any });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (await this.findDuplicate(contentHash, built.chapterId)) {
      throw await this.duplicateConflictFor({ ...built.data, chapterId: built.chapterId });
    }

    const item = this.deps.itemRepo.create({
      ...built.data,
      contentHash,
      chapter,
      chapterId: built.chapterId,
    } as any) as unknown as TItem;
    return this.saveItemGuarded(item);
  }

  async updateItem(id: string, dto: Record<string, any>): Promise<TItem> {
    const item = await this.deps.itemRepo.findOne({ where: { id } as any });
    if (!item) {
      throw new NotFoundException(`${this.itemNoun} not found`);
    }

    if (this.deps.flat && dto.subjectId !== undefined) {
      const subject = await this.deps.subjectRepo.findOne({
        where: { id: dto.subjectId } as any,
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    if (!this.deps.flat && dto.chapterId !== undefined) {
      const chapter = await this.deps.chapterRepo.findOne({ where: { id: dto.chapterId } as any });
      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }
      (item as any).chapter = chapter;
      // Keep the scalar in sync so the duplicate guard below checks the
      // chapter the item is moving TO, not the one it came from.
      (item as any).chapterId = dto.chapterId;
    }

    await this.applyUpdate(item as any, dto);

    const contentHash = hashQuestionText(String((item as any).question ?? ''));
    (item as any).contentHash = contentHash;
    const scopeId = this.itemScopeId(item as any);
    if (scopeId && (await this.findDuplicate(contentHash, scopeId, id))) {
      throw await this.duplicateConflictFor(item as any);
    }

    return this.saveItemGuarded(item);
  }

  async deleteItem(id: string): Promise<void> {
    const result = await this.deps.itemRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`${this.itemNoun} not found`);
    }
    await this.invalidateContentCaches();
  }

  // ==================== DUPLICATE GUARD ====================

  /** Owning scope id for the duplicate guard: chapterId (hierarchical) / subjectId (flat). */
  private itemScopeId(item: any): string | undefined {
    return this.deps.flat ? item.subjectId : (item.chapterId ?? item.chapter?.id);
  }

  /** Existing item with the same content hash in the same scope, optionally excluding one id. */
  private async findDuplicate(
    contentHash: string,
    scopeId: string,
    excludeId?: string
  ): Promise<TItem | null> {
    const scope = this.deps.flat ? { subjectId: scopeId } : { chapterId: scopeId };
    const found = await this.deps.itemRepo.findOne({
      where: { contentHash, ...scope } as any,
    });
    return found && (found as any).id !== excludeId ? found : null;
  }

  /** 409 carrying the duplicate question text so clients can highlight it. */
  private async duplicateConflictFor(item: any): Promise<ConflictException> {
    const text = String(item.question ?? '');
    if (this.deps.flat) {
      const subject = item.subjectId
        ? await this.deps.subjectRepo.findOne({ where: { id: item.subjectId } as any })
        : null;
      return this.duplicateConflict(text, 'subject', (subject as any)?.name ?? 'this subject');
    }
    const chapterId = item.chapterId ?? item.chapter?.id;
    const chapter = chapterId
      ? await this.deps.chapterRepo.findOne({ where: { id: chapterId } as any })
      : null;
    return this.duplicateConflict(text, 'chapter', (chapter as any)?.name ?? 'this chapter');
  }

  private duplicateConflict(
    questionText: string,
    scopeLabel: 'chapter' | 'subject',
    scopeName: string
  ): ConflictException {
    const preview = questionText.length > 200 ? `${questionText.slice(0, 200)}…` : questionText;
    return new ConflictException(
      `Duplicate question detected: "${preview}" already exists in ${scopeLabel} "${scopeName}"`
    );
  }

  /**
   * Race backstop: between the pre-check and the save, a concurrent insert can
   * still trip the unique index — translate 23505 into the same friendly 409.
   */
  private async saveItemGuarded(item: TItem): Promise<TItem> {
    try {
      const saved = await this.deps.itemRepo.save(item);
      await this.invalidateContentCaches();
      return saved;
    } catch (err: any) {
      if (err?.code === '23505') {
        throw await this.duplicateConflictFor(item as any);
      }
      throw err;
    }
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
    const duplicates: ContentImportDuplicate[] = [];

    if (!rows || rows.length === 0) {
      throw new BadRequestException(`No ${this.deps.moduleKey} rows provided for bulk creation`);
    }

    const CHUNK_SIZE = 100;
    let totalCreated = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const result = await this.processImportChunk(
        chunk,
        defaultSubjectName,
        errors,
        duplicates,
        i
      );
      totalCreated += result.count;
    }

    await this.invalidateContentCaches();
    return { count: totalCreated, errors, duplicates };
  }

  /** URL-safe slug for a subject name; falls back to 'subject' when empty. */
  protected slugify(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    return base || 'subject';
  }

  /**
   * P1 fix (TODO.md backlog): distinct names ("C++" vs "C Basics") used to
   * sanitize to identical slugs, so the second save threw a unique violation
   * and aborted the whole 100-row chunk. Now picks the next free suffix.
   */
  protected async resolveUniqueSubjectSlug(
    manager: DataSource['manager'],
    name: string
  ): Promise<string> {
    const base = this.slugify(name);
    let slug = base;
    let suffix = 2;
    while (
      (await manager.findOne(this.deps.subjectRepo.target, {
        where: { slug } as any,
      })) !== null
    ) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  /**
   * P1 fix (TODO.md backlog): new chapters were created with chapterNumber 0.
   * Returns MAX(existing) + 1 per subject; `nextBySubject` carries the counter
   * across chapters created within the same chunk/transaction.
   */
  protected async getNextChapterNumber(
    manager: DataSource['manager'],
    subjectId: string,
    nextBySubject: Map<string, number>
  ): Promise<number> {
    if (!nextBySubject.has(subjectId)) {
      const last = await manager.findOne(this.deps.chapterRepo.target, {
        where: { subjectId } as any,
        order: { chapterNumber: 'DESC' } as any,
      });
      nextBySubject.set(subjectId, ((last as any)?.chapterNumber ?? 0) + 1);
    }
    const next = nextBySubject.get(subjectId)!;
    nextBySubject.set(subjectId, next + 1);
    return next;
  }

  private async processImportChunk(
    items: Record<string, any>[],
    defaultSubjectName: string | undefined,
    errors: string[],
    duplicates: ContentImportDuplicate[],
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
            slug: await this.resolveUniqueSubjectSlug(manager, name),
            emoji: '📚',
            isActive: true,
          } as any)) as TSubject;
        }
        subjectMap.set(name, subject);
      }

      const nextChapterNumberBySubject = new Map<string, number>();

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
            chapterNumber: await this.getNextChapterNumber(
              manager,
              (subject as any).id,
              nextChapterNumberBySubject
            ),
          } as any)) as TChapter;
        }
        chapterMap.set(key, chapter);
      }

      // Duplicate guard: pre-load the hashes already stored in the affected
      // chapters, then walk rows in import order — the first occurrence wins,
      // later identical rows (or ones already in the DB) are skipped and
      // reported rather than silently doubled.
      const chapterIds = [...new Set([...chapterMap.values()].map((c) => (c as any).id))];
      const existingKeys = new Set<string>(
        chapterIds.length === 0
          ? []
          : (
              await manager.find(this.deps.itemRepo.target, {
                where: { chapterId: In(chapterIds) } as any,
                select: ['chapterId', 'contentHash'],
              })
            ).map((r: any) => `${r.chapterId}:${r.contentHash}`)
      );
      /** dupKey -> 1-based row number of the first occurrence in this import. */
      const batchKeys = new Map<string, number>();

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

          const questionText = String(payload.question ?? '');
          const contentHash = hashQuestionText(questionText);
          const dupKey = `${(chapter as any).id}:${contentHash}`;
          const duplicateOfRow = batchKeys.get(dupKey);
          if (existingKeys.has(dupKey) || duplicateOfRow !== undefined) {
            const preview =
              questionText.length > 200 ? `${questionText.slice(0, 200)}…` : questionText;
            errors.push(`Row ${index + 1}: Duplicate question "${preview}" — skipped`);
            duplicates.push({
              row: index + 1,
              question: questionText,
              ...(duplicateOfRow !== undefined ? { duplicateOfRow } : {}),
            });
            continue;
          }
          batchKeys.set(dupKey, index + 1);
          (payload as any).contentHash = contentHash;

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

  /** Validate create DTO and produce the raw entity payload + its parent id. */
  protected abstract validateAndBuildCreate(dto: Record<string, any>): Promise<{
    data: Record<string, unknown>;
    /** Hierarchical mode: owning chapter id. */
    chapterId?: string;
    /** Flat mode: owning subject id. */
    subjectId?: string;
  }>;

  /** Mutate `item` in place from a partial update DTO. */
  protected abstract applyUpdate(item: any, dto: Record<string, any>): Promise<void>;

  /**
   * Taxonomy for an import row, or null when the row is unusable.
   * Default implementation rejects everything: modules that don't use the
   * shared chapter-based importer (flat modules) never call importItems.
   */
  protected getImportRowTaxonomy(
    _row: Record<string, any>,
    _defaultSubjectName?: string
  ): ContentImportRowTaxonomy | null {
    throw new Error('importItems() is not supported by this module (no chapter layer)');
  }

  /** Map an import row to an entity payload; return an error message string to reject. */
  protected buildImportItem(
    _row: Record<string, any>,
    _ids: { chapterId: string },
    _order: number
  ): Record<string, unknown> | string {
    throw new Error('importItems() is not supported by this module (no chapter layer)');
  }
}
