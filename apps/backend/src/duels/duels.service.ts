import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';

import { Question } from '../quiz-mcq/entities/question.entity';
import { GuestUser } from '../guest-users/entities/guest-user.entity';
import { DuelMatch } from './entities/duel-match.entity';
import { DuelParticipant } from './entities/duel-participant.entity';

const MATCH_TTL_MS = 10 * 60 * 1000; // match expires 10 min after creation
const POLL_HEARTBEAT_MS = 30 * 1000; // silence while running voids the match
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0 confusion

@Injectable()
export class DuelsService {
  constructor(
    @InjectRepository(DuelMatch)
    private readonly matches: Repository<DuelMatch>,
    @InjectRepository(DuelParticipant)
    private readonly participants: Repository<DuelParticipant>,
    @InjectRepository(Question)
    private readonly questions: Repository<Question>,
    @InjectRepository(GuestUser)
    private readonly guests: Repository<GuestUser>
  ) {}

  // ---- creation / joining -------------------------------------------------

  async createMatch(input: {
    level: string;
    questionCount: number;
    playerName: string;
    guestId: string;
    challengeGuestId?: string | null;
  }): Promise<{ match: DuelMatch; code: string }> {
    const count = Math.min(Math.max(input.questionCount || 10, 3), 20);
    const picked = await this.questions
      .createQueryBuilder('q')
      .where('q.level = :level', { level: input.level })
      .andWhere('q.status = :status', { status: 'published' })
      .orderBy('random()')
      .limit(count)
      .getMany();
    if (picked.length === 0) {
      throw new NotFoundException(`No published questions for level "${input.level}"`);
    }

    const match = await this.matches.save(
      this.matches.create({
        code: await this.generateCode(),
        level: input.level,
        questionIds: picked.map((q) => q.id),
        status: 'waiting',
        expiresAt: new Date(Date.now() + MATCH_TTL_MS),
      })
    );

    await this.participants.save(
      this.participants.create({
        matchId: match.id,
        guestId: input.guestId,
        playerName: input.playerName,
        slot: 1,
      })
    );

    if (input.challengeGuestId && input.challengeGuestId !== input.guestId) {
      // Targeted invite: a hint row so the challenger's poll finds it. The
      // invite is just the (code, challenger) pair — joining still binds the
      // second slot.
      await this.participants.save(
        this.participants.create({
          matchId: match.id,
          guestId: input.challengeGuestId,
          playerName: '__invited__',
          slot: 2,
        })
      );
    }

    return { match, code: match.code };
  }

  async joinByCode(
    code: string,
    input: { playerName: string; guestId: string }
  ): Promise<{ status: string; level: string; questions: unknown[]; total: number }> {
    const match = await this.requireJoinableMatch(code);
    const existing = await this.participants.findOne({
      where: { matchId: match.id, guestId: input.guestId },
    });

    if (!existing) {
      const taken = await this.participants.count({ where: { matchId: match.id } });
      if (taken >= 2) {
        throw new ForbiddenException('This match is already full.');
      }
      await this.participants.save(
        this.participants.create({
          matchId: match.id,
          guestId: input.guestId,
          playerName: input.playerName,
          slot: taken + 1,
        })
      );
    } else if (existing.playerName === '__invited__') {
      // Targeted-invite placeholder: claim it with the real name.
      await this.participants.update(existing.id, { playerName: input.playerName });
    }

    await this.startMatch(match.id);
    return this.buildJoinedView(match, input.guestId);
  }

  // ---- playing -------------------------------------------------------------

  /** Progress poll — doubles as the leave heartbeat (30 s silence = void). */
  async pollMatch(code: string, guestId: string): Promise<unknown> {
    const match = await this.requireMatchByCode(code);
    const me = await this.requireParticipant(match.id, guestId);
    await this.participants.query(
      `UPDATE duel_participants SET "lastPolledAt" = now() WHERE id = $1`,
      [me.id]
    );
    await this.enforceSilenceRule(match);

    const fresh = await this.requireMatchByCode(code);
    const rows = await this.participants.find({ where: { matchId: fresh.id } });
    const opponent = rows.find((row) => row.guestId !== guestId) ?? null;
    const meRow = rows.find((row) => row.guestId === guestId) ?? me;
    const revealed = fresh.status === 'finished' || fresh.status === 'abandoned';

    return {
      status: fresh.status,
      total: fresh.questionIds.length,
      level: fresh.level,
      me: this.participantView(meRow, revealed),
      opponent: opponent
        ? {
            playerName: opponent.playerName === '__invited__' ? null : opponent.playerName,
            completed: revealed
              ? opponent.completedCount
              : Math.min(opponent.completedCount, fresh.questionIds.length),
            // Correct counts, score and time only after the match resolves.
            ...(revealed
              ? {
                  correct: opponent.correctCount,
                  score: opponent.score,
                  durationMs: opponent.durationMs,
                  finishedAt: opponent.finishedAt,
                }
              : {}),
          }
        : null,
    };
  }

  async recordProgress(code: string, guestId: string, completed: number): Promise<void> {
    const match = await this.requireLiveMatch(code);
    const me = await this.requireParticipant(match.id, guestId);
    const capped = Math.max(0, Math.min(completed, match.questionIds.length));
    await this.participants.update(me.id, { completedCount: capped });
    await this.participants.query(
      `UPDATE duel_participants SET "lastPolledAt" = now() WHERE id = $1`,
      [me.id]
    );
  }

  /** Server-side grading (owner decision): answers never leave the server. */
  async gradeAnswer(
    code: string,
    guestId: string,
    input: { questionId: string; selected: string }
  ): Promise<{ correct: boolean; completed: number }> {
    const match = await this.requireLiveMatch(code);
    const me = await this.requireParticipant(match.id, guestId);
    if (!match.questionIds.includes(input.questionId)) {
      throw new BadRequestException('That question is not part of this match.');
    }

    const question = await this.questions.findOne({ where: { id: input.questionId } });
    if (!question) throw new NotFoundException('Question not found.');

    const selected = input.selected.trim().toUpperCase();
    const letter = (question.correctLetter ?? '').trim().toUpperCase();
    const correct =
      letter !== ''
        ? selected === letter
        : selected !== '' && question.correctAnswer.trim().toUpperCase() === selected;

    const completedCount = Math.min(me.completedCount + 1, match.questionIds.length);
    await this.participants.update(me.id, {
      completedCount,
      correctCount: me.correctCount + (correct ? 1 : 0),
      score: me.score + (correct ? 1 : 0),
    });
    await this.participants.query(
      `UPDATE duel_participants SET "lastPolledAt" = now() WHERE id = $1`,
      [me.id]
    );
    return { correct, completed: completedCount };
  }

  /** Finishing just signals completion — the server computes the results. */
  async finishMatch(code: string, guestId: string): Promise<unknown> {
    const match = await this.requireLiveMatch(code);
    const me = await this.requireParticipant(match.id, guestId);
    const startedRows: { started: string | null }[] = await this.participants.query(
      `SELECT EXTRACT(EPOCH FROM (now() - "startedAt")) * 1000 AS started FROM duel_participants WHERE id = $1`,
      [me.id]
    );
    const durationMs =
      startedRows[0]?.started != null ? Math.round(Number(startedRows[0].started)) : null;
    await this.participants.query(
      `UPDATE duel_participants
       SET "finishedAt" = now(), "durationMs" = $2,
           "completedCount" = $3, "lastPolledAt" = now()
       WHERE id = $1`,
      [me.id, durationMs ?? 0, me.completedCount]
    );

    const rows = await this.participants.find({ where: { matchId: match.id } });
    const opponentDone = rows.every((row) => row.finishedAt !== null);
    if (opponentDone || rows.length < 2) {
      await this.matches.update(match.id, { status: 'finished' });
    }
    return this.pollMatch(code, guestId);
  }

  /** Leaving voids the match for both players — no mid-match resume. */
  async leaveMatch(code: string, guestId: string): Promise<void> {
    const match = await this.requireMatchByCode(code);
    if (match.status === 'running' || match.status === 'waiting') {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  // ---- invites -------------------------------------------------------------

  async pendingInvites(guestId: string): Promise<unknown[]> {
    await this.expireStaleMatches();
    const rows = await this.participants.find({
      where: { guestId, playerName: '__invited__' },
    });
    if (rows.length === 0) return [];

    const matches = await this.matches.find({
      where: { id: In(rows.map((row) => row.matchId)), status: 'waiting' },
    });
    const byId = new Map(matches.map((match) => [match.id, match]));

    const invites: unknown[] = [];
    for (const row of rows) {
      const match = byId.get(row.matchId);
      if (!match) continue;
      const creator = await this.participants.findOne({
        where: { matchId: match.id, slot: 1 },
      });
      invites.push({
        matchId: match.id,
        code: match.code,
        level: match.level,
        challengerName: creator?.playerName ?? 'A player',
        total: match.questionIds.length,
      });
    }
    return invites;
  }

  // ---- presence ------------------------------------------------------------

  async onlineSummary(): Promise<{ onlineCount: number }> {
    // Freshness via the DATABASE clock (raw SQL) — immune to the driver's
    // timezone interpretation of naive timestamp columns (observed +05:45 skew).
    const rows: { count: string }[] = await this.guests.query(
      `SELECT COUNT(*)::int AS count FROM guest_users
       WHERE "lastActive" > now() - interval '60 seconds'`
    );
    return { onlineCount: Number(rows[0]?.count ?? 0) };
  }

  async onlinePlayers(): Promise<unknown[]> {
    const rows: { guestId: string; displayName: string | null }[] = await this.guests.query(
      `SELECT "guestId", "displayName" FROM guest_users
         WHERE "showInList" = true AND "lastActive" > now() - interval '60 seconds'
         ORDER BY "lastActive" DESC LIMIT 50`
    );
    const busy: { guestId: string }[] = await this.participants.query(
      `SELECT "guestId" FROM duel_participants
       WHERE "lastPolledAt" > now() - interval '30 seconds'`
    );
    const busySet = new Set(busy.map((row) => row.guestId));
    return rows.map((row) => ({
      guestId: row.guestId,
      displayName: row.displayName ?? 'Player',
      inMatch: busySet.has(row.guestId),
    }));
  }

  async setDisplayName(guestId: string, displayName: string): Promise<void> {
    const guest = await this.guests.findOne({ where: { guestId } });
    if (!guest) {
      await this.guests.save(this.guests.create({ guestId, displayName }));
      return;
    }
    await this.guests.update(guest.id, { displayName });
  }

  async setShowInList(guestId: string, showInList: boolean): Promise<void> {
    const guest = await this.guests.findOne({ where: { guestId } });
    if (!guest) {
      await this.guests.save(this.guests.create({ guestId, showInList }));
      return;
    }
    await this.guests.update(guest.id, { showInList });
  }

  // ---- internals ------------------------------------------------------------

  private async generateCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      let code = '';
      for (let i = 0; i < 6; i += 1) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
      const clash = await this.matches.findOne({ where: { code } });
      if (!clash) return code;
    }
    throw new Error('Could not allocate a match code.');
  }

  private async startMatch(matchId: string): Promise<void> {
    const match = await this.matches.findOne({ where: { id: matchId } });
    if (!match || match.status !== 'waiting') return;
    // Only start once two real players exist (placeholder invite rows don't count).
    const realPlayers = await this.participants
      .createQueryBuilder('p')
      .where('p.matchId = :matchId', { matchId })
      .andWhere("p.playerName != '__invited__'")
      .getCount();
    if (realPlayers >= 2) {
      await this.matches.update(matchId, { status: 'running' });
      // Heartbeat starts at match start — a NULL lastPolledAt must not count
      // as silence (the silence window only applies to stalling mid-match).
      await this.participants.query(
        `UPDATE duel_participants
         SET "startedAt" = COALESCE("startedAt", now()), "lastPolledAt" = now()
         WHERE "matchId" = $1`,
        [matchId]
      );
    }
  }

  /** Silence rule: a player silent >30 s while running voids the match. */
  private async enforceSilenceRule(match: DuelMatch): Promise<void> {
    if (match.status !== 'running') return;
    // DB-clock comparison (see onlineSummary) — heartbeat is written with now().
    const silent: { count: string }[] = await this.participants.query(
      `SELECT COUNT(*)::int AS count FROM duel_participants
       WHERE "matchId" = $1 AND "finishedAt" IS NULL
         AND ("lastPolledAt" IS NULL OR "lastPolledAt" < now() - interval '30 seconds')`,
      [match.id]
    );
    if (Number(silent[0]?.count ?? 0) > 0) {
      await this.matches.update(match.id, { status: 'abandoned' });
    }
  }

  private async expireStaleMatches(): Promise<void> {
    await this.matches.update(
      { status: In(['waiting', 'running']), expiresAt: LessThan(new Date()) },
      { status: 'abandoned' }
    );
  }

  private participantView(row: DuelParticipant, revealed: boolean) {
    return {
      playerName: row.playerName,
      completed: row.completedCount,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      ...(revealed
        ? { correct: row.correctCount, score: row.score, durationMs: row.durationMs }
        : {}),
    };
  }

  private async buildJoinedView(match: DuelMatch, guestId: string) {
    const questions = await this.questions.find({
      where: { id: In(match.questionIds) },
      select: ['id', 'question', 'options', 'level'],
    });
    // Preserve the frozen order.
    const byId = new Map(questions.map((q) => [q.id, q]));
    const ordered = match.questionIds.map((id) => byId.get(id)).filter((q) => q !== undefined);
    void guestId;
    return { status: match.status, level: match.level, questions: ordered, total: ordered.length };
  }

  private async requireJoinableMatch(code: string): Promise<DuelMatch> {
    const match = await this.matches.findOne({ where: { code: code.toUpperCase() } });
    if (!match) throw new NotFoundException('Match not found.');
    await this.expireStaleMatches();
    const fresh = await this.matches.findOne({ where: { id: match.id } });
    if (!fresh || fresh.status !== 'waiting') {
      throw new ForbiddenException('This match is no longer joinable.');
    }
    return fresh;
  }

  private async requireMatchByCode(code: string): Promise<DuelMatch> {
    await this.expireStaleMatches();
    const match = await this.matches.findOne({ where: { code: code.toUpperCase() } });
    if (!match) throw new NotFoundException('Match not found.');
    return match;
  }

  private async requireLiveMatch(code: string): Promise<DuelMatch> {
    const match = await this.requireMatchByCode(code);
    if (match.status !== 'running' && match.status !== 'waiting') {
      throw new ForbiddenException('This match is no longer active.');
    }
    if (match.status === 'waiting') {
      await this.startMatch(match.id);
      const fresh = await this.matches.findOne({ where: { id: match.id } });
      if (fresh) return fresh;
    }
    return match;
  }

  private async requireParticipant(matchId: string, guestId: string): Promise<DuelParticipant> {
    const row = await this.participants.findOne({ where: { matchId, guestId } });
    if (!row) throw new ForbiddenException('You are not part of this match.');
    return row;
  }
}
