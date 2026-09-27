# Game 08 — Memory Quiz (Complete Plan)

> Complete plan (2026-09-12, owner request). Status: **built + upgraded** — P0–P2
> complete 2026-09-12; the 2026-09-13 extension upgrade added the 30-level campaign,
> question-type registry, modes and save v2 on top of this spec (packs grew 10 → 14
> items — see README §1). **Single-file form (owner decision 2026-09-16):** the former
> `08-memory-quiz-upgrade.md` extension document is merged below as Part II (§13–§21);
> §1–§12 remain the build spec of record. Slug `memory-quiz`; folder
> `apps/frontend/public/games/memory-quiz/`.
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

- [x] Swap twist (**shipped** in the 2026-09-13 upgrade as a two-item exchange —
      "The {item} moved! Where is it now?" — data/questions.js); kids mode (**shipped**:
      names under the items + memorize bonus); hard mode (**shipped**: one miss ends
      the run); zen mode (**shipped**: no fail state) — see data/modes.js
- [ ] confetti on a perfect board; more packs (packs grew to 14 items each for the
      candidate budget; additional packs still open)

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

---

# Part II — Future-Proof Upgrade Architecture (§13–§21)

> Owner request (2026-09-12): _"proper future proof plan that can be upgraded to any level."_
> This is the **extension architecture** for `apps/frontend/public/games/memory-quiz/` —
> formerly the separate document `08-memory-quiz-upgrade.md`, merged into this file on
> 2026-09-16 (owner decision to keep one feature file per game). It extends Part I
> (§1–§12, the build plan, P0–P2 shipped) and obeys the master README.md conventions
> (§5 QA gate, §7 isolation, Rev 2 architecture).
>
> **Status: Phases A–C BUILT (2026-09-12/13).** Phase D remains owner-triggered. Two recorded
> deviations from the sketches below, both simplifications: (1) unlocks are **derived** from
> level records + host grants — there is no stored `unlocks` map in save v2; (2) the second
> proof question type is `oddOne` ("which was NOT on the board?") instead of count/order —
> it reuses the candidate-row UI and proves the spare-item (`needs: 'spareItem'`) registry
> channel. The registry contract also gained a `missMessage(q, ctx)` member (per-type miss
> feedback) and `spareCost(entry, level)` metadata (level-aware pack lint) — `core.js` reads
> both without ever naming a question type. The E2E session lives at
> `apps/frontend/verify-memory-quiz.mjs` (serve `apps/frontend/public` on :8931 and run it
> with node from `apps/frontend`).

## 13. What "upgraded to any level" has to mean

Three readings, all covered by this plan (they are not mutually exclusive):

| #   | Reading                                                                        | Structural requirement                                                                                                        |
| --- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| L1  | **Player-facing levels** — pick/enter any level, see records, unlock as you go | Level descriptors are **data**, the menu is a level picker, records/unlocks persist                                           |
| L2  | **Unbounded difficulty** — the ladder does not stop at 3 tiers                 | A level is a **spec** (grid, items, questions, timers, rules); higher levels are new data rows or a generator, never new code |
| L3  | **Extensible content & rules** — new question types, packs, modes              | Question types, packs and modes are **registries** the engine iterates; adding one never edits the state machine              |

## 14. Current architecture (verified 2026-09-12) and what is already future-proof

```
memory-quiz/
  core.js      pure engine (no DOM) — the test surface
  config.js    flags + per-locale strings, host-overridable (window.__MEMORY_QUIZ_CONFIG__ → ?locale= → defaults)
  storage.js   versioned save v1 + daily keys + remote-adapter slot (guarded, private-mode safe)
  audio.js     blips + mute
  data/packs.js  2 emoji packs (12 items, per-locale names)
  game.js      shell: state machine, grid render, input, timers, share
  style.css    theme tokens, grid, overlays; browser-floor fallbacks
  core.test.html  in-browser twin (62 assertions)
```

**Already future-proof — keep and build on:**

- **Pure core + seeded rng.** `buildBoard(pack, tier, seed)` / `pickQuestions(board, tier, rng)` are
  deterministic and DOM-free, so any new level/question type is unit-testable and daily-replayable.
- **Module seams.** config / storage / audio / packs are separate modules; a new concern gets a new
  module instead of growing `game.js`.
- **Versioned persistence facade.** `SAVE_VERSION` + sanitize-on-load + adapter slot exists
  (`storage.js:30,121`); every future schema is a migration, not a break. Precedent for migrations
  lives in games 02/03.
- **Host-overridable config chain.** Flags and strings can be overridden by a host page/WebView
  (`config.js:20`) — the upgrade path for unlocking levels or injecting CTAs without forking.
- **Pack lint as a contract.** `lintPacks` (`core.js:274`) enforces unique emoji/names, locale
  coverage and **enough off-board spares** for the biggest tier — content bugs fail fast, not mid-run.
- **Isolation.** Zero network, zero site coupling (README §7) — a telemetry/meta layer must be an
  injected seam, never a direct `fetch`.

## 15. Gap analysis — the hardcoded assumptions that block "any level"

Everything below is index-parallel data tuned for exactly three tiers. These are the specific
places to change; no other module needs rewriting.

| #   | Location            | Hardcoded today                                                                                          | Needed                                                                                                     |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| G1  | `core.js:34-43`     | `GRID_TIERS` / `ITEMS_PER_TIER` / `QUESTIONS_PER_TIER` / `CANDIDATES` are 4 parallel 3-element arrays    | One `LEVELS` array of self-contained specs                                                                 |
| G2  | `core.js:50`        | `tierFor(boardNumber)` → 1–2 / 3–5 / 6+, capped at 2                                                     | `levelFor(run)` over the ladder (explicit rows, or a generator for endless)                                |
| G3  | `core.js:147`       | `pickQuestions` hardcodes the mix (`whereCount = questions − (tier ≥ 1 ? 1 : 0)`) and the two kinds      | Question **composition per level** + a question-type registry                                              |
| G4  | `core.js:214`       | `resolveAnswer` branches `if (kind === 'where' … else missing)`                                          | Registry: each type resolves itself (incl. its own truth reveal)                                           |
| G5  | `core.js:58`        | `memorizeWindowS` is one global ramp + floor                                                             | Per-level `memorizeS` (or ramp params) in the spec                                                         |
| G6  | `core.js:203`       | `pointsFor` uses global `BASE_POINTS` / `STREAK_BONUS` / `MAX_POINTS`                                    | Scoring hooks: defaults + per-level/per-mode overrides (time bonus, perfect board)                         |
| G7  | `core.js:274`       | `lintPacks` minimums are emoji-tier math (`≥ 8`, spares for 8+3)                                         | Per-kind validators + limits derived from the level ladder's max demands                                   |
| G8  | `storage.js:17-20`  | One global `best` + `history`; no unlocks, no per-level records, no meta                                 | Save **v2**: per-level records/unlocks/XP + v1→v2 migration                                                |
| G9  | `config.js:20`      | Only `dailyEnabled`                                                                                      | Flags per mode/level, level-lock policy, host unlock injection, CTA/telemetry seams                        |
| G10 | `game.js:227-330`   | State machine knows exactly two question kinds and one flow; UI is hardcoded to hearts/score/board chips | `renderQuestion(ctx)`/`announce` per type; HUD composed from the active mode's spec                        |
| G11 | `data/packs.js`     | Emoji-only items; single difficulty                                                                      | Pack `kind` (`emoji \| image \| shape`) + optional `difficulty`/tags (photo packs are §11's deferred item) |
| G12 | menu (`index.html`) | Pack chips, ▶ Start, daily button — no level surface                                                     | Level picker (locked/unlocked/records) + mode selector                                                     |
| G13 | grid CSS            | Fixed `min(92vw/cols, 88px)` cell sizing; 20-cell max in practice                                        | Density breakpoints + a documented cell-count cap and/or canvas render seam for very large grids           |

## 16. Target architecture — the extension contracts

### 16.1 `data/levels.js` — the ladder (the core of L1+L2)

```js
/** One level = one complete, self-contained description of a board + its questions. */
export const LEVELS = [
  {
    id: 'l1',
    label: 'Pizza Party', // per-locale via config.strings.levels.l1
    cols: 3,
    rows: 2, // grid
    items: 4, // distinct items placed
    questions: [{ type: 'where', count: 2 }],
    candidates: 3, // answer choices for missing-style questions
    memorizeS: 8,
    questionS: 10,
    points: { base: 100, streakBonus: 20, cap: 300 },
    rules: {}, // e.g. { noHearts: true }, { namesUnderItems: true }
    unlock: null, // first level is always open
  },
  // …explicit curated rows for the "campaign"…
];

/** Endless ladder: after the curated rows, difficulty keeps scaling to hard caps. */
export function makeEndlessLevel(n, { packItemCount }) {
  /* cols/rows/items/faster window/rule unlocks */
}

/** Resolve the level for a run position (campaign rows, then generator). */
export function levelFor(runPosition, source = 'campaign') {
  /* … */
}
```

Rules for the ladder (invariants, tested):

- `cols × rows ≥ items` and `items + (candidates − 1) ≤ packItemCount` (keeps generation total);
- grid caps: `cols × rows ≤ MAX_CELLS` (recommend 30 with the DOM renderer; see §16.7);
- memorize floor (3 s) and question-window floor are enforced by the resolver;
- level ids are stable strings — they are storage keys, never array indices.

### 16.2 `data/questions.js` — question-type registry (L3)

```js
/** Every question type is a plugin. The engine never names a type. */
export const QUESTION_TYPES = {
  where: {
    id: 'where',
    build(board, ctx, rng) {
      /* → question */
    },
    resolve(question, picked, ctx) {
      /* → { outcome, points, heartsLost, truth } */
    },
    announce(question, ctx) {
      /* SR text + banner string */
    },
    render(question, ctx) {
      /* candidate row / extra UI; default = none */
    },
    invariants(board, question, ctx) {
      /* throws on invalid generation */
    },
  },
  missing: {
    /* … */
  },
  // future, one object each: swap, order, count, color, pair, sequence…
};
```

Engine contract: `pickQuestions` composes from the level's `questions` list, resolves each type via
the registry, and the test-suite runs `invariants()` for **every** type × level × N seeds. Adding a
new question type = one registry entry + its invariants; no `game.js`/`core.js` edits.

### 16.3 `data/modes.js` — modes as data (L1+L3)

```js
export const MODES = {
  classic: { id: 'classic', levelSource: 'campaign', hearts: 3, scoring: 'default' },
  daily: { id: 'daily', levelSource: 'daily', hearts: 3, seeded: true }, // exists today
  zen: { id: 'zen', hearts: Infinity }, // no fail state
  hard: { id: 'hard', hearts: 1 },
  kids: { id: 'kids', rules: { namesUnderItems: true, memorizeS: +2 } },
  timeAttack: { id: 'timeAttack', rules: { questionS: 5, timeBonus: true } },
  endless: { id: 'endless', levelSource: 'endless' },
};
```

`dailyEnabled` (today's single flag) becomes one entry; the menu renders a mode selector from this
map. A mode may change the level source, hearts, scoring and rules — but never the engine.

### 16.4 Storage save **v2** (with v1 migration)

```
game:memory-quiz:save → {
  version: 2,
  best:    { score, bestStreak },              // legacy global record, kept for back-compat
  levels:  { 'l1': { best: {score,bestStreak}, stars, clears }, … },
  unlocks: { 'l2': true, … },
  meta:    { xp, achievements: {…} },           // Phase C
  history: [{ score, boards, mode, level, ts } …≤20],
  prefs:   { muted, pack, mode },
}
```

- `migrateV1(save)` runs when `version === 1`: wraps the global best into `levels` under the
  campaign's first level, seeds `unlocks` from `clears`, keeps `history`/`prefs`. Reads of v1 docs
  never lose data; the write path bumps to v2 (idempotent, like games 02/03).
- New _namespaced_ keys for future extras stay inside this doc, not new top-level keys.

### 16.5 Scoring, stars and unlock rules (data, not branches)

- `scoreFor(level, outcome, { streak, timeLeftMs, boardPerfect, mode })` — defaults reproduce
  today's formula exactly (so existing bests stay comparable); per-level/per-mode overrides are
  fields, and a `timeBonus`/`perfectBoard` term is opt-in per level.
- `starsFor(level, run)` (0–3) and `unlock: { requires: { levelId, stars } }` are **level data**;
  the menu reads them to render locks. A host can override unlocks via config (see §16.6).

### 16.6 Config / host surface (no forking)

```js
window.__MEMORY_QUIZ_CONFIG__ = {
  locale: 'fr',
  flags: { dailyEnabled: true, modeZen: true, levelsUnlocked: 'all' | 'progress' },
  unlocks: { l1: true, l7: true }, // host-granted levels (e.g. an in-app upsell)
  strings: { fr: { levels: { l1: 'Fête des pizzas' }, share: '…{level}…' } },
  telemetry: { event(name, payload) {} }, // optional, host-injected; default = no-op, no network
};
```

Same chain as today (host → `?locale=` → defaults). Telemetry stays a **host-injected no-op seam**;
the game itself still posts nothing (README §7 isolation holds).

### 16.7 Rendering at scale (the only genuinely new engineering)

- Keep DOM buttons (a11y, keyboard, 1-tap) as the default strategy up to `MAX_CELLS` (≈30–40).
- Add a `renderStrategy` seam: `dom` (today) and, only if the owner wants 6×5+ grids or photo packs
  with animation, a `canvas` strategy behind the same `renderBoard(ctx)` interface.
- Density breakpoints in `style.css`: cell size from `clamp()` on a `--cols`-aware token; item glyph
  scaling per cell count; cap grid height so the play screen never scrolls (the current 360 px
  acceptance test extends to the biggest level as a **hard gate**).

### 16.8 i18n & a11y per extension

- `LOCALES` (`core.js:265`) grows; level labels live in `config.strings.<locale>.levels.<id>`.
- Every question type ships its own `announce()` and cell-label rules; the level picker is a
  keyboard/SR-first radiogroup with lock state announced ("Level 4, locked — earn 2 stars on Level 3").

## 17. Roadmap — four shippable phases

Each phase ends with the master README §5 QA gate + jest/harness/E2E green, and leaves v1 saves readable.

### Phase A — Levels become data (the "any level" foundation) · ✅ BUILT 2026-09-12

1. `data/levels.js` with the 3 current tiers expressed as curated level rows (ids `l01…l3`+) and
   `levelFor()`; `core.js` reads specs instead of the parallel arrays (G1, G2, G5).
2. Per-level `memorizeS`/`questionS`/`points` (G5, G6) with defaults equal to today's values.
3. Save **v2** + `migrateV1` + per-level records/unlocks (G8) — migration tested, and the
   migrated save is **persisted on first read** (durable version bump).
4. Menu level picker (campaign list, records, locked/unlocked, 1-tap entry) (G12).
5. Tests: ladder invariants, migration round-trip, per-level bests, level-picker a11y.

### Phase B — Content & rules plug in · ✅ BUILT 2026-09-12

6. Question-type registry + move `where`/`missing` into it (G3, G4, G10).
7. Two new types as proof: **swap** (two items silently exchange — "where is it now?"; grids are fully filled so nothing moves into a blank, §9 P3)
   and **oddOne** ("which snack was NOT on the board?" — the deliberate inverse of the missing
   rule) — each with invariants + announce.
8. Mode registry: zen / hard / kids / time-attack on top of classic + daily (G9, §16.3); kids adds
   names under items and a memorize bonus; time attack tightens the window and pays a time bonus.
9. Pack schema v2 groundwork: packs sized to 14 items with level-aware `lintPacks(packs, levels,
types)` (G11) — actual photo packs remain the owner's deferred decision (§11).
10. Tests: every type × level × 100 seeds invariants; mode matrix; per-kind pack lint.

### Phase C — Ladder & meta depth · ✅ BUILT 2026-09-12 (meta kept local)

11. Curated campaign of **30 levels** (three bands of ten — Easy 1–10: 4 blocks, Medium 11–20: 6, Hard 21–30: 8; grids fully filled, no blank cells; owner request 2026-09-13) + `makeEndlessLevel()` with hard caps (≤ `MAX_CELLS`, ≤ pack
    spare budget, memorize floor) and rule unlocks — deterministic per position (L2).
12. Stars (+perfect = no hearts lost), per-level records, campaign star total on the menu; share
    text per level (`shareLevel`); history tagged with mode + level.
13. Tests: endless generator bounds (never an invalid spec), star math, XP reserved (not built —
    D7 kept it out until wanted).

### Phase D — Scale & polish (owner-triggered, NOT built)

14. Canvas render strategy + confetti (§9 P3) if grids exceed the DOM cap (`MAX_CELLS = 40`).
15. Photo-pack builder tool (the "Library Builder"-style idea recorded in §11) and i18n expansion.
16. Gated leaderboards/analytics **only** if the owner reverses the isolation decision (README §7).

## 18. Test & QA contract for every future upgrade

A change is not "level-ready" unless:

1. **Ladder invariants** hold for every level: `cols×rows ≥ items`, `items + candidates − 1 ≤ pack
size`, grid ≤ `MAX_CELLS`, timers ≥ floors; no duplicate level ids; ids stable.
2. **Question-type invariants** run for every registered type × level × ≥100 seeds (the registry
   makes this a loop, not a per-type chore).
3. **Save migrations** are tested one version at a time (v1→v2→…), with corrupt/lossy inputs, and
   never drop a record.
4. **E2E/gui matrix**: the current 48-check Playwright session runs per mode (at minimum classic +
   daily + each new mode), still at 360 px with no scroll, for the **largest** level.
5. **Harness parity**: `core.test.html` gains the same assertions (CI twin, no build step).
6. **Isolation**: `fetch(`/`/api/`/external imports still come up empty in the game folder.

## 19. Decisions needed from the owner (D1–D7 — resolved by the Phase A–C builds; kept for the record)

| #   | Decision                            | Options (recommendation in bold)                                                                       | Why it matters                                           |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| D1  | What is a "level"?                  | **curated campaign rows (8–12) + optional endless generator** · only curated · only endless            | Sets ids, unlock UX and storage shape                    |
| D2  | Unlock policy                       | **progress (stars/score) with a host override to open everything** · all unlocked · progress-only      | Menu lock rendering + config surface                     |
| D3  | Level boards randomness             | **random per attempt, daily stays seeded** · seeds per level (like a puzzle set)                       | Whether a level can be "learned" or must be played fresh |
| D4  | Difficulty source for growth        | **timers + grid + question mix + rule unlocks (swap/naming), capped by pack size** · new art per level | Keeps the zero-asset rule and the packs/bits we have     |
| D5  | Photo/image packs                   | **stay deferred (§11) until Phase D** · build now                                                      | Extra schema + render strategy + asset policy            |
| D6  | Modes scope                         | **classic, daily, zen, hard, kids, time-attack** · smaller                                             | Menu complexity vs replayability                         |
| D7  | Meta (XP/achievements/leaderboards) | **XP + local achievements, no network** · skip meta · gated backend                                    | Stays inside isolation unless reversed                   |

## 20. Guardrails (non-negotiable)

- **v1 saves are never lost** — migrations are additive and read-compatible forever.
- **Isolation holds** — no site links, no analytics, no network; telemetry only as an injected no-op seam.
- **Zero assets / zero build step** by default (photo packs are an explicit Phase D owner decision).
- **The pure core stays pure** — new rules/questions/levels go in `data/` + registries; `game.js`
  remains a thin shell.
- **Each phase keeps P0–P2 acceptance green** (README §5) before the next one starts.

## 21. Enhancement spec record — suggestion pass (folded 2026-09-16)

> Folded from `plan/suggestion/08` (retired; full original two-task spec in git history). This
> document was already that spec's canonical doc per its header.

Task 1 (level ladder) and Task 2 (Mystery Shuffle) shipped as specified — Task 1 earlier
(`122c601`/`b09cc28`) with naming that supersedes the spec sketch: 30 levels in 2×2/3×2/4×2
bands, stars from hearts (`starsFor`), `levelFor`/`levelUnlocked`/`nextLevelId` in
`data/levels.js`, save v2. Task 2 (commit `9649935`): `drawShuffleCards` samples 6 unique
level×mode cards from unlocked levels (deterministic rng, no duplicate pairs); the shuffle screen
flips cards permanently per session; Play starts the level under the card mode's hearts + rules
(`levelSource: 'campaign'` so results write to the same `levels[id]` record); run end returns to
the grid with refreshed stars; zen cards no longer NaN the star calc. Verified 2026-09-15:
`levelUnlocked`, `drawShuffleCards` ("Mystery Mix draw"), and the save v1→v2 migration are pinned
by `games-memory-quiz.test.ts` (all 8 games suites green, 343 tests); live pass confirmed the 🃏
Mystery Mix menu entry and prefs persistence across reloads. The campaign level-picker tiles
could not be click-through in the automation session (recurring in-app-browser guest instability)
— the suites remain the verification of record for the picker/shuffle flow.

## 22. QA fix record (was TASK-24/25/26 — resolved 2026-09-22, commit `bf55e38`+)

- **Grid answers tappable** — answer interaction fixed on all grid tiers (was QA TASK-24).
- **Swap reveal order** — the reveal shows the exchange correctly (was QA TASK-25).
- **Level-clear focus crash** — the end-of-level focus handoff no longer throws (was QA TASK-26).
- Verification: E2E 39/39. Residual owner step (every game): the 10-minute phone session at
  360 px — tracked in QA-FINDINGS as HARD-06.
