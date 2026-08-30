import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, In } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { invalidateCacheFamilies } from '../common/content/content-cache.util';
import { DEFAULT_CACHE_TTL_S } from '../common/constants/app.constants';
import {
  CreateDadJokeDto,
  CreateJokeCategoryDto,
  UpdateJokeCategoryDto,
  PaginationDto,
  SearchJokesDto,
} from '../common/dto/base.dto';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { ContentStatus } from '../common/enums/content-status.enum';
import {
  BulkActionResult,
  StatusCountResponse,
} from '../common/interfaces/bulk-action-result.interface';
import { BulkActionService } from '../common/services/bulk-action.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { settings } from '../config/settings';

import { computeDadJokeStats, DadJokesStats } from './dad-jokes-stats.util';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';

@Injectable()
export class DadJokesService {
  private readonly logger = new Logger(DadJokesService.name);

  constructor(
    @InjectRepository(DadJoke)
    private jokeRepo: Repository<DadJoke>,
    @InjectRepository(JokeCategory)
    private categoryRepo: Repository<JokeCategory>,
    private cacheService: CacheService,
    private dataSource: DataSource,
    private bulkActionService: BulkActionService,
    private analyticsService: AnalyticsService
  ) {}

  // ==================== CLASSIC JOKES ====================

  /** Public list — always PUBLISHED only (admins use admin endpoints for all statuses). */
  async findAllJokes(pagination: PaginationDto): Promise<{ data: DadJoke[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? settings.global.pagination.defaultLimit;

    const where: FindOptionsWhere<DadJoke> = {
      status: ContentStatus.PUBLISHED,
    };

    const [data, total] = await this.jokeRepo.findAndCount({
      where,
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { data, total };
  }

  /** Admin list — all statuses, no filter. */
  async findAllJokesAll(pagination: PaginationDto): Promise<{ data: DadJoke[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? settings.global.pagination.defaultLimit;

    const [data, total] = await this.jokeRepo.findAndCount({
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { data, total };
  }

  async findRandomJoke(): Promise<DadJoke> {
    // More efficient random selection using offset with count
    const count = await this.jokeRepo.count({
      where: { status: ContentStatus.PUBLISHED },
    });

    if (count === 0) {
      throw new NotFoundException('No jokes found');
    }

    const randomOffset = Math.floor(Math.random() * count);
    const joke = await this.jokeRepo
      .createQueryBuilder('joke')
      .leftJoinAndSelect('joke.category', 'category')
      .where('joke.status = :status', { status: ContentStatus.PUBLISHED })
      .skip(randomOffset)
      .take(1)
      .getOne();

    if (joke === null) {
      throw new NotFoundException('No jokes found');
    }
    return joke;
  }

  async findJokesByCategory(
    categoryId: string,
    pagination: PaginationDto
  ): Promise<{ data: DadJoke[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? settings.global.pagination.defaultLimit;
    const [data, total] = await this.jokeRepo.findAndCount({
      where: { category: { id: categoryId }, status: ContentStatus.PUBLISHED },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { data, total };
  }

  async searchJokes(searchDto: SearchJokesDto): Promise<{ data: DadJoke[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? settings.global.pagination.defaultLimit;

    const queryBuilder = this.jokeRepo
      .createQueryBuilder('joke')
      .leftJoinAndSelect('joke.category', 'category')
      .where('joke.status = :status', { status: ContentStatus.PUBLISHED });

    if (searchDto.search !== undefined && searchDto.search.length > 0) {
      // SECURITY: Use andWhere to preserve status filter
      // Input sanitization: search term is parameterized by TypeORM
      const sanitizedSearch = searchDto.search.replace(/[%_]/g, '\\$&');
      queryBuilder.andWhere('joke.joke ILIKE :search', { search: `%${sanitizedSearch}%` });
    }

    if (searchDto.categoryId !== undefined && searchDto.categoryId.length > 0) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId: searchDto.categoryId });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('joke.id', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async createJoke(dto: CreateDadJokeDto): Promise<DadJoke> {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    const joke = this.jokeRepo.create({ joke: dto.joke, category, status: ContentStatus.DRAFT });
    const saved = await this.jokeRepo.save(joke);
    await invalidateCacheFamilies(this.cacheService, ['jokes:categories:hasContent']);
    return saved;
  }

  async createJokesBulk(dto: CreateDadJokeDto[]): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];

    // Validate input
    if (!dto || dto.length === 0) {
      throw new BadRequestException('No jokes provided for bulk creation');
    }

    // Limit batch size
    const MAX_BULK_SIZE = 100;
    if (dto.length > MAX_BULK_SIZE) {
      throw new BadRequestException(`Batch size exceeds maximum of ${MAX_BULK_SIZE} jokes`);
    }

    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Get all unique non-null category IDs for batch fetch — fixes N+1
      // and prevents In([null]) crash from rows missing categoryId.
      const categoryIds = [
        ...new Set(
          dto.map((j) => j.categoryId).filter((id): id is string => id != null && id.length > 0)
        ),
      ];
      const categories = await transactionalEntityManager.find(JokeCategory, {
        where: { id: In(categoryIds) },
      });

      // Create a map for quick lookup
      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      const jokes: DadJoke[] = [];
      for (let i = 0; i < dto.length; i++) {
        const j = dto[i];
        const category = categoryMap.get(j.categoryId);

        if (!category) {
          errors.push(`Row ${i + 1}: Category not found (ID: ${j.categoryId})`);
          continue;
        }

        const joke = transactionalEntityManager.create(DadJoke, {
          joke: j.joke,
          category,
          status: ContentStatus.DRAFT,
        });
        jokes.push(joke);
      }

      if (jokes.length === 0) {
        throw new BadRequestException(`No valid jokes to create. Errors: ${errors.join('; ')}`);
      }

      const saved = await transactionalEntityManager.save(jokes);

      // Only invalidate cache if transaction succeeds
      await invalidateCacheFamilies(this.cacheService, ['jokes:categories:hasContent']);

      return { count: saved.length, errors };
    });
  }

  async updateJoke(id: string, dto: Partial<CreateDadJokeDto>): Promise<DadJoke> {
    const joke = await this.jokeRepo.findOne({ where: { id }, relations: ['category'] });
    if (joke === null) {
      throw new NotFoundException('Joke not found');
    }
    if (dto.joke !== undefined && dto.joke.length > 0) {
      joke.joke = dto.joke;
    }
    if (dto.categoryId !== undefined && dto.categoryId.length > 0) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (category === null) {
        throw new NotFoundException('Category not found');
      }
      joke.category = category;
    }
    const saved = await this.jokeRepo.save(joke);
    await invalidateCacheFamilies(this.cacheService, ['jokes:categories:hasContent']);
    return saved;
  }

  async updateJokeStatus(id: string, status: ContentStatus): Promise<DadJoke> {
    const joke = await this.jokeRepo.findOne({ where: { id } });
    if (joke === null) {
      throw new NotFoundException('Joke not found');
    }
    joke.status = status;
    const saved = await this.jokeRepo.save(joke);
    await invalidateCacheFamilies(this.cacheService, ['jokes:categories:hasContent']);
    return saved;
  }

  async deleteJoke(id: string): Promise<void> {
    const result = await this.jokeRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Joke not found');
    }
    await invalidateCacheFamilies(this.cacheService, ['jokes:categories:hasContent']);
  }

  async voteForJoke(id: string, type: 'like' | 'dislike', remove = false): Promise<DadJoke> {
    const joke = await this.jokeRepo.findOne({ where: { id } });
    if (!joke) {
      throw new NotFoundException('Joke not found');
    }

    const delta = remove ? -1 : 1;
    if (type === 'like') {
      joke.likes = Math.max(0, (joke.likes || 0) + delta);
    } else if (type === 'dislike') {
      joke.dislikes = Math.max(0, (joke.dislikes || 0) + delta);
    } else {
      throw new BadRequestException('Invalid vote type. Must be "like" or "dislike".');
    }

    const saved = await this.jokeRepo.save(joke);

    // Track B: votes change only like/dislike counters — no cached resource
    // (taxonomy lists, membership counts) depends on them, so no invalidation.

    // Analytics plan §5.2: persist the vote as an event (columns stay the
    // public counters; the event adds actor/time context for dashboards).
    void this.analyticsService.record({
      eventName: 'joke_voted',
      module: 'jokes',
      properties: { jokeId: id, voteType: type, remove },
    });

    return saved;
  }

  // ==================== CLASSIC CATEGORIES ====================

  async findAllCategories(hasContentOnly: boolean = false): Promise<JokeCategory[]> {
    return this.cacheService.getOrSet(
      `jokes:categories:hasContent:${hasContentOnly}`,
      async () => {
        const query = this.categoryRepo
          .createQueryBuilder('category')
          .orderBy('category.name', 'ASC');

        if (hasContentOnly) {
          query.innerJoin('category.jokes', 'joke');
        }

        return query.getMany();
      },
      DEFAULT_CACHE_TTL_S
    );
  }

  async findCategoryById(id: string): Promise<JokeCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['jokes'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async createCategory(dto: CreateJokeCategoryDto): Promise<JokeCategory> {
    const category = this.categoryRepo.create({
      name: dto.name,
      emoji: dto.emoji ?? settings.dadJokes.defaults.categoryEmoji,
    });
    const saved = await this.categoryRepo.save(category);
    // Track B: clear both hasContent variants so stale category list is avoided.
    await invalidateCacheFamilies(this.cacheService, [
      'jokes:categories:hasContent:true',
      'jokes:categories:hasContent:false',
    ]);
    return saved;
  }

  async updateCategory(id: string, dto: UpdateJokeCategoryDto): Promise<JokeCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    if (dto.name !== undefined && dto.name.length > 0) {
      category.name = dto.name;
    }
    if (dto.emoji !== undefined) {
      category.emoji = dto.emoji;
    }
    const saved = await this.categoryRepo.save(category);
    await invalidateCacheFamilies(this.cacheService, [
      'jokes:categories:hasContent:true',
      'jokes:categories:hasContent:false',
    ]);
    return saved;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['jokes'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }

    if (category.jokes !== undefined && category.jokes !== null && category.jokes.length > 0) {
      await this.jokeRepo.remove(category.jokes);
    }

    await this.categoryRepo.remove(category);
    await invalidateCacheFamilies(this.cacheService, [
      'jokes:categories:hasContent:true',
      'jokes:categories:hasContent:false',
    ]);
  }

  // ==================== BULK ACTIONS ====================

  async bulkActionClassic(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(`[DadJokesService] Executing bulk ${action} on ${ids.length} classic jokes`);
    const result = await this.bulkActionService.executeBulkAction(
      this.jokeRepo,
      'joke',
      ids,
      action
    );
    if (result.succeeded > 0) {
      await invalidateCacheFamilies(this.cacheService, ['jokes:categories:hasContent']);
      this.logger.log(`[DadJokesService] Cache invalidated after bulk ${action}`);
    }
    return result;
  }

  async getStatusCounts(): Promise<StatusCountResponse> {
    return this.bulkActionService.getStatusCounts(this.jokeRepo);
  }

  // ==================== STATS ====================

  async getStats(): Promise<DadJokesStats> {
    return computeDadJokeStats(this.jokeRepo, this.categoryRepo);
  }
}
