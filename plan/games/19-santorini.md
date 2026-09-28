# 19 — Santorini (empty-board family)

> **Status:** PLANNED — batch M. Template: [README.md](README.md) §1.
> The builders duel where even the starting positions are player-placed — the purest
> "you set up your own game" model in the family.

## 1. Nine-line spec

1. **Name:** Santorini
2. **One-liner:** climb towers and dome them — be the one standing on level 3, or make that impossible for your rival
3. **How to win:** move one of your builders onto level 3 · or leave the opponent with no legal move
4. **The board:** 5×5 of level-0 spaces; each player has 2 builders (placed by the
   players themselves on empty cells at game start); a move = move 1 builder 1 space,
   then build 1 level on an adjacent space
5. **Turns:** move + build, strictly; domes cap towers at level 4 (climbable 1→2→3 only)
6. **Solo AI:** easy = random-ish move+build · medium = races its own tower, blocks
   yours, avoids doming you into a win · hard = alpha-beta with climb-threat (tower +
   adjacency) evaluation
7. **Duel:** turn-based live, invite code; server validates move legality + build
   adjacency, resolves level-3 wins and lockouts
8. **Toggles:** god powers OFF in v1 (base game only — no card deck to keep it empty-board)
9. **Never:** no levels, no pre-filled anything — even builder placement is player-made

## 2. Rules

- Move: 1 orthogonal/diagonal step to an empty space at most one level higher (jump
  down any height).
- Build: add a level (or a dome on level 3) on any adjacent non-occupied space.
- You may not move onto a domed space, an occupied space, or climb 2+ levels.

## 3. Board model (`core.js`, pure)

- State: `levels: number[25]`, `domes: boolean[25]`, `builders: [pos,pos,pos,pos]`,
  `turn`, `phase: setup|play`.
- `legalMoves(state, b)` · `legalBuilds(state, pos)` · `applySetup(pos)` ·
  `applyTurn(state, move, build)` · `isWin/isLocked(state)`. All pure, jest-table-tested.

## 4. Solo AI

| Tier   | Behaviour                                                                      |
| ------ | ------------------------------------------------------------------------------ |
| Easy   | Random legal move+build                                                        |
| Medium | Climbs own towers, domes enemy level-2 towers, defends against adjacent climbs |
| Hard   | Alpha-beta with two-move win threats (climb-then-climb), lockout awareness     |

## 5. Online duel (backend)

- ttt-pattern clone (`/santorini`): match row holds levels/domes/builders (jsonb), turn,
  phase, `status`, guest ids, `expiresAt`. Server validates the full move+build turn as
  one atomic action and resolves win/lockout. 3-second poll sync.

## 6. UI / rounds

Isometric-feel 5×5 with stacked levels, tap-builder → tap-destination → tap-build flow,
illegal taps shake. Rematch = new placement phase. Rounds run 5–10 min.

## 7. Phases + effort

| Phase | Work                                 | Effort |
| ----- | ------------------------------------ | ------ |
| 1     | core.js (move/build/lockout) + tests | ~3 h   |
| 2     | shell + AI tiers                     | ~4.5 h |
| 3     | backend module + specs               | ~3 h   |
| 4     | online mode + registry + polish      | ~3 h   |

## 8. Verification

jest: climb-height legality, dome rules, lockout detection, setup-phase constraints;
backend specs: atomic move+build validation, turn enforcement, server-resolved win;
two-phone manual duel.
