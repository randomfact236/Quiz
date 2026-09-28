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

| Wave                              | Rows         | Composition                                                                   | Envelope (XS 4–6 h · S 8–12 h · M 13–18 h · L 30 h+) |
| --------------------------------- | ------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| Base F1–F10                       | 10           | planned in MP1 phases 1–5 (incl. the simultaneous-round engine for P7–P8/P10) | ~27 h (phases 1–4) + ~10 h (phase 5)                 |
| A — family variants + official 4P | F11–F26 (16) | XS×3, S×6, M×6, L×1 (Halma)                                                   | ≈ 170–230 h                                          |
| B — secret races + circle games   | F27–F32 (6)  | XS×2, S×2, M×2; F29 (4-fleet sea) reuses the Battleship redaction pattern     | ≈ 45–65 h                                            |
| C — RNG tier                      | F33–F42 (10) | **GATED** on the luck-tier decision; card games need the server-held deck     | ≈ 115–155 h + team-seat layer                        |
| D — the deep end                  | F43–F50 (8)  | L×3 (Four-Handed Chess, Blokus 4P, Chinese Checkers 4P), M×2, S×3             | ≈ 145–195 h                                          |

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
