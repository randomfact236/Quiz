# 11 — Hex (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> The purest connection duel: two sides each, stones only, and the topology guarantees
> a winner — draws are mathematically impossible. Fully empty-board.

## 1. Nine-line spec

1. **Name:** Hex
2. **One-liner:** link your two sides with an unbroken chain of stones before your opponent links theirs
3. **How to win:** complete a connected path between your two edges
4. **The board:** rhombus of hex cells (11×11 default); a move = place one stone on any empty cell
5. **Turns:** strict alternation; stones never move or die; board fills until someone connects
6. **Solo AI:** easy = random-ish placement · medium = Dijkstra shortest-path blocking ·
   hard = alpha-beta/Monte-Carlo with two-distance path evaluation (strong, not perfect)
7. **Duel:** turn-based live, invite code; server validates placement and detects the connection
8. **Toggles:** size 7×7 / 9×9 / 11×11 (default) · swap (pie) rule ON/OFF
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Player 1 connects top–bottom, player 2 left–right; corners belong to both.
- Swap rule (default ON in duels): after the first stone, player 2 may steal it — the
  built-in fix for Hex's proven first-player advantage.

## 3. Board model (`core.js`, pure)

- State: `cells: (0|1|2)[]`, `turn`, `size`, `swapPending`.
- `applyPlace(state, idx)` · `applySwap(state)` · `connected(state, player)` via BFS over
  the six-neighbour lattice. Connection check is pure and jest-tested on crafted bridges.

## 4. Solo AI

| Tier   | Behaviour                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| Easy   | Random legal cell, slight preference for centre                              |
| Medium | Plays the cheapest bridge on its own shortest path; blocks yours (Dijkstra)  |
| Hard   | Depth-limited search guided by two-distance maps; instant bridge recognition |

## 5. Online duel (backend)

- ttt-pattern clone (`/hex`): match row holds `cells`, `turn`, `size`, `swapPending`,
  `status`, guest ids, `expiresAt`. Server runs the same BFS connection check and
  resolves the winner. 3-second poll sync.

## 6. UI / rounds

Rhombus board with each player's edges tinted; winning chain animates cell by cell.
Instant rematch with swapped colours. Rounds run 3–8 min (7×7 under 5).

## 7. Phases + effort

| Phase | Work                             | Effort |
| ----- | -------------------------------- | ------ |
| 1     | core.js + connection BFS + tests | ~2 h   |
| 2     | shell + AI tiers (path eval)     | ~4 h   |
| 3     | backend module + specs           | ~2.5 h |
| 4     | online mode + registry + polish  | ~2 h   |

## 8. Verification

jest: connection detection (including corner cases), swap legality, no-draw property on
full boards; backend specs: placement validation, turn enforcement, server-resolved
winner; two-phone manual duel.
