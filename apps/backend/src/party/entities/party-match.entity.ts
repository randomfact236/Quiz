import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * MP1 (owner decision 2026-09-28): live party tables — 3/4 seats, humans join
 * by code, EMPTY SEATS DEFAULT TO BOTS (owner rule: "if only 2 players
 * available, the other 2 seats are bots"). Server-authoritative: the party
 * engine validates every move through the game adapter's pure functions and
 * resolves placement itself. Frontend syncs on the same 3-second poll the
 * duels use — no websockets.
 *
 * One table for ALL party games (the deliberate generalization of the
 * per-game duel clones): `gameSlug` selects the adapter; `state` holds that
 * game's own shape (cells/rows/scores). Rows are ephemeral (~60 min TTL).
 */
@Entity('party_matches')
@Index(['code'], { unique: true })
export class PartyMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 6-char join code (same alphabet as duels — no I/1/O/0). */
  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** Adapter key: 'quad-oxo' first; more party games register later. */
  @Column({ type: 'varchar', length: 32 })
  gameSlug: string;

  /**
   * Seat array of length N (3 or 4), index = turn order. Each seat:
   * { kind: 'human' | 'bot' | 'closed', guestId: string | null,
   *   name: string, tier: 'easy' | 'medium' | 'hard' }
   * Empty seats default to kind 'bot' at create time (owner rule).
   */
  @Column({ type: 'jsonb' })
  seats: PartySeat[];

  /** Index of the seat whose turn it is (rotation order = seat order). */
  @Column({ type: 'int' })
  turn: number;

  /** The game's own authoritative state (adapter-defined shape). */
  @Column({ type: 'jsonb' })
  state: Record<string, unknown>;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  /** Finish order as seat indexes (1st..Nth); ties carry equal rank. */
  @Column({ type: 'jsonb', nullable: true })
  placement: { seat: number; rank: number }[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}

export interface PartySeat {
  kind: 'human' | 'bot' | 'closed';
  guestId: string | null;
  name: string;
  tier: 'easy' | 'medium' | 'hard';
}
