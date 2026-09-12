# Game 08 — Memory Quiz (Complete Plan)

> Complete plan (2026-09-12, owner request). Status: **built** — P0–P2 complete
> 2026-09-12 (see `README.md` §1 for the one recorded pack-size deviation). Slug
> `memory-quiz`; folder `apps/frontend/public/games/memory-quiz/`.
> Architecture follows the Rev 2 reference (`03-sliding-puzzle.md`): `config.js` +
> versioned `storage.js` from day one, zero assets, zero network, JS modules only
> (no JSON imports), browser-floor fallbacks. Built as a **new game**, so the Rev 2
> pattern is folded into the spec (same approach as `05-continuous-runner.md` §12).
>
> Origin: the owner's social-video format — a grid of snacks appears in different
> places, "You have X seconds to memorize!", then "Where is the pizza?", "Which snack
> is missing?" etc. The social CTAs ("leave your answer in the comment / follow") are
> mapped to the share flow for the website build (see §11).

## 1. Overview

A Go/Remember reaction game: study a grid of food items for a shrinking memorize
window, then answer questions about what you saw and where. The shareable number is
the **best score**. Success metric: median first session ≥ 4 boards; players can state
their score from memory after one session (same bar as game 01).

## 2. Complete game spec

Run loop (state machine: `MENU → MEMORIZE → QUESTION → FEEDBACK → (MEMORIZE next board
| GAMEOVER)`, plus `PAUSED`; mirrors game 01's proven loop):

1. **MEMORIZE** — the board shows a grid with `ITEMS` distinct food emoji placed in
   random cells (remaining cells empty). Countdown banner: "You have {seconds} seconds
   to memorize!". A tap here is ignored (no false-start punishment — studying is free).
2. **QUESTION** — the grid stays visible; the banner is replaced by a question:
   - **Where?** — "Where is the {item}?" → tap the cell holding that item.
   - **Missing?** (from board 3) — one item is removed from its cell; "Which snack is
     missing?" → pick it from `CANDIDATES` emoji buttons (distractors drawn from the
     pack, never items still on the board).
3. **FEEDBACK** — 400 ms overlay ("✅ +130" / "❌ It was there!" with the correct cell
   pulsing), then the next board.

### Constants (authoritative — implemented in `core.js`)

| Constant             | Value           | Notes                                       |
| -------------------- | --------------- | ------------------------------------------- |
| `HEARTS`             | 3               | 0 → game over                               |
| `MEMORIZE_START_S`   | 8               | board 1                                     |
| `MEMORIZE_SHRINK_S`  | 0.5             | per board                                   |
| `MEMORIZE_FLOOR_S`   | 3               | never below                                 |
| `QUESTION_WINDOW_S`  | 10              | per question; expiry = wrong                |
| `BASE_POINTS`        | 100             | + streak bonus                              |
| `STREAK_BONUS`       | 20              | per consecutive correct answer              |
| `MAX_POINTS`         | 300             | streak multiplier caps at ×3                |
| `GRID_TIERS`         | 3×2 · 4×3 · 5×4 | boards 1–2 / 3–5 / 6+ (cells = 6 / 12 / 20) |
| `ITEMS_PER_TIER`     | 4 · 6 · 8       | distinct items placed                       |
| `QUESTIONS_PER_TIER` | 2 · 3 · 4       | where-only / +missing / +extra where        |
| `CANDIDATES`         | 3 · 3 · 4       | answer choices for a missing question       |
| `FEEDBACK_MS`        | 400             | + 250 ms blank before the next board        |

Question mix: boards 1–2 → where-only; boards 3–5 → 2 where + 1 missing; 6+ → 3 where

- 1 missing. Asked items and the missing item are chosen by the seeded rng — never the
  same item twice on one board, and the missing item is always among the candidates.

### Content packs (zero assets — emoji glyphs, not image files)

Packs live in `data/packs.js` (JS module — browser-floor rule, never JSON imports):
`{ id, title, items: [{ emoji, name }] }`, 10 items each so the largest tier (8 items)
always has spares. Shipped at MVP:

- **Snacks** 🍕 pizza · 🌭 hotdog · 🍟 fries · 🥪 sandwich · 🍗 leg piece · 🍔 burger ·
  🌮 taco · 🍩 donut · 🥨 pretzel · 🍿 popcorn
- **Fruits** 🍎 apple · 🍌 banana · 🍇 grapes · 🍓 strawberry · 🍉 watermelon · 🍍
  pineapple · 🍒 cherry · 🍑 peach · 🥝 kiwi · 🍋 lemon

`name` is per-locale (question text and aria-labels come from it). The menu picks the
pack; the daily board always uses Snacks (deterministic).

## 3. Progression & score model

- Difficulty = shrinking memorize window + bigger grids + more questions. No other knobs.
- **Score** = cumulative points across boards; **best streak** tracked alongside.
- Personal best `{score, bestStreak}` persisted; history (last 20 runs) powers a
  local top-% badge on game over using the baked-table + real-history method proven
  in game 01 (`bakedPercentile`/`localPercentile`, copied — same contract).
- **Daily board** (P2, config-gated): seed = `YYYYMMDD` → identical boards and
  questions for everyone that day; per-day record key like game 03.

## 4. Screens & UI

| State      | Elements                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `menu`     | Title, pack picker (chips), best score + streak, ▶ Start, mute toggle                                                   |
| `memorize` | Banner "You have {s} seconds to memorize!" + countdown ring, grid, HUD (hearts/score/board)                             |
| `question` | Same grid + question banner (where/missing); missing questions swap the banner for a candidate-emoji row under the grid |
| `feedback` | 400 ms overlay: ✓ points or ✗ with the correct cell pulsing once                                                        |
| `gameover` | Card: score, best streak, boards, top-% badge, NEW BEST, 📤 Share, ↻ Retry, ⌂ Menu                                      |
| `paused`   | Overlay (auto on `visibilitychange`); the memorize countdown holds, not restarts                                        |

Grid cells are buttons sized `min(92vw / cols, 88px)`; the emoji glyph fills the cell
with a `font-size: clamp()`; every cell carries `aria-label` "row r, column c, pizza"
(kept current — the announced grid IS the game for screen readers). Empty cells are
`aria-label` "row r, column c, empty". Whole-screen taps are NOT the input (unlike game 01) — taps target cells; `touch-action: manipulation` on the grid only.

## 5. Data model (localStorage, versioned through `storage.js`)

```
game:memory-quiz:save   → { version: 1,
                            best: { score, bestStreak },
                            history: [{ score, boards, ts } …max 20],
                            prefs: { muted, pack } }
game:memory-quiz:daily:<yyyymmdd> → { score }        # P2 daily
```

Legacy keys: none (new game — the versioned layout ships with v1). All access through
`storage.js` (guarded, private-mode safe, remote adapter slot for a future host).

## 6. File structure & function inventory (Rev 2 layout from day one)

```
memory-quiz/
  index.html       # menu / memorize / question / gameover sections + overlays
  style.css        # grid, countdown ring, candidate row, overlays; vh→dvh and
                   # color-mix/backdrop-filter fallbacks declared first (browser floor)
  config.js        # flags (dailyEnabled) + per-locale strings: memorize banner,
                   # "whereIs" / "whichMissing" question templates, feedback, share;
                   # host-overridable window.__MEMORY_QUIZ_CONFIG__ → ?locale= → defaults
  storage.js       # versioned save v1 + prefs + history + remote adapter slot
  audio.js         # blips + mute (context on first gesture)
  core.js          # pure model — the test surface
  game.js          # UI shell: state machine, grid render, input, timers
  data/packs.js    # item packs (emoji + per-locale names) — JS module, never JSON
  core.test.html   # in-browser twin of the jest suite
```

`core.js` exports: `mulberry32(seed)`, `buildBoard(pack, tier, seed)` →
`{ cells: (item|null)[], items: [item] }` (distinct items, random cells, rng-injected),
`pickQuestions(board, tier, rng)` → ordered question list
(`{ kind: 'where', item } | { kind: 'missing', item, candidates }`),
`memorizeWindowS(board)` (ramp + floor), `pointsFor(streak)`, `resolveAnswer(question,
picked)` → `{ outcome, points, heartsLost }`, `lintPacks(packs)` (unique emoji + names
per pack, ≥ 8 items, names present in every shipped locale), `formatTime`-style
countdown helper, `localPercentile/bakedPercentile` (copied from game 01's contract).
`game.js`: state machine + timers (`performance.now()` only, all timers registered and
cleared on pause), grid rendering, input, share.

## 7. Edge cases

1. Hidden tab during MEMORIZE → pause; the countdown holds and resumes where it left
   (unlike game 01's wait-restart — studying time is not exploit-free either way, and a
   held timer is kinder). Hidden during QUESTION → the window pauses too.
2. Tap on an empty cell → wrong pick (it is a real answer attempt, not a false start).
3. The missing item's candidates never include an item still on the board; the removed
   item's cell renders as an empty socket so the board stays truthful.
4. Asked twice about the same item on one board → impossible by generation (tested).
5. Rapid double-tap on a cell → single answer (50 ms pointerdown debounce).
6. Storage disabled → no best/history, fully playable.
7. Emoji glyph missing on an ancient device → the cell still renders the item's first
   letter as a styled fallback (`@supports not (…) ` is unreliable for fonts; the
   fallback is a `text-shadow`-free plain letter via `<span>` with `aria-hidden`) —
   low-risk cosmetic path.
8. Board/question generation is total: 20-restart guard like game 04's generator, then
   throw (data bug must never ship); packs are linted so this is unreachable.

## 8. Testing plan (core.js — jest + core.test.html twin)

- Seeded determinism: same seed → identical cells + question order (snapshot).
- Board invariants over 100 seeds/tier: `ITEMS_PER_TIER` distinct items, within bounds,
  rest empty; no duplicate emoji on a board.
- Question invariants: every `where` item is on the board; the `missing` item is off
  the board and among `candidates`; candidate count matches the tier; no repeat item
  per board; question count matches `QUESTIONS_PER_TIER`.
- `memorizeWindowS`: ramp incl. floor.
- `pointsFor`: streak bonus + ×3 cap; `resolveAnswer` truth table (where hit/miss,
  missing hit/miss/wrong-candidate).
- `lintPacks`: duplicate emoji/name rejection, ≥ 8 items, missing name rejection.
- storage.js: versioned save round-trip, corrupt-save sanitization, history cap,
  remote-adapter no-op safety.
- config.js: override chain (host → URL → default), string fallback.

## 9. Task breakdown

### P0 — playable core

- [x] `core.js`: mulberry32, buildBoard, pickQuestions, memorizeWindowS, pointsFor,
      resolveAnswer, lintPacks (+ jest §8 core tests)
- [x] `storage.js` (v1 facade + adapter slot) + `config.js` (flags + strings) +
      `audio.js` + `data/packs.js` — Rev 2 layout from day one
- [x] MEMORIZE → QUESTION loop on the 3×2 tier with where-questions; hearts; scoring;
      countdown banner; menu/gameover/pause; best-score persistence

### P1 — full rules & feel

- [x] Missing questions + candidate row; 4×3 and 5×4 tiers with the question mix;
      streak scoring + cap; feedback overlays with correct-cell pulse
- [x] Pack picker on the menu; per-locale names in questions/aria; sound design + mute
- [x] A11y: live grid labels kept current, question/feedback announced, focus handling
- [x] Share (chain: Web Share → clipboard → prompt) with the quiz-flavored template

### P2 — persistence/share/QA

- [x] Daily board (seed = `YYYYMMDD`, `config.dailyEnabled` gate, per-day record);
      history + top-% badge
- [x] QA gate (master README §5): offline play, isolation greps (clean), jest +
      core.test.html green; the 10-minute phone session at 360 px is owed by the
      owner like every game

### P3 — polish

- [ ] Swap twist (an item silently moves; "tap what changed"); more packs (data-only);
      kids mode (names printed under the emoji); confetti on a perfect board;
      hard mode (no hearts, one miss ends the run)

## 10. Acceptance criteria

- §8 tests green; every generated board/question set valid over 100 seeds per tier.
- Countdown never runs while hidden; question window pauses with the tab.
- Seeded daily reproduces identical boards/questions across reloads.
- 3×2 board fits 360 px with banner + grid + HUD visible, no scroll; grid never
  overflows horizontally (canvas-guard rule does not apply — DOM grid).
- Restart ≤ 1 tap; wrong answers always reveal the truth (correct cell pulses).

## 11. Deferred coupling (intentionally NOT built)

- **Comment/follow CTAs** from the social-video format: the website build maps them to
  the standard share chain; there is no comment system or follow concept for games.
  The copy stays configurable in `config.strings` so an app/social wrapper can append
  its own CTA.
- Footer/nav links, analytics events, achievements, leaderboards — per master README §7.
- **Real photo packs**: the zero-asset rule stands; bundled image packs (with a
  Library-Builder-style tool like sliding-puzzle's planned one) are a future owner
  decision, recorded here so it is not silently re-decided.

## 12. Multiplayer (per this game's nature)

- **Async seeded daily — the natural fit:** `buildBoard`/`pickQuestions` take a seed,
  so the daily gives everyone identical boards and question order; compare scores.
  Ships in P2 behind `config.dailyEnabled`.
- **Hot-seat:** pass the device per board with per-player tallies — trivial to add
  later (game 02's series pattern); not in MVP.
- **Live "spot it first" race:** **gated** — needs a backend and server-side timing
  (client clocks can't referee a speed contest); requires the §7 isolation reversal.
  Not planned.
