import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Gomoku match (plan/games/02 — the empty-board family's third duel
 * backend, cloned from /tictactoe). Server-authoritative: every stone is
 * validated and applied here, the frontend syncs with the same 3-second poll.
 * One match per round.
 */
@Entity('gomoku_matches')
@Index(['code'], { unique: true })
export class GomokuMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 6-char join code (no I/1/O/0). */
  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** 15 standard | 11 quick — the board is size*size cells. */
  @Column({ type: 'int' })
  size: number;

  /** Array(size*size) of null | 'B' | 'W', row-major, row 0 = TOP. Black opens. */
  @Column({ type: 'jsonb' })
  board: (string | null)[];

  @Column({ type: 'varchar', length: 1 })
  turn: string;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  @Column({ type: 'varchar', length: 64 })
  bGuestId: string;

  @Column({ type: 'varchar', length: 32 })
  bName: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  wGuestId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  wName: string | null;

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
