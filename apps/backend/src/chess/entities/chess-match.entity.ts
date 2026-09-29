import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Live Chess match (plan/games/40).
 *
 * The board is a 64-entry array of piece numbers in the same encoding the
 * game's core.js uses, so the server validates a move with the same rules
 * the client renders. The server owns the whole game state: castling rights,
 * the en-passant target, the halfmove clock, and the result. A client sends a
 * from/to pair and a promotion choice, nothing else.
 */
@Entity('chessmatches')
@Index(['code'], { unique: true })
export class ChessMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  /** waiting | running | finished | abandoned */
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: string;

  @Column({ type: 'jsonb' })
  board: number[];

  /** 1 = white (creator, opens), 2 = black. */
  @Column({ type: 'int', default: 1 })
  turn: number;

  /** Castling-rights bitmask. */
  @Column({ type: 'int', default: 15 })
  castling: number;

  /** The square a pawn may capture onto, for one ply only. */
  @Column({ type: 'int', default: -1 })
  enPassant: number;

  /** Halfmove clock — 100 plies without a capture or pawn move. */
  @Column({ type: 'int', default: 0 })
  halfmoves: number;

  @Column({ type: 'int', default: 1 })
  fullmove: number;

  @Column({ type: 'jsonb', nullable: true })
  lastMove: { from: number; to: number; promotion?: number; castle?: string } | null;

  @Column({ type: 'int', nullable: true })
  winner: number | null;

  @Column({ type: 'boolean', default: false })
  draw: boolean;

  /** 'checkmate' | 'stalemate' | 'fifty' | 'repetition' | 'material' | null */
  @Column({ type: 'varchar', length: 16, nullable: true })
  result: string | null;

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
