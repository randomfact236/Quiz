# 14 — Mancala (Kalah) (empty-board family)

> **Status:** PLANNED — batch S. Template: [README.md](README.md) §1.
> The sowing duel. The 4-seeds-per-pit start is a rules constant (a number, like
> Checkers' 12 men) — nothing is authored content; every seed afterwards moves by
> player decision.

## 1. Nine-line spec

1. **Name:** Mancala (Kalah)
2. **One-liner:** sow seeds around the board — land in your store for a free turn, capture greedily
3. **How to win:** hold more seeds in your store when all pits empty
4. **The board:** 2×6 pits + 2 stores, 4 seeds per pit (48 total); a move = pick one of
   your non-empty pits and sow counter-clockwise
5. **Turns:** sowing continues automatically; extra turn on a store landing or a capture;
   otherwise the turn passes
6. **Solo AI:** easy = random pit · medium = seeks extra turns and captures ·
   hard = alpha-beta with extra-turn-chain expansion (near-expert on 6 pits)
7. **Duel:** turn-based live, invite code; server sows, captures, and detects the end
8. **Toggles:** seeds per pit 3 / 4 (default) / 5 · empty-landing capture ON/OFF
9. **Never:** no levels, no pre-filled anything beyond the uniform seed count

## 2. Rules

- Sowing skips the opponent's store; one seed per pit in order.
- Capture (default): last seed lands in your own empty pit → take that seed plus the
  opposite pit's seeds into your store.
- Game ends when one side's pits are all empty; the other side sweeps their row.

## 3. Board model (`core.js`, pure)

- State: `pits: number[12]`, `stores: [n,n]`, `turn`.
- `sow(state, pit)` (full multi-seed walk with extra-turn flag) · `isOver(state)` ·
  `sweep(state)`. The sowing walk is the whole game — jest-table-tested heavily.

## 4. Solo AI

| Tier   | Behaviour                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| Easy   | Random non-empty pit                                                             |
| Medium | One-ply: prefers store landings and captures                                     |
| Hard   | Alpha-beta with chained extra turns expanded; stores margin + mobility heuristic |

## 5. Online duel (backend)

- ttt-pattern clone (`/mancala`): match row holds `pits`, `stores`, `turn`, `status`,
  guest ids, `expiresAt`. Server runs the sow walk (no client math), enforces
  own-pits-only moves, resolves the final sweep and winner. 3-second poll sync.

## 6. UI / rounds

Classic two-rank board with animated seed-by-seed sowing, store counters, extra-turn
banner. Rematch = side swap. Rounds run 4–8 min.

## 7. Phases + effort

| Phase | Work                                | Effort |
| ----- | ----------------------------------- | ------ |
| 1     | core.js (sow/capture/sweep) + tests | ~2.5 h |
| 2     | shell + AI tiers                    | ~3 h   |
| 3     | backend module + specs              | ~2.5 h |
| 4     | online mode + registry + polish     | ~2.5 h |

## 8. Verification

jest: sowing wrap-around, skip-opponent-store, capture edge cases, sweep totals = 48;
backend specs: pit ownership enforcement, turn enforcement, server-resolved winner;
two-phone manual duel.
