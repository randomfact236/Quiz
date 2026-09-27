# 02 — Gomoku, five-in-a-row (empty-board family)

> **Status:** PLANNED — build SECOND. Template: [README.md](README.md) §1.
> Cheapest win on the roadmap: the tic-tac-toe engine on a bigger board — and it
> practically never draws.

## 1. Nine-line spec

1. **Name:** Gomoku (Five in a Row)
2. **One-liner:** place stones on a 15×15 board; first to five in a line wins
3. **How to win:** five (or more) of your stones horizontally, vertically, or diagonally
4. **The board:** 15×15 intersections; a move = tap an empty intersection
5. **Turns:** strict alternating; black (creator) opens — no other tic-tac-toe-style rules
6. **Solo AI:** easy = random near existing stones · medium = takes wins, blocks open
   threes/fours · hard = threat-space search (strong club player, honest about not-perfect)
7. **Duel:** same board, live, invite code — server validates every stone
8. **Toggles:** board size 11×11 (quick) vs 15×15 (standard)
9. **Never:** no levels, no pre-filled patterns, no handicap system in v1

## 2. Rules

- Freestyle gomoku: five-or-more counts; overlines (six+) win (simplest rule set, no
  forbidden-move complications).
- Draw only if the board fills — practically never on 15×15.

## 3. Board model (`core.js`, pure)

- `board: Uint8Array(225)` · `place(idx, mark)` · `findWin(board, lastIdx, mark) → line`
  (scan 4 axes from the last stone, count contiguous) · `isEmpty`.
- Win-check identical in shape to ttt's, just longer runs and a bigger neighborhood.

## 4. Solo AI

| Tier   | Behaviour                                                                |
| ------ | ------------------------------------------------------------------------ |
| Easy   | Random empty cell within 2 of an existing stone                          |
| Medium | Win-now → block opponent's four → block open threes → random-near-action |
| Hard   | Candidate move generation (cells near stones) + shallow search with      |

threat scoring (open four > four > open three) — strong for casual play; documented
as "very hard", not "unbeatable" |

## 5. Online duel (backend)

- Same `tictactoe` clone: board jsonb (225 cells), move = cell index 0–224, server checks
  occupancy + turn, resolves five-in-a-row from the last stone. Rematch = new match.

## 6. UI / rounds

ttt shell reused: menu → playing → overlay → rematch. Board renders as a tap-grid
(intersections as buttons for a11y, roving focus like ttt); last-move marker + win-line
highlight. 11×11 toggle for shorter phone rounds.

## 7. Phases + effort

| Phase | Work                                     | Effort |
| ----- | ---------------------------------------- | ------ |
| 1     | core.js + win scan + tests               | ~2 h   |
| 2     | shell + AI tiers (hard tier is the bulk) | ~4 h   |
| 3     | backend module + specs                   | ~2 h   |
| 4     | online mode + registry + polish          | ~2 h   |

## 8. Verification

jest: win detection on all 4 axes, overline, adjacency-restricted AI legality; backend
specs mirror ttt's; two-phone manual duel.
