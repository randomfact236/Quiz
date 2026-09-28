# TP1 — Three-Player engine + Wave 1 (T1, T2, T8, T9, T3, T4)

> **Status:** PLANNED — engine batch S + six game batches. List:
> [three-player-games.md](three-player-games.md). Scope: ONE 3-seat engine that all
> ten T-games ride, then Wave 1 (the six XS/S games). Wave 2 (T5–T7) and Wave 3
> (T10, after the Go core) plan separately.

## 1. Nine-line spec

1. **Name:** Three-Player Tables (TP)
2. **One-liner:** native three-seat tables — humans join by code, bots fill every empty seat, everyone plays by the same rules
3. **How to win:** per game; every table finishes with placement 1st/2nd/3rd recorded
4. **The table:** 3 seats (Human / Bot / Closed); fixed clockwise turn order; per-game state held server-side
5. **Turns:** strict rotation; bots act server-side on a 1–2 s pace delay; the active seat acts, everyone else watches
6. **Solo AI:** the existing easy/medium/hard tiers, one lobby-wide tier picked by the host; hard tiers that need three-player awareness get it inside the game's own AI (e.g. Tri-Nim's exact search)
7. **Multiplayer:** server-authoritative seats on the 3-second poll pattern; Wave 1 games have no hidden information, so views are plain state
8. **Toggles:** empty seat = Bot / Closed · lobby tier · per-game toggles live in each game's own plan
9. **Never:** no levels, no pre-filled anything, no RNG anywhere in this set

## 2. Data model (backend)

One table for ALL three-player games:

```
tp_matches:     code         varchar(6) unique
                game_slug    varchar(32)      'tri-oxo' | 'tri-nim' | 'row-prison' | ...
                seats        jsonb            [{kind: human|bot|closed, guestId, name, tier}, x3]
                turn         int              seat index (0..2, clockwise)
                state        jsonb            the game's own shape (cells / rows / stones / walls ...)
                status       varchar(16)      waiting | running | finished | abandoned
                placement    jsonb            [seatIndex, ...] with tie flags
                createdAt / expiresAt timestamptz (~60 min TTL)
```

- Rules live in per-game adapters registered by `game_slug`:
  `{validateMove, applyMove, isOver, placement, aiTier}` — the same pure functions
  the game's `core.js` uses, imported server-side. No per-game tables, no logic forks.
- If the shared N-seat table from the party plan (MP1) lands first, TP games are just
  more adapters in the same registry — build the engine once, use it for both.

## 3. Seat + turn engine (backend)

- **Admission:** creator seats themselves + configures empty seats (Bot/Closed, tier);
  joiners claim open Human seats by code; Start requires ≥1 human.
- **Rotation:** `turn = (turn + 1) % 3`, skipping Closed; only the active seat may act —
  the server rejects everyone else.
- **Bot executor:** on a Bot seat's turn the server calls the game's AI (tier from the
  seat), applies the returned move through the same validator, schedules the next
  turn after 1–2 s (in-process timer, no cron).
- **Abandonment:** a silent human seat goes stalled at 90 s, converts to Bot at 3 min;
  play continues; the table always finishes.
- **Placement:** resolved server-side from the adapter's `placement()` — 1st/2nd/3rd
  with tie flags (e.g. Tri-OXO's shared 2nd).

## 4. Wave 1 adapters (per-game)

| Game           | State + validator core                                   | AI hard tier                       | Effort  |
| -------------- | -------------------------------------------------------- | ---------------------------------- | ------- |
| T1 Tri-OXO     | cells[16]; 10-line scan of four                          | 3-ply search, block-strongest      | ~5.5 h  |
| T2 Tri-Nim     | rows[3]; take 1–3 from one row; last-taker-loses ranking | exact 3-player minimax             | ~6.5 h  |
| T8 Tri-Sim     | edges[15]; per-colour triangle scan; elimination ladder  | survivor-aware exact search        | ~7.5 h  |
| T9 Corners     | cells[49]; clone/jump + 8-neighbour conversion           | conversion-maximizing search       | ~8.5 h  |
| T3 Row Prison  | cells[25]; row-forcing rule; four-line scan              | threat-line search w/ forcing      | ~9 h    |
| T4 Trinity Hex | hex cells (61); per-player pair-BFS connection           | shortest-gap search (two-distance) | ~10.5 h |

Wave 1 ≈ 48 h + engine ~6 h ≈ **54 h**. Wave 2 (T5–T7, M each) and T10 plan separately.

## 5. UI (frontend)

- Table screen: 3 seat cards (name, bot badge + tier), a triangular turn indicator
  pointing at the active seat, the game board, move feed for bot actions.
- Lobby: seat grid, join code + QR, host toggles (Bot/Closed per empty seat, tier
  picker), Start. Share links carry `?tp=CODE`.
- Results: 1st/2nd/3rd podium with tie notes, per-seat stats, instant rematch that
  keeps the seat configuration.

## 6. Phases

| Phase | Work                                                 | Effort  |
| ----- | ---------------------------------------------------- | ------- |
| 1     | tp_matches + seat/turn engine + bot executor + specs | ~6 h    |
| 2     | T1 + T2 adapters, UI, registry                       | ~12 h   |
| 3     | T8 + T9 adapters, UI                                 | ~16 h   |
| 4     | T3 + T4 adapters, UI                                 | ~19.5 h |
| 5     | Wave 2 planning (T5–T7)                              | —       |

## 7. Verification

- jest: each Wave-1 pure model (line scans, elimination ladders, conversion rings,
  BFS connections); seat engine (rotation, skip-Closed, abandonment conversion);
  adapter parity with each game's `core.js` on scripted games.
- Backend specs: only the active seat may act; bot moves pass the SAME validator as
  humans; placement resolution matches the adapter; TTL cleanup.
- Manual: 3 phones full table · 2 phones + 1 bot · 1 phone + 2 bots (solo practice) ·
  hot-seat round-robin where the game allows it · an abandoned seat converting and
  the table finishing.
