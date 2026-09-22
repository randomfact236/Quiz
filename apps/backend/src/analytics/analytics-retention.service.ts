/**
 * ============================================================================
 * analytics-retention.service.ts — C1 data-retention purge (plan/13 §4b C1)
 * ============================================================================
 * Raw `analytics_events` rows are the retention-capped tier (entity doc):
 * the collection plan §9 promises ~13 months of raw events while dashboard
 * aggregates are computed on read and only ever queried over ≤365-day ranges
 * (admin controller clamps `days`), so 13 months of raw history is always
 * sufficient. Nothing enforced this before — the table grew unbounded
 * (TASK-02's probe rows were even un-deletable through the ops guard).
 *
 * Runs as a fail-safe in-process job: first pass shortly after boot, then
 * every 24h. Deletes in bounded batches so no single statement locks the
 * table for long, and invalidates the analytics caches afterwards so
 * dashboards never show counts older than the retention horizon.
 * ============================================================================
 */

import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';

/** Raw-event retention window in months (plan §9: ~13). */
const RETENTION_MONTHS = Number(process.env['ANALYTICS_RETENTION_MONTHS'] ?? 13);
/** Rows per DELETE statement — keeps each transaction short. */
const PURGE_BATCH_SIZE = Number(process.env['ANALYTICS_RETENTION_BATCH'] ?? 5000);
const RUN_INTERVAL_MS = 24 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 45 * 1000;
/** Safety bound so a pathological loop can never spin forever. */
const MAX_BATCHES_PER_RUN = 1000;

@Injectable()
export class AnalyticsRetentionService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(AnalyticsRetentionService.name);
  private initialTimer: ReturnType<typeof setTimeout> | null = null;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cacheService: CacheService
  ) {}

  onModuleInit(): void {
    this.initialTimer = setTimeout(() => {
      void this.purgeExpiredEvents();
      this.intervalTimer = setInterval(() => void this.purgeExpiredEvents(), RUN_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }

  onApplicationShutdown(): void {
    if (this.initialTimer) clearTimeout(this.initialTimer);
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }

  /**
   * Delete raw rows older than the retention window, batch by batch.
   * Never throws — a failing purge must not take the app down; the next
   * run simply retries.
   */
  async purgeExpiredEvents(): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    let totalDeleted = 0;
    try {
      for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch++) {
        // RETURNING gives an exact per-batch count without relying on driver
        // rowCount quirks across TypeORM/PG versions.
        const rows: Array<{ id: string }> = (await this.dataSource.query(
          `DELETE FROM analytics_events
           WHERE id IN (
             SELECT id FROM analytics_events
             WHERE server_ts < now() - make_interval(months => $1)
             LIMIT $2
           )
           RETURNING id`,
          [RETENTION_MONTHS, PURGE_BATCH_SIZE]
        )) as Array<{ id: string }>;
        const deleted = Array.isArray(rows) ? rows.length : 0;
        totalDeleted += deleted;
        if (deleted < PURGE_BATCH_SIZE) break;
      }
      if (totalDeleted > 0) {
        await this.cacheService.delPattern('analytics:*');
        this.logger.log(
          `Analytics retention purge removed ${totalDeleted} rows (older than ${RETENTION_MONTHS} months)`
        );
      }
      return totalDeleted;
    } catch (err) {
      this.logger.error(
        `Analytics retention purge failed after ${totalDeleted} rows: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return totalDeleted;
    } finally {
      this.running = false;
    }
  }
}
