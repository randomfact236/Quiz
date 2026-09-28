import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Checkers match (plan/games/06 — the 8×8 two-player duel).
 *
 * The board is stored as 32 small ints (the 32 playable squares): 0 empty,
 * 1 red man, 2 red king, 3 black man, 4 black king — the same encoding the
 * game's core.js uses, so the server validates steps with the same rules the
 * client renders. A "move" is ONE STEP: a slide or a single jump, which is
 * what lets the server hold a multi-jump chain open and refuse a client that
 * tries to shorten or skip it.
 */
@Entity('checkersmatches')
@Index(['code'], { unique: true })
export class CheckersMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  /** 32 playable squares, row-major (see core.js). */
  @Column({ type: 'jsonb' })
  board: number[];

  /** Side to move: 1 = red (creator), 2 = black. */
  @Column({ type: 'int', default: 1 })
  turn: number;

  /**
   * Set while a multi-jump is in progress: the square the SAME side must
   * continue from. Null when the player may pick any piece. The server is the
   * only thing that clears it, and only when the chain is genuinely over.
   */
  @Column({ type: 'int', nullable: true })
  chainSquare: number | null;

  /** Plies since the last capture or man advancement — the 40-move draw clock. */
  @Column({ type: 'int', default: 0 })
  quietPlies: number;

  /** The step just played, for the client's hop/crown animation. */
  @Column({ type: 'jsonb', nullable: true })
  lastMove: { from: number; to: number; over?: number; crowned?: boolean } | null;

  @Column({ type: 'int', nullable: true })
  winner: number | null;

  /** Set when the game ended on the quiet-move clock. */
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
