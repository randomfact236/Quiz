import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { DuelMatch } from './duel-match.entity';

/**
 * One participant of a duel match. Unique per (match, guest) — a guest cannot
 * join the same match twice. `lastPolledAt` doubles as the leave heartbeat:
 * 30 s of silence while the match is running voids the match (no resume).
 */
@Entity('duel_participants')
@Unique('UQ_duel_participant', ['matchId', 'guestId'])
@Index(['guestId'])
export class DuelParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  matchId: string;

  @ManyToOne(() => DuelMatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: DuelMatch;

  @Column()
  guestId: string;

  /** Self-chosen nickname shown to the opponent. */
  @Column({ type: 'varchar', length: 32 })
  playerName: string;

  /** 1 = creator, 2 = challenger. */
  @Column({ type: 'smallint' })
  slot: number;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'integer', default: 0 })
  completedCount: number;

  @Column({ type: 'integer', default: 0 })
  correctCount: number;

  @Column({ type: 'integer', default: 0 })
  score: number;

  @Column({ type: 'integer', nullable: true })
  durationMs: number | null;

  /** Leave-heartbeat: refreshed by the progress poll. */
  @Column({ type: 'timestamptz', nullable: true })
  lastPolledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
