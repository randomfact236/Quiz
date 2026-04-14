import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { BulkActionType } from '../../common/enums/bulk-action.enum';
import { BulkActionResult } from '../../common/interfaces/bulk-action-result.interface';

import { RiddleMcq, RiddleStatus, RiddleMcqLevel } from '../entities/riddle-mcq.entity';

@Injectable()
export class RiddleMcqBulkService {
  private readonly logger = new Logger(RiddleMcqBulkService.name);

  constructor(
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    private cacheService: CacheService,
    private dataSource: DataSource
  ) {}

  private async clearRiddleCaches() {
    await this.cacheService.delPattern(`riddle-mcq:*`);
  }

  async createRiddlesBulk(
    dtos: Array<{
      question: string;
      options?: string[];
      correctLetter?: string;
      level: string;
      subjectId: string;
      hint?: string;
      explanation?: string;
      answer?: string;
      status?: RiddleStatus;
    }>
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

    await this.clearRiddleCaches();
    return { count: totalCreated, errors };
  }

  private async processRiddleChunk(
    dtos: Array<{
      question: string;
      options?: string[];
      correctLetter?: string;
      level: string;
      subjectId: string;
      hint?: string;
      explanation?: string;
      answer?: string;
      status?: RiddleStatus;
    }>,
    errors: string[],
    offset: number
  ): Promise<{ count: number; errors: string[] }> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const riddles: RiddleMcq[] = [];

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

        const riddle = new RiddleMcq();
        riddle.question = dto.question;
        riddle.options = isExpert ? null : (dto.options ?? null);
        riddle.correctLetter = isExpert ? null : (dto.correctLetter ?? null);
        riddle.level = dto.level as RiddleMcqLevel;
        riddle.subjectId = dto.subjectId;
        riddle.hint = dto.hint ?? null;
        riddle.explanation = dto.explanation ?? null;
        riddle.answer = dto.answer ?? null;
        riddle.status = dto.status ?? RiddleStatus.DRAFT;
        riddles.push(riddle);
      }

      if (riddles.length === 0) {
        throw new BadRequestException('No valid riddles to create');
      }

      const saved = await transactionalEntityManager.save(riddles);
      return { count: saved.length, errors };
    });
  }

  async bulkActionRiddles(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(`[RiddleMcqBulkService] Executing bulk ${action} on ${ids.length} riddles`);

    let succeeded = 0;
    let failed = 0;
    const failures: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        if (action === BulkActionType.DELETE) {
          const result = await this.riddleMcqRepo.delete(id);
          if (result.affected && result.affected > 0) {
            succeeded++;
          } else {
            failed++;
            failures.push({ id, error: 'Not found' });
          }
        } else if (
          action === BulkActionType.PUBLISH ||
          action === BulkActionType.DRAFT ||
          action === BulkActionType.TRASH
        ) {
          const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
          if (!riddle) {
            failed++;
            failures.push({ id, error: 'Not found' });
          } else {
            riddle.status = RiddleStatus[action.toUpperCase() as keyof typeof RiddleStatus];
            await this.riddleMcqRepo.save(riddle);
            succeeded++;
          }
        } else if (action === BulkActionType.RESTORE) {
          const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
          if (!riddle) {
            failed++;
            failures.push({ id, error: 'Not found' });
          } else {
            riddle.status = RiddleStatus.DRAFT;
            await this.riddleMcqRepo.save(riddle);
            succeeded++;
          }
        } else {
          failed++;
          failures.push({ id, error: `Action ${action} not supported` });
        }
      } catch (err) {
        failed++;
        failures.push({ id, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    if (succeeded > 0) {
      await this.clearRiddleCaches();
    }

    return {
      success: failed === 0,
      processed: ids.length,
      succeeded,
      failed,
      failures: failures.length > 0 ? failures : undefined,
      message: `Bulk ${action} completed: ${succeeded} succeeded, ${failed} failed`,
    };
  }
}
