# 10 — Chomp (empty-board family)

> **Status:** PLANNED — batch XS. Template: [README.md](README.md) §1.
> One poisoned cookie, one grid, brutal math. The board starts full of cookies the
> players then eat — the poison square is a rules constant, not content.

## 1. Nine-line spec

1. **Name:** Chomp
2. **One-liner:** pick a cookie, eat it plus everything above and to its right — eat the poison cookie and you lose
3. **How to win:** leave the opponent with only the poison square
4. **The board:** n×m cookie grid, poison in the bottom-left; a move = tap any remaining cookie
5. **Turns:** strict alternation; each chomp removes the tapped cookie and its whole
   up-right rectangle; taking the poison loses immediately
6. **Solo AI:** easy = random legal cookie · medium = avoids obvious losing chomps ·
   hard = **perfect solver** for small grids (memoized win/loss over chomp positions)
7. **Duel:** turn-based live, invite code; server validates chomps and resolves the poison loss
8. **Toggles:** grid size 5×5 (default) / 4×6 / 3×9 · who moves first
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- The top-right cookie always goes with any chomp of itself (full rectangle removal).
- Poison is never "eaten and survived": tapping it ends the game as a loss for the tapper.

## 3. Board model (`core.js`, pure)

- State: `remaining: number[]` (row lengths), `turn`.
- `applyChomp(state, r, c)` → clamps rows; `isPoisonOnly(state)`; `chompKey(state)` for
  memoization. Solver shares the same pure model; jest-tested on all 5×5 positions.

## 4. Solo AI

| Tier   | Behaviour                                                                 |
| ------ | ------------------------------------------------------------------------- |
| Easy   | Uniform random cookie                                                     |
| Medium | Prefers edge/\_corner chomps, avoids leaving obvious 2×2 threats          |
| Hard   | Memoized perfect play for grids up to ~6×6; beyond that, depth heuristics |

## 5. Online duel (backend)

- ttt-pattern clone (`/chomp`): match row holds `remaining`, `turn`, `status`, guest
  ids, `expiresAt`. Server validates every chomp (row/col bounds) and resolves the
  poison loss. 3-second poll sync.

## 6. UI / rounds

Cookie grid with a skull on the poison square; eaten rectangles animate away.
Instant rematch with role flip. Rounds run 1–3 min.

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js + solver + tests        | ~1.5 h |
| 2     | shell + AI tiers                | ~1.5 h |
| 3     | backend module + specs          | ~1.5 h |
| 4     | online mode + registry + polish | ~1 h   |

## 8. Verification

jest: chomp rectangle math, poison-loss, solver self-consistency (win ⇔ opponent has no
winning reply); backend specs: chomp validation, turn enforcement; two-phone manual duel.
