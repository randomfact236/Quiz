# 17 — Hive (empty-board family)

> **Status:** PLANNED — batch M. Template: [README.md](README.md) §1.
> The most empty-board game on the list: there IS no board — the playing surface is
> created entirely by the pieces the players place. The canonical "player-built" duel.

## 1. Nine-line spec

1. **Name:** Hive
2. **One-liner:** surround the enemy queen with your bugs — no board, the hive IS the board
3. **How to win:** fully encircle the opponent's queen bee
4. **The board:** none — a growing hex cluster; a move = place a bug from hand, or move
   one of yours already in the hive
5. **Turns:** alternation; your queen must be placed by turn 4 at the latest; placement
   (turn 1–3ish) then a mix of placements and moves
6. **Solo AI:** easy = random legal actions · medium = places beetles on the queen,
   values surrounding cells · hard = alpha-beta with freedom/encirclement eval (strong,
   honestly NOT perfect — the loopy state space forbids it)
7. **Duel:** turn-based live, invite code; server validates the one-hive rule and pins, resolves the surround
8. **Toggles:** Ladybug/Pillbug expansion OFF in v1 (base 11 bugs per side)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- One-hive rule: after any move the whole cluster must stay connected — illegal moves
  (pinned pieces) are rejected.
- Bugs: Queen (1), Beetle (2, climbs), Grasshopper (3, jumps), Soldier Ant (3, free walk),
  Spider (2, exactly 3 steps).
- First contact placement: new bugs must touch your own colour only (first bug exempt).

## 3. Board model (`core.js`, pure)

- State: `stacks: Map<hex, bug[]>` (height = beetles), `inHand per player`, `turn`.
- `legalPlacements(state)` · `legalMovesOf(bug)` per bug type · `hiveConnected(afterState)`
  · `queenSurrounded(state)`. Bug movement is the deep part — jest-tested per bug,
  including beetle stacking and pin detection.

## 4. Solo AI

| Tier   | Behaviour                                                                   |
| ------ | --------------------------------------------------------------------------- |
| Easy   | Random legal placement/move                                                 |
| Medium | Covers own queen's neighbours, attacks the enemy queen with Beetles/Ants    |
| Hard   | Depth-limited alpha-beta; eval = free neighbours of both queens + mobility. |
|        | Explicitly strong-not-perfect (loopy game).                                 |

## 5. Online duel (backend)

- ttt-pattern clone (`/hive`): match row holds the hex map (jsonb), hands, `turn`,
  `status`, guest ids, `expiresAt`. Server re-validates the one-hive rule per action and
  resolves the surround. 3-second poll sync.

## 6. UI / rounds

Hex cluster renders wherever it grows (auto-pan/zoom); bug silhouettes with height
stack indicator; legal-action hints. Rematch = new match. Rounds run 5–15 min.

## 7. Phases + effort

| Phase | Work                                         | Effort |
| ----- | -------------------------------------------- | ------ |
| 1     | core.js (5 bug types + connectivity) + tests | ~5 h   |
| 2     | shell + AI tiers                             | ~5 h   |
| 3     | backend module + specs                       | ~3 h   |
| 4     | online mode + registry + polish              | ~3 h   |

## 8. Verification

jest: per-bug movement matrix, one-hive connectivity (pin cases), queen surround,
turn-4 queen deadline; backend specs: illegal-action rejection, turn enforcement,
server-resolved win; two-phone manual duel.
