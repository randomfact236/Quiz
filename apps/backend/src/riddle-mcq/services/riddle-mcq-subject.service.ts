import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';

import { RiddleMcq, RiddleStatus, RiddleMcqLevel } from '../entities/riddle-mcq.entity';
import { RiddleSubject } from '../entities/riddle-subject.entity';

@Injectable()
export class RiddleMcqSubjectService {
  private readonly CACHE_KEYS = {
    SUBJECTS: (active: boolean) => `riddle-mcq:subjects:${active ? 'active' : 'all'}`,
  };

  private readonly CACHE_TTL = {
    SUBJECTS: 600,
  };

  constructor(
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

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

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
          .orderBy('subject.name', 'ASC');

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

  async findSubjectMeta(slug: string): Promise<{ name: string; emoji: string; slug: string }> {
    const subject = await this.findSubjectBySlug(slug);
    return { name: subject.name, emoji: subject.emoji, slug: subject.slug };
  }

  async createSubject(dto: {
    name: string;
    slug?: string;
    emoji?: string;
    categoryId?: string | null;
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

  async getSubjectCounts(filters: { category?: string; level?: string }): Promise<
    {
      id: string;
      name: string;
      emoji: string;
      categoryId: string | null;
      count: number;
    }[]
  > {
    const allSubjects = await this.subjectRepo.find();

    const subjectCountMap = new Map<string, number>();
    allSubjects.forEach((s) => subjectCountMap.set(s.id, 0));

    let subjectQuery = this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .leftJoin('riddle.subject', 'subject')
      .leftJoin('subject.category', 'category')
      .select('subject.id', 'subjectId')
      .addSelect('subject.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('subject.id');

    if (filters.category && filters.category !== 'all') {
      subjectQuery = subjectQuery.andWhere('category.slug = :category', {
        category: filters.category,
      });
    }

    if (filters.level && filters.level !== 'all') {
      subjectQuery = subjectQuery.andWhere('riddle.level = :level', { level: filters.level });
    }

    const subjectResults = await subjectQuery.getRawMany();
    subjectResults.forEach(
      (r: { subjectId: string | null; categoryId: string | null; count: string }) => {
        if (r.subjectId) {
          subjectCountMap.set(r.subjectId, parseInt(r.count, 10));
        }
      }
    );

    return Array.from(subjectCountMap.entries()).map(([id, count]) => {
      const subject = allSubjects.find((s) => s.id === id);
      return {
        id,
        name: subject?.name || '',
        emoji: subject?.emoji || '🧩',
        categoryId: subject?.categoryId || null,
        count,
      };
    });
  }
}
