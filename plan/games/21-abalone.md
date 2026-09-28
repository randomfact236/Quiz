# 21 — Abalone (empty-board family)

> **Status:** PLANNED — batch M. Template: [README.md](README.md) §1.
> Sumo with marbles on a hex ring. The canonical start formation is a rules constant
> (like Checkers' ranks); every push and step after it is player decision.

## 1. Nine-line spec

1. **Name:** Abalone
2. **One-liner:** push your marbles in lines — shove six enemy marbles off the ring first
3. **How to win:** eject 6 opponent marbles off the board edge
4. **The board:** hexagon of 61 cells with the standard 14-marble start per side; a move
   = move a line of 1–3 of your marbles one cell in-line, or 1 marble broadside
5. **Turns:** alternation; an in-line move may push a shorter enemy line (2 yours push 1
   theirs; 3 yours push 1–2 theirs) — pushing into the edge ejects the last marble
6. **Solo AI:** easy = random legal pushes · medium = prefers edge-threatening
   alignments, avoids overextending · hard = alpha-beta with cohesion/ejection eval
7. **Duel:** turn-based live, invite code; server validates line sums/pushes and counts ejections
8. **Toggles:** target ejections 6 (default) / 4 (quick)
9. **Never:** no levels, no pre-filled anything beyond the canonical formation

## 2. Rules

- Broadside moves never push.
- A line may not push a line of equal or greater length, and never pushes your own colour.

## 3. Board model (`core.js`, pure)

- State: `cells: (0|1|2|null)[61]`, `ejected: [n,n]`, `turn`.
- `lineAt(state, cells, dir)` · `canPush(state, line, dir)` (sum rule) ·
  `applyMove(state, line, dir)` with ejection handling · `isWin(state)`. Push math is
  the whole game — jest-tested on the classic sum table.

## 4. Solo AI

| Tier   | Behaviour                                                                         |
| ------ | --------------------------------------------------------------------------------- |
| Easy   | Random legal line/broadside moves                                                 |
| Medium | Builds 3-marble phalanxes, pushes toward edges, blocks enemy phalanxes            |
| Hard   | Alpha-beta; eval = marbles + edge-distance + push-threats. Heuristic, not solved. |

## 5. Online duel (backend)

- ttt-pattern clone (`/abalone`): match row holds `cells`, `ejected`, `turn`, `status`,
  guest ids, `expiresAt`. Server validates the sum rule and counts ejections to the
  target. 3-second poll sync.

## 6. UI / rounds

Hex ring with marble-drag or tap-line+direction input, eject animation off the rim.
Score pips at the rim. Rematch = colour swap. Rounds run 8–15 min.

## 7. Phases + effort

| Phase | Work                                      | Effort |
| ----- | ----------------------------------------- | ------ |
| 1     | core.js (lines, pushes, ejection) + tests | ~4 h   |
| 2     | shell + AI tiers                          | ~4 h   |
| 3     | backend module + specs                    | ~3 h   |
| 4     | online mode + registry + polish           | ~3 h   |

## 8. Verification

jest: push sum table (2v1, 3v1, 3v2, blocked cases), ejection counting, broadside
no-push; backend specs: illegal-push rejection, turn enforcement, server-counted win;
two-phone manual duel.
