import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { BulkActionType } from '../../common/enums/bulk-action.enum';
import { BulkActionResult } from '../../common/interfaces/bulk-action-result.interface';
import { RiddleMcq, RiddleStatus } from '../entities/riddle-mcq.entity';

@Injectable()
export class RiddleMcqBulkActionsService {
  private readonly logger = new Logger(RiddleMcqBulkActionsService.name);

  constructor(
    @InjectRepository(RiddleMcq)
    private riddleMcqRepo: Repository<RiddleMcq>,
    private cacheService: CacheService
  ) {}

  private async clearCaches(): Promise<void> {
    await this.cacheService.delPattern(`riddle-mcq:*`);
  }

  async bulkAction(ids: string[], action: BulkActionType): Promise<BulkActionResult> {
    this.logger.log(
      `[RiddleMcqBulkActionsService] Executing bulk ${action} on ${ids.length} riddles`
    );

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
        } else if (action === BulkActionType.PUBLISH) {
          const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
          if (!riddle) {
            failed++;
            failures.push({ id, error: 'Not found' });
          } else {
            riddle.status = RiddleStatus.PUBLISHED;
            await this.riddleMcqRepo.save(riddle);
            succeeded++;
          }
        } else if (action === BulkActionType.DRAFT) {
          const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
          if (!riddle) {
            failed++;
            failures.push({ id, error: 'Not found' });
          } else {
            riddle.status = RiddleStatus.DRAFT;
            await this.riddleMcqRepo.save(riddle);
            succeeded++;
          }
        } else if (action === BulkActionType.TRASH) {
          const riddle = await this.riddleMcqRepo.findOne({ where: { id } });
          if (!riddle) {
            failed++;
            failures.push({ id, error: 'Not found' });
          } else {
            riddle.status = RiddleStatus.TRASH;
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
      await this.clearCaches();
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
