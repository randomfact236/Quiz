# 22 — Pentago (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> Connect Four with a twist — literally: every turn you place a marble AND spin one
> quadrant. Starts completely empty.

## 1. Nine-line spec

1. **Name:** Pentago
2. **One-liner:** get five in a row — but the quadrant you spin after placing may rewrite the whole board
3. **How to win:** five of your marbles in a line anywhere on the 6×6 board after your spin
4. **The board:** 6×6 split into four 3×3 quadrants; a move = place a marble on any empty
   cell + rotate one quadrant 90° (either direction)
5. **Turns:** alternation; place then spin (spinning is mandatory); a full board with no
   five is a draw
6. **Solo AI:** easy = random place + random spin · medium = seeks 4-in-a-row
   pre-spin, blocks obvious ones · hard = alpha-beta with line + rotation-threat
   evaluation (strong, not perfect)
7. **Duel:** turn-based live, invite code; server applies place+spin atomically and resolves the win
8. **Toggles:** none in v1
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- The placed marble spins WITH its quadrant (it may move to a new cell).
- If both players complete five-in-a-row in the same turn action, the mover wins
  (server-checked in strict order: spin resolves once, winner read after).

## 3. Board model (`core.js`, pure)

- State: `quads: [3×3 grid ×4]`, `turn`.
- `applyPlace(state, cell)` · `applySpin(state, quad, dir)` (pure rotation map) ·
  `fiveInRow(state)` across the reassembled 6×6. Rotation maps are jest-table-tested
  per quadrant/direction.

## 4. Solo AI

| Tier   | Behaviour                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| Easy   | Random placement, random quadrant/direction                                      |
| Medium | Hunts 3–4 lines, avoids spins that complete enemy lines                          |
| Hard   | Alpha-beta over place+spin pairs; eval = open five-lanes + spin-threat counting. |
|        | Strong club play, explicitly heuristic.                                          |

## 5. Online duel (backend)

- ttt-pattern clone (`/pentago`): match row holds quadrants (jsonb), turn, `status`,
  guest ids, `expiresAt`. Server validates the two-step action, applies the spin, and
  resolves five-in-a-row. 3-second poll sync.

## 6. UI / rounds

Four quadrant frames with rotate buttons, marble drop, spin animation with line-scan
highlight after each spin. Rematch = first move swap. Rounds run 4–8 min.

## 7. Phases + effort

| Phase | Work                                   | Effort |
| ----- | -------------------------------------- | ------ |
| 1     | core.js (rotation + five-scan) + tests | ~2.5 h |
| 2     | shell + AI tiers                       | ~4 h   |
| 3     | backend module + specs                 | ~2.5 h |
| 4     | online mode + registry + polish        | ~2.5 h |

## 8. Verification

jest: rotation map for all 8 quad×dir cases, five-in-row across quadrant seams,
place-then-spin atomicity; backend specs: two-step validation, turn enforcement,
server-resolved win; two-phone manual duel.
