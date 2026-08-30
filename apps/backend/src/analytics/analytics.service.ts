/**
 * ============================================================================
 * Analytics Service
 * ============================================================================
 * Ingest (analytics plan Phase 1–2) + dashboard aggregation (Phase 4).
 *
 * Ingest is best-effort and never throws to the caller: analytics must not
 * break gameplay. Guest counters (quizAttempts / totalScore / lastActive)
 * are incremented on `session_completed` events carrying a guestId, closing
 * the "counters never incremented" gap from the plan audit.
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CacheService } from '../common/cache/cache.service';
import { GuestUsersService } from '../guest-users/guest-users.service';

import { AnalyticsEvent } from './entities/analytics-event.entity';
import { AnalyticsEventDto } from './dto/analytics.dto';

/** Free-form properties payload cap (plan §9 data minimization). */
const MAX_PROPERTIES_JSON_BYTES = 8192;

const OVERVIEW_CACHE_KEY = 'analytics:overview';
const OVERVIEW_CACHE_TTL_S = 60;

const PUBLIC_SUMMARY_CACHE_KEY = 'analytics:public-summary';
const PUBLIC_SUMMARY_CACHE_TTL_S = 300;

export interface AdminOverview {
  totals: {
    events: number;
    eventsLast24h: number;
    registeredUsers: number;
    guestUsers: number;
  };
  activeUsers: { dau: number; wau: number; mau: number };
  sessionsCompletedByModule: { module: string; count: number }[];
  questionAccuracy: { module: string; answered: number; correct: number; accuracyPct: number }[];
  dailySeries: { day: string; events: number; activeUsers: number }[];
  topEvents: { eventName: string; count: number }[];
  topPages: { page: string; count: number }[];
  jokeVotes: { likes: number; dislikes: number };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepo: Repository<AnalyticsEvent>,
    private readonly guestUsersService: GuestUsersService,
    private readonly cacheService: CacheService
  ) {}

  // ==================== INGEST ====================

  /**
   * Persist a client batch. Invalid/oversized events are dropped (counted in
   * the reply) rather than failing the whole batch.
   */
  async ingest(
    dtos: AnalyticsEventDto[],
    userId: string | null
  ): Promise<{ accepted: number; rejected: number }> {
    const rows: AnalyticsEvent[] = [];
    let rejected = 0;

    for (const dto of dtos) {
      if (!AnalyticsEventDtoSafe.isNameValid(dto.eventName)) {
        rejected++;
        continue;
      }
      const properties = this.sanitizeProperties(dto.properties);
      if (properties === undefined && dto.properties) {
        rejected++;
        continue;
      }

      const row = new AnalyticsEvent();
      row.eventName = dto.eventName;
      row.module = dto.module ?? null;
      row.userId = userId ?? null;
      row.guestId = dto.guestId ?? null;
      row.sessionId = dto.sessionId ?? null;
      row.page = dto.page ?? null;
      row.properties = properties ?? null;
      row.clientTs = dto.clientTs ? new Date(dto.clientTs) : null;
      rows.push(row);
    }

    if (rows.length > 0) {
      try {
        await this.eventRepo.save(rows);
      } catch (err) {
        this.logger.warn(`analytics ingest failed: ${err instanceof Error ? err.message : err}`);
        return { accepted: 0, rejected: dtos.length };
      }
    }

    await this.applyServerSideEffects(rows);
    return { accepted: rows.length, rejected };
  }

  /**
   * Server-side record for backend hooks (auth, joke votes). Failures are
   * logged and swallowed — the surrounding use case must keep working.
   */
  async record(input: {
    eventName: string;
    module?: string;
    userId?: string | null;
    guestId?: string | null;
    sessionId?: string | null;
    page?: string | null;
    properties?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const row = new AnalyticsEvent();
      row.eventName = input.eventName;
      row.module = input.module ?? null;
      row.userId = input.userId ?? null;
      row.guestId = input.guestId ?? null;
      row.sessionId = input.sessionId ?? null;
      row.page = input.page ?? null;
      row.properties = this.sanitizeProperties(input.properties) ?? null;
      row.clientTs = null;
      await this.eventRepo.save(row);
    } catch (err) {
      this.logger.warn(
        `analytics record(${input.eventName}) failed: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  /** Guest counter wiring (analytics plan §2.3): attempts/score/lastActive. */
  private async applyServerSideEffects(rows: AnalyticsEvent[]): Promise<void> {
    for (const row of rows) {
      if (row.eventName !== 'session_completed' || !row.guestId) continue;
      const score = Number(row.properties?.['score'] ?? 0);
      try {
        await this.guestUsersService.recordSessionCompletion(
          row.guestId,
          Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0
        );
      } catch (err) {
        this.logger.warn(
          `guest counter update failed for ${row.guestId}: ${err instanceof Error ? err.message : err}`
        );
      }
    }
  }

  private sanitizeProperties(
    properties?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!properties) return undefined;
    // Strip common free-text fields (plan §9: don't persist open-ended text).
    const stripped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (/^(text|answer_text|open_ended|openEnded)$/i.test(key)) continue;
      stripped[key] = value;
    }
    if (JSON.stringify(stripped).length > MAX_PROPERTIES_JSON_BYTES) return undefined;
    return stripped;
  }

  // ==================== DASHBOARDS ====================

  async getAdminOverview(): Promise<AdminOverview> {
    return this.cacheService.getOrSet(
      OVERVIEW_CACHE_KEY,
      () => this.computeOverview(),
      OVERVIEW_CACHE_TTL_S
    );
  }

  private async computeOverview(): Promise<AdminOverview> {
    const repo = this.eventRepo;
    // DB columns are camelCase (TypeORM default naming, see BaselineSchema).
    const actor = `COALESCE("userId"::text, "guestId")`;

    const [
      totalEvents,
      eventsLast24h,
      registeredUsers,
      guestUsers,
      dau,
      wau,
      mau,
      byModule,
      accuracy,
      daily,
      topEvents,
      topPages,
      jokeVotes,
    ] = await Promise.all([
      repo.count(),
      repo.createQueryBuilder('e').andWhere("e.serverTs > now() - interval '24 hours'").getCount(),
      this.scalar(`SELECT COUNT(*)::int AS n FROM users WHERE role != 'admin'`),
      this.scalar(`SELECT COUNT(*)::int AS n FROM guest_users`),
      this.scalar(
        `SELECT COUNT(DISTINCT ${actor}) AS n FROM analytics_events WHERE "serverTs" > now() - interval '1 day'`
      ),
      this.scalar(
        `SELECT COUNT(DISTINCT ${actor}) AS n FROM analytics_events WHERE "serverTs" > now() - interval '7 days'`
      ),
      this.scalar(
        `SELECT COUNT(DISTINCT ${actor}) AS n FROM analytics_events WHERE "serverTs" > now() - interval '30 days'`
      ),
      repo.query(
        `SELECT COALESCE(module, 'unknown') AS module, COUNT(*)::int AS count
         FROM analytics_events WHERE "eventName" = 'session_completed'
         GROUP BY 1 ORDER BY count DESC`
      ),
      repo.query(
        `SELECT COALESCE(module, 'unknown') AS module,
                COUNT(*)::int AS answered,
                SUM(CASE WHEN (properties->>'correct')::boolean THEN 1 ELSE 0 END)::int AS correct
         FROM analytics_events WHERE "eventName" = 'question_answered'
         GROUP BY 1 ORDER BY answered DESC`
      ),
      repo.query(
        `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
                COALESCE(ev.events, 0)::int AS events,
                COALESCE(ev.actors, 0)::int AS "activeUsers"
         FROM generate_series(CURRENT_DATE - interval '29 days', CURRENT_DATE, interval '1 day') AS d(day)
         LEFT JOIN (
           SELECT date_trunc('day', "serverTs") AS day,
                  COUNT(*)::int AS events,
                  COUNT(DISTINCT ${actor})::int AS actors
           FROM analytics_events
           WHERE "serverTs" > now() - interval '30 days'
           GROUP BY 1
         ) ev ON ev.day = d.day
         ORDER BY d.day`
      ),
      repo.query(
        `SELECT "eventName" AS "eventName", COUNT(*)::int AS count
         FROM analytics_events GROUP BY 1 ORDER BY count DESC LIMIT 15`
      ),
      repo.query(
        `SELECT page, COUNT(*)::int AS count
         FROM analytics_events WHERE page IS NOT NULL
         GROUP BY 1 ORDER BY count DESC LIMIT 10`
      ),
      repo.query(
        `SELECT
           SUM(CASE WHEN properties->>'voteType' = 'like' THEN 1 ELSE 0 END)::int AS likes,
           SUM(CASE WHEN properties->>'voteType' = 'dislike' THEN 1 ELSE 0 END)::int AS dislikes
         FROM analytics_events WHERE "eventName" = 'joke_voted'`
      ),
    ]);

    return {
      totals: { events: totalEvents, eventsLast24h, registeredUsers, guestUsers },
      activeUsers: { dau, wau, mau },
      sessionsCompletedByModule: byModule,
      questionAccuracy: accuracy.map(
        (r: { module: string; answered: number; correct: number }) => ({
          module: r.module,
          answered: Number(r.answered),
          correct: Number(r.correct),
          accuracyPct:
            Number(r.answered) > 0 ? Math.round((Number(r.correct) / Number(r.answered)) * 100) : 0,
        })
      ),
      dailySeries: daily,
      topEvents,
      topPages,
      jokeVotes: {
        likes: Number(jokeVotes?.likes ?? 0),
        dislikes: Number(jokeVotes?.dislikes ?? 0),
      },
    };
  }

  async getPublicSummary(): Promise<{
    totalSessionsCompleted: number;
    sessionsCompletedByModule: { module: string; count: number }[];
    activeQuizzers30d: number;
  }> {
    return this.cacheService.getOrSet(
      PUBLIC_SUMMARY_CACHE_KEY,
      async () => {
        const [byModule, activeQuizzers30d, total] = await Promise.all([
          this.eventRepo.query(
            `SELECT COALESCE(module, 'unknown') AS module, COUNT(*)::int AS count
             FROM analytics_events WHERE "eventName" = 'session_completed'
             GROUP BY 1 ORDER BY count DESC`
          ),
          this.scalar(
            `SELECT COUNT(DISTINCT COALESCE("userId"::text, "guestId")) AS n FROM analytics_events
             WHERE "eventName" = 'session_completed' AND "serverTs" > now() - interval '30 days'`
          ),
          this.scalar(
            `SELECT COUNT(*)::int AS n FROM analytics_events WHERE "eventName" = 'session_completed'`
          ),
        ]);
        return {
          totalSessionsCompleted: total,
          sessionsCompletedByModule: byModule,
          activeQuizzers30d,
        };
      },
      PUBLIC_SUMMARY_CACHE_TTL_S
    );
  }

  async listEvents(opts: {
    eventName?: string;
    module?: string;
    page: number;
    limit: number;
  }): Promise<{ data: AnalyticsEvent[]; total: number; page: number; limit: number }> {
    const qb = this.eventRepo.createQueryBuilder('e');
    if (opts.eventName) qb.andWhere('e.eventName = :eventName', { eventName: opts.eventName });
    if (opts.module) qb.andWhere('e.module = :module', { module: opts.module });

    const total = await qb.getCount();
    const data = await qb
      .orderBy('e.serverTs', 'DESC')
      .skip((opts.page - 1) * opts.limit)
      .take(opts.limit)
      .getMany();

    return { data, total, page: opts.page, limit: opts.limit };
  }

  /**
   * Weekly retention cohorts (plan §7): for each of the last `weeks` cohort
   * weeks, how many distinct actors appeared, and how many returned in any
   * later week. D1/D7/D30 rolling retention is approximated by week buckets.
   */
  async getRetentionCohorts(
    weeks = 6
  ): Promise<{ cohortWeek: string; size: number; returned: number; retentionPct: number }[]> {
    const rows = await this.eventRepo.query(
      `WITH actor AS (
         SELECT COALESCE("userId"::text, "guestId") AS actor, "serverTs" AS ts
         FROM analytics_events WHERE COALESCE("userId"::text, "guestId") IS NOT NULL
       ),
       first_seen AS (
         SELECT actor, date_trunc('week', MIN(ts)) AS cohort
         FROM actor GROUP BY actor
       ),
       activity AS (
         SELECT a.actor, date_trunc('week', a.ts) AS wk FROM actor a
       ),
       cohort_activity AS (
         SELECT f.cohort, COUNT(DISTINCT f.actor)::int AS size,
                COUNT(DISTINCT CASE WHEN act.wk > f.cohort THEN f.actor END)::int AS returned
         FROM first_seen f
         LEFT JOIN activity act ON act.actor = f.actor
         WHERE f.cohort > date_trunc('week', now()) - ($1::int * interval '1 week')
           AND f.cohort < date_trunc('week', now())
         GROUP BY f.cohort
       )
       SELECT to_char(cohort, 'YYYY-MM-DD') AS "cohortWeek", size, returned
       FROM cohort_activity ORDER BY cohort`,
      [Math.min(Math.max(weeks, 2), 12)]
    );
    return rows.map((r: { cohortWeek: string; size: number; returned: number }) => ({
      cohortWeek: r.cohortWeek,
      size: Number(r.size),
      returned: Number(r.returned),
      retentionPct:
        Number(r.size) > 0 ? Math.round((Number(r.returned) / Number(r.size)) * 100) : 0,
    }));
  }

  private async scalar(sql: string): Promise<number> {
    const res = await this.eventRepo.query(sql);
    const val = Array.isArray(res) ? res[0]?.[Object.keys(res[0] ?? {})[0]] : undefined;
    return Number(val ?? 0);
  }
}

/**
 * Small helper namespace so ingest validation stays in one place without a
 * second validator instance (the global pipe already shape-validates DTOs).
 */
class AnalyticsEventDtoSafe {
  static isNameValid(name: string): boolean {
    return typeof name === 'string' && /^[a-z][a-z0-9_]{2,63}$/.test(name);
  }
}
