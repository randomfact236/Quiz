# 03 — Dots and Boxes (empty-board family)

> **Status:** PLANNED — third in the roadmap. Template: [README.md](README.md) §1.
> Sneaky-strategic: the endgame chains decide everything.

## 1. Nine-line spec

1. **Name:** Dots and Boxes
2. **One-liner:** take turns drawing lines between dots; close a box to claim it —
   most boxes wins
3. **How to win:** own more boxes than the opponent when the grid completes
4. **The board:** dots grid with 4×4 boxes (16 boxes, 40 edges); a move = tap one
   unclaimed edge
5. **Turns:** alternating — BUT completing a box grants an extra turn (the core tension)
6. **Solo AI:** easy = random safe-ish edges · medium = takes free boxes, avoids creating
   a third edge · hard = chain counting (keeps control via the all-but-two sacrifice)
7. **Duel:** same board, live, invite code — server applies edge claims, box fills and
   the extra-turn rule
8. **Toggles:** grid size 3×3 (quick) / 4×4 (standard) / 5×5 (long)
9. **Never:** no levels, no pre-filled patterns

## 2. Rules

- Drawing the 4th edge of a 1×1 box claims it for the mover (+1 point) and grants another
  turn immediately.
- Game ends when all edges are drawn; most boxes wins; equal boxes = draw.

## 3. Board model (`core.js`, pure)

- `edges: Uint8Array(E)` (0 none, 1 drawn) with a fixed edge-index map ·
  `owners: Int8Array(boxes)` · `drawEdge(edge) → {claimedBoxes, extraTurn}` ·
  `chainAnalysis()` helper used by the hard AI and (v2) a hint system.

## 4. Solo AI

| Tier                                   | Behaviour                                                                |
| -------------------------------------- | ------------------------------------------------------------------------ |
| Easy                                   | Random edge; takes free boxes when seen                                  |
| Medium                                 | Takes all free boxes; never opens a box unless forced (safe-edge filter) |
| Hard                                   | Full chain analysis: opens the shortest chain and keeps control          |
| (all-but-two), double-cross sacrifices |

## 5. Online duel (backend)

- ttt clone: state = edges + owners + scores; move = edge index; server resolves box
  claims and the extra-turn chain in one authoritative step (turn does NOT simply flip —
  the server returns whose turn it actually is).

## 6. UI / rounds

Tap-edges board (edges as fat touch targets, dots as anchors); claimed boxes tint to the
owner's colour with a running score strip; end overlay with the box tally. Rematch flips
the opener.

## 7. Phases + effort

| Phase | Work                                                      | Effort |
| ----- | --------------------------------------------------------- | ------ |
| 1     | core.js (edges/boxes/extra-turn) + chain analysis + tests | ~4 h   |
| 2     | shell + AI tiers                                          | ~4 h   |
| 3     | backend module + specs                                    | ~3 h   |
| 4     | online mode + registry + polish                           | ~2 h   |

## 8. Verification

jest: box completion, extra-turn cascade, chain counting, parity of total boxes; backend
specs: edge double-claim rejection, authoritative turn resolution; two-phone manual duel.

## 9. Party variants (3P/4P) — see [multiplayer-party.md](multiplayer-party.md) §P1

3P/4P on the 8×8 (4P also 10×10): every claimed box scores its owner, no player
elimination — running out of turns never removes you from scoring. The classic
four-way endgame chain giveaway is the whole show. Bots fill empty lobby seats
(owner decision 2026-09-28); each runs its tier independently. Effort: +4–6 h
(N-player seats, box-owner map, bot ticker).
