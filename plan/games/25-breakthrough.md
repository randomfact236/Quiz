# 25 — Breakthrough (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> The pawn race: two moves per pawn, one goal — reach the far row. Fixed starting ranks
> are rules constants; every advance is a player decision.

## 1. Nine-line spec

1. **Name:** Breakthrough
2. **One-liner:** march your pawns to the enemy back row — capture diagonally, never straight ahead
3. **How to win:** first pawn to reach the opponent's home row · or capture every enemy pawn
4. **The board:** 8×8 (or 6×6 quick), 2 ranks of pawns per side (16 each); a move = one
   pawn one step forward or diagonally-forward-capture
5. **Turns:** strict alternation, one pawn per turn
6. **Solo AI:** easy = random legal moves · medium = advances the most advanced pawn,
   blocks breakthrough files · hard = alpha-beta with pawn-race evaluation
7. **Duel:** turn-based live, invite code; server validates moves/captures and resolves the race
8. **Toggles:** board 6×6 / 8×8 (default) · pawn ranks 1/2 (default)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Forward step into an EMPTY cell only; captures ONLY diagonally forward.
- No double-step, no en passant, no promotion — the far row IS the win.

## 3. Board model (`core.js`, pure)

- State: `cells: (0|1|2|null)[]`, `turn`.
- `legalMoves(state, player)` · `applyMove(state, from, to)` · `isWin(state)` (row reach
  or material elimination). Tiny rule set — fully jest-table-tested.

## 4. Solo AI

| Tier   | Behaviour                                                                          |
| ------ | ---------------------------------------------------------------------------------- |
| Easy   | Random legal pawn moves                                                            |
| Medium | Pushes the leading pawn, trades when ahead, guards the breakthrough file           |
| Hard   | Alpha-beta; eval = advancement + pawn count + file control. Sharp but not perfect. |

## 5. Online duel (backend)

- ttt-pattern clone (`/breakthrough`): match row holds `cells`, `turn`, `status`, guest
  ids, `expiresAt`. Server validates each move (empty-forward, diagonal-capture-only)
  and resolves the finish. 3-second poll sync.

## 6. UI / rounds

Checkerboard with pawn silhouettes, legal-move dots, win-row glow. Rematch = colour
swap. Rounds run 3–7 min.

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js + tests                 | ~1.5 h |
| 2     | shell + AI tiers                | ~3 h   |
| 3     | backend module + specs          | ~2.5 h |
| 4     | online mode + registry + polish | ~2.5 h |

## 8. Verification

jest: forward-vs-diagonal legality matrix, elimination win, row-reach win; backend
specs: move validation, turn enforcement, server-resolved winner; two-phone manual duel.
