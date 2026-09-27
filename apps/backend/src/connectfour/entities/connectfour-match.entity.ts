import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Connect Four match (plan/games/01 — the empty-board family's second
 * duel backend, cloned from /tictactoe). Server-authoritative: the server
 * applies gravity, validates the turn, and resolves the win — the frontend
 * syncs with the same 3-second poll. One round per match.
 */
@Entity('connectfour_matches')
@Index(['code'], { unique: true })
export class ConnectFourMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 6-char join code (no I/1/O/0). */
  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** Array(42) of null | 'R' | 'Y', row-major, row 0 = TOP. Red (creator) opens. */
  @Column({ type: 'jsonb' })
  board: (string | null)[];

  @Column({ type: 'varchar', length: 1 })
  turn: string;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  @Column({ type: 'varchar', length: 64 })
  rGuestId: string;

  @Column({ type: 'varchar', length: 32 })
  rName: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  yGuestId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  yName: string | null;

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
