# TP2 — Three-Player 50 expansion plan (waves A–D)

> **Status:** PLANNED — rides the TP1 engine ([three-player-plan.md](three-player-plan.md));
> list: [three-player-50.md](three-player-50.md). Nothing here re-plans the engine, seats,
> bots or placement — those exist. This file plans HOW the 40 post-base rows (T11–T50)
> get built, in waves, with effort envelopes and the verification shape per wave.

## 1. Approach per row (the adapter checklist)

Every new game repeats the same four moves — no exceptions, no forks:

1. **Pure core** (`core.js`): state shape + `validateMove / applyMove / isOver /
placement()` + three AI tiers (easy/medium/hard), jest-covered.
2. **Adapter**: registers `game_slug → {validateMove, applyMove, isOver, placement,
aiTier}` in the TP registry; server-side validation via the SAME pure functions.
3. **UI shell**: the family folder layout (`index.html + config.js + core.js +
game.js + storage.js + style.css`), triangular turn indicator reused as-is.
4. **Wave verification** (below), then registry/hub/sitemap wiring.

## 2. Waves

| Wave                          | Build positions | Notes                                                                                |
| ----------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| Base                          | 1-4             | T1 + T11 + T12 BUILT; T2 (Tri-Nim) completes TP1 phase 2                             |
| A - famous + previously-gated | 5-10            | T45/T18/T23 build now; T41 Ludo, T42 Snakes & Ladders, T39 Memory Flip now unblocked |
| B - known + secret races      | 11-24           | Code Race / Hangman Relay / Fleet Royale reuse the redaction pattern                 |
| C - connoisseur + originals   | 25-40           | XS-to-M bulk; Pig Dice 3P (T33) rides the approved server-roll                       |
| D - the deep end              | 41-44           | Chinese Checkers 3P, Three-Handed Chess, Go-3, TriGo (needs Go core)                 |
| E - RNG tail                  | 45-50           | UNBLOCKED 2026-09-29: dice are server-rolled (Pig Dice precedent)                    |

Wave A starts only after TP1 Wave 1 ships; within a wave the order is XS → S → M → L
(cheap rows first keeps the hub growing every week).

## 3. Per-wave verification (constant shape)

- jest: each new pure core (placement/scan/elimination rules + placement-ordering
  function — three-player placement is a rule, not an afterthought).
- Adapter parity: scripted games replayed through both `core.js` and the server
  adapter produce identical states.
- Seat specs: only the active seat acts; bots pass the same validator; abandonment
  conversion finishes the table with a full 1st/2nd/3rd.
- Manual: 3 phones · 2 phones + 1 bot · 1 phone + 2 bots, per game.

## 4. Gating + risks

- Wave C waits on the owner's RNG decision — nothing else blocks.
- T26 (Go-3 on 13×13) reuses the Go 9×9 core; do NOT start it before that core exists.
- Three-handed chess (T44) needs an agreed corner-blank geometry before Wave D —
  a one-page rules note goes into the plan file when Wave D opens.
- No word lists, no served content anywhere in any wave.
