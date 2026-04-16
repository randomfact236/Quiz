import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';

import { RiddleMcqCategory } from '../entities/riddle-category.entity';
import { RiddleMcq } from '../entities/riddle-mcq.entity';
import { RiddleMcqSubject } from '../entities/riddle-subject.entity';

@Injectable()
export class RiddleMcqCategoryService {
  private readonly CACHE_KEYS = {
    CATEGORIES: (active: boolean) => `riddle-mcq:categories:${active ? 'active' : 'all'}`,
  };

  private readonly CACHE_TTL = {
    CATEGORIES: 600,
  };

  constructor(
    @InjectRepository(RiddleMcqCategory)
    private categoryRepo: Repository<RiddleMcqCategory>,
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    @InjectRepository(RiddleMcqSubject)
    private subjectRepo: Repository<RiddleMcqSubject>,
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

  async findAllCategories(includeInactive: boolean = false): Promise<RiddleMcqCategory[]> {
    const cacheKey = this.CACHE_KEYS.CATEGORIES(includeInactive);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = this.categoryRepo
          .createQueryBuilder('category')
          .orderBy('category.name', 'ASC');

        if (!includeInactive) {
          query.where('category.isActive = :isActive', { isActive: true });
        }

        return query.getMany();
      },
      this.CACHE_TTL.CATEGORIES
    );
  }

  async findCategoryById(id: string): Promise<RiddleMcqCategory> {
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
    isActive?: boolean;
  }): Promise<RiddleMcqCategory> {
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
      isActive?: boolean;
    }
  ): Promise<RiddleMcqCategory> {
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
        await queryRunner.manager.delete(RiddleMcqSubject, { categoryId: id });
      }

      await queryRunner.manager.delete(RiddleMcqCategory, { id });
      await queryRunner.commitTransaction();
      await this.clearRiddleCaches();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getCategoryCounts(): Promise<{ id: string; name: string; emoji: string; count: number }[]> {
    const allCategories = await this.categoryRepo.find();

    const categoryCountMap = new Map<string, number>();
    allCategories.forEach((c) => categoryCountMap.set(c.id, 0));

    const categoryResults = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .leftJoin('riddle.subject', 'subject')
      .leftJoin('subject.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('COUNT(DISTINCT riddle.id)', 'count')
      .where('category.id IS NOT NULL')
      .groupBy('category.id')
      .getRawMany();

    categoryResults.forEach((r: { categoryId: string; count: string }) => {
      if (r.categoryId) {
        categoryCountMap.set(r.categoryId, parseInt(r.count, 10));
      }
    });

    return Array.from(categoryCountMap.entries()).map(([id, count]) => {
      const category = allCategories.find((c) => c.id === id);
      return {
        id,
        name: category?.name || '',
        emoji: category?.emoji || '📚',
        count,
      };
    });
  }
}
