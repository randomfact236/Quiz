# 20 — Blokus Duo (empty-board family)

> **Status:** PLANNED — batch M. Template: [README.md](README.md) §1.
> Two players, 21 polyominoes each, one 14×14 grid. The piece sets are rules constants
> (the fixed polyomino catalogue); where they go is 100% player decision.

## 1. Nine-line spec

1. **Name:** Blokus Duo
2. **One-liner:** fit your odd-shaped pieces onto the grid — only corners touch your own colour
3. **How to win:** higher score when both players are out of moves (score = placed
   squares, +15 and −1/square for dumping your whole hand)
4. **The board:** 14×14 grid; each player holds the 21-piece polyomino set (1–5 squares);
   a move = place one piece touching your own pieces corner-to-corner only
5. **Turns:** alternation; first piece must cover the marked start cells; pass when no
   legal placement exists; both passing ends the game
6. **Solo AI:** easy = random legal piece+placement · medium = biggest-fits-first
   heuristic with corner spreading · hard = greedy search over placements scored by
   edge-extension + mobility denial (strong, not perfect)
7. **Duel:** turn-based live, invite code; server validates corner-touch + overlap rules and scores the end
8. **Toggles:** none in v1 (fixed 14×14 + standard set)
9. **Never:** no levels, no pre-filled anything

## 2. Rules

- Same-colour pieces may never share an edge; corner contact required after the opener.
- A piece may be flipped as well as rotated (8 orientations for asymmetric shapes).

## 3. Board model (`core.js`, pure)

- State: `grid: (0|1|2|null)[196]`, `hands: [pieceIds, pieceIds]`, `turn`.
- `legalPlacements(state, pieceId)` (corner-contact + edge-conflict + bounds) ·
  `applyPlace` · `hasAnyMove(state)` · `score(hand, grid)`. Piece geometries are
  generated from the 21 canonical shapes as coordinate lists — pure and jest-tested.

## 4. Solo AI

| Tier   | Behaviour                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| Easy   | Random piece, first legal placement found                                    |
| Medium | Plays largest pieces early, spreads toward the centre and enemy corners      |
| Hard   | Scores all placements: frontier expansion + block-value; 1-ply opponent look |
|        | at enemy corner options. Explicitly heuristic.                               |

## 5. Online duel (backend)

- ttt-pattern clone (`/blokusduo`): match row holds `grid` (jsonb), hands, `turn`,
  pass flags, `status`, guest ids, `expiresAt`. Server re-validates corner/edge rules
  and computes the final score. 3-second poll sync.

## 6. UI / rounds

Piece tray with rotate/flip controls, ghost preview on hover/tap, legal-cell glow.
End overlay with score breakdown. Rematch = colour swap. Rounds run 8–15 min.

## 7. Phases + effort

| Phase | Work                                       | Effort |
| ----- | ------------------------------------------ | ------ |
| 1     | core.js (shapes + placement rules) + tests | ~4 h   |
| 2     | shell + AI tiers                           | ~5 h   |
| 3     | backend module + specs                     | ~3 h   |
| 4     | online mode + registry + polish            | ~3 h   |

## 8. Verification

jest: corner-contact matrix, edge-conflict rejection, all-21-piece geometry rotations,
score formula; backend specs: placement validation parity, pass handling, server-counted
score; two-phone manual duel.
