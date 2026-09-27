import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Async game challenge (plan/18 §6 phase 4): a player posts a finished run
 * (score / seed / duration) and gets a shareable token; the friend opens the
 * game with ?challenge=<token>, plays the same board where a seed exists,
 * and posts their own run back. No live match row — one lightweight record.
 */
@Entity('game_challenges')
@Index(['gameSlug'])
export class GameChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Link-friendly id (?challenge=<token>), 20 chars, no I/1/O/0. */
  @Column({ type: 'varchar', length: 24, unique: true })
  token: string;

  /** Slug under /games/<slug>/ (e.g. 'word-puzzle'). */
  @Column({ type: 'varchar', length: 48 })
  gameSlug: string;

  /** Same-board parameters: { seed, level, daily?, note? } — never secret. */
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 32 })
  challengerName: string;

  /** Authorizes the creator's own run updates; never shown in views. */
  @Column({ type: 'varchar', length: 64 })
  challengerGuestId: string;

  /** The run being challenged: { score, durationMs, moves, detail }. */
  @Column({ type: 'jsonb' })
  challengeRun: Record<string, unknown>;

  /** Accepted runs, one per guest (replaced when the same guest replays). */
  @Column({ type: 'jsonb', default: '[]' })
  runs: Record<string, unknown>[];

  @CreateDateColumn()
  createdAt: Date;

  /** Challenges are links — two weeks, then the view says it expired. */
  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
