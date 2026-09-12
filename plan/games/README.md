# 2D Games — Complete Build Plans (Master)

> Complete, decision-ready build plans for the seven games in `2d games plan.md` (repo root).
> Created as samples 2026-09-09, upgraded to **complete plans 2026-09-10**. Every open
> question is resolved (§8 Decisions log); each game doc is build-ready as written.

## 1. Status

| #   | Game             | Plan file                 | Build status                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Est. left |
| --- | ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Tap or Don't Tap | `01-tap-or-dont-tap.md`   | **Built** — Rev 2 applied 2026-09-11: modular (core/config/storage/audio), analytics removed, a11y + contrast pass; 2026-09-12 stale-code cleanup: config strings completed (menu/feedback/gameover copy), dead code removed, history schema aligned with plan; 31 tests green; tuning pass after human sessions owed                                                                                                                                                           | ~0.5 day  |
| 2   | Tic Tac Toe      | `02-tic-tac-toe.md`       | **Built** — Rev 2 applied 2026-09-11: pure logic in `core.js`, modular (config/storage), analytics removed, versioned series/prefs save with legacy migration, 23 tests green (incl. exhaustive minimax sweep)                                                                                                                                                                                                                                                                  | done      |
| 3   | Sliding Puzzle   | `03-sliding-puzzle.md`    | **Built** — P0–P2 complete + 5×5, picture mode (8 procedural scenes, corner target preview, peek pills), daily challenge (seeded 4×4) and hard mode; jest suite + `core.test.html` green; **Rev 2 Phase 0 applied 2026-09-12**: config/storage/scenes/audio modules, versioned save with legacy migration, `slideTile` returns displaced tiles, dead CSS removed; remaining P3 extras: undo, solve-demo, swipe, score/clock rounding unification; future: fixed picture library | done      |
| 4   | Word Puzzle      | `04-word-puzzle.md`       | **Built** — P0–P2 complete in `public/games/word-puzzle/` (core/game + `data/themes.json`, 4 themes × 3 tiers, seeded generator, drag/tap/keyboard input, hints, stars, share); jest suite + `core.test.html` green; P3 extras (daily puzzle, confetti, more themes) deferred                                                                                                                                                                                                   | done      |
| 5   | Hurdle Runner    | `05-continuous-runner.md` | **Built** — P0–P2 complete in `public/games/hurdle-runner/` (engine/core/render/main, 💚 pickup, share, `?debug=1`, day→night palette); a spawner rng double-call bug left by the interrupted build pass was fixed 2026-09-11 and the jest suite is green; 2026-09-12: config.js wired (strings live), storage legacy guard fixed, dead helpers removed; P3 leftovers: fast-fall, gamepad                                                                                       | done      |
| 6   | Flying Snake     | `06-flying-snake.md`      | **Built** — P0–P2 complete in `public/games/flying-snake/` (core/render/main, fixed 1/120 s physics, medals, share, `?debug=1`); jest suite + `core.test.html` green; 2026-09-12: config.js wired (share/medal strings live), medal thresholds single-sourced, dead code removed; P3 extras deferred                                                                                                                                                                            | done      |
| 7   | Spirit Runner    | `07-spirit-runner.md`     | **Built** — Phases A–D complete in `public/games/spirit-runner/` (engine forked from 05 with slide/swipes; `gates.js` 5 rules; orbs/powers; shadow realm; characters/unlocks; `?debug=1`); jest suite + `core.test.html` green; 2026-09-12: `storage.js` facade extracted, tall-guardian spawn/hitbox fixed per plan, config strings live, dead fork leftovers removed; balance pass + 10-min manual session pending; P3 deferred                                               | ~0.5 day  |

## 2. Shared conventions (binding for all games)

- **Tech:** vanilla HTML/CSS/JS, one self-contained folder per game — no framework, no
  libraries, no build step. DOM/CSS for board & puzzle games; Canvas 2D for 05/06/07.
- **Location:** `apps/frontend/public/games/<slug>/` — served as static files by Next.js.
  The folder is **git-ignored** (`.gitignore`) and must import nothing from, and be
  imported by nothing in, `apps/frontend/src` or `apps/backend`.
- **Viewport:** mobile-first, one-thumb playable; canvas uses `devicePixelRatio` scaling;
  board games fit `100dvh` in the play state with no scrolling.
- **Persistence:** `localStorage` only, keys `game:<slug>:*`, always through a guarded
  read/write wrapper (private-mode safe). No server calls of any kind.
- **Share:** end-screen 📤 via `navigator.share` → clipboard fallback → `prompt` fallback.
  Format: `I {result} in {Game} — can you beat it? {url}`.
- **Timing:** `performance.now()` only, never `Date.now()`. Any timed game pauses on
  `visibilitychange` (timers restart or accumulate — never silently elapse).
- **Code layout:** pure game logic lives in a separate `core.js` (or a clearly separated
  pure section of `game.js`) with no DOM access — this is what makes games testable.
- **Rev 2 architecture reference (2026-09-11):** `03-sliding-puzzle.md` — every game
  adopts, per its nature, a `config.js` (flags + per-locale strings, host-overridable
  via `window.__<GAME>_CONFIG__` → URL param → defaults), a `storage.js` facade (schema
  version + migrations over its keys, prefs/records, and a remote adapter slot that only
  a host can inject), **local-first persistence** (guests keep full local saving; the
  game never checks auth; account sync is a gated future phase), and a per-game
  multiplayer analysis in its plan (hot-seat / async seeded challenges are backend-free;
  live online is gated behind a backend + an explicit §7 reversal). See each plan's
  "Rev 2 architecture upgrade" section.
- **Static asset freshness (2026-09-12):** everything under `/games/` is served with
  `Cache-Control: public, max-age=0, must-revalidate` (both Next configs), so a deploy is
  picked up on the next load — no cache-busting query strings needed, and players never
  get a stale `style.css`/`game.js`. Non-Next hosts must serve the games with the same
  revalidation.
- **Browser floor (2026-09-12):** games must load on any module-capable browser — data
  ships as JS modules, never JSON-module imports (Safari < 17.2 / Firefox < 128 can't
  parse `with`/`assert`), and modern CSS (`dvh`, `color-mix`, `backdrop-filter`) always
  has a plain fallback declared first.
- **Phases:** P0 playable core · P1 full rules & feel · P2 persistence/share/QA ·
  P3 polish (same basis as `plan/STANDARDS.md` §1).

## 3. Shared utilities (`apps/frontend/public/games/shared/`)

Extract during Game 02 assembly (do not pre-build). Plain ES modules; games load their
code with `<script type="module">`; no bundler.

| File            | Exports (exact API)                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage.js`    | `readJson(key, fallback)`, `writeJson(key, value)` — try/catch guarded                                                                                         |
| `best-score.js` | `getBest(slug)`, `setBest(slug, value)` — compares and stores `game:<slug>:best`                                                                               |
| `loop.js`       | `createLoop({ update(dt), render(), fixedDt = 1/120 }) → { start, stop, setPaused }` — rAF + accumulator, frame clamp 250 ms, auto-pause on `visibilitychange` |
| `input.js`      | `onTap(element, fn)` — pointerdown-based, 50 ms debounce, applies `touch-action:none`; `onKey(keys, fn)`                                                       |
| `audio.js`      | `blip(freq, ms, type)`, `setMuted(bool)`, `isMuted()` — WebAudio context created on first user gesture                                                         |
| `share.js`      | `shareScore({ text, url })` — Web Share → clipboard → `prompt` fallback chain                                                                                  |

Games 01/02 already carry their own inline versions of these helpers — migrating them to
`shared/` is a P2 item per game, not a blocker.

> **Superseded (2026-09-11/12):** the `shared/` folder was never built. The Rev 2 pass
> gave every game its own `config.js`/`storage.js` modules (plus per-game `audio.js` /
> `scenes.js` where relevant) instead — see each plan's "Rev 2 architecture upgrade".
> Kept for history.

## 4. Build order & milestones

1 → 2 → 3 → 6 → 5 → 4 → 7 (risk-adjusted: 05's engine is reused by 07; the two ⭐ games
shake out the shared utils first).

| Milestone | Contents             | Exit criteria                                          |
| --------- | -------------------- | ------------------------------------------------------ |
| M1        | Finish Games 01 + 02 | Both pass their acceptance checklists; utils extracted |
| M2        | Games 03 + 06        | Puzzle + arcade pair pass acceptance                   |
| M3        | Game 05              | Runner engine proven (07 forks it)                     |
| M4        | Game 04              | Generator + content pipeline tested                    |
| M5        | Game 07              | Twist + meta complete; balance pass done               |

## 5. Per-game QA gate (before a game is called done)

1. All P0/P1/P2 checkboxes in its plan are checked; P3 items explicitly deferred or done.
2. Pure-function tests pass (per-game Testing plan; `core` runs under `node:test` or a
   shipped `test.html` harness).
3. 10-minute manual session at phone width: no stuck states or sounds, pause/resume
   correct, restart in one tap.
4. Offline check: playable with network blocked (static, zero fetches).
5. Isolation check: grep the game folder for `fetch(`, `/api/`, and imports beyond
   `../shared/` — all must come up empty.

## 6. Openable formats

Markdown here is the single source of truth. Regenerate with:
`node plan/games/build-html.mjs` (screen HTML → `plan/games/html/`) and
`node plan/games/build-pdf.mjs` + pdf-skill conversion (PDFs → `plan/games/pdf/`).

## 7. Isolation from the website (owner decision 2026-09-09 — binding)

- No nav/footer/sitemap links, no analytics events, no achievements integration, no
  backend endpoints, no shared UI. Each game plan has a **Deferred coupling** section
  listing what is intentionally NOT built.
- ✅ **RESOLVED (2026-09-11/12):** the analytics POSTs were deleted in the Rev 2 commits
  (verified 2026-09-12: isolation greps clean across all seven games — see
  `plan/stale-code-scan-2026-09-12.md`); the local `/games` hub's `?api=` beacon
  plumbing was removed 2026-09-12 (games take no hub parameters and post nothing);
  game 02's Play-Hub header claim is gone. Isolation holds; shipping later remains the
  explicit owner action below.
- Shipping later is an explicit owner action: remove the `.gitignore` line
  `apps/frontend/public/games/`, commit, and add any site references in one scoped change.

## 8. Decisions log (resolved — supersedes the sample plans' open questions)

| #   | Question                           | Decision (default chosen; change = edit here)                     |
| --- | ---------------------------------- | ----------------------------------------------------------------- |
| 1   | Word Puzzle interpretation         | **Word Search** (drag-highlight finding); Wordle/anagram dropped  |
| 2   | Word list source                   | Hand-curated static `data/themes.json`; English-only MVP          |
| 3   | Leaderboards / "Top 12%"           | Local only: baked percentile table + personal history; no backend |
| 4   | Site nav/footer links              | None while isolation holds (§7)                                   |
| 5   | Analytics events                   | None posted (§7)                                                  |
| 6   | Achievements (plan/06) integration | Out of scope; games track medals/shards locally                   |
| 7   | Arcade art                         | Procedural shapes/gradients/glow — no sprite assets at MVP        |
| 8   | "Flying Snake" branding            | Keep the name (page title "Flying Snake")                         |
| 9   | Runner death rule                  | 05/06: one hit = game over; 07: 2 hearts (longer-form design)     |
| 10  | Gate hint tone (07)                | Poetic line + learnable literal rule; 5 rules documented          |
