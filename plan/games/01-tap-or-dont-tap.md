# Game 01 — Tap or Don't Tap (Complete Plan)

> Complete plan (supersedes the 2026-09-09 sample). Status: **built & browser-verified**
> (2026-09-09 build pass) — `apps/frontend/public/games/tap-or-dont-tap/` with decoys,
> Stroop traps, rule swap, audio, pause and a baked percentile table. Logic tests:
> `apps/frontend/src/__tests__/games-tap-or-dont-tap.test.ts`.
> **Rev 2 (2026-09-11): architecture upgraded — pure `core.js`, `config.js`,
> `storage.js` (versioned + migrated), `audio.js`; analytics removed; a11y pass. 30/30
> tests green.** This doc is the spec of record: the constants below are authoritative
> when tuning, and §13 tracks the Rev 2 state.

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
- [x] **Delete `analyticsCandidates`/`trackGamePlayed` stubs** — done 2026-09-11 (Rev 2);
      the game makes zero network calls (isolation greps clean)
- [x] Storage/audio/config helpers moved to per-game modules (`storage.js`, `audio.js`,
      `config.js`) per the Rev 2 architecture — supersedes the `../shared/` idea
- [x] Pure core extracted to `core.js`; site test file re-pointed and green (30 tests)
- [x] QA gate (master README §5): offline play + isolation greps clean (2026-09-11)

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

1. ~~Remove analytics stubs~~ — done 2026-09-11 (Rev 2 R2-1; isolation greps clean).
2. ~~Shared-utils migration + `core.js` extraction~~ — done 2026-09-11 as per-game
   `config.js`/`storage.js`/`audio.js` + `core.js` (Rev 2 R2-1; supersedes `../shared/`).
3. ~~Reduced-motion + tuning~~ — reduced-motion covered (flash is a solid color; pop +
   button transitions disabled); tuning pass still owes human sessions (P3).

## 13. Rev 2 architecture upgrade (2026-09-11) — reference: `03-sliding-puzzle.md`

> Owner-approved architecture reference for all games (Sliding Puzzle Rev 2), applied
> per this game's nature: a reflex game has no levels and no meaningful multiplayer, so
> the upgrade here is **hygiene + structure**, not features. Isolation contract
> unchanged: no analytics, no site coupling, offline-first.

### Target file layout

```
tap-or-dont-tap/
  index.html
  style.css
  config.js     # flags + per-locale strings (menu rule line, feedback/share/gameover
                # copy), host-overridable: window.__TAP_OR_DONT_TAP_CONFIG__ → ?locale= → defaults
  storage.js    # guarded facade: versioned save + migrations, remote adapter slot
  audio.js      # WebAudio + mute
  core.js       # extracted pure core (windowMs, pointsForGreen, pickSignal, resolveTap,
                # percentileFor) — the test surface; jest suite re-pointed here
  game.js       # UI shell: state machine + DOM wiring
```

### config.js

Flags and strings only — no multiplayer, no levels in this game. Per-locale strings for
the rule line, feedback overlays, share template and gameover card; `prefs` may override
the copy but is documented as a cache, not the source of truth.

### storage.js facade

One versioned save record replaces the three loose keys:
`game:tap-or-dont-tap:save → { version:1, best:{score,bestMs}, history:[…≤50], prefs:{muted} }`
with a one-time migration from the legacy keys. Remote adapter slot (host-injected only)
reserved for future account sync of best/history — the game never checks auth; **guests
keep full local persistence**. Mid-round resume: N/A (rounds are seconds).

### Multiplayer (per this game's nature)

- Live/real-time duels: **gated** — device input/display latency makes reaction times
  unfairly comparable; needs a backend plus server-side timing and a §7 reversal. Not
  planned.
- Optional future: **async seeded duel** — `pickSignal(round, rng)` already accepts an
  rng, so a shared seed fixes the identical signal sequence for both players; compare
  score. Deferred; not scheduled.

### Phases

- [x] R2-1 Hygiene (2026-09-11): analytics stubs deleted; pure core extracted to
      `core.js` (jest suite re-pointed); `config.js` (locale + share strings,
      host-overridable) and `storage.js` (versioned `save` document, legacy-key
      migration, remote adapter slot) introduced; `audio.js` split out. 30/30 tests
      green; browser-verified end-to-end.
- [x] R2-2 A11y/polish (2026-09-11): signal `aria-label` describing each flash (incl.
      the Stroop lie) via `role="img"`; focus lands on Retry at gameover; `data-state`
      now maintained on the game root; Stroop word contrast fixed on the green flash;
      go-badge gradient darkened to AA; visible `:focus-visible` rings. (Reduced-motion:
      the flash is a solid color — nothing moves; the existing block covers the feedback
      pop + buttons. Sparkline + haptics were already shipped.)
- [ ] R2-3 (deferred, optional) async seeded duel — only if there's demand.
