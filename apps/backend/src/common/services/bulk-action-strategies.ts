/**
 * ============================================================================
 * Bulk Action Strategies
 * ============================================================================
 * Strategy pattern implementation for bulk actions to reduce complexity
 * ============================================================================
 */

import { Repository, QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ContentStatus } from '../enums/content-status.enum';
import { BulkActionType } from '../enums/bulk-action.enum';
import { IStatusEntity } from '../interfaces/bulk-action-result.interface';

/**
 * Bulk action strategy interface
 */
export interface IBulkActionStrategy {
  /**
   * Execute the bulk action on an entity
   * @param queryRunner - TypeORM query runner
   * @param repository - Entity repository
   * @param entity - Entity to process
   * @param entityName - Name of the entity for logging
   */
  execute<T extends IStatusEntity>(
    queryRunner: QueryRunner,
    repository: Repository<T>,
    entity: T,
    entityName: string,
    logger: Logger
  ): Promise<void>;
}

/**
 * Publish entity strategy
 */
export class PublishStrategy implements IBulkActionStrategy {
  async execute<T extends IStatusEntity>(
    queryRunner: QueryRunner,
    repository: Repository<T>,
    entity: T,
    entityName: string,
    logger: Logger
  ): Promise<void> {
    if (entity.status === ContentStatus.PUBLISHED) {
      return; // Already published
    }

    await queryRunner.manager.update(
      repository.target,
      entity.id,
      {
        status: ContentStatus.PUBLISHED,
        updatedAt: new Date(),
      },
    );

    logger.debug(`[BULK ACTION] Published ${entityName} ${entity.id}`, 'BulkActionService');
  }
}

/**
 * Draft entity strategy
 */
export class DraftStrategy implements IBulkActionStrategy {
  async execute<T extends IStatusEntity>(
    queryRunner: QueryRunner,
    repository: Repository<T>,
    entity: T,
    entityName: string,
    logger: Logger
  ): Promise<void> {
    if (entity.status === ContentStatus.DRAFT) {
      return; // Already draft
    }

    await queryRunner.manager.update(
      repository.target,
      entity.id,
      {
        status: ContentStatus.DRAFT,
        updatedAt: new Date(),
      },
    );

    logger.debug(`[BULK ACTION] Drafted ${entityName} ${entity.id}`, 'BulkActionService');
  }
}

/**
 * Trash entity strategy (soft delete)
 */
export class TrashStrategy implements IBulkActionStrategy {
  async execute<T extends IStatusEntity>(
    queryRunner: QueryRunner,
    repository: Repository<T>,
    entity: T,
    entityName: string,
    logger: Logger
  ): Promise<void> {
    if (entity.status === ContentStatus.TRASH) {
      return; // Already trashed
    }

    await queryRunner.manager.update(
      repository.target,
      entity.id,
      {
        status: ContentStatus.TRASH,
        updatedAt: new Date(),
      },
    );

    logger.debug(`[BULK ACTION] Trashed ${entityName} ${entity.id}`, 'BulkActionService');
  }
}

/**
 * Restore entity strategy
 */
export class RestoreStrategy implements IBulkActionStrategy {
  async execute<T extends IStatusEntity>(
    queryRunner: QueryRunner,
    repository: Repository<T>,
    entity: T,
    entityName: string,
    logger: Logger
  ): Promise<void> {
    if (entity.status !== ContentStatus.TRASH) {
      return; // Not in trash
    }

    await queryRunner.manager.update(
      repository.target,
      entity.id,
      {
        status: ContentStatus.DRAFT,
        updatedAt: new Date(),
      },
    );

    logger.debug(`[BULK ACTION] Restored ${entityName} ${entity.id}`, 'BulkActionService');
  }
}

/**
 * Delete entity strategy (hard delete)
 */
export class DeleteStrategy implements IBulkActionStrategy {
  async execute<T extends IStatusEntity>(
    queryRunner: QueryRunner,
    repository: Repository<T>,
    entity: T,
    entityName: string,
    logger: Logger
  ): Promise<void> {
    await queryRunner.manager.delete(repository.target, entity.id);

    logger.debug(`[BULK ACTION] Deleted ${entityName} ${entity.id}`, 'BulkActionService');
  }
}

/**
 * Factory to get the appropriate strategy for a bulk action type
 */
export class BulkActionStrategyFactory {
  private static strategies: Map<BulkActionType, IBulkActionStrategy> = new Map([
    [BulkActionType.PUBLISH, new PublishStrategy()],
    [BulkActionType.DRAFT, new DraftStrategy()],
    [BulkActionType.TRASH, new TrashStrategy()],
    [BulkActionType.RESTORE, new RestoreStrategy()],
    [BulkActionType.DELETE, new DeleteStrategy()],
  ]);

  /**
   * Get the strategy for a given action type
   * @param action - Bulk action type
   * @returns The strategy or null if not found
   */
  static getStrategy(action: BulkActionType): IBulkActionStrategy | null {
    return this.strategies.get(action) || null;
  }
}

/**
 * Get human-readable past tense action name
 */
export function getActionPastTense(action: BulkActionType): string {
  const actionPastMap: Record<BulkActionType, string> = {
    [BulkActionType.PUBLISH]: 'published',
    [BulkActionType.DRAFT]: 'set to draft',
    [BulkActionType.TRASH]: 'moved to trash',
    [BulkActionType.RESTORE]: 'restored',
    [BulkActionType.DELETE]: 'deleted',
  };

  return actionPastMap[action] || action;
}
