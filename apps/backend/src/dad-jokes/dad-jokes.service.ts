import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import {
  CreateDadJokeDto,
  CreateJokeCategoryDto,
  UpdateJokeCategoryDto,
  PaginationDto,
  SearchJokesDto,
} from '../common/dto/base.dto';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class DadJokesService {
  constructor(
    @InjectRepository(DadJoke)
    private jokeRepo: Repository<DadJoke>,
    @InjectRepository(JokeCategory)
    private categoryRepo: Repository<JokeCategory>,
    private cacheService: CacheService,
  ) {}

  // ==================== JOKES ====================

  async findAllJokes(pagination: PaginationDto): Promise<{ data: DadJoke[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.jokeRepo.findAndCount({
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { data, total };
  }

  async findRandomJoke(): Promise<DadJoke> {
    const joke = await this.jokeRepo
      .createQueryBuilder('joke')
      .leftJoinAndSelect('joke.category', 'category')
      .orderBy('RANDOM()')
      .getOne();
    if (joke === null) {
      throw new NotFoundException('No jokes found');
    }
    return joke;
  }

  async findJokesByCategory(
    categoryId: string,
    pagination: PaginationDto,
  ): Promise<{ data: DadJoke[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.jokeRepo.findAndCount({
      where: { category: { id: categoryId } },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async searchJokes(searchDto: SearchJokesDto): Promise<{ data: DadJoke[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? 10;

    const queryBuilder = this.jokeRepo
      .createQueryBuilder('joke')
      .leftJoinAndSelect('joke.category', 'category');

    if (searchDto.search !== undefined && searchDto.search.length > 0) {
      queryBuilder.where('joke.joke ILIKE :search', { search: `%${searchDto.search}%` });
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
    const joke = this.jokeRepo.create({ joke: dto.joke, category });
    const saved = await this.jokeRepo.save(joke);
    await this.cacheService.delPattern('jokes:*');
    return saved;
  }

  async createJokesBulk(dto: CreateDadJokeDto[]): Promise<number> {
    const jokes: DadJoke[] = [];
    for (const j of dto) {
      const category = await this.categoryRepo.findOne({ where: { id: j.categoryId } });
      if (category !== null) {
        const joke = this.jokeRepo.create({ joke: j.joke, category });
        jokes.push(joke);
      }
    }
    const saved = await this.jokeRepo.save(jokes);
    await this.cacheService.delPattern('jokes:*');
    return saved.length;
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
    await this.cacheService.delPattern('jokes:*');
    return saved;
  }

  async deleteJoke(id: string): Promise<void> {
    const result = await this.jokeRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Joke not found');
    }
    await this.cacheService.delPattern('jokes:*');
  }

  // ==================== CATEGORIES ====================

  async findAllCategories(): Promise<JokeCategory[]> {
    return this.cacheService.getOrSet(
      'jokes:categories',
      async () => {
        return this.categoryRepo.find({
          order: { name: 'ASC' },
          relations: ['jokes'],
        });
      },
      3600,
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
      emoji: dto.emoji ?? '😂',
    });
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('jokes:categories');
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
    await this.cacheService.del('jokes:categories');
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

    // Delete all jokes in this category first
    if (category.jokes !== undefined && category.jokes !== null && category.jokes.length > 0) {
      await this.jokeRepo.remove(category.jokes);
    }

    await this.categoryRepo.remove(category);
    await this.cacheService.del('jokes:categories');
  }

  // ==================== STATS ====================

  async getStats(): Promise<{
    totalJokes: number;
    totalCategories: number;
    jokesByCategory: Record<string, number>;
  }> {
    const totalJokes = await this.jokeRepo.count();
    const totalCategories = await this.categoryRepo.count();

    const categories = await this.categoryRepo.find({ relations: ['jokes'] });
    const jokesByCategory: Record<string, number> = {};

    for (const cat of categories) {
      jokesByCategory[cat.name] = cat.jokes?.length ?? 0;
    }

    return { totalJokes, totalCategories, jokesByCategory };
  }
}
