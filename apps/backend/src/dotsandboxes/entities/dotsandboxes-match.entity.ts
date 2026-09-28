import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Dots and Boxes match (plan/games/03 — the chain-strategy game).
 * Server-authoritative: the server applies each edge, resolves box claims
 * AND the extra turn (the turn does not simply flip on a claim), and the
 * frontend syncs with the same 3-second poll as the other duels.
 */
@Entity('dotsandboxes_matches')
@Index(['code'], { unique: true })
export class DotsAndBoxesMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 6-char join code (no I/1/O/0). */
  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** 3 | 4 | 5 boxes per side. */
  @Column({ type: 'int' })
  size: number;

  /** Array(2n(n+1)) of 0 (free) | 1 | 2 — the drawn lines. */
  @Column({ type: 'jsonb' })
  edges: number[];

  /** Array(n*n) of 0 (open) | 1 | 2 — claimed boxes. */
  @Column({ type: 'jsonb' })
  owners: number[];

  /** 1 (🔴 Red, creator, opens) | 2 (🔵 Blue). */
  @Column({ type: 'int' })
  turn: number;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  @Column({ type: 'int', default: 0 })
  rScore: number;

  @Column({ type: 'int', default: 0 })
  bScore: number;

  @Column({ type: 'int', nullable: true })
  winner: number | null;

  @Column({ type: 'boolean', default: false })
  draw: boolean;

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
