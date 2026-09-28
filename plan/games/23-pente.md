# 23 — Pente (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> Gomoku's meaner sibling on a Go board: pair-captures make draws nearly impossible.
> Starts as a bare crosshair board — one centre stone by rule, everything else player-placed.

## 1. Nine-line spec

1. **Name:** Pente
2. **One-liner:** five in a row wins — but flanking a pair captures it, and captures can decide the game
3. **How to win:** five in a row · or first to 5 captured pairs (10 enemy stones)
4. **The board:** 19×19 intersection grid (play concentrates centrally); a move = place
   one stone on any empty intersection
5. **Turns:** alternation; first stone is fixed at the centre (rules constant); flanking
   exactly 2 enemy stones captures them immediately
6. **Solo AI:** easy = random-ish placement · medium = extends lines, takes flanking
   captures, blocks yours · hard = alpha-beta with capture-aware line evaluation
7. **Duel:** turn-based live, invite code; server validates placement, resolves captures and both win conditions
8. **Toggles:** capture target 5 pairs (default) / 3 (quick) · board 15×15 / 19×19 (default)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Capture = your two stones already flanking exactly two enemy stones in a line, and
  you place the completing stone; only exactly-2 pairs go (1 or 3 do not).
- Multiple pairs may be captured by a single stone.

## 3. Board model (`core.js`, pure)

- State: `cells: (0|1|2)[]`, `captures: [pairs, pairs]`, `turn`.
- `applyPlace(state, idx)` with `capturesAt(idx)` scan over 4 axes · `fiveInRow(state)` ·
  `isWin(state)`. Capture geometry is jest-table-tested per axis.

## 4. Solo AI

| Tier   | Behaviour                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| Easy   | Random legal intersection, takes only obvious captures                           |
| Medium | Line extension + capture awareness, blocks open threes                           |
| Hard   | Alpha-beta; eval = open-line lengths + capture counts + double-threat detection. |
|        | Strong, explicitly not perfect.                                                  |

## 5. Online duel (backend)

- ttt-pattern clone (`/pente`): match row holds `cells`, `captures`, `turn`, `status`,
  guest ids, `expiresAt`. Server runs the capture scan and resolves either win
  condition. 3-second poll sync.

## 6. UI / rounds

Go-style grid with stone shadows, capture flash on pairs, capture-count pips per player.
Rematch = colour swap. Rounds run 5–12 min.

## 7. Phases + effort

| Phase | Work                              | Effort |
| ----- | --------------------------------- | ------ |
| 1     | core.js (captures + five) + tests | ~2.5 h |
| 2     | shell + AI tiers                  | ~4 h   |
| 3     | backend module + specs            | ~2.5 h |
| 4     | online mode + registry + polish   | ~2.5 h |

## 8. Verification

jest: capture matrix per axis (exactly-2 rule), multi-capture stones, five detection
through gaps (five wins immediately even if capturable); backend specs: capture
resolution parity, turn enforcement, server-resolved win; two-phone manual duel.
