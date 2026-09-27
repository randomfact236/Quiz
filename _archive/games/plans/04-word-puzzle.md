# Game 04 — Word Puzzle (Complete Plan)

> Complete plan (supersedes the 2026-09-09 sample). Status: **Built** (P0–P2 complete;
> re-synced with the implementation 2026-09-13 — see §12.1)
> 2026-09-11) — full game in `apps/frontend/public/games/word-puzzle/`
> (core.js/game.js/style.css + `data/themes.js`), jest suite + `core.test.html` green
> (incl. the 100-seeds-per-level generator proof and data lint), browser smoke test
> covered drag / tap-tap / keyboard paths, hints, stars, progress and the
> theme-complete flow; P3 extras (daily puzzle, confetti, more themes) deferred.
> Interpretation decided: **word search** (master README §8 #1–2). Slug `word-puzzle`;
> folder `apps/frontend/public/games/word-puzzle/`.

## 1. Overview

Themed word search: drag a line through letters to find hidden words; correct finds lock
in with colored highlights, wrong picks flash red. Hook: 3-star levels and the daily
seed (P3) that gives everyone the same puzzle.

## 2. Complete game spec

- **Content:** 4 themes (Animals 🦁, Food 🍎, Tech 💻, Space 🚀) × 3 levels, shipped as
  static `data/themes.js` (schema §5) — a JS module on purpose: the game imports it
  statically, which works on every module-capable browser, whereas a JSON-module import
  fails on Safari < 17.2 / Firefox < 128. English, lowercase, 4–9 letters, no spaces,
  no duplicate words within a level.
- **Grid tiers:** L1 = 8×8, 5 words, directions {→, ↓}; L2 = 10×10, 7 words,
  - {↘, ↗}; L3 = 12×12, 10 words, all 8 directions incl. reversed.
- **Selection:** pointerdown on a cell anchors; pointermove samples cells via
  `document.elementFromPoint`, snapped to the grid; a valid drag follows one of the 8
  direction vectors in a straight line. Live highlight while dragging; on release:
  - Letters match an unfound word (or its reverse where reversed dirs are on) → **locked**
    in the word's color, struck off the list, +pop animation. ✅
  - Otherwise → red flash 300 ms, **wrong picks +1**, selection clears. ❌
- **Hints:** 3 per level; a hint rings the first letter of a random unfound word.
- **Stars:** ⭐ finish the level · ⭐ time ≤ par · ⭐ `hintsUsed === 0 && wrongPicks ≤ 2`.
- **Par times:** L1 90 s · L2 150 s · L3 240 s (per level data, tunable).
- **Level flow:** complete → result overlay → next level → theme complete → badge.
  Progress persisted per level (§5).

## 3. Generator (pure, deterministic)

`generateLevel(levelData, seed)` using `mulberry32(seed)`:

1. Sort words longest-first. For each word: try up to 200 random placements
   (random direction from the tier's set, random start cell) — legal if in bounds and
   every cell is empty or holds the same letter (shared-letter crossings allowed).
2. If a word fails 200 attempts → restart the whole level (max 20 restarts, then throw —
   data bug, must never ship).
3. Fill empty cells from a letter bag: 60 % weighted toward the level's own letters,
   40 % uniform A–Z (keeps grids solvable-feeling and dense).
4. Return `{ grid, placements: [{word, row, col, dir}], seed }`.

## 4. Screens & UI

| State    | Elements                                                                                     |
| -------- | -------------------------------------------------------------------------------------------- |
| `menu`   | Theme cards (emoji, name, stars x/9, badge when complete), Continue banner, mute toggle      |
| `level`  | Letter grid + word list (chips; found = struck, colored), HUD: timer, hint stars, [Hint] [⌂] |
| `result` | Overlay: time, stars, words found, [Next level] [Replay] [📤 Share]; theme-complete variant  |

Word list sits below the grid at phone width (side-by-side ≥ 768 px). Grid cells sized
`min(92vw, 100% / size)`; touch highlight uses per-word colors from a fixed 10-color
accessible palette (4.5:1 on white).

## 5. Data model

```
data/themes.js (default export):
{ "themes": [ { "id": "animals", "name": "Animals", "emoji": "🦁",
    "levels": [ { "size": 8, "parSec": 90, "words": ["LION","ZEBRA", …] }, … ] }, … ] }

localStorage:
game:word-puzzle:progress  → { "<themeId>:<lvl>": { stars: 0-3, bestTimeMs: 84200 } }
game:word-puzzle:prefs     → { muted: false }
```

## 6. File structure & function inventory

```
word-puzzle/
  index.html
  style.css        # grid, highlight pills, flash animations
  core.js          # generator + validation (pure, seeded) — test surface
  game.js          # input, rendering, timer, stars, persistence
  data/themes.js
```

`core.js` exports: `mulberry32(seed)`, `generateLevel(level, seed)`, `lineCells(grid,
start, end) → cells | null` (8-direction check), `lettersAt(grid, cells) → string`,
`matchesWord(letters, word, allowReverse)`, `starsFor(parSec, timeSec, hintsUsed,
wrongPicks)`. `game.js`: pointer/tap-tap/keyboard input, highlight rendering, timer,
progress, share.

## 7. Edge cases

1. Diagonal reverse drags (e.g. ↙ when reversed on) must validate as the word reversed.
2. Drag that leaves the grid → clamp to last valid cell; release outside → evaluate.
3. Re-finding a found word → counts as correct-but-noop (no star penalty, no duplicate).
4. Wrong selection on cells that partially spell a word (prefix) → still wrong (full
   word required) — documented in-game via the red flash.
5. Tap-tap mode: first tap anchors (cell pulses), second tap submits; tapping the anchor
   again cancels.
6. Keyboard: arrows move focus; Enter anchors/submits; grid is one tab stop (roving
   focus), `aria-label` per cell = "row r column c, letter X"; word chips labeled
   "word k, N letters" (never the word itself).
7. `visibilitychange` pauses the timer; level restarts only via user action.
8. Storage disabled → progress not saved, everything else works.

## 8. Testing plan (core.js)

- Seeded determinism: same seed → identical grid/placements (snapshot).
- Every word present in `placements`, within the tier's allowed directions.
- Generated grid: all placements verified by `lineCells` + `lettersAt` round-trip.
- Generator termination: 100 seeds per shipped level, zero throws.
- `lineCells`: 8 directions, out-of-bounds, non-collinear → null.
- `matchesWord`: exact, reverse (allowed vs not), case handling.
- `starsFor`: boundary table (par ±1 s, hints 0/1, wrong 2/3).

## 9. Task breakdown

### P0 — playable core

- [x] `core.js`: mulberry32, generateLevel, lineCells, lettersAt, matchesWord + tests
- [x] Grid rendering + drag selection with live highlight and correct/wrong resolution
- [x] Word list check-off, level timer, win detection, next-level flow

### P1 — full rules & feel

- [x] 4 themes × 3 levels data (`themes.js`) + data lint (lengths, dupes, charset)
- [x] Reversed directions at L3; hints; star rating; color pills; red flash; pop anim
- [x] Progress persistence + Continue; sound blips + mute

### P2 — persistence/share/QA

- [x] Tap-tap + full keyboard path; a11y labels (§7.5–7.6)
- [x] Share text (`{words} words in m:ss · ⭐⭐⭐`); QA gate (master README §5)
      (browser smoke test at 390×844 covered seeded drags, tap-tap branches, keyboard,
      hints, stars, persistence, theme completion + lint harness; a human 10-minute
      session is still owed before calling it player-proof)

### P3 — polish

- [ ] Daily puzzle (seed = `YYYYMMDD` hash → same grid for everyone, share-friendly);
      confetti on theme completion; more themes _(deferred — verified still absent
      2026-09-13; the `?seed=`/`?theme=`/`?level=` QA hook ships the
      deterministic-generator half)_

## 10. Acceptance criteria

- §8 tests green; every shipped level solvable and every word placeable (generator proof).
- Wrong picks never permanently mark letters; found letters stay locked.
- Drag usable at 360 px without zoom; grid + chips visible during a drag.
- Seeded daily mode reproduces identical grids across reloads.

## 11. Deferred coupling (intentionally NOT built)

Riddle/content-pipeline integration (backend word lists), footer/nav links, analytics
events, achievements — per master README §7.

## 12. Rev 2 architecture upgrade (2026-09-11) — reference: `03-sliding-puzzle.md`

> Owner-approved architecture reference for all games (Sliding Puzzle Rev 2), applied
> per this game's nature: word search is already data-driven (`themes.json`) and seeded
> (`mulberry32` + the `?seed=` hook), so its Rev 2 is persistence hygiene plus
> **promoting the daily/seed features that make async multiplayer natural**.

### Target file layout (additions to the shipped trio)

```
word-puzzle/
  index.html
  style.css
  core.js         # generator + validation (unchanged)
  game.js         # UI shell (unchanged behavior)
  config.js       # flags (dailyEnabled) + per-locale strings (share template, hint copy,
                  # theme-complete lines); host-overridable
  storage.js      # guarded facade: versioned progress + prefs + migrations,
                  # remote adapter slot (host-injected only)
  data/themes.js
```

### config.js

Per-locale strings (share template, hint wording, toasts, theme-complete lines).
(The placeholder `dailyEnabled` flag was removed 2026-09-12 — daily stays deferred with
P3; strings extraction completed 2026-09-12.) Host override
`window.__WORD_PUZZLE_CONFIG__` → `?locale=` →
defaults. `prefs` may override copy but is a cache, not the source of truth.

### storage.js facade

Versioned progress record — `{ version, levels: { "<theme>:<lvl>": {stars, bestTimeMs} },
prefs }` — migrated from the loose per-level keys. Remote adapter slot reserved for
future account sync of stars/progress — the game never checks auth; **guests keep full
local persistence**. Mid-round resume: N/A (levels are short; stars already persist).

### Multiplayer (per this game's nature)

- **Async seeded race — the natural fit; promote from P3:** the generator is already
  deterministic (`generateLevel(level, seed)`, `?seed=` hook ships). Daily seed
  (`YYYYMMDD`) = everyone gets the same grid; a shared seed link = challenge a friend;
  compare time/stars. Hot-seat: pass the device per level.
- Live co-op/race: **gated** — backend + §7 reversal. Not planned.

### Phases

- [x] R2-1 Hygiene (2026-09-11; strings completed 2026-09-12): `config.js` (locale,
      share template + hint/toast/theme-complete copy, host-overridable) + `storage.js`
      (versioned `save` document — levels + prefs — migrated from the loose
      progress/prefs keys, corrupt entries sanitized, remote adapter slot); strings
      moved out of `game.js`; 43 tests green.
- [x] R2-2 (partial 2026-09-11): the deterministic generator + `?seed=` hook ship; the
      full daily UI (menu entry + per-day record, seed = `YYYYMMDD`) remains deferred
      with P3 (the placeholder `dailyEnabled` flag was removed 2026-09-12 until the
      mode ships).
- [ ] R2-3 Content: more themes via the data module (**shipped as `data/themes.js`**,
      not `themes.json` — ESM on purpose per §2); confetti polish. Still deferred.

## 12.1 Implementation sync (2026-09-13) — deviations of code from the text above

- **Data file is `data/themes.js`** (ESM module, §2's own decision) — every
  `themes.json` mention in this plan and in core.js comments means that file.
- **Storage is the Rev 2 versioned facade:** `game:word-puzzle:save` v1
  (`{version, levels, prefs:{muted}}`); the §5 loose `:progress`/`:prefs` keys are
  legacy migration inputs, deleted after migration. Remote adapter slot shipped.
- **Tests:** 32 jest cases (an earlier "43 tests" note here was stale) + the
  in-folder `core.test.html` browser harness.
- **Share template** extended beyond §9's sketch: "I found {words} words in {time} ·
  {stars} in Word Puzzle — can you beat it? {url}" (config.js).
- **Input paths all ship:** drag (elementFromPoint sampling), tap-tap anchor/submit,
  keyboard (arrows + Enter/Space/Escape, roving tabindex), plus `?seed=`/`?theme=`/
  `?level=` QA hooks and 3-hint rings.
- **Result overlay** also has a ⌂ Menu button (§4 lists Next/Replay/Share).
- **Stars formula:** finish + ≤par + (no hints and ≤2 wrong picks).

---

## Enhancements pass — shipped 2026-09-13, verified 2026-09-15

> Folded 2026-09-16 from `plan/suggestion/03` (multi-game spec, retired; full text in git history).

Items 1–3 shipped (commit `25a754e`): live invalid-direction drag state via the same `lineCells`
call as release-time, a first-hint star-cost toast (session flag), and a theme-complete strip
powered by core.js `themeSummary` (other themes shown ×/9, tap = first unsolved level).
Verified 2026-09-15: `lineCells`/`themeSummary` pinned by the suite (all 8 games suites green,
343 tests).
