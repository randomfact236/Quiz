# 01 — Connect Four (empty-board family)

> **Status:** PLANNED — build FIRST (owner-approved roadmap). Template: [README.md](README.md) §1.
> The strongest friend-duel fit on the roadmap.

## 1. Nine-line spec

1. **Name:** Connect Four
2. **One-liner:** drop discs into a 7×6 grid; first to line up four wins
3. **How to win:** four of your discs in a row — horizontal, vertical, or diagonal
4. **The board:** 7 columns × 6 rows; a move = tap a column, the disc falls to the
   lowest empty slot
5. **Turns:** strict alternating (red / yellow); X-equivalent = the creator
6. **Solo AI:** easy = mostly random · medium = wins/blocks immediately, prefers center ·
   hard = searches ahead (near-perfect)
7. **Duel:** same board, live, invite code — the server validates every drop
8. **Toggles:** none (keep it pure)
9. **Never:** no levels, no pre-filled data

## 2. Rules

- Gravity: a disc lands in the lowest empty row of the chosen column; full columns reject.
- Win: any 4-in-a-line of the mover's discs. Draw: all 42 cells filled.
- First mover alternates on rematch.

## 3. Board model (`core.js`, pure)

- `board: Int8Array(42)` (0 empty, 1 red, 2 yellow) + `heights: Int8Array(7)`.
- `drop(board, col, mark) → {board, row}` · `findWin(board, lastRow, lastCol) → line | null`
  (4 directions from the last drop — no full-board scan needed) · `isFull`.
- Same pure-model + UI-shell split as tic-tac-toe (`core.js` jest-tested).

## 4. Solo AI

| Tier   | Behaviour                                                                     |
| ------ | ----------------------------------------------------------------------------- |
| Easy   | Random valid column; takes an instant win ~50% of the time                    |
| Medium | Win if possible → block if forced → else center-weighted heuristic            |
| Hard   | Minimax + alpha-beta, depth 7–8, center-column weighting — plays near-perfect |

All client-side, no server cost; runs in `core.js` behind the same `aiMove` seam as ttt.

## 5. Online duel (backend)

- Clone of the `tictactoe` module (`connectfour` controller/service/entity): 6-char code,
  `POST create/join/move/leave`, `GET view` — server-authoritative, 3-second poll, no
  websockets.
- Move payload: `{cell: column}`; server applies gravity, detects the win line, stores it.
- Migration clones `ttt_matches` with a `columns` board representation.

## 6. UI / rounds

Menu (mode + difficulty, the ttt shell) → playing (7×6 board, drop animation, win-line
highlight) → result overlay → instant rematch. Online rematch = new match (ttt pattern).

## 7. Phases + effort

| Phase | Work                                      | Effort |
| ----- | ----------------------------------------- | ------ |
| 1     | core.js model + win check + tests         | ~2 h   |
| 2     | solo shell + AI tiers                     | ~3 h   |
| 3     | backend module + migration + specs        | ~3 h   |
| 4     | online mode + registry/hub entry + polish | ~2 h   |

## 8. Verification

`core.js` jest suite (gravity, wins in 4 directions, draws, full-column rejection);
backend specs (turn validation, gravity server-side, win detection); two-phone manual duel.
