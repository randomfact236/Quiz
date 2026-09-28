# 33 — Three Men's Morris (empty-board family)

> **Status:** PLANNED — batch XS. Template: [README.md](README.md) §1.
> The 2,000-year-old ancestor of tic-tac-toe: place 3 men, then slide them. A tiny,
> perfect-solver game — the ideal XS companion to Nim and Chomp.

## 1. Nine-line spec

1. **Name:** Three Men's Morris
2. **One-liner:** get your three men in a row — first place them, then slide them
3. **How to win:** three of your men on a straight line
4. **The board:** 3×3 grid (diagonals variant: + 4 diagonal lines); a move = place a man
   on an empty cell (phase 1) or slide one of yours to an adjacent empty cell (phase 2)
5. **Turns:** alternation; 3 men each, placement then sliding forever — no captures,
   no passes
6. **Solo AI:** easy = random legal moves · medium = blocks obvious lines ·
   hard = **perfect solver** (tiny state space, fully enumerable)
7. **Duel:** turn-based live, invite code; server validates placement/slides and resolves the line
8. **Toggles:** diagonal lines OFF (classic) / ON (nine-board variant)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Phase 1: each player places their 3 men on alternating turns.
- Phase 2: a man slides to an orthogonally (and diagonally, if toggled) adjacent empty cell.
- Stalemate safety: with best play the game can loop — a 50-move rule declares a draw.

## 3. Board model (`core.js`, pure)

- State: `cells: (0|1|2|null)[9]`, `inHand: [3,3]`, `turn`, `moveClock`.
- `legalMoves(state)` (phase-aware) · `applyPlace/applySlide` · `lineAt(state, player)` ·
  `isDraw(state)`. Fully enumerable — jest can test every reachable position.

## 4. Solo AI

| Tier   | Behaviour                                                         |
| ------ | ----------------------------------------------------------------- |
| Easy   | Random placement/slides                                           |
| Medium | Creates two-line threats, blocks the player's forks               |
| Hard   | Perfect: retrograde-solved lookup (or exhaustive search per move) |

## 5. Online duel (backend)

- ttt-pattern clone (`/threemensmorris`): match row holds `cells`, `inHand`, `turn`,
  `moveClock`, `status`, guest ids, `expiresAt`. Server validates phase-correct moves
  and resolves line/draw. 3-second poll sync.

## 6. UI / rounds

Tic-tac-toe-like grid, hand counter per player, slide arrows in phase 2, 50-move clock
subtly shown. Rematch = first move swap. Rounds run 2–4 min.

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js + solver + tests        | ~1.5 h |
| 2     | shell + AI tiers                | ~1.5 h |
| 3     | backend module + specs          | ~1.5 h |
| 4     | online mode + registry + polish | ~1 h   |

## 8. Verification

jest: phase transitions, slide adjacency, line detection incl. diagonals toggle, draw
clock; backend specs: move validation, turn enforcement, server-resolved result;
two-phone manual duel.
