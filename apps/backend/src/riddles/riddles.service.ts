import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiddleCategory } from './entities/riddle-category.entity';
import { Riddle } from './entities/riddle.entity';
import {
  CreateRiddleDto,
  CreateRiddleCategoryDto,
  UpdateRiddleCategoryDto,
  PaginationDto,
  SearchRiddlesDto,
} from '../common/dto/base.dto';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class RiddlesService {
  constructor(
    @InjectRepository(Riddle)
    private riddleRepo: Repository<Riddle>,
    @InjectRepository(RiddleCategory)
    private categoryRepo: Repository<RiddleCategory>,
    private cacheService: CacheService,
  ) {}

  // ==================== RIDDLES ====================

  async findAllRiddles(pagination: PaginationDto): Promise<{ data: Riddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.riddleRepo.findAndCount({
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { data, total };
  }

  async findRandomRiddle(): Promise<Riddle> {
    const riddle = await this.riddleRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.category', 'category')
      .orderBy('RANDOM()')
      .getOne();
    if (riddle === null) {
      throw new NotFoundException('No riddles found');
    }
    return riddle;
  }

  async findRiddlesByCategory(
    categoryId: string,
    pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.riddleRepo.findAndCount({
      where: { category: { id: categoryId } },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findRiddlesByDifficulty(
    difficulty: string,
    pagination: PaginationDto,
  ): Promise<{ data: Riddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.riddleRepo.findAndCount({
      where: { difficulty },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async searchRiddles(searchDto: SearchRiddlesDto): Promise<{ data: Riddle[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? 10;

    const queryBuilder = this.riddleRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.category', 'category');

    if (searchDto.search !== undefined && searchDto.search.length > 0) {
      queryBuilder.where('(riddle.question ILIKE :search OR riddle.answer ILIKE :search)', {
        search: `%${searchDto.search}%`,
      });
    }

    if (searchDto.categoryId !== undefined && searchDto.categoryId.length > 0) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId: searchDto.categoryId });
    }

    if (searchDto.difficulty !== undefined && searchDto.difficulty.length > 0) {
      queryBuilder.andWhere('riddle.difficulty = :difficulty', { difficulty: searchDto.difficulty });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('riddle.id', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async createRiddle(dto: CreateRiddleDto): Promise<Riddle> {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    const riddle = this.riddleRepo.create({
      question: dto.question,
      answer: dto.answer,
      difficulty: dto.difficulty,
      category,
    });
    const saved = await this.riddleRepo.save(riddle);
    await this.cacheService.delPattern('riddles:*');
    return saved;
  }

  async createRiddlesBulk(dto: CreateRiddleDto[]): Promise<number> {
    const riddles: Riddle[] = [];
    for (const r of dto) {
      const category = await this.categoryRepo.findOne({ where: { id: r.categoryId } });
      if (category !== null) {
        const riddle = this.riddleRepo.create({
          question: r.question,
          answer: r.answer,
          difficulty: r.difficulty,
          category,
        });
        riddles.push(riddle);
      }
    }
    const saved = await this.riddleRepo.save(riddles);
    await this.cacheService.delPattern('riddles:*');
    return saved.length;
  }

  async updateRiddle(id: string, dto: Partial<CreateRiddleDto>): Promise<Riddle> {
    const riddle = await this.riddleRepo.findOne({ where: { id }, relations: ['category'] });
    if (riddle === null) {
      throw new NotFoundException('Riddle not found');
    }
    if (dto.question !== undefined && dto.question.length > 0) {
      riddle.question = dto.question;
    }
    if (dto.answer !== undefined && dto.answer.length > 0) {
      riddle.answer = dto.answer;
    }
    if (dto.difficulty !== undefined && dto.difficulty.length > 0) {
      riddle.difficulty = dto.difficulty;
    }
    if (dto.categoryId !== undefined && dto.categoryId.length > 0) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (category === null) {
        throw new NotFoundException('Category not found');
      }
      riddle.category = category;
    }
    const saved = await this.riddleRepo.save(riddle);
    await this.cacheService.delPattern('riddles:*');
    return saved;
  }

  async deleteRiddle(id: string): Promise<void> {
    const result = await this.riddleRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Riddle not found');
    }
    await this.cacheService.delPattern('riddles:*');
  }

  // ==================== CATEGORIES ====================

  async findAllCategories(): Promise<RiddleCategory[]> {
    return this.cacheService.getOrSet(
      'riddles:categories',
      async () => {
        return this.categoryRepo.find({
          order: { name: 'ASC' },
          relations: ['riddles'],
        });
      },
      3600,
    );
  }

  async findCategoryById(id: string): Promise<RiddleCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['riddles'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async createCategory(dto: CreateRiddleCategoryDto): Promise<RiddleCategory> {
    const category = this.categoryRepo.create({
      name: dto.name,
      emoji: dto.emoji ?? '🧩',
    });
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('riddles:categories');
    return saved;
  }

  async updateCategory(id: string, dto: UpdateRiddleCategoryDto): Promise<RiddleCategory> {
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
    await this.cacheService.del('riddles:categories');
    return saved;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['riddles'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }

    // Delete all riddles in this category first
    if (category.riddles !== undefined && category.riddles !== null && category.riddles.length > 0) {
      await this.riddleRepo.remove(category.riddles);
    }

    await this.categoryRepo.remove(category);
    await this.cacheService.del('riddles:categories');
  }

  // ==================== STATS ====================

  async getStats(): Promise<{
    totalRiddles: number;
    totalCategories: number;
    riddlesByCategory: Record<string, number>;
    riddlesByDifficulty: Record<string, number>;
  }> {
    const totalRiddles = await this.riddleRepo.count();
    const totalCategories = await this.categoryRepo.count();

    const categories = await this.categoryRepo.find({ relations: ['riddles'] });
    const riddlesByCategory: Record<string, number> = {};

    for (const cat of categories) {
      riddlesByCategory[cat.name] = cat.riddles?.length ?? 0;
    }

    const riddlesByDifficulty: Record<string, number> = {
      easy: await this.riddleRepo.count({ where: { difficulty: 'easy' } }),
      medium: await this.riddleRepo.count({ where: { difficulty: 'medium' } }),
      hard: await this.riddleRepo.count({ where: { difficulty: 'hard' } }),
    };

    return { totalRiddles, totalCategories, riddlesByCategory, riddlesByDifficulty };
  }
}
