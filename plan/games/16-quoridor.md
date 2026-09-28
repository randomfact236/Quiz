# 16 — Quoridor (empty-board family)

> **Status:** PLANNED — batch M. Template: [README.md](README.md) §1.
> Race + walls. Pawns start on their fixed baselines (rules constants, like Checkers'
> ranks); every wall and every step is a player decision. The hard AI is honest work:
> shortest-path + wall-search, not a solved game.

## 1. Nine-line spec

1. **Name:** Quoridor
2. **One-liner:** race your pawn to the far row — or strand your opponent with walls
3. **How to win:** reach any cell of your target back row first
4. **The board:** 9×9 cells + fence lattice; a move = step the pawn 1 cell (orthogonal)
   OR place one of your 10 walls (2-cell span)
5. **Turns:** strict alternation; wall or step each turn
6. **Solo AI:** easy = greedy shortest walk, few walls · medium = defensive walls when
   your path shortens · hard = shortest-path + wall-placement search (strong, not perfect)
7. **Duel:** turn-based live, invite code; server validates wall collisions and the
   always-a-path rule, resolves the finish
8. **Toggles:** walls 10 (default) / 7 (quick) · board 7×7 / 9×9 (default)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Walls may not overlap or cross, and must always leave BOTH pawns at least one
  connected path to their goal row (the server enforces this).
- Diagonal steps only per official corner-cut rules (adjacent pawns may sidestep).

## 3. Board model (`core.js`, pure)

- State: `pawn: [pos,pos]`, `wallsH/wallsV: Set`, `wallsLeft: [n,n]`, `turn`.
- `legalSteps(state, p)` · `canPlaceWall(state, h, v)` (overlap + BFS path check for both
  pawns) · `applyStep/applyWall` · `isWin(state)`. Path-existence BFS is the critical
  pure function — jest-tested on crafted mazes.

## 4. Solo AI

| Tier   | Behaviour                                                                       |
| ------ | ------------------------------------------------------------------------------- |
| Easy   | Walks its shortest path; places a wall rarely and badly                         |
| Medium | Maintains path parity; walls when opponent's path shortens by 2+                |
| Hard   | Alternation search: compare own next-path vs opponent's after candidate walls;  |
|        | eval = path-length difference + walls left. Strong amateur play, explicitly not |
|        | a solver.                                                                       |

## 5. Online duel (backend)

- ttt-pattern clone (`/quoridor`): match row holds pawn positions, wall sets, counts,
  `turn`, `status`, guest ids, `expiresAt`. Server re-runs the path-existence check on
  every wall and resolves the finish. 3-second poll sync.

## 6. UI / rounds

Board with two clearly tinted goal rows, wall ghost preview with instant illegal
feedback, walls-left pips. Rematch = side swap. Rounds run 5–15 min (7×7 shorter).

## 7. Phases + effort

| Phase | Work                               | Effort |
| ----- | ---------------------------------- | ------ |
| 1     | core.js (walls + path BFS) + tests | ~4 h   |
| 2     | shell + AI tiers                   | ~5 h   |
| 3     | backend module + specs             | ~3 h   |
| 4     | online mode + registry + polish    | ~3 h   |

## 8. Verification

jest: wall overlap/cross matrix, path-existence enforcement (blockade rejection),
corner-step legality; backend specs: wall validation parity with core.js, turn
enforcement, server-resolved win; two-phone manual duel.
