import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Pig Dice match (plan/games/05 — the luck entry). The SERVER generates
 * every roll (crypto RNG), so neither client can influence the die; the client
 * only sends roll/hold. Same tictactoe duel pattern otherwise: 6-char codes,
 * 3-second poll, guest-token guarded.
 */
@Entity('pigmatches')
@Index(['code'], { unique: true })
export class PigDiceMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'running' })
  status: string;

  /** 1 (🔴 Red, creator, opens) | 2 (🔵 Blue). */
  @Column({ type: 'int' })
  turn: number;

  /** Banked scores per side. */
  @Column({ type: 'int', default: 0 })
  rScore: number;

  @Column({ type: 'int', default: 0 })
  yScore: number;

  /** The live turn pot (belongs to whoever is on turn). */
  @Column({ type: 'int', default: 0 })
  pot: number;

  /** 50 quick | 100 standard. */
  @Column({ type: 'int', default: 100 })
  target: number;

  /** The last roll the server produced (for the reveal animation / notice). */
  @Column({ type: 'int', nullable: true })
  lastRoll: number | null;

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
