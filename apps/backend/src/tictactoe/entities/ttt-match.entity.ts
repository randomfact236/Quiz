import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live tic-tac-toe match (plan/18 phase 5 — the first realtime 2P game).
 * Server-authoritative: every move is validated and applied here, the board
 * never trusts the client, and the frontend syncs with the same 3-second
 * poll the duels use — no websockets.
 */
@Entity('ttt_matches')
@Index(['code'], { unique: true })
export class TttMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 6-char join code (same alphabet as duels — no I/1/O/0). */
  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** Array(9) of null | 'X' | 'O' — X (the creator) always opens. */
  @Column({ type: 'jsonb' })
  board: (string | null)[];

  @Column({ type: 'varchar', length: 1 })
  turn: string;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  @Column({ type: 'boolean', default: false })
  misere: boolean;

  @Column({ type: 'varchar', length: 64 })
  xGuestId: string;

  @Column({ type: 'varchar', length: 32 })
  xName: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  oGuestId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  oName: string | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  winner: string | null;

  @Column({ type: 'jsonb', nullable: true })
  winningLine: number[] | null;

  @Column({ type: 'boolean', default: false })
  draw: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
