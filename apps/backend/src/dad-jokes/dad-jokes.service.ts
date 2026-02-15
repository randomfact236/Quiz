import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { DadJoke } from './entities/dad-joke.entity';
import { JokeCategory } from './entities/joke-category.entity';
import { JokeSubject } from './entities/joke-subject.entity';
import { JokeChapter } from './entities/joke-chapter.entity';
import { QuizJoke } from './entities/quiz-joke.entity';
import {
  CreateDadJokeDto,
  CreateJokeCategoryDto,
  UpdateJokeCategoryDto,
  CreateJokeSubjectDto,
  UpdateJokeSubjectDto,
  CreateJokeChapterDto,
  UpdateJokeChapterDto,
  CreateQuizJokeDto,
  UpdateQuizJokeDto,
  PaginationDto,
  SearchJokesDto,
} from '../common/dto/base.dto';
import { CacheService } from '../common/cache/cache.service';
import { settings } from '../config/settings';
import { BulkActionService } from '../common/services/bulk-action.service';
import { BulkActionType } from '../common/enums/bulk-action.enum';
import { BulkActionResult, StatusCountResponse } from '../common/interfaces/bulk-action-result.interface';
import { ContentStatus } from '../common/enums/content-status.enum';
import { DEFAULT_CACHE_TTL_S } from '../common/constants/app.constants';
import { computeDadJokeStats, DadJokesStats } from './dad-jokes-stats.util';

@Injectable()
export class DadJokesService {
  private readonly logger = new Logger(DadJokesService.name);

  constructor(
    @InjectRepository(DadJoke)
    private jokeRepo: Repository<DadJoke>,
    @InjectRepository(JokeCategory)
    private categoryRepo: Repository<JokeCategory>,
    @InjectRepository(JokeSubject)
    private subjectRepo: Repository<JokeSubject>,
    @InjectRepository(JokeChapter)
    private chapterRepo: Repository<JokeChapter>,
    @InjectRepository(QuizJoke)
    private quizJokeRepo: Repository<QuizJoke>,
    private cacheService: CacheService,
    private dataSource: DataSource,
    private bulkActionService: BulkActionService,
  ) { }

  // ==================== CLASSIC JOKES ====================

  async findAllJokes(
    pagination: PaginationDto,
    status?: ContentStatus,
  ): Promise<{ data: DadJoke[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? settings.global.pagination.defaultLimit;
    
    const where: FindOptionsWhere<DadJoke> = {};
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.jokeRepo.findAndCount({
      where,
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
      .where('joke.status = :status', { status: ContentStatus.PUBLISHED })
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
    const joke = this.jokeRepo.create({ joke: dto.joke, category, status: ContentStatus.DRAFT });
    const saved = await this.jokeRepo.save(joke);
    await this.cacheService.delPattern('jokes:*');
    return saved;
  }

  async createJokesBulk(dto: CreateDadJokeDto[]): Promise<number> {
    const jokes: DadJoke[] = [];
    for (const j of dto) {
      const category = await this.categoryRepo.findOne({ where: { id: j.categoryId } });
      if (category !== null) {
        const joke = this.jokeRepo.create({ joke: j.joke, category, status: ContentStatus.DRAFT });
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

  async updateJokeStatus(id: string, status: ContentStatus): Promise<DadJoke> {
    const joke = await this.jokeRepo.findOne({ where: { id } });
    if (joke === null) {
      throw new NotFoundException('Joke not found');
    }
    joke.status = status;
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

  // ==================== CLASSIC CATEGORIES ====================

  async findAllCategories(): Promise<JokeCategory[]> {
    return this.cacheService.getOrSet(
      'jokes:categories',
      async () => {
        return this.categoryRepo.find({
          order: { name: 'ASC' },
          relations: ['jokes'],
        });
      },
      DEFAULT_CACHE_TTL_S,
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

    if (category.jokes !== undefined && category.jokes !== null && category.jokes.length > 0) {
      await this.jokeRepo.remove(category.jokes);
    }

    await this.categoryRepo.remove(category);
    await this.cacheService.del('jokes:categories');
  }

  // ==================== QUIZ FORMAT - SUBJECTS ====================

  async findAllSubjects(): Promise<JokeSubject[]> {
    return this.cacheService.getOrSet(
      'jokes:subjects',
      async () => {
        return this.subjectRepo.find({
          where: { isActive: true },
          order: { order: 'ASC', name: 'ASC' },
          relations: ['chapters'],
        });
      },
      DEFAULT_CACHE_TTL_S,
    );
  }

  async findSubjectBySlug(slug: string): Promise<JokeSubject> {
    const subject = await this.subjectRepo.findOne({
      where: { slug },
      relations: ['chapters'],
    });
    if (subject === null) {
      throw new NotFoundException('Subject not found');
    }
    return subject;
  }

  async createSubject(dto: CreateJokeSubjectDto): Promise<JokeSubject> {
    const subject = this.subjectRepo.create({
      ...dto,
      isActive: true,
    });
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.del('jokes:subjects');
    return saved;
  }

  async updateSubject(id: string, dto: UpdateJokeSubjectDto): Promise<JokeSubject> {
    const subject = await this.subjectRepo.findOne({ where: { id } });
    if (subject === null) {
      throw new NotFoundException('Subject not found');
    }
    Object.assign(subject, dto);
    const saved = await this.subjectRepo.save(subject);
    await this.cacheService.del('jokes:subjects');
    return saved;
  }

  async deleteSubject(id: string): Promise<void> {
    const result = await this.subjectRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Subject not found');
    }
    await this.cacheService.del('jokes:subjects');
  }

  // ==================== QUIZ FORMAT - CHAPTERS ====================

  async findChaptersBySubject(subjectId: string): Promise<JokeChapter[]> {
    return this.chapterRepo.find({
      where: { subject: { id: subjectId } },
      order: { chapterNumber: 'ASC' },
      relations: ['subject'],
    });
  }

  async createChapter(dto: CreateJokeChapterDto): Promise<JokeChapter> {
    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (subject === null) {
      throw new NotFoundException('Subject not found');
    }
    const chapter = this.chapterRepo.create({
      name: dto.name,
      chapterNumber: dto.chapterNumber,
      subject,
    });
    return this.chapterRepo.save(chapter);
  }

  async updateChapter(id: string, dto: UpdateJokeChapterDto): Promise<JokeChapter> {
    const chapter = await this.chapterRepo.findOne({ where: { id } });
    if (chapter === null) {
      throw new NotFoundException('Chapter not found');
    }
    if (dto.name !== undefined && dto.name.length > 0) {
      chapter.name = dto.name;
    }
    if (dto.chapterNumber !== undefined) {
      chapter.chapterNumber = dto.chapterNumber;
    }
    return this.chapterRepo.save(chapter);
  }

  async deleteChapter(id: string): Promise<void> {
    const result = await this.chapterRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Chapter not found');
    }
  }

  // ==================== QUIZ FORMAT - JOKES ====================

  async findQuizJokesByChapter(
    chapterId: string,
    pagination: PaginationDto,
  ): Promise<{ data: QuizJoke[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? settings.global.pagination.defaultLimit;
    const [data, total] = await this.quizJokeRepo.findAndCount({
      where: { chapter: { id: chapterId } },
      relations: ['chapter'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return { data, total };
  }

  async findRandomQuizJokes(level: string, count: number): Promise<QuizJoke[]> {
    return this.quizJokeRepo
      .createQueryBuilder('joke')
      .where('joke.level = :level', { level })
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();
  }

  async findMixedQuizJokes(count: number): Promise<QuizJoke[]> {
    return this.quizJokeRepo
      .createQueryBuilder('joke')
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();
  }

  async createQuizJoke(dto: CreateQuizJokeDto): Promise<QuizJoke> {
    const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
    if (chapter === null) {
      throw new NotFoundException('Chapter not found');
    }
    const joke = this.quizJokeRepo.create({
      question: dto.question,
      options: dto.options,
      correctAnswer: dto.correctAnswer,
      level: dto.level,
      explanation: dto.explanation,
      punchline: dto.punchline,
      chapter,
    });
    return this.quizJokeRepo.save(joke);
  }

  async createQuizJokesBulk(dto: CreateQuizJokeDto[]): Promise<number> {
    const jokes: QuizJoke[] = [];
    for (const j of dto) {
      const chapter = await this.chapterRepo.findOne({ where: { id: j.chapterId } });
      if (chapter !== null) {
        const joke = this.quizJokeRepo.create({
          question: j.question,
          options: j.options,
          correctAnswer: j.correctAnswer,
          level: j.level,
          explanation: j.explanation,
          punchline: j.punchline,
          chapter,
        });
        jokes.push(joke);
      }
    }
    const saved = await this.quizJokeRepo.save(jokes);
    return saved.length;
  }

  async updateQuizJoke(id: string, dto: Partial<CreateQuizJokeDto>): Promise<QuizJoke> {
    const joke = await this.quizJokeRepo.findOne({ where: { id } });
    if (joke === null) {
      throw new NotFoundException('Quiz joke not found');
    }
    const stringFields = ['question', 'correctAnswer', 'level', 'explanation', 'punchline'] as const;
    stringFields.forEach(field => {
      const value = dto[field];
      if (value !== undefined && (field === 'explanation' || field === 'punchline' || value.length > 0)) {
        (joke[field] as string | undefined) = value;
      }
    });
    if (dto.options !== undefined) joke.options = dto.options;
    if (dto.chapterId?.length) {
      const chapter = await this.chapterRepo.findOne({ where: { id: dto.chapterId } });
      if (chapter === null) throw new NotFoundException('Chapter not found');
      joke.chapter = chapter;
    }
    return this.quizJokeRepo.save(joke);
  }

  async deleteQuizJoke(id: string): Promise<void> {
    const result = await this.quizJokeRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Quiz joke not found');
    }
  }

  // ==================== BULK ACTIONS ====================

  async bulkActionClassic(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(`[DadJokesService] Executing bulk ${action} on ${ids.length} classic jokes`);
    const result = await this.bulkActionService.executeBulkAction(this.jokeRepo, 'joke', ids, action);
    if (result.succeeded > 0) {
      await this.cacheService.delPattern('jokes:*');
      this.logger.log(`[DadJokesService] Cache invalidated after bulk ${action}`);
    }
    return result;
  }

  async getStatusCounts(): Promise<StatusCountResponse> {
    return this.bulkActionService.getStatusCounts(this.jokeRepo);
  }

  // ==================== STATS ====================

  async getStats(): Promise<DadJokesStats> {
    return computeDadJokeStats(
      this.jokeRepo,
      this.categoryRepo,
      this.quizJokeRepo,
      this.subjectRepo,
      this.chapterRepo,
    );
  }
}
