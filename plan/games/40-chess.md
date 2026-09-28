# 40 — Chess (empty-board family)

> **Status:** PLANNED — batch L, deliberately scheduled LAST. Template: [README.md](README.md) §1.
> The final boss. The opening array is the one fixed setup in chess — a rules constant,
> not served content. Building a full legal-move engine + a playable AI in core.js is a
> project; this plan exists so the scope is honest before anyone starts.

## 1. Nine-line spec

1. **Name:** Chess
2. **One-liner:** the classic — checkmate the enemy king before yours falls
3. **How to win:** checkmate · resignation · timeout (duel clock) · stalemate/fivefold
   repetition/50-move = draw
4. **The board:** 8×8 with the standard opening array (rules constant); a move = one
   legal piece move per turn (specials: castling, en passant, promotion to Q/R/B/N)
5. **Turns:** strict alternation; you may never leave your king in check
6. **Solo AI:** easy = material-greedy with blunders · medium = 2-ply alpha-beta +
   material/position tables · hard = deeper alpha-beta with quiescence and a real
   evaluation — **a genuine project; strength capped by phone CPU, stated honestly**
7. **Duel:** turn-based live, invite code; server validates every move (full legality incl.
   check), applies clocks, resolves mates/draws
8. **Toggles:** side selection · clock none / 5+3 / 10+0 (duels) · no variants in v1
9. **Never:** no levels, no pre-filled anything beyond the standard array

## 2. Rules

- Full FIDE legality: pins, discovered checks, castling rights tracking, en passant
  window, promotion choice, insufficient-material draws.
- Duel clock: elapsed on your turn; flag = loss (server-clock, like duel timing).

## 3. Board model (`core.js`, pure)

- State: `squares: piece[64]`, `turn`, `castlingRights`, `epSquare`, `halfmoveClock`,
  `fullmove`, position-key history for repetition.
- `legalMoves(state, from)` · `applyMove(state, mv)` · `isCheck/isMate/isStalemate` ·
  `classifyEnd(state)`. This is the largest pure model in the family — its jest suite
  (perft counts on standard positions) is the build's backbone.

## 4. Solo AI

| Tier   | Behaviour                                                                         |
| ------ | --------------------------------------------------------------------------------- |
| Easy   | 1-ply material greed + random blunder rate                                        |
| Medium | Alpha-beta ~2-ply + PSTs, no search extensions                                    |
| Hard   | Iterative deepening + quiescence + MVV-LVA ordering, time-budgeted per phone CPU. |
|        | Honest framing: solid amateur, not Stockfish.                                     |

## 5. Online duel (backend)

- ttt-pattern clone (`/chess`): match row holds the full game state (jsonb), clocks,
  `status`, guest ids, `expiresAt`. Server runs the SAME legality engine (shared pure
  module imported by both backend and frontend) — no move crosses unchecked.
  Server clock authoritative; checkmate/draw resolved server-side. 3-second poll sync.

## 6. UI / rounds

Board with drag/tap-move, check highlight, move list, promotion picker, clock pills.
Rematch = colour swap. Rounds run 5–20 min (clocked duels) — the longest family game.

## 7. Phases + effort

| Phase | Work                                           | Effort |
| ----- | ---------------------------------------------- | ------ |
| 1     | core.js move-gen + legality + perft test suite | ~12 h  |
| 2     | shell + AI tiers + end classification          | ~10 h  |
| 3     | backend module (clocks, resolution) + specs    | ~6 h   |
| 4     | online mode + registry + polish                | ~4 h   |

## 8. Verification

jest: perft(1..3) = 20/400/8902 on the start position, castling/en-passant/promotion
matrix, mate/stalemate classics; backend specs: legality parity, clock authority,
resolution correctness; two-phone manual duel with a clocked finish.
