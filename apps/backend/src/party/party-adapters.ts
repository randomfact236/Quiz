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
import {
  CrState,
  crApplyMove,
  crBotCode,
  crBotGuess,
  crInitialState,
  crIsOver,
  crPlacement,
  crValidateMove,
} from './games/coderace-mp.core';
import {
  BrState,
  brApplyMove,
  brBotCode,
  brBotGuess,
  brInitialState,
  brIsOver,
  brPlacement,
  brValidateMove,
} from './games/bullsrace-mp.core';
import {
  HmState,
  hmApplyMove,
  hmBotLetter,
  hmBotWord,
  hmInitialState,
  hmPlacement,
  hmRedactFor,
  hmValidateMove,
} from './games/hangman-mp.core';
import {
  PdState,
  pdApplyMove,
  pdBotMove,
  pdInitialState,
  pdIsOver,
  pdPlacement,
  pdValidateMove,
  pdWinner,
} from './games/pigdice-mp.core';
import {
  ChState,
  chApplyMove,
  chBotMove,
  chInitialState,
  chIsOver,
  chPlacement,
  chValidateMove,
  chWinner,
} from './games/chomp-mp.core';
import {
  FrShip,
  FrState,
  frApplyMove,
  frBotMove,
  frInitialState,
  frIsOver,
  frPlacement,
  frRedactFor,
  frValidateMove,
  frWinner,
} from './games/fleet-royale-mp.core';
import {
  SprState,
  sprApplyMove,
  sprBotMove,
  sprInitialState,
  sprIsOver,
  sprPlacement,
  sprValidateMove,
  sprWinner,
} from './games/sprouts-mp.core';
import {
  P3State,
  p3ApplyMove,
  p3BotMove,
  p3InitialState,
  p3IsOver,
  p3Placement,
  p3ValidateMove,
  p3Winner,
} from './games/pente3-mp.core';
import {
  QuState,
  quApplyMove,
  quBotMove,
  quInitialState,
  quIsOver,
  quPlacement,
  quValidateMove,
  quWinner,
} from './games/quadwall-mp.core';
import {
  C6State,
  c6ApplyMove,
  c6BotMove,
  c6InitialState,
  c6IsOver,
  c6Placement,
  c6ValidateMove,
  c6Winner,
} from './games/connect6-mp.core';
import {
  QpState,
  qpApplyMove,
  qpBotMove,
  qpInitialState,
  qpIsOver,
  qpPlacement,
  qpValidateMove,
  qpWinner,
} from './games/quarto-pass-mp.core';
import {
  NkState,
  nkAiMove,
  nkApplyMove,
  nkInitialState,
  nkIsOver,
  nkPlacement,
  nkValidateMove,
} from './games/notakto-mp.core';
import {
  SnlState,
  snlApplyMove,
  snlInitialState,
  snlIsOver,
  snlPlacement,
  snlRoll,
  snlValidateMove,
} from './games/snl-mp.core';
import {
  MemState,
  memApplyFlip,
  memBotFlip,
  memInitialState,
  memIsOver,
  memPlacement,
  memValidateMove,
} from './games/memory-mp.core';
import {
  LudoState,
  ludoApplyMove,
  ludoBotTurn,
  ludoInitialState,
  ludoIsOver,
  ludoLegalTokens,
  ludoPlacement,
  ludoWinner,
} from './games/ludo-mp.core';
import {
  CmpState,
  cmpAiMove,
  cmpApplyMove,
  cmpInitialState,
  cmpIsOver,
  cmpPlacement,
  cmpValidateMove,
} from './games/checkers-mp.core';
import {
  BlkState,
  blkApplyMove,
  blkApplyPass,
  blkApplyTurnWithPassTracking,
  blkBotMove,
  blkHasAnyMove,
  blkInitialState,
  blkIsOver,
  blkPlacement,
  blkScore,
  blkValidateMove,
} from './games/blokus-mp.core';
import {
  DomState,
  domApplyDraw,
  domApplyPass,
  domApplyPlay,
  domBotMove,
  domInitialState,
  domIsOver,
  domPips,
  domPlacement,
  domValidateMove,
} from './games/dominoes-mp.core';
import {
  CeCard,
  CeState,
  ceApplyDraw,
  ceApplyPass,
  ceApplyPlay,
  ceBotMove,
  ceInitialState,
  ceIsOver,
  cePlacement,
  ceValidateMove,
} from './games/crazy-eights-mp.core';
import {
  YzCategory,
  YzState,
  yzApplyRoll,
  yzApplyScore,
  yzBotDecide,
  yzInitialState,
  yzPlacement,
  yzValidateMove,
} from './games/yatzy-mp.core';

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
  /** OPTIONAL: strip per-seat secrets from state before it crosses the API. */
  redactFor?(state: Record<string, unknown>, seat: number | null): Record<string, unknown>;
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
    return null;
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
/**
 * Code Race MP: one maker invents a hidden 4-peg code (player-created, NOT
 * served content); the other seats race to crack it. The maker must place
 * the code BEFORE any breaker can guess. Redaction: the code never crosses
 * the API until the table finishes.
 */
class CodeRaceAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return crInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): CrState {
    return state as unknown as CrState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return crValidateMove(this.as(state), seat, move as { code?: number[]; guess?: number[] });
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return crApplyMove(
      this.as(state),
      seat,
      move as { code?: number[]; guess?: number[] }
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return crIsOver(this.as(state));
  }

  winner(): number | null {
    return null; // rank game — placement() orders everyone
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    const s = this.as(state);
    if (s.phase === 'setting') return { code: crBotCode() };
    return { guess: crBotGuess(s, seat, tier) };
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // crApplyMove already computed the correct next breaker seat.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return crPlacement(this.as(state));
  }

  /** THE critical property: the maker’s code never crosses the API. */
  redactFor(state: Record<string, unknown>, _seat: number | null): Record<string, unknown> {
    const s = this.as(state);
    if (s.phase === 'finished') return state;
    return { ...state, code: null };
  }
}

/**
 * Notakto MP: three boards, everyone places X, a line ELIMINATES you.
 * Last survivor 1st; board-full end = survivors share 1st.
 */
class NotaktoAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return nkInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): NkState {
    return state as unknown as NkState;
  }

  validate(state: Record<string, unknown>, _seat: number, move: unknown): string | null {
    return nkValidateMove(this.as(state), move as number);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return nkApplyMove(this.as(state), seat, move as number) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return nkIsOver(this.as(state));
  }

  winner(): number | null {
    return null;
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seats;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return nkAiMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // nkApplyMove already computed the next LIVING seat (skips eliminated).
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return nkPlacement(this.as(state));
  }
}
/**
 * Snakes & Ladders MP: move = {} (the SERVER rolls — approved Pig
 * precedent). Canonical snakes/ladders layout is a rules constant.
 * First to land exactly on 100 wins; overshoot bounces back.
 */
class SnlAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return snlInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): SnlState {
    return state as unknown as SnlState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    // The server rolls the die; the client must send an EMPTY move.
    if (move !== null && typeof move === 'object' && Object.keys(move as object).length > 0) {
      return 'Unexpected move payload — just send {}.';
    }
    return snlValidateMove(this.as(state), seat, {});
  }

  apply(state: Record<string, unknown>, seat: number): Record<string, unknown> {
    return snlApplyMove(this.as(state), seat, snlRoll()) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return snlIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    const s = this.as(state);
    return s.finished.length > 0 ? s.finished[0] : null;
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(
    _state: Record<string, unknown>,
    _seat: number,
    _tier: 'easy' | 'medium' | 'hard'
  ): unknown {
    return {}; // the roll happens in apply()
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return snlPlacement(this.as(state));
  }
}

/**
 * Memory Flip MP: move = {cell}; a match scores +1 and keeps the turn.
 * Deck + bot memory are SERVER-ONLY (redactFor strips them); the grid is
 * server-shuffled at creation (approved card-tier precedent).
 */
class MemoryAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return memInitialState(playerCount, Math.random) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): MemState {
    return state as unknown as MemState;
  }

  validate(state: Record<string, unknown>, _seat: number, move: unknown): string | null {
    return memValidateMove(this.as(state), (move as { cell: number }).cell);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return memApplyFlip(this.as(state), seat, (move as { cell: number }).cell) as unknown as Record<
      string,
      unknown
    >;
  }

  isOver(state: Record<string, unknown>): boolean {
    return memIsOver(this.as(state));
  }

  winner(): number | null {
    return null;
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return { cell: memBotFlip(this.as(state), seat, tier) };
  }

  /** CRITICAL: the deck values and bot memory never cross the API. */
  redactFor(state: Record<string, unknown>, _seat: number | null): Record<string, unknown> {
    const s = { ...(state as unknown as MemState) };
    return { ...s, deck: s.claimed.map(() => 0), botMemory: {} };
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // memApplyFlip keeps the turn on a match, passes on a miss.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return memPlacement(this.as(state).scores);
  }
}
/**
 * Ludo MP: move = {token} (the SERVER rolls; extra roll on 6/capture/finish
 * handled inside ludoApplyMove’s turn computation). 2 tokens per seat;
 * capture sends back to the yard; both home = 1st.
 */
class LudoAdapter implements PartyAdapter {
  constructor(private readonly variant: 'classic' | 'snakes' = 'classic') {}
  initialState(playerCount: number): Record<string, unknown> {
    return ludoInitialState(playerCount, this.variant) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): LudoState {
    return state as unknown as LudoState;
  }

  validate(_state: Record<string, unknown>, _seat: number, move: unknown): string | null {
    // The server rolls and moves; the client must send an EMPTY move.
    if (move !== null && typeof move === 'object' && Object.keys(move as object).length > 0) {
      return 'Unexpected move payload — just send {}.';
    }
    return null;
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    const s = this.as(state);
    // The roll happens here, server-side (approved RNG precedent).
    const roll = 1 + Math.floor(Math.random() * 6);
    const legal = ludoLegalTokens(s, seat, roll);
    if (legal.length === 0) {
      // no legal token: pass the turn (documented house rule)
      return { ...s, lastRoll: roll, turn: (seat + 1) % s.seatCount } as unknown as Record<
        string,
        unknown
      >;
    }
    let token = (move as { token: number }).token;
    if (!legal.includes(token)) token = legal[0];
    return ludoApplyMove(s, seat, roll, token).state as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return ludoIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return ludoWinner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(): unknown {
    return {}; // roll + token chosen inside apply for Ludo
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // ludoApplyMove computed extra-roll/skip inside state.turn.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return ludoPlacement(this.as(state));
  }
}

/**
 * Checkers MP: one adapter, two variants — 'checkers-hex' (3P, 8×8) and
 * 'checkers-4p' (4P, 10×10). Jump chains mandatory; elimination ranks by
 * survival.
 */
class CheckersMpAdapter implements PartyAdapter {
  constructor(private readonly variant: 'checkers-hex' | 'checkers-4p') {}

  initialState(_playerCount: number): Record<string, unknown> {
    return cmpInitialState(this.variant) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): CmpState {
    return state as unknown as CmpState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return cmpValidateMove(this.as(state), seat, move as { from: number; to: number });
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return cmpApplyMove(
      this.as(state),
      seat,
      move as { from: number; to: number }
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return cmpIsOver(this.as(state));
  }

  winner(): number | null {
    return null;
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return cmpAiMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // cmpApplyMove computed the next living seat + chain handling.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return cmpPlacement(this.as(state));
  }
}
/**
 * Blokus 4P: 20×20, 21 pieces per seat, corner-touch placement. Passes
 * tracked via passStreak (all pass → game ends); most squares wins.
 * move = {piece, rot, r, c} — bots pick inside botMove.
 */
class BlokusAdapter implements PartyAdapter {
  initialState(_playerCount: number): Record<string, unknown> {
    return blkInitialState(4) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): BlkState {
    return state as unknown as BlkState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    // validate against the ACTING seat — state.turn can lag after resolveTurn.
    return blkValidateMove(
      this.as(state),
      seat,
      move as { piece: number; rot: number; r: number; c: number }
    );
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    const next = blkApplyMove(
      this.as(state),
      seat,
      move as { piece: number; rot: number; r: number; c: number }
    );
    // pass tracking: a real placement resets the streak.
    return blkApplyTurnWithPassTracking(next, seat, true) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return blkIsOver(this.as(state));
  }

  winner(): number | null {
    return null;
  }

  seatsInPlay(): number[] {
    return [0, 1, 2, 3];
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    const mv = blkBotMove(this.as(state), seat, tier);
    if (!mv) return { pass: true };
    // belt-and-braces: never surface an illegal bot move
    const err = blkValidateMove(this.as(state), seat, mv);
    if (err) return { pass: true };
    return mv;
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
    const s = next as unknown as BlkState;
    // the next seat with a legal move; passStreak resets on placements.
    if (blkIsOver(s)) return seat;
    let probe = (seat + 1) % seatCount;
    let hops = 0;
    while (hops < seatCount && !blkHasAnyMove(s, probe)) {
      hops += 1;
      probe = (probe + 1) % seatCount;
    }
    return probe;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return blkPlacement(this.as(state));
  }
}
/**
 * Dominoes Block MP: one adapter, 'dominoes-mp' (3P + 4P). Draw variant:
 * empty seats draw to play; blocked line ranks by pips.
 */
class DominoesAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return domInitialState(playerCount, Math.random) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): DomState {
    return state as unknown as DomState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return domValidateMove(
      this.as(state),
      seat,
      move as { tile: [number, number]; side?: 'left' | 'right' } | { draw: true } | { pass: true }
    );
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    const m = move as {
      tile?: [number, number];
      side?: 'left' | 'right';
      draw?: boolean;
      pass?: boolean;
    };
    if (m.draw) return domApplyDraw(this.as(state), seat) as unknown as Record<string, unknown>;
    if (m.pass) return domApplyPass(this.as(state), seat) as unknown as Record<string, unknown>;
    return domApplyPlay(
      this.as(state),
      seat,
      m.tile as [number, number],
      m.side ?? 'right'
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return domIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return this.as(state).domino;
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  nextTurn(state: Record<string, unknown>, turn: number, seatCount: number): number {
    void state;
    return (turn + 1) % seatCount;
  }

  placement(
    state: Record<string, unknown>,
    winnerSeat: number | null
  ): { seat: number; rank: number }[] {
    void winnerSeat;
    return domPlacement(this.as(state));
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return domBotMove(this.as(state), seat, tier);
  }

  redactFor(state: Record<string, unknown>, seat: number | null): Record<string, unknown> {
    const s = this.as(state);
    // viewer keeps their own hand; others become counts
    const hands = s.hands.map((h, i) => (i === seat ? h : []));
    const counts = s.hands.map((h) => h.length);
    return {
      ...s,
      hands,
      boneyard: [],
      handCounts: counts,
      boneyardCount: s.boneyard.length,
    };
  }
}

/**
 * Crazy Eights MP: one adapter, 'crazy-eights-mp' (3P + 4P). Suit/value match,
 * eights wild with a called suit; draw-one house rule.
 */
class CrazyEightsAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return ceInitialState(playerCount, Math.random) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): CeState {
    return state as unknown as CeState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return ceValidateMove(
      this.as(state),
      seat,
      move as { card: CeCard; calledSuit?: number } | { draw: true } | { pass: true }
    );
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    const m = move as { card?: CeCard; calledSuit?: number; draw?: boolean; pass?: boolean };
    if (m.draw) return ceApplyDraw(this.as(state), seat) as unknown as Record<string, unknown>;
    if (m.pass) return ceApplyPass(this.as(state), seat) as unknown as Record<string, unknown>;
    return ceApplyPlay(
      this.as(state),
      seat,
      m.card as CeCard,
      m.calledSuit ?? null
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return ceIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return this.as(state).winner;
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  nextTurn(state: Record<string, unknown>, turn: number, seatCount: number): number {
    void state;
    return (turn + 1) % seatCount;
  }

  placement(
    state: Record<string, unknown>,
    winnerSeat: number | null
  ): { seat: number; rank: number }[] {
    void winnerSeat;
    return cePlacement(this.as(state));
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return ceBotMove(this.as(state), seat, tier);
  }

  redactFor(state: Record<string, unknown>, seat: number | null): Record<string, unknown> {
    const s = this.as(state);
    const hands = s.hands.map((h, i) => (i === seat ? h : []));
    const counts = s.hands.map((h) => h.length);
    return {
      ...s,
      hands,
      stock: [],
      handCounts: counts,
      stockCount: s.stock.length,
    };
  }
}

/**
 * Yatzy MP: one adapter, 'yatzy-mp' (3P + 4P). Server-rolled dice, 3 rolls,
 * 15 fixed-canonical categories, highest total wins.
 */
class YatzyAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return yzInitialState(playerCount, Math.random) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): YzState {
    return state as unknown as YzState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return yzValidateMove(
      this.as(state),
      seat,
      move as { roll?: boolean; keep?: number[] } | { score: YzCategory }
    );
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    const m = move as { roll?: boolean; keep?: number[]; score?: YzCategory };
    if (m.roll) {
      const { state: next } = yzApplyRoll(this.as(state), seat, m.keep ?? [], Math.random);
      return next as unknown as Record<string, unknown>;
    }
    const { state: next } = yzApplyScore(this.as(state), seat, (m.score ?? 'chance') as YzCategory);
    return next as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return this.as(state).finished;
  }

  winner(state: Record<string, unknown>): number | null {
    void state;
    return null; // ranked by total via placement
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  nextTurn(state: Record<string, unknown>, turn: number, seatCount: number): number {
    void turn;
    void seatCount;
    return this.as(state).turn;
  }

  placement(
    state: Record<string, unknown>,
    winnerSeat: number | null
  ): { seat: number; rank: number }[] {
    void winnerSeat;
    return yzPlacement(this.as(state));
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return yzBotDecide(this.as(state), seat, tier, Math.random);
  }
}

/**
 * Bulls Race MP (T28 3P + F28 4P): bulls-only code race — the maker's code
 * never crosses the API until the table settles (redactFor).
 */
class BullsRaceAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return brInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): BrState {
    return state as unknown as BrState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return brValidateMove(this.as(state), seat, move as { code?: number[]; guess?: number[] });
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return brApplyMove(
      this.as(state),
      seat,
      move as { code?: number[]; guess?: number[] }
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return brIsOver(this.as(state));
  }

  winner(): number | null {
    return null; // rank game — placement() orders everyone
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    const s = this.as(state);
    if (s.phase === 'setting') return { code: brBotCode() };
    return { guess: brBotGuess(s, seat, tier) };
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // brApplyMove already computed the correct next breaker seat.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return brPlacement(this.as(state));
  }

  /** The maker's code never crosses the API while the race runs. */
  redactFor(state: Record<string, unknown>): Record<string, unknown> {
    const s = this.as(state);
    if (s.phase === 'finished') return state;
    return { ...state, code: null };
  }
}

/**
 * Hangman Relay MP (T30 3P + F30 4P): trust-relayed hangman — write a word
 * for the next seat, race to solve your own, 6 strikes and you are out.
 */
class HangmanAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return hmInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): HmState {
    return state as unknown as HmState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return hmValidateMove(this.as(state), seat, move as { word?: unknown; letter?: unknown });
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return hmApplyMove(
      this.as(state),
      seat,
      move as { word?: unknown; letter?: unknown }
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return this.as(state).phase === 'finished';
  }

  winner(): number | null {
    return null; // rank game — placement() orders everyone
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    const s = this.as(state);
    if (s.phase === 'writing') return { word: hmBotWord(seat) };
    return { letter: hmBotLetter(s, seat, tier) };
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return hmPlacement(this.as(state));
  }

  /** Unsettled words only ever cross the API to the seat that wrote them. */
  redactFor(state: Record<string, unknown>, seat: number | null): Record<string, unknown> {
    return hmRedactFor(this.as(state), seat) as unknown as Record<string, unknown>;
  }
}

/**
 * Pig Dice MP (T33 3P + F5 4P): server-rolled push-your-luck to 100.
 * The die is rolled HERE (approved server-roll precedent) — clients only
 * send {roll:true} / {hold:true}; every number is public.
 */
class PigDiceMpAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return pdInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): PdState {
    return state as unknown as PdState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return pdValidateMove(this.as(state), seat, move);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    const die = 1 + Math.floor(Math.random() * 6);
    return pdApplyMove(
      this.as(state),
      seat,
      move as { roll?: boolean; hold?: boolean },
      die
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return pdIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return pdWinner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return pdBotMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // A non-1 roll keeps the seat's turn; pdApplyMove already set it.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return pdPlacement(this.as(state));
  }
}

/**
 * Chomp Elimination MP (T15 3P + F22 4P): the poison bite knocks you out,
 * survivors get a fresh tray, last seat standing wins. All public.
 */
class ChompAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return chInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): ChState {
    return state as unknown as ChState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return chValidateMove(this.as(state), seat, move as { cell: [number, number] });
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return chApplyMove(
      this.as(state),
      seat,
      move as { cell: [number, number] }
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return chIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return chWinner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return chBotMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return chPlacement(this.as(state));
  }
}

/**
 * Fleet Royale MP (T29 3P + F29 4P): one shared sea, overlapping secret
 * fleets, rotating shots; a live fleet never crosses the API (redactFor).
 */
class FleetRoyaleAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return frInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): FrState {
    return state as unknown as FrState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return frValidateMove(this.as(state), seat, move as { fleet?: unknown; shot?: unknown });
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return frApplyMove(
      this.as(state),
      seat,
      move as { fleet?: FrShip[]; shot?: number }
    ) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return frIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return frWinner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return frBotMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // Placement is a relay and elimination skips seats — frApplyMove already
    // computed the right next turn for both phases.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return frPlacement(this.as(state));
  }

  /** Live fleets stay server-side except for their owner; hits are public
   *  only as shared-board markers plus the per-seat segments-left count. */
  redactFor(state: Record<string, unknown>, seat: number | null): Record<string, unknown> {
    return frRedactFor(this.as(state), seat) as unknown as Record<string, unknown>;
  }
}

/**
 * Sprouts MP (T16 3P + F21 4P): three line-ends per dot; draw a line
 * between two live dots (or loop one back to itself) and plant a new dot
 * on it. When the table can draw no more, the LAST MOVER wins.
 */
class SproutsAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return sprInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): SprState {
    return state as unknown as SprState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return sprValidateMove(this.as(state), seat, move);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return sprApplyMove(this.as(state), seat, move) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return sprIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return sprWinner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return sprBotMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // The game can end on the move itself — apply() already decided the turn.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return sprPlacement(this.as(state));
  }
}

/** Pente-3 MP (T19, seats up to 4): five in a row or five captured pairs. */
class Pente3Adapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return p3InitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): P3State {
    return state as unknown as P3State;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return p3ValidateMove(this.as(state), seat, move);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return p3ApplyMove(this.as(state), seat, move) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return p3IsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return p3Winner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return p3BotMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return p3Placement(this.as(state));
  }
}

/** Quadwall MP (T20 3P + F17 4P): multiplayer Quoridor — race home, wall the rest. */
class QuadwallAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return quInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): QuState {
    return state as unknown as QuState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return quValidateMove(this.as(state), seat, move);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return quApplyMove(this.as(state), seat, move) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return quIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return quWinner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return quBotMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return quPlacement(this.as(state));
  }
}

/** Connect6 MP (T25, seats up to 4): two stones a turn, six in a row. */
class Connect6Adapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return c6InitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): C6State {
    return state as unknown as C6State;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return c6ValidateMove(this.as(state), seat, move);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return c6ApplyMove(this.as(state), seat, move) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return c6IsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return c6Winner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return c6BotMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // Two-stone turns keep the same seat until their stones are placed.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return c6Placement(this.as(state));
  }
}

/** Quarto Pass MP (T31 3P + F31 4P): place what you were handed, hand to the next. */
class QuartoPassAdapter implements PartyAdapter {
  initialState(playerCount: number): Record<string, unknown> {
    return qpInitialState(playerCount) as unknown as Record<string, unknown>;
  }

  private as(state: Record<string, unknown>): QpState {
    return state as unknown as QpState;
  }

  validate(state: Record<string, unknown>, seat: number, move: unknown): string | null {
    return qpValidateMove(this.as(state), seat, move);
  }

  apply(state: Record<string, unknown>, seat: number, move: unknown): Record<string, unknown> {
    return qpApplyMove(this.as(state), seat, move) as unknown as Record<string, unknown>;
  }

  isOver(state: Record<string, unknown>): boolean {
    return qpIsOver(this.as(state));
  }

  winner(state: Record<string, unknown>): number | null {
    return qpWinner(this.as(state));
  }

  seatsInPlay(state: Record<string, unknown>): number[] {
    const n = this.as(state).seatCount;
    return Array.from({ length: n }, (_, i) => i);
  }

  botMove(state: Record<string, unknown>, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
    return qpBotMove(this.as(state), seat, tier);
  }

  nextTurn(_state: Record<string, unknown>, turn: number, seatCount: number): number {
    return (turn + 1) % seatCount;
  }

  resolveTurn(
    _prev: Record<string, unknown>,
    next: Record<string, unknown>,
    _seat: number,
    _turn: number,
    _seatCount: number
  ): number {
    // Placing keeps the seat (they hand next); handing advances the turn.
    return (next as unknown as { turn: number }).turn;
  }

  placement(state: Record<string, unknown>): { seat: number; rank: number }[] {
    return qpPlacement(this.as(state));
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
  'code-race': new CodeRaceAdapter(),
  'notakto-mp': new NotaktoAdapter(),
  'snakes-ladders-mp': new SnlAdapter(),
  'memory-flip-mp': new MemoryAdapter(),
  'ludo-mp': new LudoAdapter('classic'),
  'ludo-snakes': new LudoAdapter('snakes'),
  'checkers-hex': new CheckersMpAdapter('checkers-hex'),
  'checkers-4p': new CheckersMpAdapter('checkers-4p'),
  'blokus-4p': new BlokusAdapter(),
  'dominoes-mp': new DominoesAdapter(),
  'crazy-eights-mp': new CrazyEightsAdapter(),
  'yatzy-mp': new YatzyAdapter(),
  'bulls-race-mp': new BullsRaceAdapter(),
  'hangman-relay-mp': new HangmanAdapter(),
  'pig-dice-mp': new PigDiceMpAdapter(),
  'chomp-elimination': new ChompAdapter(),
  'fleet-royale': new FleetRoyaleAdapter(),
  sprouts: new SproutsAdapter(),
  'pente-3': new Pente3Adapter(),
  quadwall: new QuadwallAdapter(),
  'connect6-mp': new Connect6Adapter(),
  'quarto-pass': new QuartoPassAdapter(),
};

export function partyAdapterFor(gameSlug: string): PartyAdapter {
  const adapter = ADAPTERS[gameSlug];
  if (!adapter) throw new NotFoundException(`Unknown party game: ${gameSlug}`);
  return adapter;
}
