# 04 — Battleship Lite (empty-board family)

> **Status:** PLANNED — the hidden-information entry. Template: [README.md](README.md) §1.
> Fully on-philosophy: players PLACE their own ships — the only "data" in the game is
> player-created. Luck (guessing) keeps beginners competitive.

## 1. Nine-line spec

1. **Name:** Battleship Lite
2. **One-liner:** hide 3 ships on your grid, take turns firing at the enemy waters —
   sink everything first
3. **How to win:** sink all three enemy ships before they sink yours
4. **The board:** 8×8 water grid, 3 ships (lengths 4, 3, 2); a move = either place a ship
   (setup) or fire at one enemy cell (battle)
5. **Turns:** setup (both place, hidden) → battle (strict alternating single shots);
   hit or miss, the turn passes
6. **Solo AI:** easy = pure random shots · medium = hunt mode (targets neighbours of a
   hit) · hard = parity search + probability density targeting
7. **Duel:** each player places on their OWN phone; the server holds both boards and
   never reveals ships — it answers every shot with hit / miss / sunk
8. **Toggles:** none in v1 (fixed fleet keeps games short)
9. **Never:** no levels, no pre-filled layouts, no ship auto-place without consent

## 2. Rules

- Ships are straight (horizontal/vertical), within the grid, no overlap.
- Firing a already-shot cell is rejected. A ship reports "sunk" when all its cells are hit.
- No "hit = fire again" — strict alternation keeps the duel fair and the poll cadence calm.

## 3. Board model (`core.js`, pure)

- `placeFleet(grid, placements) → ok|reason` · `fire(board, shots, cell) →
{hit, sunkShip?}` · `allSunk(shots, ships)`. Pure and jest-tested; the UI never sees the
  enemy fleet — only shot results.

## 4. Solo AI (plays the enemy fleet + its shots)

| Tier   | Behaviour                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| Easy   | Uniform random shots, no hunt                                                    |
| Medium | Hunt: random until a hit, then tries the 4 neighbours until sunk                 |
| Hard   | Parity sweep + probability-density map (weights cells by remaining ship lengths) |

The AI's own fleet is placed legally at random at game start.

## 5. Online duel (backend)

- ttt-pattern clone with THREE phases: `placing` → `running` → `finished`.
- Each participant submits their own fleet (`POST fleet`) during placing; the server
  validates legality and stores both fleets — **enemy fleet data never crosses the API**
  (shots return `{cell, result: hit|miss|sunk:<length>}` only).
- Turn enforcement server-side; finished when a fleet sinks.

## 6. UI / rounds

Two-screen flow: placement (drag/tap-place + rotate, confirm) → battle (my grid + my
shots-on-their-waters grid, hit/miss markers, sunk announcements). End overlay lists both
fleets revealed. Rematch = new match, new placements.

## 7. Phases + effort

| Phase | Work                                                       | Effort |
| ----- | ---------------------------------------------------------- | ------ |
| 1     | core.js (placement legality, fire/sunk resolution) + tests | ~3 h   |
| 2     | shell + AI tiers                                           | ~4 h   |
| 3     | backend module (fleet phase + hidden-info views) + specs   | ~4 h   |
| 4     | online mode + registry + polish                            | ~3 h   |

## 8. Verification

jest: placement legality matrix, sunk detection, no enemy-fleet leakage in views; backend
specs: fleet double-submit rejection, shot turn enforcement, view redaction (the #1
security property of this game); two-phone manual duel.
