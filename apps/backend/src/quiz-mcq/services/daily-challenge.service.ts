import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CacheService } from '../../common/cache/cache.service';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { DailyChallengeResult } from '../entities/daily-challenge-result.entity';
import { Question } from '../entities/question.entity';

/** NOW-08 Daily Challenge — deterministic per-date set + one-attempt results. */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAILY_SIZE = 10;
const DAY_SET_TTL_S = 6 * 3600;
/** Cap the date walk for streak math (a daily player hits this after ~1 year). */
const STREAK_LOOKBACK_DAYS = 400;

interface DailyIdentity {
  userId: string | null;
  guestId: string | null;
}

export interface DailyResultPayload {
  score: number;
  correctCount: number;
  total: number;
}

@Injectable()
export class DailyChallengeService {
  private readonly logger = new Logger(DailyChallengeService.name);

  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(DailyChallengeResult)
    private readonly resultRepo: Repository<DailyChallengeResult>,
    private readonly cacheService: CacheService
  ) {}

  /** Validates a client-supplied date; falls back to the server's UTC day. */
  resolveDate(date?: string): string {
    if (!date) return new Date().toISOString().slice(0, 10);
    if (!DATE_RE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    return date;
  }

  /**
   * The day's set: deterministic per date so EVERY visitor sees the same ten
   * questions (seeded order via md5(id + ':daily:<date>') — the games' daily
   * board pattern). Key-free public payloads (H1); cached in redis for the day.
   */
  async getDailySet(date: string): Promise<{ date: string; questions: Record<string, unknown>[] }> {
    const day = this.resolveDate(date);
    return this.cacheService.getOrSet(
      `quiz:daily:${day}`,
      async () => {
        const rows = await this.questionRepo
          .createQueryBuilder('q')
          .select('q.id', 'id')
          .addSelect('md5(q.id || :salt)', 'h')
          .where('q.status = :status', { status: ContentStatus.PUBLISHED })
          .setParameter('salt', `daily:${day}`)
          .orderBy('h', 'ASC')
          .limit(DAILY_SIZE)
          .getRawMany();
        const ids = rows.map((row) => row.id as string);
        if (ids.length === 0) return { date: day, questions: [] };
        const questions = await this.questionRepo.find({ where: { id: In(ids) } });
        const byId = new Map(questions.map((q) => [q.id, q]));
        const ordered = ids.map((id) => byId.get(id)).filter((q): q is Question => Boolean(q));
        // Same strip contract as QuizMcqController.toPublicQuestion (H1).
        return {
          date: day,
          questions: ordered.map(({ correctAnswer, correctLetter, ...safe }) => safe),
        };
      },
      DAY_SET_TTL_S
    );
  }

  /** Today's result + current/best streak for the caller (user or guest). */
  async getStatus(
    date: string,
    identity: DailyIdentity
  ): Promise<{
    date: string;
    played: boolean;
    streak: number;
    bestStreak: number;
    result: DailyResultPayload | null;
  }> {
    const day = this.resolveDate(date);
    const empty = { date: day, played: false, streak: 0, bestStreak: 0, result: null };
    if (!identity.userId && !identity.guestId) return empty;

    const existing = await this.findResult(day, identity);
    const dates = await this.identityDates(identity);
    const { current, best } = computeStreaks(dates, day);
    return {
      date: day,
      played: Boolean(existing),
      streak: current,
      bestStreak: best,
      result: existing
        ? {
            score: existing.score,
            correctCount: existing.correctCount,
            total: existing.total,
          }
        : null,
    };
  }

  /** Records the day's attempt (one per identity per date — partial unique indexes). */
  async submitResult(
    date: string,
    payload: DailyResultPayload,
    identity: DailyIdentity
  ): Promise<{
    recorded: boolean;
    alreadyPlayed: boolean;
    streak: number;
    bestStreak: number;
  }> {
    const day = this.resolveDate(date);
    if (!identity.userId && !identity.guestId) {
      // Same convention as sessions: nothing to attribute to — accept, don't store.
      return { recorded: false, alreadyPlayed: false, streak: 0, bestStreak: 0 };
    }
    const existing = await this.findResult(day, identity);
    if (!existing) {
      try {
        await this.resultRepo.insert({
          date: day,
          userId: identity.userId,
          guestId: identity.guestId,
          score: Math.max(0, Math.trunc(payload.score)),
          correctCount: Math.max(0, Math.trunc(payload.correctCount)),
          total: Math.max(1, Math.trunc(payload.total)),
        });
      } catch (error) {
        // Lost a race against the same identity's first submit — the unique
        // indexes keep one row per day; treat as already played.
        this.logger.warn(`Daily result insert raced for ${day}: ${(error as Error).message}`);
      }
    }
    const dates = await this.identityDates(identity);
    const { current, best } = computeStreaks(dates, day);
    return { recorded: true, alreadyPlayed: Boolean(existing), streak: current, bestStreak: best };
  }

  private findResult(day: string, identity: DailyIdentity): Promise<DailyChallengeResult | null> {
    return this.resultRepo.findOne({
      where: identity.userId
        ? { date: day, userId: identity.userId }
        : { date: day, guestId: identity.guestId ?? '' },
    });
  }

  private identityDates(identity: DailyIdentity): Promise<string[]> {
    const query = this.resultRepo
      .createQueryBuilder('r')
      // to_char: pg otherwise returns `date` columns as Date objects (raw
      // queries skip TypeORM's string transform), which would break the
      // 'YYYY-MM-DD' set lookups in computeStreaks.
      .select("to_char(r.date, 'YYYY-MM-DD')", 'date')
      .orderBy('r.date', 'DESC')
      .limit(STREAK_LOOKBACK_DAYS);
    if (identity.userId) {
      void query.andWhere('r.userId = :id', { id: identity.userId });
    } else {
      void query.andWhere('r.guestId = :id', { id: identity.guestId ?? '' });
    }
    return query.getRawMany().then((rows) => rows.map((row) => String(row.date)));
  }
}

/** Consecutive-day streaks over a DESC-sorted date list, anchored at `today`. */
function computeStreaks(dates: string[], today: string): { current: number; best: number } {
  const set = new Set(dates);
  const dayBefore = (iso: string) =>
    new Date(new Date(`${iso}T00:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10);

  // Current streak: consecutive days ending today, or yesterday when today is
  // unplayed (streak alive but at risk — the standard daily-game display).
  let current = 0;
  let cursor = set.has(today) ? today : dayBefore(today);
  while (cursor && set.has(cursor)) {
    current += 1;
    cursor = dayBefore(cursor);
  }

  // Best streak: longest consecutive run inside the fetched window.
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of [...set].sort()) {
    run = previous !== null && dayBefore(day) === previous ? run + 1 : 1;
    previous = day;
    if (run > best) best = run;
  }
  return { current, best };
}
