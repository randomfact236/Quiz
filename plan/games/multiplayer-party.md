# Multiplayer Party — 3P/4P game list (empty-board family)

> **Owner decision 2026-09-28:** party play is approved for the family — 3–4 players
> per table, and **empty seats are filled by bots** (2 humans + 2 bots, 1 human + 3
> bots, any mix). Bots use the same easy/medium/hard tiers as solo AI. Implementation
> plan: [multiplayer-party-plan.md](multiplayer-party-plan.md).

## 1. The seat rule (answers "who plays when seats are empty")

1. A party lobby has N seats (3 or 4, per game below).
2. Humans claim seats by joining with the invite code/link (same duel flow).
3. Every empty seat defaults to **Bot**; the host may flip any empty seat to
   **Closed** (shrink the table) before starting.
4. The host starts the game whenever they like — any human/bot mix is legal.
5. Bots play the SAME rules, one lobby-wide tier (default medium), acting server-side
   with a 1–2 s pace delay. Bots are players, not referees — nothing is ever placed
   for them by the game itself (empty-board rule holds).
6. A human who abandons (the duels' stalled/abandoned rule) converts to a Bot so the
   table always finishes; results record final placement (1st…Nth).
7. Solo practice for party games = you + bots only (it is the same N-player engine).

## 2. Party roster (build order)

| §   | Game         | Seats | Turns          | Needs new decision? | Effort |
| --- | ------------ | ----- | -------------- | ------------------- | ------ |
| P1  | Dots & Boxes | 3–4   | fixed          | no                  | S+     |
| P2  | Ultimate TTT | 3–4   | fixed (shared) | no                  | S+     |
| P3  | SOS          | 3–4   | fixed          | no                  | S+     |
| P4  | Notakto      | 3–4   | fixed          | no                  | S+     |
| P5  | Pig Dice     | 3–4   | fixed          | no (RNG precedent)  | S+     |
| P6  | Two-Dice Pig | 3–4   | fixed          | RNG decision        | XS→S   |
| P7  | Yatzy Lite   | 3–4   | simultaneous   | RNG decision        | M      |
| P8  | Liar's Dice  | 3–4+  | simultaneous   | RNG decision        | M      |
| P9  | Ludo         | 4     | fixed          | RNG decision        | L      |
| P10 | Crazy Eights | 3–4   | simultaneous   | RNG decision        | M      |

Fixed-turn board games (P1–P6, P9) are the cheap, natural party fit. Simultaneous
games (P7–P8, P10) need a round engine instead of a turn ticker — phase 5 of the plan.

Games NOT in the roster, and why: Chess/Go/Hive/Quoridor (2-player by design —
3P variants are different games), Quarto/Blokus/Abalone (piece economics break past
2P), Mastermind/Bulls & Cows (one breaker vs one maker — a 3rd player just watches),
Memory Flip / Higher or Lower (duel variants still undefined, §2 decisions pending).

## 3. Mode availability matrix

| §   | Hot-seat (one phone)           | Online lobby (phones + bots) | Solo party (you + bots) |
| --- | ------------------------------ | ---------------------------- | ----------------------- |
| P1  | ✅ pass-and-play               | ✅                           | ✅                      |
| P2  | ✅ pass-and-play               | ✅                           | ✅                      |
| P3  | ✅ pass-and-play               | ✅                           | ✅                      |
| P4  | ✅ pass-and-play               | ✅                           | ✅                      |
| P5  | ✅ pass-and-play               | ✅                           | ✅                      |
| P6  | ✅ pass-and-play               | ✅                           | ✅                      |
| P7  | ✅ one-phone round-robin rolls | ✅ simultaneous rounds       | ✅                      |
| P8  | ❌ cups must stay secret       | ✅ hidden hands, server-held | ✅ (server holds cups)  |
| P9  | ✅ pass-and-play (4 seats)     | ✅                           | ✅                      |
| P10 | ❌ hidden hands                | ✅ hidden hands, server-held | ✅ (server holds deck)  |

Hot-seat ❌ = the hidden information cannot be passed safely on one phone without an
honor system; those games simply skip hot-seat mode online-only, like duel-only games.

## 4. Effort + gating

- **Now (no new decisions):** P1–P5 ≈ 5 × S+ on top of their duel builds; the shared
  seat engine in [multiplayer-party-plan.md](multiplayer-party-plan.md) is the real
  cost (one engine serves all party games).
- **After the RNG decision:** P6–P10 join the same engine. Ludo (P9) is its own L
  build regardless.

## 5. Related

- Per-game party notes: `03-dots-and-boxes.md` §9 (P1), `29-sos.md` §9 (P3),
  `05-pig-dice.md` §9 (P5) — same pattern extends to P2/P4 as they are planned.
- Duel backend baseline: `plan/18-duel-multiplayer.md` phase 5; games README §1 template.
