# 26 — Lines of Action (empty-board family)

> **Status:** PLANNED — batch M. Template: [README.md](README.md) §1.
> Connect your checkers into one blob — but the distance you may move is dictated by
> how many pieces (either colour) share that line. Fixed edge setup = rules constant.

## 1. Nine-line spec

1. **Name:** Lines of Action (LOA)
2. **One-liner:** move checkers to fuse all of yours into one connected group before your opponent does
3. **How to win:** all your checkers form a single orthogonally+diagonally connected group
4. **The board:** 8×8 with 12 checkers per side on the border cells (corners empty); a
   move = one checker exactly N squares in a straight line, where N = number of checkers
   (both colours) on that line of movement
5. **Turns:** alternation; landing on an enemy checker captures it; landing on your own is illegal
6. **Solo AI:** easy = random legal moves · medium = seeks captures and central
   cohesion · hard = alpha-beta with connectivity/mobility evaluation
7. **Duel:** turn-based live, invite code; server validates distance counts and resolves the connection
8. **Toggles:** none in v1 (standard setup is the game)
9. **Never:** no levels, no pre-filled anything beyond the canonical border setup

## 2. Rules

- Lines of movement: rows, columns, and both diagonals through the moving checker.
- A checker may jump over friendly checkers but NOT over enemy checkers.
- Rare double-win (both connect simultaneously) → the mover wins.

## 3. Board model (`core.js`, pure)

- State: `cells: (0|1|2|null)[]`, `turn`.
- `lineCount(state, pos, dir)` · `legalMoves(state, pos)` (distance, jumps, capture) ·
  `connected(state, player)` via flood fill · `isWin(state)`. Distance law + connection
  are jest-tested on crafted positions.

## 4. Solo AI

| Tier   | Behaviour                                                                     |
| ------ | ----------------------------------------------------------------------------- |
| Easy   | Random checker, random legal distance                                         |
| Medium | Captures when possible, pulls scattered checkers toward its group             |
| Hard   | Alpha-beta; eval = group size/fragment count + enemy mobility. Heuristic, not |
|        | solved.                                                                       |

## 5. Online duel (backend)

- ttt-pattern clone (`/loa`): match row holds `cells`, `turn`, `status`, guest ids,
  `expiresAt`. Server recomputes line counts and validates every move; resolves
  connection (mover-wins rule). 3-second poll sync.

## 6. UI / rounds

Board with tapped checker showing all legal destinations (distance law visualized by
highlighted rings), group-connected glow. Rematch = colour swap. Rounds run 5–12 min.

## 7. Phases + effort

| Phase | Work                                        | Effort |
| ----- | ------------------------------------------- | ------ |
| 1     | core.js (distance law + flood fill) + tests | ~3.5 h |
| 2     | shell + AI tiers                            | ~4 h   |
| 3     | backend module + specs                      | ~2.5 h |
| 4     | online mode + registry + polish             | ~2.5 h |

## 8. Verification

jest: distance-count correctness (row/col/diag), jump-over-enemy rejection, flood-fill
connection, double-win resolution; backend specs: move validation parity, turn
enforcement, server-resolved win; two-phone manual duel.
