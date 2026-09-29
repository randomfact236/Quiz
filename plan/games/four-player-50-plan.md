# MP2 — Four-Player 50 expansion plan (waves A–D)

> **Status:** PLANNED — rides the MP1 engine ([multiplayer-party-plan.md](multiplayer-party-plan.md));
> list: [four-player-50.md](four-player-50.md). Nothing here re-plans the engine, seats,
> bots or placement. This file plans HOW the 40 post-base rows (F11–F50) get built,
> in waves, with effort envelopes and the verification shape per wave.

## 1. Approach per row (the adapter checklist)

Identical to TP2 — one checklist, four moves per game: pure core (with `placement()`
for 1st–4th), registry adapter, family UI shell (seat grid, not the triangle), wave
verification. The MP1 engine's 4-seat shape, bot executor and abandonment conversion
serve every row unchanged.

## 2. Waves

| Wave                          | Build positions | Notes                                                                                   |
| ----------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| Base                          | 1-3             | F11 Quad-OXO + F1 Dots & Boxes 4P + F3 SOS 4P BUILT on MP1                              |
| A - famous + previously-gated | 4-10            | F47/F15/F46/F44 build now; F9 Ludo, F35 Snakes & Ladders, F33 Memory Flip now unblocked |
| B - official 4P canon         | 11-12           | F45 Chinese Checkers 4P, F26 Halma (L band)                                             |
| C - known + secret races      | 13-20           | F29/F27 reuse hidden-info redaction; F5 Pig Dice 4P rides the approved server-roll      |
| D - connoisseur bulk          | 21-38           | XS-to-M; F43 Four-Handed Chess needs its geometry note                                  |
| E - RNG tail                  | 39-50           | unblocked 2026-09-29 (server-rolled dice); F40/F41 also need the 2v2 seat layer         |

## 3. Two MP2-only prerequisites

1. **Team-seat layer (before F40/F41):** partners share a placement (win/lose as a
   pair), sit opposite, and inherit each other's turn. Small MP1 extension — seat
   pairs + team placement — flagged here so it is never improvised mid-wave.
2. **Server-held deck view (before Wave C card rows):** hands are per-seat secrets;
   views redact other seats' hands (the Battleship/Mastermind pattern generalized —
   MP1 phase 5 builds exactly this for P8/P10).

## 4. Per-wave verification (constant shape)

- jest per pure core incl. 4-way placement ordering; adapter parity on scripted games;
  seat specs (active seat only, bot validator parity, abandonment → bot → finish);
  hidden-view redaction specs for F27/F29 and all Wave C card rows.
- Manual per game: 4 phones · 3 + 1 bot · 2 + 2 bots · 1 + 3 bots (solo party) ·
  hot-seat where hidden info allows (F27/F29/card rows skip hot-seat by design).

## 5. Gating + risks

- Wave C waits on the owner's RNG decision; team rows wait on the seat layer —
  everything else proceeds independently.
- Blokus 4P (F44) is the 20×20 four-set original: budget as its own L, not a variant
  reskin of the Duo plan.
- Four-handed chess (F43) needs its cross-board geometry settled in a one-page rules
  note before Wave D opens.
- No word lists, no served content anywhere in any wave.
