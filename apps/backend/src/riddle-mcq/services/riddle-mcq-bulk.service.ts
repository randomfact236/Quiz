import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BulkActionType } from '../../common/enums/bulk-action.enum';
import { BulkActionResult } from '../../common/interfaces/bulk-action-result.interface';
import { RiddleMcq } from '../entities/riddle-mcq.entity';
import { RiddleMcqImportService, BulkCreateRiddleDto } from './riddle-mcq-import.service';
import { RiddleMcqBulkActionsService } from './riddle-mcq-bulk-actions.service';
import { buildCsvHeaders, formatAnswerText, buildCsvRow } from '../utils/csv-export.util';

@Injectable()
export class RiddleMcqBulkService {
  private readonly logger = new Logger(RiddleMcqBulkService.name);

  constructor(
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    private importService: RiddleMcqImportService,
    private bulkActionsService: RiddleMcqBulkActionsService
  ) {}

  async createRiddlesBulk(dtos: BulkCreateRiddleDto[]) {
    return this.importService.createRiddlesBulk(dtos);
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

  async bulkActionRiddles(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    return this.bulkActionsService.bulkAction(ids, action);
  }
}
