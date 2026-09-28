import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Rock Paper Scissors match (plan/games/07 — the 60-second quickfire
 * duel). Picks are SIMULTANEOUS: each player stores their throw for the
 * round, the server resolves only when BOTH are in, and the reveal goes out
 * together — no second-mover cheating. Server-authoritative, tictactoe
 * pattern otherwise.
 */
@Entity('rpsmatches')
@Index(['code'], { unique: true })
export class RpsMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'running' })
  status: string;

  /** Round wins per side — first to 3 takes the match. */
  @Column({ type: 'int', default: 0 })
  rWins: number;

  @Column({ type: 'int', default: 0 })
  yWins: number;

  /** This round's locked picks: 'R' | 'P' | 'S' | null. */
  @Column({ type: 'varchar', length: 1, nullable: true })
  rPick: string | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  yPick: string | null;

  @Column({ type: 'int', default: 1 })
  roundNo: number;

  /** The revealed round: { r, y, result: 'R' | 'Y' | 'tie' } */
  @Column({ type: 'jsonb', nullable: true })
  lastRound: { r: string; y: string; result: string } | null;

  @Column({ type: 'int', nullable: true })
  winner: number | null;

  @Column({ type: 'varchar', length: 64 })
  rGuestId: string;

  @Column({ type: 'varchar', length: 32 })
  rName: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  yGuestId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  yName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
