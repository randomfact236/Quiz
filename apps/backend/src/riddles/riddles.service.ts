import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Riddle } from './entities/riddle.entity';
import { RiddleCategory } from './entities/riddle-category.entity';
import { CreateRiddleDto, PaginationDto } from '../common/dto/base.dto';
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
    if (!riddle) throw new NotFoundException('No riddles found');
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

  async createRiddle(dto: CreateRiddleDto): Promise<Riddle> {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    const riddle = this.riddleRepo.create({
      question: dto.question,
      answer: dto.answer,
      difficulty: dto.difficulty,
      category,
    });
    return this.riddleRepo.save(riddle);
  }

  async createRiddlesBulk(dto: CreateRiddleDto[]): Promise<number> {
    const riddles: Riddle[] = [];
    for (const r of dto) {
      const category = await this.categoryRepo.findOne({ where: { id: r.categoryId } });
      if (category) {
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
    const riddle = await this.riddleRepo.findOne({ where: { id } });
    if (!riddle) throw new NotFoundException('Riddle not found');
    if (dto.question) riddle.question = dto.question;
    if (dto.answer) riddle.answer = dto.answer;
    if (dto.difficulty) riddle.difficulty = dto.difficulty;
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
      riddle.category = category;
    }
    return this.riddleRepo.save(riddle);
  }

  async deleteRiddle(id: string): Promise<void> {
    const result = await this.riddleRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Riddle not found');
  }

  // ==================== CATEGORIES ====================

  async findAllCategories(): Promise<RiddleCategory[]> {
    return this.cacheService.getOrSet('riddles:categories', async () => {
      return this.categoryRepo.find({ order: { name: 'ASC' } });
    }, 3600);
  }

  async createCategory(name: string): Promise<RiddleCategory> {
    const category = this.categoryRepo.create({ name });
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('riddles:categories');
    return saved;
  }

  async updateCategory(id: string, name: string): Promise<RiddleCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    category.name = name;
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('riddles:categories');
    return saved;
  }

  async deleteCategory(id: string): Promise<void> {
    const result = await this.categoryRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Category not found');
    await this.cacheService.del('riddles:categories');
  }
}
