# 08 — Ultimate Tic-Tac-Toe (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> The send-rule makes every move a gift and a trap: where you play decides where your
> opponent must play. Fully empty-board — nine blank mini-grids at start.

## 1. Nine-line spec

1. **Name:** Ultimate Tic-Tac-Toe
2. **One-liner:** win three mini-games in a row — but your move picks which mini-board your opponent plays
3. **How to win:** take three mini-boards in a line (or lead on boards when the game fills)
4. **The board:** 9 mini 3×3 boards (81 cells); a move = place your mark in one legal cell
5. **Turns:** the cell you play (row/col inside the mini-board) sends the opponent to the
   matching mini-board; if that board is decided or full they play anywhere (free move)
6. **Solo AI:** easy = random legal cell · medium = prefers winning mini-boards and
   blocking sends into dangerous boards · hard = depth-limited search with
   board-ownership + send-trap evaluation (strong, not a perfect solver)
7. **Duel:** turn-based live, invite code, server validates the send-rule and every mark
8. **Toggles:** none in v1 (the send-rule is the game)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- A mini-board already decided (won or full) is closed; playing there is illegal.
- Free move (closed target) may NOT be used to reopen a decided board — it picks any open board.
- Draw if all boards are decided with no three-in-a-line of board ownership.

## 3. Board model (`core.js`, pure)

- State: `cells[9][9]`, `boardOwner[9]`, `activeBoard | null`, `turn`.
- `applyMove(state, board, cell)` → validates target legality, sets mark, recomputes
  `boardOwner`, derives next `activeBoard`; `roundOutcome(state)` → win/draw/running.
- Send-rule derivation is pure and jest-table-tested (81-cell edge cases).

## 4. Solo AI

| Tier   | Behaviour                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| Easy   | Uniform random legal cell (often gifts free moves)                           |
| Medium | Greedy: takes mini-board wins, blocks opponent lines, avoids bad sends       |
| Hard   | Depth-limited alpha-beta; eval = board ownership lines + active-board threat |

## 5. Online duel (backend)

- ttt-pattern clone (`/ultimatetictactoe`): match row holds `cells`, `boardOwner`,
  `activeBoard`, `turn`, `status`, guest ids, `expiresAt` (~30 min TTL).
- Server re-validates the send-rule on every move and resolves board/game outcomes —
  the client never decides anything. 3-second poll sync; winner stored server-side.

## 6. UI / rounds

3×3 grid of highlighted mini-boards; the forced board glows, legal cells pulse.
End overlay with board-ownership replay. Rematch = new match. Rounds run 3–6 min.

## 7. Phases + effort

| Phase | Work                                  | Effort |
| ----- | ------------------------------------- | ------ |
| 1     | core.js (send-rule + outcome) + tests | ~2 h   |
| 2     | shell + AI tiers                      | ~4 h   |
| 3     | backend module + specs                | ~3 h   |
| 4     | online mode + registry + polish       | ~2 h   |

## 8. Verification

jest: send-rule matrix (open/closed/full targets), board-ownership lines, draw detection;
backend specs: illegal-target rejection, turn enforcement, server-resolved winner;
two-phone manual duel.
