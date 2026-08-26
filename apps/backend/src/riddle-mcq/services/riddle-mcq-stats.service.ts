import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';

import { RiddleMcq, RiddleStatus } from '../entities/riddle-mcq.entity';
import { RiddleMcqCategoryService } from './riddle-mcq-category.service';
import { RiddleMcqSubjectService } from './riddle-mcq-subject.service';

@Injectable()
export class RiddleMcqStatsService {
  private readonly CACHE_KEYS = {
    FILTER_COUNTS: (category: string, subject: string, level: string) =>
      `riddle-mcq:filter-counts:${category || 'all'}:${subject || 'all'}:${level || 'all'}`,
    PUBLIC_LEVEL_COUNTS: 'riddle-mcq:stats:public-level-counts',
  };

  private readonly CACHE_TTL = {
    FILTER_COUNTS: 300,
    PUBLIC_LEVEL_COUNTS: 300,
  };

  constructor(
    @InjectRepository(RiddleMcq)
    private riddleRepo: Repository<RiddleMcq>,
    private categoryService: RiddleMcqCategoryService,
    private subjectService: RiddleMcqSubjectService,
    private cacheService: CacheService
  ) {}

  async getStats(): Promise<{
    totalRiddleMcqs: number;
    totalSubjects: number;
    totalCategories: number;
    mcqsByLevel: Record<string, number>;
  }> {
    const [totalRiddleMcqs, totalSubjects, totalCategories] = await Promise.all([
      this.riddleRepo.count(),
      this.subjectService.findAllSubjects().then((subs) => subs.length),
      this.categoryService.findAllCategories().then((cats) => cats.length),
    ]);

    const levelCounts = await this.riddleRepo
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
      totalRiddleMcqs,
      totalSubjects,
      totalCategories,
      mcqsByLevel,
    };
  }

  /**
   * Public per-level published counts for the challenge/practice hubs — one
   * grouped query (replaces the client-side even-distribution hack). Cached;
   * invalidated with the riddle-mcq:stats family on any mutation.
   */
  async getPublicLevelCounts(): Promise<{
    subjectWise: Record<string, Record<string, number>>;
    allSubject: Record<string, number>;
    completeMix: number;
  }> {
    return this.cacheService.getOrSet(
      this.CACHE_KEYS.PUBLIC_LEVEL_COUNTS,
      async () => {
        const rows: { slug: string | null; level: string; count: string }[] = await this.riddleRepo
          .createQueryBuilder('riddle')
          .leftJoin('riddle.subject', 'subject')
          .select('subject.slug', 'slug')
          .addSelect('riddle.level', 'level')
          .addSelect('COUNT(*)', 'count')
          .where('riddle.status = :status', { status: RiddleStatus.PUBLISHED })
          .andWhere('subject.slug IS NOT NULL')
          .groupBy('subject.slug')
          .addGroupBy('riddle.level')
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
      this.CACHE_TTL.PUBLIC_LEVEL_COUNTS
    );
  }

  /**
   * Get riddle counts by status for a specific subject
   * @param subjectIdOrSlug - The subject ID or slug
   * @returns StatusCountResponse with counts by status for the subject
   */
  async getStatusCountsBySubject(
    subjectIdOrSlug: string
  ): Promise<{ total: number; published: number; draft: number; trash: number }> {
    const subject =
      (await this.subjectService.findSubjectBySlug(subjectIdOrSlug).catch(() => null)) ||
      (await this.subjectService.findSubjectById(subjectIdOrSlug));

    if (!subject) {
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }

    // Single query with GROUP BY for all status counts
    const statusCounts = await this.riddleRepo
      .createQueryBuilder('riddle')
      .select('riddle.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('riddle.subjectId = :subjectId', { subjectId: subject.id })
      .groupBy('riddle.status')
      .getRawMany();

    // Initialize with defaults
    const counts = { total: 0, published: 0, draft: 0, trash: 0 };

    // Sum up total and populate individual statuses
    statusCounts.forEach((row: { status: string; count: string }) => {
      const count = parseInt(row.count, 10);
      counts.total += count;
      if (row.status in counts) {
        (counts as Record<string, number>)[row.status] = count;
      }
    });

    return counts;
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
    statusCounts: { status: string; count: number }[];
    total: number;
  }> {
    const cacheKey = this.CACHE_KEYS.FILTER_COUNTS(
      filters.category || 'all',
      filters.subject || 'all',
      filters.level || 'all'
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [categoryCounts, subjectCounts, levelStatus] = await Promise.all([
          this.categoryService.getCategoryCounts(),
          this.subjectService.getSubjectCounts({
            category: filters.category,
            level: filters.level,
          }),
          this.getLevelAndStatusCounts(filters),
        ]);

        return {
          categoryCounts,
          subjectCounts,
          levelCounts: levelStatus.levelCounts,
          statusCounts: levelStatus.statusCounts,
          total: levelStatus.total,
        };
      },
      this.CACHE_TTL.FILTER_COUNTS
    );
  }

  /**
   * Level + status + total counts in two grouped queries (was three separate
   * queries plus a COUNT). Semantics preserved:
   * - levelCounts ignore the level filter (selecting a level must not
   *   collapse its own picker);
   * - statusCounts respect category/subject/level filters;
   * - total is the sum over those same status rows.
   */
  private async getLevelAndStatusCounts(filters: {
    category?: string;
    subject?: string;
    level?: string;
  }): Promise<{
    levelCounts: { level: string; count: number }[];
    statusCounts: { status: string; count: number }[];
    total: number;
  }> {
    const applyTaxonomyFilters = (query: ReturnType<typeof this.riddleRepo.createQueryBuilder>) => {
      if (filters.category && filters.category !== 'all') {
        query.andWhere('category.slug = :category', { category: filters.category });
      }
      if (filters.subject && filters.subject !== 'all') {
        query.andWhere('subject.slug = :subject', { subject: filters.subject });
      }
      return query;
    };

    const baseQuery = () =>
      this.riddleRepo
        .createQueryBuilder('riddle')
        .leftJoin('riddle.subject', 'subject')
        .leftJoin('subject.category', 'category');

    const [levelRows, statusRows] = await Promise.all([
      applyTaxonomyFilters(baseQuery())
        .select('riddle.level', 'level')
        .addSelect('COUNT(*)', 'count')
        .groupBy('riddle.level')
        .getRawMany(),
      (() => {
        let q = applyTaxonomyFilters(baseQuery())
          .select('riddle.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('riddle.status');
        if (filters.level && filters.level !== 'all') {
          q = q.andWhere('riddle.level = :level', { level: filters.level });
        }
        return q.getRawMany();
      })(),
    ]);

    const levelCounts = (levelRows as { level: string; count: string }[]).map((r) => ({
      level: r.level,
      count: parseInt(r.count, 10),
    }));

    let total = 0;
    const statusCounts = (statusRows as { status: string; count: string }[]).map((r) => {
      const count = parseInt(r.count, 10);
      total += count;
      return { status: r.status, count };
    });

    return { levelCounts, statusCounts, total };
  }
}
