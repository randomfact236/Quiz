# MP1 — Multiplayer Party engine, 3P/4P (empty-board family)

> **Status:** PLANNED — batch L. Builds on the duel backend (`plan/18` phase 5, the
> `/tictactoe` pattern) and the seat rule in [multiplayer-party.md](multiplayer-party.md).
> Scope: ONE shared N-player engine for all party games — not ten more cloned modules.

## 1. Nine-line spec

1. **Name:** Multiplayer Party (3P/4P)
2. **One-liner:** the empty-board games on one 3–4-seat table — bots fill every empty seat
3. **How to win:** per game; every table finishes with placement 1st…Nth recorded
4. **The table:** a lobby of N seats; each seat = Human (joined via code) / Bot / Closed;
   the host starts whenever, any mix
5. **Turns:** fixed turn order for board games (P1–P6, P9); simultaneous rounds for
   P7–P8/P10 (phase 5); bots act server-side with a 1–2 s pace delay
6. **Solo AI:** the existing easy/medium/hard tiers, unchanged — one lobby-wide tier
   picked by the host (default medium); each bot runs it independently
7. **Multiplayer:** server-authoritative N-player seats on the 3-second poll pattern;
   abandoned human seats convert to Bots; placement resolved server-side
8. **Toggles:** seats per game (roster table) · bot tier · empty seat = Bot or Closed
9. **Never:** no levels, no pre-filled anything — bots are players; the game itself
   still places nothing

## 2. Data model (backend)

One table for ALL party games (the deliberate generalization of the duel-clone
pattern — no new table per game):

```
party_matches:  code            varchar(6) unique
                game_slug       varchar(32)      'dots-boxes' | 'sos' | 'pig' | ...
                seats           jsonb            [{kind: human|bot|closed,
                                                   guestId, name, tier}, ...]
                turn            int              seat index (fixed-turn games)
                round           int              round counter (simultaneous games)
                state           jsonb            the game's own state shape
                                                  (cells / rows / scores / rolls ...)
                status          varchar(16)      waiting | running | finished | abandoned
                placement       jsonb            [seatIndex, ...] finish order
                createdAt / expiresAt timestamptz (~60 min TTL — longer tables)
```

- `state` reuses each game's existing row shape; rules live in per-game validators
  (the same pure functions the duel clones run) behind a registry: `game_slug →
{validateMove, applyMove, isOver, score, aiTier}`.
- Hidden-info games: secrets live inside `state` and are redacted per-view, exactly
  like the Mastermind/Battleship pattern — enemy hands never cross the API.

## 3. Seat + turn engine (backend)

- Move admission: only the seat whose turn it is may act (fixed-turn games) / all
  living humans act per round (simultaneous); server validates via the registry.
- Bot executor: when the active seat is a Bot, the server calls the game's AI
  function (imported from the game's pure core), applies the move, advances —
  with a 1–2 s scheduled delay so tables feel alive (cron-free: in-process timer).
- Abandonment: the duels' 30-s-silence rule widens to 90 s stalled → 3 min → the
  seat converts to Bot; the table always finishes; placement is recorded.
- Winner/placement: resolved server-side from the registry's `score`/`isOver`.

## 4. Hot-seat + lobby UI (frontend)

- Hot-seat: round-robin name banners between turns, per-seat scores; bots optional
  here too (same tiers, local execution).
- Lobby: seat grid (N chairs), join by code/QR, host toggles each empty seat
  Bot/Closed, tier picker, Start; share text carries the table code (`?party=CODE`).
- Results: placement podium (1st…Nth), per-player stats, share line
  ("I took 2nd of 4 in SOS — beat my table"), instant rematch with seat keep.

## 5. Phases + effort

| Phase | Work                                                         | Effort |
| ----- | ------------------------------------------------------------ | ------ |
| 1     | party_matches table + seat engine (create/join/toggles/turn) | ~6 h   |
| 2     | registry adapters for P1–P5 (validators reuse duel cores)    | ~10 h  |
| 3     | bot executor (server-side AI calls + pacing + conversion)    | ~5 h   |
| 4     | lobby UI, hot-seat N-player, results/placement, registry     | ~6 h   |
| 5     | simultaneous-round engine (P7) + hidden-info views (P8/P10)  | ~10 h  |

Phases 1–4 = the P1–P5 scope now (~27 h). Phase 5 joins after the RNG decision
(with P6–P10). Ludo (P9) stays a separate L build on this engine.

## 6. Verification

jest: seat engine (order, skip-closed, conversion on abandonment), bot executor
determinism with seeded RNG, registry adapter parity with each duel clone; backend
specs: seat permission (act only on your turn), bot-move legality (same validator as
humans), placement resolution, view redaction for hidden-info seats; manual: 2 phones

- 2 bots, 3 phones full table, hot-seat 4, and an abandoned-seat finish.
