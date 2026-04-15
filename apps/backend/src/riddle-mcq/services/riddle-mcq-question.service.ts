import { randomUUID } from 'crypto';

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';

import { RiddleMcq, RiddleStatus, RiddleMcqLevel } from '../entities/riddle-mcq.entity';
import { RiddleSubject } from '../entities/riddle-subject.entity';

@Injectable()
export class RiddleMcqQuestionService {
  constructor(
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    @InjectRepository(RiddleSubject)
    private subjectRepo: Repository<RiddleSubject>,
    private cacheService: CacheService
  ) {}

  private async clearRiddleCaches() {
    await this.cacheService.delPattern(`riddle-mcq:*`);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const uuidPart = randomUUID().replace(/-/g, '').slice(0, 8);
      const j = Math.floor(parseInt(uuidPart, 16) % (i + 1));
      const temp = shuffled[j]!;
      shuffled[j] = shuffled[i]!;
      shuffled[i] = temp;
    }
    return shuffled;
  }

  async findRiddlesBySubject(
    subjectId: string,
    pagination: { page?: number; limit?: number } = {},
    level?: string
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const query = this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.subject', 'subject')
      .where('subject.id = :subjectId', { subjectId })
      .andWhere('subject.isActive = :isActive', { isActive: true });

    if (level) {
      query.andWhere('riddle.level = :level', { level });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('riddle.createdAt', 'DESC')
      .addOrderBy('riddle.id', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findAllRiddles(
    filters: {
      category?: string;
      subject?: string;
      level?: string;
      status?: string;
      search?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ data: RiddleMcq[]; total: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const query = this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.subject', 'subject')
      .leftJoinAndSelect('subject.category', 'category');

    if (filters.category && filters.category !== 'all') {
      query.where('category.slug = :category', { category: filters.category });
    }

    if (filters.subject && filters.subject !== 'all') {
      if (filters.category && filters.category !== 'all') {
        query.andWhere('subject.slug = :subject', { subject: filters.subject });
      } else {
        query.where('subject.slug = :subject', { subject: filters.subject });
      }
    }

    if (filters.level && filters.level !== 'all') {
      query.andWhere('riddle.level = :level', { level: filters.level });
    }

    if (filters.status && filters.status !== 'all') {
      query.andWhere('riddle.status = :status', { status: filters.status });
    }

    if (filters.search) {
      query.andWhere('riddle.question ILIKE :search', { search: `%${filters.search}%` });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('riddle.importOrder', 'ASC')
      .addOrderBy('riddle.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findRandomRiddles(level: string, count: number): Promise<RiddleMcq[]> {
    const validLevels = ['easy', 'medium', 'hard', 'expert'];
    if (!validLevels.includes(level)) {
      throw new BadRequestException(`Invalid level: ${level}`);
    }

    const totalCount = await this.riddleMcqRepo.count({
      where: { level: level as RiddleMcqLevel, status: RiddleStatus.PUBLISHED },
    });

    if (totalCount === 0) {
      return [];
    }

    if (count >= totalCount) {
      return this.riddleMcqRepo.find({
        where: { level: level as RiddleMcqLevel, status: RiddleStatus.PUBLISHED },
        relations: ['subject'],
      });
    }

    const allIds = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .where('riddle.level = :level', { level })
      .andWhere('riddle.status = :status', { status: RiddleStatus.PUBLISHED })
      .getMany();

    const shuffled = this.shuffleArray(allIds).slice(0, count);
    const selectedIds = shuffled.map((r) => r.id);

    return this.riddleMcqRepo.find({
      where: { id: In(selectedIds) },
      relations: ['subject'],
    });
  }

  async findMixedRiddles(count: number = 50): Promise<RiddleMcq[]> {
    const totalCount = await this.riddleMcqRepo.count({
      where: { status: RiddleStatus.PUBLISHED },
    });

    if (totalCount === 0) {
      return [];
    }

    if (count >= totalCount) {
      return this.riddleMcqRepo.find({
        relations: ['subject'],
        where: { status: RiddleStatus.PUBLISHED },
      });
    }

    const allIds = await this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .select('riddle.id')
      .where('riddle.status = :status', { status: RiddleStatus.PUBLISHED })
      .getMany();

    const shuffled = this.shuffleArray(allIds).slice(0, count);
    const selectedIds = shuffled.map((r) => r.id);

    return this.riddleMcqRepo.find({
      where: { id: In(selectedIds) },
      relations: ['subject'],
    });
  }

  async createRiddle(dto: {
    question: string;
    options?: string[];
    correctLetter?: string;
    level: string;
    subjectId: string;
    hint?: string;
    explanation?: string;
    answer?: string;
    status?: RiddleStatus;
  }): Promise<RiddleMcq> {
    const isExpert = dto.level === 'expert';

    if (!isExpert && (!dto.options || dto.options.length < 2)) {
      throw new BadRequestException('Riddle requires at least 2 options');
    }

    if (!isExpert && !dto.correctLetter) {
      throw new BadRequestException('Riddle questions require correctLetter (A/B/C/D)');
    }

    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new BadRequestException('Subject not found');
    }

    const riddle = new RiddleMcq();
    riddle.question = dto.question;
    riddle.options = isExpert ? null : dto.options || null;
    riddle.correctLetter = isExpert ? null : dto.correctLetter || null;
    riddle.level = dto.level as RiddleMcqLevel;
    riddle.subjectId = dto.subjectId;
    riddle.hint = dto.hint || null;
    riddle.explanation = dto.explanation || null;
    riddle.answer = dto.answer || null;
    riddle.status = dto.status || RiddleStatus.DRAFT;

    const saved = await this.riddleMcqRepo.save(riddle);
    await this.clearRiddleCaches();
    return saved;
  }

  async updateRiddle(
    id: string,
    dto: {
      question?: string;
      options?: string[];
      correctLetter?: string;
      level?: string;
      subjectId?: string;
      hint?: string;
      explanation?: string;
      answer?: string;
      status?: RiddleStatus;
    }
  ): Promise<RiddleMcq> {
    const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
    if (!riddle) {
      throw new NotFoundException('Riddle not found');
    }

    if (dto.question !== undefined) {
      riddle.question = dto.question;
    }
    if (dto.correctLetter !== undefined) {
      riddle.correctLetter = dto.correctLetter || null;
    }
    if (dto.options !== undefined) {
      riddle.options = dto.options || null;
    }
    if (dto.level !== undefined) {
      riddle.level = dto.level as RiddleMcqLevel;
    }
    if (dto.subjectId !== undefined) {
      riddle.subjectId = dto.subjectId;
    }
    if (dto.hint !== undefined) {
      riddle.hint = dto.hint || null;
    }
    if (dto.explanation !== undefined) {
      riddle.explanation = dto.explanation || null;
    }
    if (dto.answer !== undefined) {
      riddle.answer = dto.answer || null;
    }
    if (dto.status !== undefined) {
      riddle.status = dto.status;
    }

    const saved = await this.riddleMcqRepo.save(riddle);
    await this.clearRiddleCaches();
    return saved;
  }

  async deleteRiddle(id: string): Promise<void> {
    const result = await this.riddleMcqRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Riddle not found');
    }
    await this.clearRiddleCaches();
  }

  async findRiddleById(id: string): Promise<RiddleMcq> {
    const riddle = await this.riddleMcqRepo.findOne({
      where: { id },
      relations: ['subject'],
    });
    if (!riddle) {
      throw new NotFoundException('Riddle not found');
    }
    return riddle;
  }
}
