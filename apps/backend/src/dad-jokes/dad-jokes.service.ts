import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import { CreateDadJokeDto, PaginationDto } from '../common/dto/base.dto';
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
    if (!joke) throw new NotFoundException('No jokes found');
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

  async createJoke(dto: CreateDadJokeDto): Promise<DadJoke> {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    const joke = this.jokeRepo.create({ joke: dto.joke, category });
    return this.jokeRepo.save(joke);
  }

  async createJokesBulk(dto: CreateDadJokeDto[]): Promise<number> {
    const jokes: DadJoke[] = [];
    for (const j of dto) {
      const category = await this.categoryRepo.findOne({ where: { id: j.categoryId } });
      if (category) {
        const joke = this.jokeRepo.create({ joke: j.joke, category });
        jokes.push(joke);
      }
    }
    const saved = await this.jokeRepo.save(jokes);
    await this.cacheService.delPattern('jokes:*');
    return saved.length;
  }

  async updateJoke(id: string, dto: Partial<CreateDadJokeDto>): Promise<DadJoke> {
    const joke = await this.jokeRepo.findOne({ where: { id } });
    if (!joke) throw new NotFoundException('Joke not found');
    if (dto.joke) joke.joke = dto.joke;
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
      joke.category = category;
    }
    return this.jokeRepo.save(joke);
  }

  async deleteJoke(id: string): Promise<void> {
    const result = await this.jokeRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Joke not found');
  }

  // ==================== CATEGORIES ====================

  async findAllCategories(): Promise<JokeCategory[]> {
    return this.cacheService.getOrSet('jokes:categories', async () => {
      return this.categoryRepo.find({ order: { name: 'ASC' } });
    }, 3600);
  }

  async createCategory(name: string): Promise<JokeCategory> {
    const category = this.categoryRepo.create({ name });
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('jokes:categories');
    return saved;
  }

  async updateCategory(id: string, name: string): Promise<JokeCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    category.name = name;
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('jokes:categories');
    return saved;
  }

  async deleteCategory(id: string): Promise<void> {
    const result = await this.categoryRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Category not found');
    await this.cacheService.del('jokes:categories');
  }
}
