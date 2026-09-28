# 12 — Othello / Reversi (empty-board family)

> **Status:** PLANNED — batch M. Template: [README.md](README.md) §1.
> The classic flip duel. The four opening stones are the game's own setup — a rules
> constant (like Checkers' ranks), not served content; every other disc is player-placed.

## 1. Nine-line spec

1. **Name:** Othello (Reversi)
2. **One-liner:** outflank enemy discs to flip them — own the most discs when the board fills
3. **How to win:** majority of your colour when neither side can move
4. **The board:** 8×8 with the standard 2×2 centre start; a move = place one disc so it
   flanks at least one enemy line
5. **Turns:** you must flip; if you have no legal move you pass (auto-shown); both
   passing ends the game
6. **Solo AI:** easy = greedy flip count · medium = positional weights (corners, edges) ·
   hard = alpha-beta with mobility + stability evaluation (strong club play)
7. **Duel:** turn-based live, invite code; server validates flips, applies them, counts discs
8. **Toggles:** board 6×6 / 8×8 (default) / 10×10
9. **Never:** no levels, no pre-filled anything beyond the standard opening setup

## 2. Rules

- Legal move = one or more straight (8-direction) enemy lines closed by your new disc.
- Flipped discs change colour immediately and permanently (until re-flipped later).

## 3. Board model (`core.js`, pure)

- State: `cells: (0|1|2)[]`, `turn`.
- `legalMoves(state)` · `applyMove(state, idx)` → flips + turn/pass resolution ·
  `discCount(state)` · `isOver(state)`. Flip math is pure and jest-table-tested.

## 4. Solo AI

| Tier   | Behaviour                                                                     |
| ------ | ----------------------------------------------------------------------------- |
| Easy   | Maximizes immediate flips, ignores corners                                    |
| Medium | Positional weight table (corners huge, X/C squares negative)                  |
| Hard   | Alpha-beta with mobility/stability eval; endgame exact solve from ~12 empties |

## 5. Online duel (backend)

- ttt-pattern clone (`/othello`): match row holds `cells`, `turn`, `status`, guest ids,
  `expiresAt`. Server recomputes flips and pass transitions; disc counts are
  server-derived. 3-second poll sync.

## 6. UI / rounds

Disc-flip animation, legal-move hints, live score bar, pass banner. End overlay with the
final board + counts. Rematch = colour swap. Rounds run 5–10 min (6×6 ~4).

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js (flips, passes) + tests | ~2.5 h |
| 2     | shell + AI tiers                | ~5 h   |
| 3     | backend module + specs          | ~3 h   |
| 4     | online mode + registry + polish | ~3 h   |

## 8. Verification

jest: flip geometry on all 8 directions, pass/pass endgame, score integrity; backend
specs: illegal placement rejection, turn enforcement, server-counted result; two-phone
manual duel.
