import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { invalidateCacheFamilies } from '../../common/content/content-cache.util';
import { RiddleMcq, RiddleStatus, RiddleMcqLevel } from '../entities/riddle-mcq.entity';
import { RiddleMcqCategory } from '../entities/riddle-category.entity';
import { RiddleMcqSubject } from '../entities/riddle-subject.entity';
import { generateSlug } from '../utils/slug.util';
import { buildCsvHeaders, formatAnswerText, buildCsvRow } from '../utils/csv-export.util';

export interface BulkCreateRiddleDto {
  question: string;
  options?: string[];
  correctLetter?: string;
  level: string;
  subjectId?: string;
  subjectName?: string;
  categoryName?: string;
  hint?: string;
  explanation?: string;
  answer?: string;
  status?: RiddleStatus;
  importOrder?: number;
}

@Injectable()
export class RiddleMcqImportService {
  private readonly logger = new Logger(RiddleMcqImportService.name);

  constructor(
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    private cacheService: CacheService,
    private dataSource: DataSource
  ) {}

  private async clearCaches(): Promise<void> {
    await invalidateCacheFamilies(this.cacheService, [
      'riddle-mcq:questions',
      'riddle-mcq:subjects',
      'riddle-mcq:filter-counts',
      'riddle-mcq:stats',
    ]);
  }

  async createRiddlesBulk(
    dtos: BulkCreateRiddleDto[]
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];

    if (!dtos || dtos.length === 0) {
      throw new BadRequestException('No riddles provided for bulk creation');
    }

    const CHUNK_SIZE = 100;
    const totalChunks = Math.ceil(dtos.length / CHUNK_SIZE);
    let totalCreated = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, dtos.length);
      const chunk = dtos.slice(start, end);

      const result = await this.processRiddleChunk(chunk, errors, start);
      totalCreated += result.count;
    }

    await this.clearCaches();
    return { count: totalCreated, errors };
  }

  private async processRiddleChunk(
    dtos: BulkCreateRiddleDto[],
    errors: string[],
    offset: number
  ): Promise<{ count: number; errors: string[] }> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const riddles: RiddleMcq[] = [];

      const uniqueCategories = [
        ...new Set(dtos.map((d) => d.categoryName).filter(Boolean)),
      ] as string[];
      const categoryMap = new Map<string, RiddleMcqCategory>();

      for (const catName of uniqueCategories) {
        let category = await transactionalEntityManager.findOne(RiddleMcqCategory, {
          where: { name: catName },
        });
        if (!category) {
          category = await transactionalEntityManager.save(RiddleMcqCategory, {
            name: catName,
            slug: generateSlug(catName),
            emoji: '📁',
            isActive: true,
          });
        }
        categoryMap.set(catName, category);
      }

      const uniqueSubjects = [
        ...new Set(dtos.map((d) => d.subjectName).filter(Boolean)),
      ] as string[];
      const subjectMap = new Map<string, RiddleMcqSubject>();

      for (const subjName of uniqueSubjects) {
        const dtoWithCategory = dtos.find((d) => d.subjectName === subjName);
        const categoryName = dtoWithCategory?.categoryName;
        const category = categoryName ? categoryMap.get(categoryName) : null;

        let subject = await transactionalEntityManager.findOne(RiddleMcqSubject, {
          where: { name: subjName },
        });
        if (!subject) {
          subject = await transactionalEntityManager.save(RiddleMcqSubject, {
            name: subjName,
            slug: generateSlug(subjName),
            emoji: '📚',
            isActive: true,
            categoryId: category?.id ?? null,
          });
        }
        subjectMap.set(subjName, subject);
      }

      for (let i = 0; i < dtos.length; i++) {
        const dto = dtos[i];
        const isExpert = dto.level === 'expert';

        const validLevels = ['easy', 'medium', 'hard', 'expert'];
        if (!validLevels.includes(dto.level)) {
          errors.push(`Row ${offset + i + 1}: Invalid level '${dto.level}'`);
          continue;
        }

        if (!isExpert && !dto.correctLetter) {
          errors.push(`Row ${offset + i + 1}: Riddle requires correctLetter`);
          continue;
        }

        if (!isExpert && (!dto.options || dto.options.length < 2)) {
          errors.push(`Row ${offset + i + 1}: Riddle requires at least 2 options`);
          continue;
        }

        let subjectId = dto.subjectId;
        if (!subjectId && dto.subjectName) {
          const subject = subjectMap.get(dto.subjectName);
          if (subject) {
            subjectId = subject.id;
          }
        }

        if (!subjectId) {
          errors.push(
            `Row ${offset + i + 1}: Subject not found for "${dto.subjectName || dto.subjectId}"`
          );
          continue;
        }

        const riddle = new RiddleMcq();
        riddle.question = dto.question;
        riddle.options = isExpert ? null : (dto.options ?? null);
        riddle.correctLetter = isExpert ? null : (dto.correctLetter ?? null);
        riddle.level = dto.level as RiddleMcqLevel;
        riddle.subjectId = subjectId;
        riddle.hint = dto.hint ?? null;
        riddle.explanation = dto.explanation ?? null;
        riddle.answer = dto.answer ?? null;
        riddle.status = dto.status ?? RiddleStatus.DRAFT;
        riddle.importOrder = dto.importOrder ?? null;
        riddles.push(riddle);
      }

      if (riddles.length === 0) {
        throw new BadRequestException('No valid riddles to create');
      }

      const saved = await transactionalEntityManager.save(riddles);
      return { count: saved.length, errors };
    });
  }

  async exportRiddlesToCSV(filters?: {
    category?: string;
  }): Promise<{ csv: string; filename: string }> {
    const { category } = filters || {};

    let query = this.riddleMcqRepo
      .createQueryBuilder('riddle')
      .leftJoinAndSelect('riddle.subject', 'subject')
      .leftJoinAndSelect('subject.category', 'category');

    if (category && category !== 'all') {
      query = query.andWhere('category.slug = :category', { category });
    }

    const riddles = await query
      .orderBy('category.name', 'ASC')
      .addOrderBy('subject.name', 'ASC')
      .addOrderBy('riddle.updatedAt', 'DESC')
      .getMany();

    const headers = buildCsvHeaders();
    const csvLines: string[] = [];
    let counter = 0;
    let currentCategory = '';

    if (category && category !== 'all') {
      const firstCategoryName = riddles[0]?.subject?.category?.name || category;
      csvLines.push(`# Category: ${firstCategoryName}`);
      csvLines.push(headers.join(','));
    } else {
      csvLines.push(headers.join(','));
    }

    for (const r of riddles) {
      if (!category || category === 'all') {
        const categoryName = r.subject?.category?.name || 'Uncategorized';
        if (categoryName !== currentCategory) {
          currentCategory = categoryName;
          csvLines.push(`# Category: ${categoryName}`);
        }
      }

      counter++;
      const answerText = formatAnswerText(r);
      csvLines.push(buildCsvRow(counter, r, answerText));
    }

    const filename =
      category && category !== 'all'
        ? `riddle-mcqs-${category}-${new Date().toISOString().split('T')[0]}.csv`
        : `riddle-mcqs-${new Date().toISOString().split('T')[0]}.csv`;
    return { csv: csvLines.join('\n'), filename };
  }
}
