import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Battleship Lite match (plan/games/04 — the hidden-information game
 * where the fleet is PLAYER-CREATED). Server-authoritative: the server holds
 * both fleets, validates every placement and shot, and the read view is
 * REDACTED per player (the enemy fleet never crosses the API — plan §7).
 */
@Entity('bsmatches')
@Index(['code'], { unique: true })
export class BattleshipMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 6-char join code (no I/1/O/0). */
  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** placing | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'placing' })
  status: string;

  /** 1 (🔴 Red, creator, opens) | 2 (🔵 Blue). */
  @Column({ type: 'int' })
  turn: number;

  /** The player's own fleet: [{cells:number[]}] × 3, or null until placed. */
  @Column({ type: 'jsonb', nullable: true })
  rFleet: { cells: number[] }[] | null;

  @Column({ type: 'jsonb', nullable: true })
  bFleet: { cells: number[] }[] | null;

  /** Shots each player FIRED at the enemy (64: 0 none | 1 hit). */
  @Column({ type: 'jsonb' })
  rShots: number[];

  @Column({ type: 'jsonb' })
  bShots: number[];

  /** Shots received on each side (64: 0 none | 1 miss | 2 hit). */
  @Column({ type: 'jsonb' })
  rIncoming: number[];

  @Column({ type: 'jsonb' })
  bIncoming: number[];

  @Column({ type: 'int', nullable: true })
  winner: number | null;

  @Column({ type: 'varchar', length: 64 })
  rGuestId: string;

  @Column({ type: 'varchar', length: 32 })
  rName: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  bGuestId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  bName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
