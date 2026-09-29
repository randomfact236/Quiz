import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Othello match (plan/games/12 — the flip duel).
 *
 * The board is a 0|1|2 array (0 empty, 1 dark, 2 light) in the same encoding
 * the game's core.js uses, so the server validates a placement by running the
 * same flip rules. The client never gets to claim which discs flipped — the
 * server recomputes them and stores the result.
 */
@Entity('othellomatches')
@Index(['code'], { unique: true })
export class OthelloMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  /** 6, 8 or 10 — fixed at creation so both players see the same board. */
  @Column({ type: 'int', default: 8 })
  size: number;

  /** size*size cells, row-major. 0 empty, 1 dark, 2 light. */
  @Column({ type: 'jsonb' })
  cells: number[];

  /** Side to move: 1 = dark (creator), 2 = light. */
  @Column({ type: 'int', default: 1 })
  turn: number;

  /** The step just played, for the client's place/flip animation. */
  @Column({ type: 'jsonb', nullable: true })
  lastMove: { idx: number; flipped: number[] } | null;

  @Column({ type: 'int', nullable: true })
  winner: number | null;

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
