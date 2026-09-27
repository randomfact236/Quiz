# 06 — Checkers (empty-board family)

> **Status:** PLANNED — the "step up" game. Template: [README.md](README.md) §1.
> Bigger build than the others (forced captures, multi-jumps, kings) — scheduled after
> the four cheaper games prove the family.

## 1. Nine-line spec

1. **Name:** Checkers (Draughts)
2. **One-liner:** jump your opponent's pieces; crown kings on the far row; capture or
   corner them all
3. **How to win:** opponent has no legal move (all pieces captured or blocked)
4. **The board:** 8×8, 12 pieces per side on the dark squares; a move = move a piece
   diagonally, or jump an enemy piece
5. **Turns:** strict alternating; captures are FORCED (the classic rule that keeps games
   sharp); multi-jumps continue in one turn; reaching the far row crowns a KING (moves
   and captures backwards too)
6. **Solo AI:** easy = random legal moves · medium = greedy captures + basic safety ·
   hard = minimax with alpha-beta (deep enough to punish mistakes for many moves)
7. **Duel:** same board, live, invite code — the server enforces forced captures and
   resolves multi-jump paths cell by cell
8. **Toggles:** none in v1
9. **Never:** no levels, no pre-filled openings

## 2. Rules

- Men move/capture diagonally forward; kings both ways.
- If any capture exists, the mover MUST capture; a multi-jump must be continued while
  jumps remain (path chosen by the player, cell-by-cell for online clarity).
- Draw: 40 moves with no capture and no man advancement (simple repetition guard).

## 3. Board model (`core.js`, pure)

- `board: Uint8Array(32)` (dark squares only) · `legalMoves(board, side) → Move[]` with
  forced-capture filtering · `applyMove` (handles multi-jump steps + crowning) ·
  `outcome(board, side) → win|loss|draw`. The most complex pure model in the family —
  the test suite carries the weight.

## 4. Solo AI

| Tier   | Behaviour                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| Easy   | Random legal move                                                            |
| Medium | Prefers captures (multi-jumps first), avoids moving into jumps               |
| Hard   | Minimax + alpha-beta depth ~8 with piece-count, king and advancement weights |

## 5. Online duel (backend)

- ttt-pattern clone; a "move" is one jump step or a simple move — the server validates
  the forced-capture constraint at every step and tracks the in-progress multi-jump, so
  neither client can skip or shorten a chain.

## 6. UI / rounds

Tap-piece → highlighted destinations (jump moves visually distinct) → tap-destination;
multi-jumps walk one hop per tap. Crown animation on kings; end overlay. Rematch flips
the opener.

## 7. Phases + effort

| Phase | Work                                                                         | Effort |
| ----- | ---------------------------------------------------------------------------- | ------ |
| 1     | core.js (legal moves, forced capture, multi-jump, kings, draw guard) + tests | ~6 h   |
| 2     | shell + AI tiers                                                             | ~4 h   |
| 3     | backend module (step-validated multi-jumps) + specs                          | ~4 h   |
| 4     | online mode + registry + polish                                              | ~2 h   |

## 8. Verification

jest: forced-capture filtering, multi-jump continuation + termination, crowning, draw
guard (the classic bug farm); backend specs: illegal-step rejection, chain enforcement;
two-phone manual duel.
