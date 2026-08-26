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
        const [categoryCounts, subjectCounts, levelCounts, statusCounts, total] = await Promise.all(
          [
            this.categoryService.getCategoryCounts(),
            this.subjectService.getSubjectCounts({
              category: filters.category,
              level: filters.level,
            }),
            this.getLevelCounts(filters),
            this.getStatusCounts(filters),
            this.getTotalCount(filters),
          ]
        );

        return { categoryCounts, subjectCounts, levelCounts, statusCounts, total };
      },
      this.CACHE_TTL.FILTER_COUNTS
    );
  }

  private async getLevelCounts(filters: {
    category?: string;
    subject?: string;
    level?: string;
  }): Promise<{ level: string; count: number }[]> {
    let levelQuery = this.riddleRepo
      .createQueryBuilder('riddle')
      .leftJoin('riddle.subject', 'subject')
      .leftJoin('subject.category', 'category')
      .select('riddle.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('riddle.level');

    if (filters.category && filters.category !== 'all') {
      levelQuery = levelQuery.andWhere('category.slug = :category', {
        category: filters.category,
      });
    }

    if (filters.subject && filters.subject !== 'all') {
      levelQuery = levelQuery.andWhere('subject.slug = :subject', { subject: filters.subject });
    }

    const levelResults = await levelQuery.getRawMany();
    return levelResults.map((r: { level: string; count: string }) => ({
      level: r.level,
      count: parseInt(r.count, 10),
    }));
  }

  private async getStatusCounts(filters: {
    category?: string;
    subject?: string;
    level?: string;
  }): Promise<{ status: string; count: number }[]> {
    let statusQuery = this.riddleRepo
      .createQueryBuilder('riddle')
      .leftJoin('riddle.subject', 'subject')
      .leftJoin('subject.category', 'category')
      .select('riddle.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('riddle.status');

    if (filters.category && filters.category !== 'all') {
      statusQuery = statusQuery.andWhere('category.slug = :category', {
        category: filters.category,
      });
    }

    if (filters.subject && filters.subject !== 'all') {
      statusQuery = statusQuery.andWhere('subject.slug = :subject', {
        subject: filters.subject,
      });
    }

    if (filters.level && filters.level !== 'all') {
      statusQuery = statusQuery.andWhere('riddle.level = :level', { level: filters.level });
    }

    const statusResults = await statusQuery.getRawMany();
    return statusResults.map((r: { status: string; count: string }) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));
  }

  private async getTotalCount(filters: {
    category?: string;
    subject?: string;
    level?: string;
  }): Promise<number> {
    let totalQuery = this.riddleRepo.createQueryBuilder('riddle');
    totalQuery = totalQuery.leftJoin('riddle.subject', 'subject');
    totalQuery = totalQuery.leftJoin('subject.category', 'category');

    if (filters.category && filters.category !== 'all') {
      totalQuery = totalQuery.andWhere('category.slug = :category', {
        category: filters.category,
      });
    }
    if (filters.subject && filters.subject !== 'all') {
      totalQuery = totalQuery.andWhere('subject.slug = :subject', { subject: filters.subject });
    }
    if (filters.level && filters.level !== 'all') {
      totalQuery = totalQuery.andWhere('riddle.level = :level', { level: filters.level });
    }

    return totalQuery.getCount();
  }
}
