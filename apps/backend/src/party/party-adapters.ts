import { Injectable, NotFoundException } from '@nestjs/common';

import {
  QuadState,
  QUAD_BOARD_CELLS,
  QUAD_SYMBOLS,
  quadAiMove,
  quadApplyMove,
  quadIsFull,
  quadPlacement,
  quadValidateMove,
  quadWinningLine,
} from './games/quad-oxo.core';
import {
  Db4State,
  db4AdjacentBoxes,
  db4AiMove,
  db4ApplyMove,
  db4BoxEdges,
  db4InitialState,
  db4IsOver,
  db4Placement,
  db4ValidateMove,
} from './games/db4.core';
import {
  Sos4State,
  sos4AiMove,
  sos4ApplyMove,
  sos4InitialState,
  sos4IsOver,
  sos4Placement,
  sos4ValidateMove,
} from './games/sos4.core';
import {
  TriState,
  triAiMove,
  triApplyMove,
  triInitialState,
  triIsOver,
  triPlacement,
  triValidateMove,
  triWinner,
} from './games/tri-nim.core';
import {
  C4State,
  c4AiMove,
  c4AnyWin,
  c4ApplyMove,
  c4Geometry,
  c4InitialState,
  c4IsOver,
  c4Placement,
  c4ValidateMove,
} from './games/c4mp.core';
import {
  FlipState,
  flipAiMove,
  flipApplyMove,
  flipInitialState,
  flipIsOver,
  flipLegalMoves,
  flipPlacement,
  flipValidateMove,
} from './games/flip-mp.core';
import {
  UtttState,
  utttAiMove,
  utttApplyMove,
  utttInitialState,
  utttIsOver,
  utttPlacement,
  utttValidateMove,
  utttWinner,
} from './games/uttt-mp.core';

/**
 * MP1 party engine — ONE server-authoritative engine for ALL party games
 * (3/4 seats, bots fill empty seats by owner rule). Games register an
 * adapter: pure validators from the game's core module, no logic forks.
 *
 * Flow (mirrors the ttt pattern):
 *   create (host + seat config) → join (humans claim open seats) → start
 *   → move/turn rotation (+bot turns) → placement resolved server-side.
 * The 3-second poll (`view`) carries the whole authoritative state.
 *
 * Bot pacing: bots act LAZILY — whenever a poll or move touches the table,
 * the engine advances any pending bot turns first (same server authority,
 * zero timers, naturally in step with the poll cadence).
 */

export interface PartyAdapter {
  /** Initial authoritative state for a fresh table. */
  initialState(playerCount: number): Record<string, unknown>;
  /** Validate a seat's move against the state; null = legal, else reason. */
  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null;
  /** Apply a legal move immutably and return the next state. */
  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown>;
  /** Is the game over? (checked after each applied move) */
  isOver(state: Record<string, unknown>): boolean;
  /** Winner seat index or null (shared/none) — only called when isOver. */
  winner(state: Record<string, unknown>): number | null;
  /** Active seat indexes (for placement ordering). */
  seatsInPlay(state: Record<string, unknown>): number[];
  /** Server-side bot move pick for a seat (tier-aware). */
  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown;
  /**
   * OPTIONAL: decide the next turn with knowledge of the move.
   * prev = state BEFORE the move; next = state AFTER; seat = mover.
   * Return the seat index that plays next (extra-turn games return the
   * mover when they scored/claimed). Default: simple rotation.
   */
  resolveTurn?(
    prev: Record<string, unknown>,
    next: Record<string, unknown>,
    seat: number,
    turn: number,
    seatCount: number
  ): number;
  /** Which seat moves next given state + current turn index. */
  nextTurn(state: Record<string, unknown>, turn: number, seatCount: number): number;
  /** Server-side placement (1st..Nth) for a finished table. */
  placement(
    state: Record<string, unknown>,
    winnerSeat: number | null
  ): { seat: number; rank: number }[];
}

class QuadAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    const state: QuadState = {
      cells: Array<null>(QUAD_BOARD_CELLS).fill(null),
      playerCount,
    };
    return state as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): QuadState {
    return state as unknown as QuadState;
  }

  validate(state: Record<string, unknown>, _seat: number, move: unknown): string | null {
    return quadValidateMove(this.as(state), move as number);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return quadApplyMove(this.as(state), seat, move as number) as unknown as Record<
      string,
      unknown
    >;
  }

  isOver(state: Record<string, unknown>): boolean {
    const s = this.as(state);
    return this.anyLine(s) !== null || quadIsFull(s);
  }

  private anyLine(s: QuadState): number | null {
    for (let seat = 0; seat < QUAD_SYMBOLS.length; seat++) {
      if (quadWinningLine(s, seat) !== null) return seat;
    }
    return null;
  }

  winner(state: Record<string, unknown>): number | null {
    return this.anyLine(this.as(state));
  }

  seatsInPlay(_state: Record<string, unknown>): number[] {
    return [0, 1, 2, 3];
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return quadAiMove(this.as(state), seat, tier);
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    _next: Record<string, unknown>,
    _seat: number,
    turn: number,
    seatCount: number
  ): number {
    return (turn + 1) % seatCount;
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  placement(
    state: Record<string, unknown>,
    winnerSeat: number | null
  ): { seat: number; rank: number }[] {
    return quadPlacement(this.seatsInPlay(state), winnerSeat);
  }
}

/**
 * Dots & Boxes 4P: move = edge index; boxes grant extra turns to the SAME
 * seat; free edges rotate through ACTIVE (non-closed) seats.
 */
class Db4Adapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return db4InitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): Db4State {
    return state as unknown as Db4State;
  }

  validate(state: Record<string, unknown>, _seat: number, move: unknown): string | null {
    return db4ValidateMove(this.as(state), move as number);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    // Engine reads nextTurn from the result via nextTurn(); the state only.
    const { state: next } = db4ApplyMove(
      this.as(state),
      seat,
      move as number,
      this.seatsInPlay(state)
    );
    return next as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return db4IsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    // Score game: no single winner seat; placement() ranks everyone.
    return null;
  }

  seatsInPlay(_state: Record<string, unknown>): number[] {
    return [0, 1, 2, 3];
  }

  botMove(
    state: Record<string, unknown>,
    _seat: number,
    tier: 'easy' | 'medium' | 'hard'
  ): unknown {
    return db4AiMove(this.as(state), tier);
  }

  resolveTurn(
    prev: Record<string, unknown>,
    next: Record<string, unknown>,
    seat: number,
    turn: number,
    seatCount: number
  ): number {
    // Extra turn when this edge completed at least one box (score grew).
    const claimed = this.as(next).scores[seat] - this.as(prev).scores[seat];
    if (claimed > 0) return seat;
    return (turn + 1) % seatCount;
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  placement(
    state: Record<string, unknown>,
    _winnerSeat: number | null
  ): { seat: number; rank: number }[] {
    return db4Placement(this.as(state).scores);
  }
}

/**
 * SOS 4P: move = {cell, letter}; completed SOS scores +1 and keeps the turn.
 */
class Sos4Adapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return sos4InitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): Sos4State {
    return state as unknown as Sos4State;
  }

  validate(state: Record<string, unknown>, _seat: number, move: unknown): string | null {
    return sos4ValidateMove(this.as(state), move as { cell: number; letter: string });
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    const { state: next } = sos4ApplyMove(
      this.as(state),
      seat,
      move as { cell: number; letter: string },
      this.seatsInPlay(state)
    );
    return next as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return sos4IsOver(this.as(state));
  }

  winner(): number | null {
    return null;
  }

  seatsInPlay(_state: Record<string, unknown>): number[] {
    return [0, 1, 2, 3];
  }

  botMove(
    state: Record<string, unknown>,
    _seat: number,
    tier: 'easy' | 'medium' | 'hard'
  ): unknown {
    return sos4AiMove(this.as(state), tier);
  }

  resolveTurn(
    prev: Record<string, unknown>,
    next: Record<string, unknown>,
    seat: number,
    turn: number,
    seatCount: number
  ): number {
    // Extra turn when the placement completed an SOS (score grew).
    const scored = this.as(next).scores[seat] - this.as(prev).scores[seat];
    if (scored > 0) return seat;
    return (turn + 1) % seatCount;
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  placement(
    state: Record<string, unknown>,
    _winnerSeat: number | null
  ): { seat: number; rank: number }[] {
    return sos4Placement(this.as(state).scores);
  }
}
/**
 * Tri-Nim: move = {row, count}; misère placement (taker of the last stick is
 * 3rd, the seat before them 1st). Fixed 3 seats.
 */
class TriNimAdapter implements PartyAdapter {
  initialState(_playerCount: number): Record<string, unknown> {
    return triInitialState() as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): TriState {
    return state as unknown as TriState;
  }

  validate(state: Record<string, unknown>, _seat: number, move: unknown): string | null {
    return triValidateMove(this.as(state), move as { row: number; count: number });
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return triApplyMove(
      this.as(state),
      seat,
      move as { row: number; count: number }
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return triIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return triWinner(this.as(state));
  }

  seatsInPlay(_state: Record<string, unknown>): number[] {
    return [0, 1, 2];
  }

  botMove(
    state: Record<string, unknown>,
    _seat: number,
    tier: 'easy' | 'medium' | 'hard'
  ): unknown {
    return triAiMove(this.as(state), tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return triPlacement(this.as(state));
  }
}

/**
 * Connect Four MP: one game, two geometries — 8×8 at 3 seats (3P tab),
 * 10×10 at 4 seats (4P tab). move = column index.
 */
class C4Adapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return c4InitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): C4State {
    return state as unknown as C4State;
  }

  validate(state: Record<string, unknown>, _seat: number, move: unknown): string | null {
    return c4ValidateMove(this.as(state), move as number);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return c4ApplyMove(this.as(state), seat, move as number) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return c4IsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return c4AnyWin(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).cols >= 10 ? 4 : 3;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(
    state: Record<string, unknown>,
    _seat: number,
    tier: 'easy' | 'medium' | 'hard'
  ): unknown {
    return c4AiMove(this.as(state), tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  placement(
    state: Record<string, unknown>,
    winnerSeat: number | null
  ): { seat: number; rank: number }[] {
    return c4Placement(this.as(state).cols >= 10 ? 4 : 3, winnerSeat);
  }
}

/**
 * Flip MP â€” ONE adapter, two slugs: 'othello-3' (3 seats, 10Ã—10) and
 * 'quadflip' (4 seats, 14Ã—14). Extra-turn never happens; stuck seats pass
 * (passStreak), and resolveTurn lands on the next seat WITH a move.
 */
class FlipAdapter implements PartyAdapter {
  constructor(private readonly seatCount: number) {}

  initialState(_playerCount: number): Record<string, unknown> {
    return flipInitialState(this.seatCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): FlipState {
    return state as unknown as FlipState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return flipValidateMove(this.as(state), seat, move as number);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return flipApplyMove(this.as(state), seat, move as number) as unknown as Record<
      string,
      unknown
    >;
  }

  isOver(state: Record<string, unknown>): boolean {
    return flipIsOver(this.as(state));
  }

  winner(): number | null {
    return null; // score game â€” placement ranks everyone
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return flipAiMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    seat: number,
    _turn: number,
    seatCount: number
  ): number {
    // flipApplyMove stored the pass chain in passStreak; the next seat with a
    // move is seat + passStreak + 1 (mod seatCount). Full board â†’ keep seat
    // (isOver already fired).
    const s = this.as(next);
    if (flipIsOver(s)) return seat;
    return (seat + s.passStreak + 1) % seatCount;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return flipPlacement(this.as(state).scores);
  }
}

/** Ultimate TTT MP: 9 mini-boards, send-rule turn forcing, macro-line win. */
class UtttAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return utttInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): UtttState {
    return state as unknown as UtttState;
  }

  validate(state: Record<string, unknown>, _seat: number, move: unknown): string | null {
    return utttValidateMove(this.as(state), move as number);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return utttApplyMove(this.as(state), seat, move as number) as unknown as Record<
      string,
      unknown
    >;
  }

  isOver(state: Record<string, unknown>): boolean {
    return utttIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return utttWinner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return utttAiMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  placement(
    state: Record<string, unknown>,
    winnerSeat: number | null
  ): { seat: number; rank: number }[] {
    return utttPlacement(this.as(state).seatCount, winnerSeat);
  }
}
/** Registry: every party game plugs in here. */
const ADAPTERS: Record<string, PartyAdapter> = {
  'quad-oxo': new QuadAdapter(),
  'dots-boxes-4p': new Db4Adapter(),
  'sos-4p': new Sos4Adapter(),
  'tri-nim': new TriNimAdapter(),
  'connect-four-mp': new C4Adapter(),
  'othello-3': new FlipAdapter(3),
  quadflip: new FlipAdapter(4),
  'ultimate-ttt-mp': new UtttAdapter(),
};

export function partyAdapterFor(gameSlug: string): PartyAdapter {
  const adapter = ADAPTERS[gameSlug];
  if (!adapter) throw new NotFoundException(`Unknown party game: ${gameSlug}`);
  return adapter;
}
