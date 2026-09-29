import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Go 9×9 match (plan/games/39).
 *
 * The board is a 0|1|2[] array in the same encoding the game's core.js uses,
 * so the server validates a placement with the same rules the client renders.
 * The server owns everything that decides a game: captures, the ko ban, the
 * pass counter and the final area score. A client cannot claim a stone it did
 * not earn, cannot retake a ko immediately, and cannot declare a result.
 */
@Entity('gomatches')
@Index(['code'], { unique: true })
export class GoMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  /** 81 cells, row-major. 0 empty, 1 black, 2 white. */
  @Column({ type: 'jsonb' })
  cells: number[];

  /** Side to move: 1 = black (creator, opens), 2 = white. */
  @Column({ type: 'int', default: 1 })
  turn: number;

  /** Stones captured by each side — index 0 black, 1 white. */
  @Column({ type: 'jsonb', default: '[0,0]' })
  captures: number[];

  /** Consecutive passes; two end the game. */
  @Column({ type: 'int', default: 0 })
  passes: number;

  /** The board before the last move — the simple ko ban is checked against it. */
  @Column({ type: 'jsonb', nullable: true })
  previous: number[] | null;

  @Column({ type: 'jsonb', nullable: true })
  lastMove: { idx: number; captured: number[] } | null;

  /** Handicap given to white. 5.5 is the classic default. */
  @Column({ type: 'float', default: 5.5 })
  komi: number;

  @Column({ type: 'int', nullable: true })
  winner: number | null;

  @Column({ type: 'boolean', default: false })
  draw: boolean;

  /** The server-computed area score, stored so a late joiner sees the same one. */
  @Column({ type: 'jsonb', nullable: true })
  score: {
    blackArea: number;
    whiteArea: number;
    komi: number;
    winner: number | null;
    margin: number;
    dame: number;
  } | null;

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
