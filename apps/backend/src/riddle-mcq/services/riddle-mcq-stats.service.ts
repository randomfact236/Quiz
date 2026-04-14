import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';

import { RiddleMcq } from '../entities/riddle-mcq.entity';
import { RiddleMcqCategoryService } from './riddle-mcq-category.service';
import { RiddleMcqSubjectService } from './riddle-mcq-subject.service';

@Injectable()
export class RiddleMcqStatsService {
  private readonly CACHE_KEYS = {
    FILTER_COUNTS: (category: string, subject: string, level: string) =>
      `riddle-mcq:filter-counts:${category || 'all'}:${subject || 'all'}:${level || 'all'}`,
  };

  private readonly CACHE_TTL = {
    FILTER_COUNTS: 300,
  };

  constructor(
    @InjectRepository(RiddleMcq)
    private riddleRepo: Repository<RiddleMcq>,
    private categoryService: RiddleMcqCategoryService,
    private subjectService: RiddleMcqSubjectService,
    private cacheService: CacheService
  ) {}

  async getStats(): Promise<{
    totalRiddles: number;
    totalSubjects: number;
    totalCategories: number;
    riddlesByLevel: Record<string, number>;
  }> {
    const [totalRiddles, totalSubjects, totalCategories] = await Promise.all([
      this.riddleRepo.count(),
      this.categoryService.findAllCategories().then((cats) => cats.length),
      this.subjectService.findAllSubjects().then((subs) => subs.length),
    ]);

    const levelCounts = await this.riddleRepo
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
