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
import { RequestContext } from './request-context';

/** Free-form properties payload cap (plan §9 data minimization). */
const MAX_PROPERTIES_JSON_BYTES = 8192;

const OVERVIEW_CACHE_KEY = 'analytics:overview';
const OVERVIEW_CACHE_TTL_S = 60;

const PUBLIC_SUMMARY_CACHE_KEY = 'analytics:public-summary';
const PUBLIC_SUMMARY_CACHE_TTL_S = 300;

const DASHBOARD_CACHE_TTL_S = 60;
/** Max look-back window the dashboard accepts (bounds query cost). */
export const DASHBOARD_MAX_DAYS = 365;

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

/** Per-game drill-down (quiz / riddle share the shape). */
export interface ModuleDashboard {
  sessionsStarted: number;
  sessionsResumed: number;
  sessionsCompleted: number;
  questionsAnswered: number;
  correct: number;
  accuracyPct: number | null;
  skipped: number;
  avgScorePct: number | null;
  byLevel: { level: string; answered: number; correct: number; accuracyPct: number | null }[];
  achievementsUnlocked: number | null;
}

export interface AdminDashboard {
  range: { days: number };
  kpis: {
    events: number;
    eventsPrev: number;
    pageViews: number;
    dau: number;
    sessionsCompleted: number;
    registeredUsers: number;
    guestUsers: number;
    newGuests: number;
    achievementsUnlocked: number;
    jokeLikes: number;
    jokeDislikes: number;
    newsletterSubscribers: number;
    newsletterNew: number;
    commentsTotal: number;
    avgQuizScorePct: number | null;
    avgQuizSeconds: number | null;
  };
  dailySeries: { day: string; events: number; pageViews: number; activeUsers: number }[];
  topPages: { label: string; count: number }[];
  topEvents: { label: string; count: number }[];
  topReferrers: { label: string; count: number }[];
  geo: {
    byCountry: { label: string; events: number; visitors: number }[];
    byCity: { label: string; count: number }[];
  };
  devices: {
    byType: { label: string; count: number }[];
    byBrowser: { label: string; count: number }[];
    byOs: { label: string; count: number }[];
  };
  webVitals: { metric: string; avg: number; p75: number; samples: number }[];
  users: {
    signupsByDay: { day: string; count: number }[];
    loginsByDay: { day: string; count: number }[];
  };
  modules: {
    'quiz-mcq': ModuleDashboard;
    'riddle-mcq': ModuleDashboard;
    'image-riddles': {
      answerChecked: number;
      hintShown: number;
      gaveUp: number;
      shared: number;
    };
    jokes: { viewed: number; liked: number; disliked: number; shared: number };
  };
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
    userId: string | null,
    context?: RequestContext
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
      this.applyContext(row, context);
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

  private applyContext(row: AnalyticsEvent, context?: RequestContext): void {
    if (!context) return;
    row.country = context.country;
    row.region = context.region;
    row.city = context.city;
    row.deviceType = context.deviceType;
    row.browser = context.browser;
    row.os = context.os;
    row.referrerDomain = context.referrerDomain;
    row.ipAnon = context.ipAnon;
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

  // ==================== DASHBOARD (tabbed UI) ====================

  /**
   * Everything the tabbed analytics dashboard renders, in one payload, for a
   * look-back of `days`. Short-TTL cached per range. All breakdowns are
   * scoped to the window; lifetime counters (users, subscribers) are noted
   * as such in the UI.
   */
  async getDashboard(days: number): Promise<AdminDashboard> {
    const clamped = Math.min(Math.max(Math.floor(days) || 30, 1), DASHBOARD_MAX_DAYS);
    return this.cacheService.getOrSet(
      `analytics:dashboard:${clamped}`,
      () => this.computeDashboard(clamped),
      DASHBOARD_CACHE_TTL_S
    );
  }

  private async computeDashboard(days: number): Promise<AdminDashboard> {
    const repo = this.eventRepo;
    const actor = `COALESCE("userId"::text, "guestId")`;
    const win = `"serverTs" > now() - ($1::int * interval '1 day')`;
    const prev = `"serverTs" > now() - (2 * $1::int * interval '1 day') AND "serverTs" <= now() - ($1::int * interval '1 day')`;

    const moduleDashboard = async (module: string): Promise<ModuleDashboard> => {
      const [started, resumed, completed, answered, byLevel, avgScore] = await Promise.all([
        this.scalarN(
          `SELECT COUNT(*)::int AS n FROM analytics_events WHERE "eventName" = 'session_started' AND module = $2 AND ${win}`,
          [days, module]
        ),
        this.scalarN(
          `SELECT COUNT(*)::int AS n FROM analytics_events WHERE "eventName" = 'session_resumed' AND module = $2 AND ${win}`,
          [days, module]
        ),
        this.scalarN(
          `SELECT COUNT(*)::int AS n FROM analytics_events WHERE "eventName" = 'session_completed' AND module = $2 AND ${win}`,
          [days, module]
        ),
        repo.query(
          `SELECT COUNT(*)::int AS answered,
                  SUM(CASE WHEN (properties->>'correct')::boolean THEN 1 ELSE 0 END)::int AS correct
           FROM analytics_events
           WHERE "eventName" = 'question_answered' AND module = $2 AND ${win}`,
          [days, module]
        ),
        repo.query(
          `SELECT COALESCE(properties->>'level', 'unknown') AS level,
                  COUNT(*)::int AS answered,
                  SUM(CASE WHEN (properties->>'correct')::boolean THEN 1 ELSE 0 END)::int AS correct
           FROM analytics_events
           WHERE "eventName" = 'question_answered' AND module = $2 AND ${win}
           GROUP BY 1 ORDER BY answered DESC`,
          [days, module]
        ),
        repo.query(
          `SELECT AVG((properties->>'percentage')::float)::float AS pct
           FROM analytics_events
           WHERE "eventName" = 'session_completed' AND module = $2 AND ${win}
             AND properties->>'percentage' IS NOT NULL`,
          [days, module]
        ),
      ]);
      const answeredN = Number(answered[0]?.answered ?? 0);
      const correctN = Number(answered[0]?.correct ?? 0);
      return {
        sessionsStarted: started,
        sessionsResumed: resumed,
        sessionsCompleted: completed,
        questionsAnswered: answeredN,
        correct: correctN,
        accuracyPct: answeredN > 0 ? Math.round((correctN / answeredN) * 100) : null,
        skipped: await this.scalarN(
          `SELECT COUNT(*)::int AS n FROM analytics_events WHERE "eventName" = 'question_skipped' AND module = $2 AND ${win}`,
          [days, module]
        ),
        avgScorePct: avgScore[0]?.pct != null ? Math.round(Number(avgScore[0].pct)) : null,
        byLevel: byLevel.map((r: { level: string; answered: number; correct: number }) => ({
          level: r.level,
          answered: Number(r.answered),
          correct: Number(r.correct ?? 0),
          accuracyPct:
            Number(r.answered) > 0
              ? Math.round((Number(r.correct ?? 0) / Number(r.answered)) * 100)
              : null,
        })),
        achievementsUnlocked:
          module === 'quiz-mcq'
            ? await this.scalarN(
                `SELECT COUNT(*)::int AS n FROM analytics_events WHERE "eventName" = 'achievement_unlocked' AND ${win}`,
                [days]
              )
            : null,
      };
    };

    const [
      events,
      eventsPrev,
      pageViews,
      dau,
      registeredUsers,
      guestUsers,
      newGuests,
      jokeVotes,
      jokeViews,
      jokeShares,
      newsletterSubscribers,
      newsletterNew,
      commentsTotal,
      quizMeta,
      daily,
      topPages,
      topEvents,
      topReferrers,
      byCountry,
      byCity,
      byType,
      byBrowser,
      byOs,
      webVitals,
      signupsByDay,
      loginsByDay,
      imageRiddles,
      quiz,
      riddle,
    ] = await Promise.all([
      this.scalarN(`SELECT COUNT(*)::int AS n FROM analytics_events WHERE ${win}`, [days]),
      this.scalarN(`SELECT COUNT(*)::int AS n FROM analytics_events WHERE ${prev}`, [days]),
      this.scalarN(
        `SELECT COUNT(*)::int AS n FROM analytics_events WHERE "eventName" = 'page_viewed' AND ${win}`,
        [days]
      ),
      this.scalarN(
        `SELECT COUNT(DISTINCT ${actor})::int AS n FROM analytics_events WHERE "serverTs" > now() - interval '1 day'`
      ),
      this.scalarN(`SELECT COUNT(*)::int AS n FROM users WHERE role != 'admin'`),
      this.scalarN(`SELECT COUNT(*)::int AS n FROM guest_users`),
      this.scalarN(
        `SELECT COUNT(*)::int AS n FROM guest_users WHERE "createdAt" > now() - ($1::int * interval '1 day')`,
        [days]
      ),
      repo.query(
        `SELECT
           SUM(CASE WHEN properties->>'voteType' = 'like' THEN 1 ELSE 0 END)::int AS likes,
           SUM(CASE WHEN properties->>'voteType' = 'dislike' THEN 1 ELSE 0 END)::int AS dislikes
         FROM analytics_events WHERE "eventName" = 'joke_voted' AND ${win}`,
        [days]
      ),
      this.scalarN(
        `SELECT COUNT(*)::int AS n FROM analytics_events WHERE "eventName" = 'joke_viewed' AND ${win}`,
        [days]
      ),
      this.scalarN(
        `SELECT COUNT(*)::int AS n FROM analytics_events WHERE "eventName" = 'joke_shared' AND ${win}`,
        [days]
      ),
      this.scalarN(
        `SELECT COUNT(*)::int AS n FROM newsletter_subscribers WHERE unsubscribed = false`
      ),
      this.scalarN(
        `SELECT COUNT(*)::int AS n FROM newsletter_subscribers WHERE "createdAt" > now() - ($1::int * interval '1 day')`,
        [days]
      ),
      this.scalarN(`SELECT COUNT(*)::int AS n FROM comments`),
      repo.query(
        `SELECT AVG((properties->>'percentage')::float)::float AS pct,
                AVG((properties->>'timeTaken')::float)::float AS secs
         FROM analytics_events
         WHERE "eventName" = 'session_completed' AND module = 'quiz-mcq' AND ${win}`,
        [days]
      ),
      repo.query(
        `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
                COALESCE(ev.events, 0)::int AS events,
                COALESCE(ev.views, 0)::int AS "pageViews",
                COALESCE(ev.actors, 0)::int AS "activeUsers"
         FROM generate_series(CURRENT_DATE - (($1::int - 1) * interval '1 day'), CURRENT_DATE, interval '1 day') AS d(day)
         LEFT JOIN (
           SELECT date_trunc('day', "serverTs") AS day,
                  COUNT(*)::int AS events,
                  COUNT(*) FILTER (WHERE "eventName" = 'page_viewed')::int AS views,
                  COUNT(DISTINCT ${actor})::int AS actors
           FROM analytics_events
           WHERE ${win}
           GROUP BY 1
         ) ev ON ev.day = d.day
         ORDER BY d.day`,
        [days]
      ),
      repo.query(
        `SELECT page AS label, COUNT(*)::int AS count FROM analytics_events
         WHERE page IS NOT NULL AND ${win} GROUP BY 1 ORDER BY count DESC LIMIT 10`,
        [days]
      ),
      repo.query(
        `SELECT "eventName" AS label, COUNT(*)::int AS count FROM analytics_events
         WHERE ${win} GROUP BY 1 ORDER BY count DESC LIMIT 15`,
        [days]
      ),
      repo.query(
        `SELECT COALESCE("referrerDomain", 'direct/none') AS label, COUNT(*)::int AS count
         FROM analytics_events WHERE ${win} GROUP BY 1 ORDER BY count DESC LIMIT 10`,
        [days]
      ),
      repo.query(
        `SELECT COALESCE(country, 'Unknown') AS label, COUNT(*)::int AS events,
                COUNT(DISTINCT ${actor})::int AS visitors
         FROM analytics_events WHERE ${win} GROUP BY 1 ORDER BY events DESC LIMIT 15`,
        [days]
      ),
      repo.query(
        `SELECT COALESCE(country, 'Unknown') || ' / ' || COALESCE(city, 'Unknown') AS label,
                COUNT(*)::int AS count
         FROM analytics_events WHERE ${win} GROUP BY 1 ORDER BY count DESC LIMIT 15`,
        [days]
      ),
      repo.query(
        `SELECT COALESCE("deviceType", 'unknown') AS label, COUNT(*)::int AS count
         FROM analytics_events WHERE ${win} GROUP BY 1 ORDER BY count DESC`,
        [days]
      ),
      repo.query(
        `SELECT COALESCE("browser", 'Unknown') AS label, COUNT(*)::int AS count
         FROM analytics_events WHERE ${win} GROUP BY 1 ORDER BY count DESC LIMIT 10`,
        [days]
      ),
      repo.query(
        `SELECT COALESCE("os", 'Unknown') AS label, COUNT(*)::int AS count
         FROM analytics_events WHERE ${win} GROUP BY 1 ORDER BY count DESC LIMIT 10`,
        [days]
      ),
      repo.query(
        `SELECT properties->>'metric' AS metric,
                AVG((properties->>'value')::float)::float AS avg,
                percentile_cont(0.75) WITHIN GROUP (ORDER BY (properties->>'value')::float) AS p75,
                COUNT(*)::int AS samples
         FROM analytics_events
         WHERE "eventName" = 'web_vitals' AND properties->>'metric' IS NOT NULL AND ${win}
         GROUP BY 1`,
        [days]
      ),
      repo.query(
        `SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(s.n, 0)::int AS count
         FROM generate_series(CURRENT_DATE - (($1::int - 1) * interval '1 day'), CURRENT_DATE, interval '1 day') AS d(day)
         LEFT JOIN (
           SELECT date_trunc('day', "serverTs") AS day, COUNT(*)::int AS n
           FROM analytics_events
           WHERE "eventName" = 'user_registered' AND ${win} GROUP BY 1
         ) s ON s.day = d.day ORDER BY d.day`,
        [days]
      ),
      repo.query(
        `SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(l.n, 0)::int AS count
         FROM generate_series(CURRENT_DATE - (($1::int - 1) * interval '1 day'), CURRENT_DATE, interval '1 day') AS d(day)
         LEFT JOIN (
           SELECT date_trunc('day', "serverTs") AS day, COUNT(*)::int AS n
           FROM analytics_events
           WHERE "eventName" = 'user_login' AND ${win} GROUP BY 1
         ) l ON l.day = d.day ORDER BY d.day`,
        [days]
      ),
      repo.query(
        `SELECT "eventName", COUNT(*)::int AS count FROM analytics_events
         WHERE module = 'image-riddles' AND ${win} GROUP BY 1`,
        [days]
      ),
      moduleDashboard('quiz-mcq'),
      moduleDashboard('riddle-mcq'),
    ]);

    const irEvents = new Map(
      (imageRiddles as { eventName: string; count: number }[]).map((r) => [
        r.eventName,
        Number(r.count),
      ])
    );
    const votes = jokeVotes[0] ?? {};

    return {
      range: { days },
      kpis: {
        events,
        eventsPrev,
        pageViews,
        dau,
        sessionsCompleted: quiz.sessionsCompleted + riddle.sessionsCompleted,
        registeredUsers,
        guestUsers,
        newGuests,
        achievementsUnlocked: quiz.achievementsUnlocked ?? 0,
        jokeLikes: Number(votes.likes ?? 0),
        jokeDislikes: Number(votes.dislikes ?? 0),
        newsletterSubscribers,
        newsletterNew,
        commentsTotal,
        avgQuizScorePct: quizMeta[0]?.pct != null ? Math.round(Number(quizMeta[0].pct)) : null,
        avgQuizSeconds: quizMeta[0]?.secs != null ? Math.round(Number(quizMeta[0].secs)) : null,
      },
      dailySeries: daily,
      topPages: topPages,
      topEvents: topEvents,
      topReferrers: topReferrers,
      geo: { byCountry, byCity },
      devices: { byType, byBrowser, byOs },
      webVitals: (webVitals as { metric: string; avg: number; p75: number; samples: number }[]).map(
        (r) => ({
          metric: r.metric,
          avg: Math.round(Number(r.avg ?? 0)),
          p75: Math.round(Number(r.p75 ?? 0)),
          samples: Number(r.samples ?? 0),
        })
      ),
      users: {
        signupsByDay: signupsByDay,
        loginsByDay: loginsByDay,
      },
      modules: {
        'quiz-mcq': quiz,
        'riddle-mcq': riddle,
        'image-riddles': {
          answerChecked: irEvents.get('image_riddle_answer_checked') ?? 0,
          hintShown: irEvents.get('image_riddle_hint_shown') ?? 0,
          gaveUp: irEvents.get('image_riddle_gave_up') ?? 0,
          shared: irEvents.get('image_riddle_riddle_shared') ?? 0,
        },
        jokes: {
          viewed: jokeViews,
          liked: Number(votes.likes ?? 0),
          disliked: Number(votes.dislikes ?? 0),
          shared: jokeShares,
        },
      },
    };
  }

  /** scalar() variant with query parameters. */
  private async scalarN(sql: string, params: unknown[] = []): Promise<number> {
    const res = await this.eventRepo.query(sql, params);
    const val = Array.isArray(res) ? res[0]?.[Object.keys(res[0] ?? {})[0]] : undefined;
    return Number(val ?? 0);
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
