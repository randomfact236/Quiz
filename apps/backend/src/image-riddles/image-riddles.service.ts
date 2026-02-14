import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageRiddle } from './entities/image-riddle.entity';
import { ImageRiddleCategory } from './entities/image-riddle-category.entity';
import {
  CreateImageRiddleDto,
  UpdateImageRiddleDto,
  CreateImageRiddleCategoryDto,
  UpdateImageRiddleCategoryDto,
  PaginationDto,
  SearchImageRiddlesDto,
} from '../common/dto/base.dto';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class ImageRiddlesService {
  constructor(
    @InjectRepository(ImageRiddle)
    private imageRiddleRepo: Repository<ImageRiddle>,
    @InjectRepository(ImageRiddleCategory)
    private categoryRepo: Repository<ImageRiddleCategory>,
    private cacheService: CacheService,
  ) {}

  // ==================== CATEGORIES ====================

  async findAllCategories(): Promise<ImageRiddleCategory[]> {
    return this.cacheService.getOrSet(
      'image-riddles:categories',
      async () => {
        return this.categoryRepo.find({
          order: { name: 'ASC' },
          relations: ['riddles'],
        });
      },
      3600,
    );
  }

  async findCategoryById(id: string): Promise<ImageRiddleCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['riddles'],
    });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async createCategory(dto: CreateImageRiddleCategoryDto): Promise<ImageRiddleCategory> {
    const category = this.categoryRepo.create({
      name: dto.name,
      emoji: dto.emoji ?? '🖼️',
      description: dto.description,
    });
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('image-riddles:categories');
    return saved;
  }

  async updateCategory(id: string, dto: UpdateImageRiddleCategoryDto): Promise<ImageRiddleCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (category === null) {
      throw new NotFoundException('Category not found');
    }
    if (dto.name !== undefined) {
      category.name = dto.name;
    }
    if (dto.emoji !== undefined) {
      category.emoji = dto.emoji;
    }
    if (dto.description !== undefined) {
      category.description = dto.description;
    }
    const saved = await this.categoryRepo.save(category);
    await this.cacheService.del('image-riddles:categories');
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

    if (category.riddles !== undefined && category.riddles !== null && category.riddles.length > 0) {
      await this.imageRiddleRepo.remove(category.riddles);
    }

    await this.categoryRepo.remove(category);
    await this.cacheService.del('image-riddles:categories');
  }

  // ==================== IMAGE RIDDLES ====================

  async findAllRiddles(pagination: PaginationDto): Promise<{ data: ImageRiddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.imageRiddleRepo.findAndCount({
      where: { isActive: true },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findRiddleById(id: string): Promise<ImageRiddle> {
    const riddle = await this.imageRiddleRepo.findOne({
      where: { id, isActive: true },
      relations: ['category'],
    });
    if (riddle === null) {
      throw new NotFoundException('Image riddle not found');
    }
    return riddle;
  }

  async findRandomRiddle(): Promise<ImageRiddle> {
    const riddle = await this.imageRiddleRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.category', 'category')
      .where('riddle.isActive = :isActive', { isActive: true })
      .orderBy('RANDOM()')
      .getOne();
    if (riddle === null) {
      throw new NotFoundException('No image riddles found');
    }
    return riddle;
  }

  async findRiddlesByCategory(
    categoryId: string,
    pagination: PaginationDto,
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.imageRiddleRepo.findAndCount({
      where: { category: { id: categoryId }, isActive: true },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findRiddlesByDifficulty(
    difficulty: string,
    pagination: PaginationDto,
  ): Promise<{ data: ImageRiddle[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.imageRiddleRepo.findAndCount({
      where: { difficulty, isActive: true },
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async searchRiddles(searchDto: SearchImageRiddlesDto): Promise<{ data: ImageRiddle[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? 10;

    const queryBuilder = this.imageRiddleRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.category', 'category')
      .where('riddle.isActive = :isActive', { isActive: true });

    if (searchDto.search !== undefined && searchDto.search.length > 0) {
      queryBuilder.andWhere('(riddle.title ILIKE :search OR riddle.answer ILIKE :search)', {
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
      .orderBy('riddle.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async createRiddle(dto: CreateImageRiddleDto): Promise<ImageRiddle> {
    let category: ImageRiddleCategory | undefined;
    
    if (dto.categoryId !== undefined && dto.categoryId.length > 0) {
      const foundCategory = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (foundCategory === null) {
        throw new NotFoundException('Category not found');
      }
      category = foundCategory;
    }

    const riddle = this.imageRiddleRepo.create({
      title: dto.title,
      imageUrl: dto.imageUrl,
      answer: dto.answer,
      hint: dto.hint,
      difficulty: dto.difficulty,
      timerSeconds: dto.timerSeconds ?? null,
      showTimer: dto.showTimer ?? true,
      altText: dto.altText,
      category,
      isActive: true,
    });
    const saved = await this.imageRiddleRepo.save(riddle);
    await this.cacheService.delPattern('image-riddles:*');
    return saved;
  }

  async createRiddlesBulk(dto: CreateImageRiddleDto[]): Promise<number> {
    const riddles: ImageRiddle[] = [];
    for (const r of dto) {
      let category: ImageRiddleCategory | undefined;
      
      if (r.categoryId !== undefined && r.categoryId.length > 0) {
        const foundCategory = await this.categoryRepo.findOne({ where: { id: r.categoryId } });
        if (foundCategory !== null) {
          category = foundCategory;
        }
      }

      const riddle = this.imageRiddleRepo.create({
        title: r.title,
        imageUrl: r.imageUrl,
        answer: r.answer,
        hint: r.hint,
        difficulty: r.difficulty,
        timerSeconds: r.timerSeconds ?? null,
        showTimer: r.showTimer ?? true,
        altText: r.altText,
        category,
        isActive: true,
      });
      riddles.push(riddle);
    }
    const saved = await this.imageRiddleRepo.save(riddles);
    await this.cacheService.delPattern('image-riddles:*');
    return saved.length;
  }

  async updateRiddle(id: string, dto: UpdateImageRiddleDto): Promise<ImageRiddle> {
    const riddle = await this.imageRiddleRepo.findOne({ where: { id }, relations: ['category'] });
    if (riddle === null) {
      throw new NotFoundException('Image riddle not found');
    }

    if (dto.title !== undefined) {
      riddle.title = dto.title;
    }
    if (dto.imageUrl !== undefined) {
      riddle.imageUrl = dto.imageUrl;
    }
    if (dto.answer !== undefined) {
      riddle.answer = dto.answer;
    }
    if (dto.hint !== undefined) {
      riddle.hint = dto.hint;
    }
    if (dto.difficulty !== undefined) {
      riddle.difficulty = dto.difficulty;
    }
    if (dto.timerSeconds !== undefined) {
      riddle.timerSeconds = dto.timerSeconds;
    }
    if (dto.showTimer !== undefined) {
      riddle.showTimer = dto.showTimer;
    }
    if (dto.altText !== undefined) {
      riddle.altText = dto.altText;
    }
    if (dto.isActive !== undefined) {
      riddle.isActive = dto.isActive;
    }
    if (dto.categoryId !== undefined) {
      if (dto.categoryId.length > 0) {
        const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
        if (category === null) {
          throw new NotFoundException('Category not found');
        }
        riddle.category = category;
      } else {
        riddle.category = undefined as any;
        riddle.categoryId = undefined as any;
      }
    }

    const saved = await this.imageRiddleRepo.save(riddle);
    await this.cacheService.delPattern('image-riddles:*');
    return saved;
  }

  async deleteRiddle(id: string): Promise<void> {
    const result = await this.imageRiddleRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Image riddle not found');
    }
    await this.cacheService.delPattern('image-riddles:*');
  }

  // ==================== STATS ====================

  async getStats(): Promise<{
    totalRiddles: number;
    totalCategories: number;
    riddlesByDifficulty: Record<string, number>;
    averageTimer: number;
  }> {
    const [totalRiddles, totalCategories] = await Promise.all([
      this.imageRiddleRepo.count({ where: { isActive: true } }),
      this.categoryRepo.count(),
    ]);

    const riddlesByDifficulty: Record<string, number> = {
      easy: await this.imageRiddleRepo.count({ where: { difficulty: 'easy', isActive: true } }),
      medium: await this.imageRiddleRepo.count({ where: { difficulty: 'medium', isActive: true } }),
      hard: await this.imageRiddleRepo.count({ where: { difficulty: 'hard', isActive: true } }),
      expert: await this.imageRiddleRepo.count({ where: { difficulty: 'expert', isActive: true } }),
    };

    // Calculate average timer using effective timer values
    const riddles = await this.imageRiddleRepo.find({
      where: { isActive: true },
      select: ['timerSeconds', 'difficulty'],
    });
    
    const totalTimer = riddles.reduce((sum, r) => {
      const timer = r.timerSeconds ?? this.getDefaultTimerForDifficulty(r.difficulty);
      return sum + timer;
    }, 0);
    const averageTimer = riddles.length > 0 ? Math.round(totalTimer / riddles.length) : 0;

    return {
      totalRiddles,
      totalCategories,
      riddlesByDifficulty,
      averageTimer,
    };
  }

  private getDefaultTimerForDifficulty(difficulty: string): number {
    // All difficulties use 90s as default auto timer
    return 90;
  }
}
