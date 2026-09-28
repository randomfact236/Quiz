# 28 — Domineering (empty-board family)

> **Status:** PLANNED — batch XS. Template: [README.md](README.md) §1.
> Two players, two orientations, one shrinking grid. Possibly the smallest complete
> duel in the family: an empty grid and one rule.

## 1. Nine-line spec

1. **Name:** Domineering
2. **One-liner:** you place vertical dominoes, they place horizontal ones — whoever cannot place, loses
3. **How to win:** make the opponent unable to place their orientation on the remaining cells
4. **The board:** n×m empty grid; a move = occupy two adjacent cells (Vertical player:
   one above the other · Horizontal player: side by side)
5. **Turns:** strict alternation; no pass — stuck = loss
6. **Solo AI:** easy = random legal placement · medium = prefers move-preserving
   placements · hard = **perfect solver** for small boards (memoized game-tree over
   bitmask grid); heuristic alpha-beta on larger
7. **Duel:** turn-based live, invite code; server validates orientation adjacency and resolves the stuck loss
8. **Toggles:** grid 5×5 (default) / 6×6 / 8×8 · who takes Vertical
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Both cells of a domino must be empty; they may touch anything (no capture, no contact rules).
- The game cannot draw — the grid always runs out for someone.

## 3. Board model (`core.js`, pure)

- State: `cells: boolean[]`, `turn` (orientation implied).
- `legalMoves(state, orientation)` · `applyPlace(state, cells)` · `isStuck(state)`.
  Bitmask representation keeps the solver tiny — jest-tested exhaustively on 5×5.

## 4. Solo AI

| Tier   | Behaviour                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| Easy   | Random legal domino                                                          |
| Medium | Avoids splitting its own region; takes big-region placements                 |
| Hard   | Exact memoized solver on ≤6×6; alpha-beta with region-count heuristic beyond |

## 5. Online duel (backend)

- ttt-pattern clone (`/domineering`): match row holds `cells`, `turn`, `status`, guest
  ids, `expiresAt`. Server validates orientation + adjacency and resolves the stuck
  loss. 3-second poll sync.

## 6. UI / rounds

Grid with domino ghost preview locked to your orientation, stuck-lose overlay.
Rematch = orientation swap. Rounds run 2–5 min.

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js + solver + tests        | ~1.5 h |
| 2     | shell + AI tiers                | ~1.5 h |
| 3     | backend module + specs          | ~1.5 h |
| 4     | online mode + registry + polish | ~1 h   |

## 8. Verification

jest: orientation legality, stuck detection, solver agreement with brute force on small
boards; backend specs: orientation enforcement, turn validation, server-resolved loss;
two-phone manual duel.
