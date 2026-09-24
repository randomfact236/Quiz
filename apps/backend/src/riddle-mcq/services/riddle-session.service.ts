import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RiddleSession } from '../entities/riddle-session.entity';

/** NOW-07: riddle session persistence — the quiz_sessions mirror. */

export interface CreateRiddleSessionPayload {
  guestId?: string | null;
  subjectSlug?: string | null;
  subjectName?: string | null;
  difficulty?: string | null;
  mode?: string | null;
  totalRiddles: number;
  correctCount: number;
  score: number;
  maxScore: number;
  timeTaken?: number | null;
  startedAt?: string | null;
}

const clampInt = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.trunc(value) || 0));

@Injectable()
export class RiddleSessionService {
  private readonly logger = new Logger(RiddleSessionService.name);

  constructor(
    @InjectRepository(RiddleSession)
    private readonly sessionRepo: Repository<RiddleSession>
  ) {}

  async createSession(
    payload: CreateRiddleSessionPayload,
    userId: string | null
  ): Promise<RiddleSession> {
    if (payload.correctCount > payload.totalRiddles) {
      throw new BadRequestException('correctCount cannot exceed totalRiddles');
    }
    if (payload.score > payload.maxScore) {
      throw new BadRequestException('score cannot exceed maxScore');
    }
    const session = this.sessionRepo.create({
      userId: userId ?? null,
      guestId: payload.guestId ?? null,
      subjectSlug: payload.subjectSlug ?? null,
      subjectName: payload.subjectName ?? null,
      difficulty: payload.difficulty ?? null,
      mode: payload.mode ?? null,
      totalRiddles: clampInt(payload.totalRiddles, 1, 100),
      correctCount: clampInt(payload.correctCount, 0, 100),
      score: clampInt(payload.score, 0, 1_000_000),
      maxScore: clampInt(payload.maxScore, 0, 1_000_000),
      timeTaken: payload.timeTaken != null ? clampInt(payload.timeTaken, 0, 86400) : null,
      startedAt: payload.startedAt ? new Date(payload.startedAt) : new Date(),
      completedAt: new Date(),
    });
    return this.sessionRepo.save(session);
  }

  async history(identity: {
    userId: string | null;
    guestId: string | null;
  }): Promise<RiddleSession[]> {
    if (!identity.userId && !identity.guestId) return [];
    const query = this.sessionRepo
      .createQueryBuilder('r')
      .orderBy('r.completedAt', 'DESC')
      .limit(50);
    if (identity.userId) {
      query.where('r.userId = :id', { id: identity.userId });
    } else {
      query.where('r.guestId = :id', { id: identity.guestId });
    }
    return query.getMany();
  }

  async highScores(identity: { userId: string | null; guestId: string | null }) {
    if (!identity.userId && !identity.guestId) return [];
    const query = this.sessionRepo
      .createQueryBuilder('r')
      .select('r.subjectSlug', 'subjectSlug')
      .addSelect('MAX(r.score)', 'bestScore');
    if (identity.userId) {
      query.andWhere('r.userId = :id', { id: identity.userId });
    } else {
      query.andWhere('r.guestId = :id', { id: identity.guestId });
    }
    return query.groupBy('r.subjectSlug').orderBy('bestScore', 'DESC').limit(50).getRawMany();
  }
}
