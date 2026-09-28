# 37 — Notakto (empty-board family)

> **Status:** PLANNED — batch XS. Template: [README.md](README.md) §1.
> The misère tic-tac-toe nobody can draw: BOTH players place X on THREE boards, and
> completing THREE in a row on ANY board loses. (The ideas doc said "four in a row" —
> corrected here to the canonical three.) Fully empty-board.

## 1. Nine-line spec

1. **Name:** Notakto (Misère Tic-Tac-Toe)
2. **One-liner:** three boards, everyone plays X — the player who completes a three-in-a-row loses
3. **How to win:** force the opponent to complete any line on any board
4. **The board:** three 3×3 boards side by side; a move = place an X in any empty cell of
   any board
5. **Turns:** strict alternation, one X per turn; completing THREE-in-a-row on any board
   = immediate loss; boards that fill without a line go dead (rare)
6. **Solo AI:** easy = random empty cell · medium = avoids immediate losing moves,
   creates weak traps · hard = **perfect solver** (the known Notakto strategy space is
   small enough to enumerate)
7. **Duel:** turn-based live, invite code; server places X's and resolves the losing line
8. **Toggles:** boards 1/2/3 (default 3) · first player X-always (no marks to assign)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- There are no O's — both sides write the same X.
- A line is 3 collinear X's on ONE board (rows, cols, diagonals of that board).
- If a placement fills the last empty cell of the last live board with no line, the
  mover loses (parity endgame; solver handles it).

## 3. Board model (`core.js`, pure)

- State: `boards: (null|'X')[9][] × 3`, `turn`.
- `applyPlace(state, board, cell)` · `losingLine(state, board)` · `allDead(state)`.
  Trivial pure model — the depth is all in the solver/AI.

## 4. Solo AI

| Tier   | Behaviour                                                                      |
| ------ | ------------------------------------------------------------------------------ |
| Easy   | Random cell on a random live board                                             |
| Medium | Never takes a losing line; sets up two-way threats                             |
| Hard   | Perfect: memoized win/loss over the small joint state space (known result: the |
|        | first player wins on 3 boards with the right opening)                          |

## 5. Online duel (backend)

- ttt-pattern clone (`/notakto`): match row holds `boards` (jsonb), `turn`, `status`,
  guest ids, `expiresAt`. Server validates empties, runs the line scan, resolves the
  loss. 3-second poll sync.

## 6. UI / rounds

Three boards with one shared X mark style, losing line flashes red, dead boards dim.
Rematch = first move swap. Rounds run 2–4 min.

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js + solver + tests        | ~1.5 h |
| 2     | shell + AI tiers                | ~1.5 h |
| 3     | backend module + specs          | ~1.5 h |
| 4     | online mode + registry + polish | ~1 h   |

## 8. Verification

jest: line detection per board, all-dead endgame, solver agreement with brute force;
backend specs: placement validation, turn enforcement, server-resolved loss; two-phone
manual duel.
