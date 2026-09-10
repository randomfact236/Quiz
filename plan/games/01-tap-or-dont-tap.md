# Game 01 — Tap or Don't Tap (Complete Plan)

> Complete plan (supersedes the 2026-09-09 sample). Status: **built & browser-verified**
> (2026-09-09 build pass) — `apps/frontend/public/games/tap-or-dont-tap/` with decoys,
> Stroop traps, rule swap, audio, pause and a baked percentile table. Logic tests:
> `apps/frontend/src/__tests__/games-tap-or-dont-tap.test.ts`.
> This doc is the spec of record: the constants below are authoritative when tuning, and
> the open items in §9–§12 are the only remaining work.

## 1. Overview

A Go/No-Go reaction game (the real psychology self-control test). The shareable number is
the **best reaction time in ms**. Success metric: median first session ≥ 15 rounds;
players can state their ms score from memory after one session.

## 2. Complete game spec

Round loop (state machine: `MENU → WAITING → SIGNAL → FEEDBACK → (WAITING | GAMEOVER)`,
plus `PAUSED`):

1. **WAITING** — dark screen, random delay **uniform 300–3000 ms**. A tap here is a
   **false start**: lose a heart, skip the round (no signal shown).
2. **SIGNAL** — one of:
   - 🟢 GREEN → tap within the window.
   - 🔴 RED → do not tap; survives after the window expires.
   - 🟡/🔵 DECOY (round ≥ 10) → never tap; ignoring it for the full window = +50.
   - STROOP TRAP (round ≥ 15) — word "TAP" in red or "WAIT" in green; **color wins,
     word ignored**.
3. **FEEDBACK** — 400 ms overlay ("218ms! 🔥" / "❌ Too slow" / "✅ Resisted +25"), then
   250 ms blank before the next WAITING.

### Constants (authoritative — implemented in `game.js`)

| Constant            | Value      | Notes                                         |
| ------------------- | ---------- | --------------------------------------------- |
| `WAIT_MIN/MAX_MS`   | 300 / 3000 | uniform random                                |
| `WINDOW_START_MS`   | 1200       | signal visible duration, round 1              |
| `WINDOW_SHRINK_MS`  | 25         | per round                                     |
| `WINDOW_FLOOR_MS`   | 450        | never below                                   |
| `HEARTS`            | 3          | 0 → game over                                 |
| `GREEN_BASE_POINTS` | 100        | `points = min(100 + streak×10, 500)` (×5 cap) |
| `RESIST_BONUS`      | 25         | red expired untouched                         |
| `DECOY_BONUS`       | 50         | decoy expired untouched (round ≥ 10)          |
| `FEEDBACK_MS`       | 400        | + 250 ms blank                                |
| `SWAP_ROUNDS`       | 21–23      | "🔄 RULES SWAPPED!" — red taps, green doesn't |

Signal mix per round band: 1–9 → 45 % green / 55 % red; 10–14 → 40/30/30 decoy;
15+ → 40 green / 30 red / 15 decoy / 15 Stroop.

Losing: tap on red/decoy/Stroop-wrong, false start, or green missed → −1 heart each.
Reaction recorded only on green hits. Swap inverts green/red only; decoys always
"never tap".

## 3. Progression & percentile model

- Difficulty = shrinking window + signal mix. No other knobs.
- **Best reaction** = min green-hit reaction of the run; **score** = sum of points.
- **Top-% badge**: `BAKED_TABLE` in `game.js` maps score → percentile (fixed simulated
  distribution). Personal history (last 50 runs `{date, score, bestMs}`) stored locally.

## 4. Screens & UI

| State      | Elements                                                             |
| ---------- | -------------------------------------------------------------------- |
| `menu`     | Title, one-line rule, best score + best ms, ▶ Start, mute toggle     |
| `waiting`  | Full-dark screen, "wait for it…" hint, HUD (hearts, score, round)    |
| `signal`   | Full-bleed color, optional overlay word (Stroop), HUD persists       |
| `feedback` | Center overlay text + tone color, 400 ms                             |
| `gameover` | Card: score, best ms, rounds, top-% badge, 📤 Share, ↻ Retry, ⌂ Menu |
| `paused`   | Overlay "Paused — tap to resume" (auto on `visibilitychange`)        |

Whole screen is the tap target (`pointerdown`); `touch-action:none` on the play area;
Space/Enter equivalent on desktop; HUD height fixed across states (no relayout).

## 5. Data model (localStorage, guarded wrapper)

```
game:tap-or-dont-tap:best     → { score: 1240, bestMs: 187 }
game:tap-or-dont-tap:history  → [{ date: '2026-09-10', score: 1240, bestMs: 187 }, …max 50]
game:tap-or-dont-tap:muted    → true|false
```

## 6. File structure & function inventory

```
tap-or-dont-tap/
  index.html    # state sections + gameover card
  style.css     # flash colors, HUD, overlays
  game.js       # constants → pure core → state machine → DOM wiring
```

Pure core (no DOM — the test surface, currently in `game.js`, mirrored in the site test
file): `windowMs(round)`, `pointsForGreen(streak)`, `pickSignal(round, rng)`,
`resolveTap({signalKind, expectsTap, tapped, elapsedMs})`, `percentileFor(score)`.
DOM layer: `startRun`, `beginRound`, `showSignal`, `handleTap`, `expireSignal`,
`finishRound`, `loseHeart`, `gameOver`, `pauseRun`, `showFeedback`, audio helpers.

## 7. Edge cases (verify each once)

1. Hidden tab during WAITING → pause; on return restart the wait from 0. Hidden during
   SIGNAL → counts as a miss (anti-cheat).
2. Tap within 50 ms of a state change → single tap only (pointerdown debounce).
3. Private mode / storage disabled → game runs, persistence silently skipped.
4. Phone sleep mid-wait → `visibilitychange` → pause path.
5. Stroop × swap overlap (rounds 21–23) → swap inverts green/red; decoys never tappable.
6. Rapid restart from gameover → all pending timers cleared.
7. Reaction ≤ 0 ms or > window + 50 ms → discarded as anomaly (clock sanity).

## 8. Testing plan

Existing: `apps/frontend/src/__tests__/games-tap-or-dont-tap.test.ts` — keep green.
Required cases (verify present; add missing): `windowMs` ramp incl. floor;
`pointsForGreen` cap; `resolveTap` truth table (5 signal kinds × tap/late/no-tap);
seeded `pickSignal` sequences per band; `percentileFor` monotonic + bounds.

## 9. Task breakdown

### P0 — playable core — DONE (2026-09-09 build pass)

- [x] State machine + round loop; signal kinds; hearts; reaction capture; ramp; scoring
- [x] HUD + gameover card; pause/resume (`visibilitychange` incl. wait-restart)

### P1 — full rules & feel — DONE

- [x] Streak multiplier; decoys; Stroop traps; rule swap; false starts
- [x] Feedback overlays; WebAudio + mute; baked percentile badge

### P2 — persistence/share/QA

- [x] Best score + history persistence; share chain
- [ ] **Delete `analyticsCandidates`/`trackGamePlayed` stubs** (isolation decision — they
      must never post to `/api/*`)
- [ ] Optional: migrate inline storage/audio helpers to `../shared/`
- [ ] Optional: extract pure core to `core.js`; keep site test file green
- [ ] QA gate (master README §5): offline play + isolation greps

### P3 — polish

- [ ] Reduced-motion variant of flash; tuning pass after 5 test sessions
- [ ] History sparkline on menu; haptics on heart loss; sound design pass

## 10. Acceptance criteria

- §7 edge cases each verified once (note date when done); §8 tests green.
- 20 consecutive rounds, no stuck state; restart from gameover < 300 ms to first signal.
- Share works through all three fallback paths (share sheet / clipboard / prompt).

## 11. Deferred coupling (intentionally NOT built)

Footer/nav links, `game_played` analytics posting, achievements, leaderboard backend —
per master README §7. The analytics stubs in `game.js` are to be **deleted**, not wired.

## 12. Remaining work (from code review 2026-09-10)

1. Remove analytics stubs (P2 — the only required code change).
2. Optional shared-utils migration + `core.js` extraction (P2, non-blocking).
3. Reduced-motion + tuning (P3).
