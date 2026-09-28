# 24 — Connect6 (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> Six in a row with two stones per turn — the double-move tames first-player advantage
> without a swap rule. Completely empty board (first turn gets exactly one stone by rule).

## 1. Nine-line spec

1. **Name:** Connect6
2. **One-liner:** place two stones per turn — first to SIX in a row wins
3. **How to win:** six or more of your stones in any straight line
4. **The board:** 19×19 intersections; a move = place 2 stones (1 stone only on the very
   first move of the game)
5. **Turns:** alternation; both stones of a turn go to empty intersections
6. **Solo AI:** easy = random-ish pairs · medium = builds/blocks open fours and threes ·
   hard = alpha-beta with line-threat counting (strong, honestly not perfect — wide branching)
7. **Duel:** turn-based live, invite code; server validates both stones and resolves six-in-a-row
8. **Toggles:** board 15×15 / 19×19 (default)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Exactly two stones per turn after the opener's single stone.
- Winning line may be horizontal, vertical, or either diagonal; 6+ counts (overlines win).

## 3. Board model (`core.js`, pure)

- State: `cells: (0|1|2)[]`, `turn`, `firstMoveDone`.
- `applyTurn(state, a, b)` (validates 1 or 2 stones by phase) · `sixInRow(state)` over
  4 axes. Jest-tested line scans including overlines.

## 4. Solo AI

| Tier   | Behaviour                                                                          |
| ------ | ---------------------------------------------------------------------------------- |
| Easy   | Random empty intersections                                                         |
| Medium | Extends own lines, blocks enemy open lines, prefers central pairs                  |
| Hard   | Alpha-beta on threat lines; eval = open 3/4/5 counts both colours. Strong amateur, |
|        | explicitly not a solver (19×19 branching).                                         |

## 5. Online duel (backend)

- ttt-pattern clone (`/connect6`): match row holds `cells`, `turn`, `firstMoveDone`,
  `status`, guest ids, `expiresAt`. Server validates stone count per phase and resolves
  the win after the second stone. 3-second poll sync.

## 6. UI / rounds

Go-grid with two-stone turn basket (tap-tap-confirm), last-move markers, win-line
highlight. Rematch = colour swap. Rounds run 8–15 min.

## 7. Phases + effort

| Phase | Work                              | Effort |
| ----- | --------------------------------- | ------ |
| 1     | core.js (two-stone turns) + tests | ~2 h   |
| 2     | shell + AI tiers                  | ~4 h   |
| 3     | backend module + specs            | ~2.5 h |
| 4     | online mode + registry + polish   | ~2.5 h |

## 8. Verification

jest: one-stone opener enforcement, two-stone validation, six/overline detection on all
4 axes; backend specs: stone-count validation, turn enforcement, server-resolved win;
two-phone manual duel.
