import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Pente match (plan/games/23 — the five-in-a-row with pair captures).
 *
 * The board is a 0|1|2 array (0 empty, 1 black, 2 white) in the same encoding
 * the game's core.js uses, so the server validates a placement with the same
 * rules the client renders. Both win conditions live here: five in a row, or
 * `captures[side]` reaching the target — the client never decides either.
 */
@Entity('pentematches')
@Index(['code'], { unique: true })
export class PenteMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  /** 15 or 19 — fixed at creation so both players see the same board. */
  @Column({ type: 'int', default: 19 })
  size: number;

  /** Pairs a player must capture to win on points. */
  @Column({ type: 'int', default: 5 })
  target: number;

  /** size*size cells, row-major. 0 empty, 1 black, 2 white. */
  @Column({ type: 'jsonb' })
  cells: number[];

  /** Side to move: 1 = black (creator, opens on the centre), 2 = white. */
  @Column({ type: 'int', default: 1 })
  turn: number;

  /** Captured PAIRS, indexed 0 = black, 1 = white. */
  @Column({ type: 'jsonb', default: [0, 0] })
  captures: number[];

  @Column({ type: 'jsonb', nullable: true })
  lastMove: { idx: number; captured: number[] } | null;

  @Column({ type: 'int', nullable: true })
  winner: number | null;

  /** Set when the board filled with no five and no capture target. */
  @Column({ type: 'boolean', default: false })
  draw: boolean;

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
