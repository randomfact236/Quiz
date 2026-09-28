# 30 — Sim (empty-board family)

> **Status:** PLANNED — batch XS. Template: [README.md](README.md) §1.
> Six dots, two pencils, one deadly geometric trap: draw a line, and the moment YOUR
> three lines close a triangle of your colour — you lose. Fully empty-board.

## 1. Nine-line spec

1. **Name:** Sim
2. **One-liner:** take turns colouring lines between six dots — the first to own a full triangle LOSES
3. **How to win:** avoid completing any monochromatic triangle in your colour
4. **The board:** 6 dots with all 15 possible connecting lines empty; a move = colour
   one uncoloured line in your colour
5. **Turns:** strict alternation; max 15 moves total — the game always ends: someone
   closes a triangle of their colour, or (theoretically impossible by Ramsey theory)
   the board fills — treat a full board as a draw for safety
6. **Solo AI:** easy = random free line · medium = avoids immediate losing triangles,
   blocks yours · hard = **perfect solver** (15 lines, exhaustive game-tree over 2^15
   subset — tiny)
7. **Duel:** turn-based live, invite code; server colours lines and detects the losing triangle
8. **Toggles:** none in v1 (6 dots is the game)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- A line, once coloured, never changes owner.
- Triangle check: any 3 dots where all 3 connecting lines share your colour = you lose
  (checked immediately after your move).

## 3. Board model (`core.js`, pure)

- State: `edges: (0|1|2|null)[15]`, `turn`.
- `applyColour(state, edge)` · `losingTriangle(state, player)` (20 triangle triples) ·
  `isOver(state)`. The 20-triangle scan is jest-exhaustively-testable.

## 4. Solo AI

| Tier   | Behaviour                                                               |
| ------ | ----------------------------------------------------------------------- |
| Easy   | Random uncoloured edge                                                  |
| Medium | Never completes own triangle; leaves enemy traps where cheap            |
| Hard   | Full game-tree solver over remaining edges — provably perfect on 6 dots |

## 5. Online duel (backend)

- ttt-pattern clone (`/sim`): match row holds `edges`, `turn`, `status`, guest ids,
  `expiresAt`. Server validates edge ownership, runs the triangle scan, resolves the
  loss. 3-second poll sync.

## 6. UI / rounds

Hexagon of dots with two-colour line drawing, losing triangle flashes red. Rematch =
colour swap. Rounds run 2–4 min.

## 7. Phases + effort

| Phase | Work                            | Effort |
| ----- | ------------------------------- | ------ |
| 1     | core.js + solver + tests        | ~1.5 h |
| 2     | shell + AI tiers                | ~1.5 h |
| 3     | backend module + specs          | ~1.5 h |
| 4     | online mode + registry + polish | ~1 h   |

## 8. Verification

jest: triangle scan over all 20 triples, loss-on-completion, draw safety path, perfect
play sanity; backend specs: edge validation, turn enforcement, server-resolved loss;
two-phone manual duel.
