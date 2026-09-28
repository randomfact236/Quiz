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

| Wave                            | Rows         | Composition                                                                   | Envelope (XS 4–6 h · S 8–12 h · M 13–18 h · L 30 h+) |
| ------------------------------- | ------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| Base T1–T10                     | 10           | planned in TP1 phases 2–3 (T1–T9) + T10 with the Go core                      | ~54 h (Wave 1) + ~40 h (Wave 2) + L                  |
| A — family variants             | T11–T26 (16) | XS×3, S×5, M×7, L×1 (Go-3 on 13×13)                                           | ≈ 170–235 h                                          |
| B — secret races + circle games | T27–T32 (6)  | XS×2, S×2, M×2; hidden-info rows (T27) reuse the Mastermind redaction pattern | ≈ 45–65 h                                            |
| C — RNG tier                    | T33–T42 (10) | **GATED** on the luck-tier decision; server rolls via the Pig pattern         | ≈ 95–135 h                                           |
| D — the deep end                | T43–T50 (8)  | L×2 (Chinese Checkers, Three-Handed Chess), M×2, S×3, XS×1                    | ≈ 110–155 h                                          |

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
