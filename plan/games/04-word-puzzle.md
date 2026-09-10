# Game 04 — Word Puzzle (Complete Plan)

> Complete plan (supersedes the 2026-09-09 sample). Status: **not started** — build-ready.
> Interpretation decided: **word search** (master README §8 #1–2). Slug `word-puzzle`;
> folder `apps/frontend/public/games/word-puzzle/`.

## 1. Overview

Themed word search: drag a line through letters to find hidden words; correct finds lock
in with colored highlights, wrong picks flash red. Hook: 3-star levels and the daily
seed (P3) that gives everyone the same puzzle.

## 2. Complete game spec

- **Content:** 4 themes (Animals 🦁, Food 🍎, Tech 💻, Space 🚀) × 3 levels, shipped as
  static `data/themes.json` (schema §5). English, lowercase, 4–9 letters, no spaces,
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
data/themes.json:
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
  data/themes.json
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

- [ ] `core.js`: mulberry32, generateLevel, lineCells, lettersAt, matchesWord + tests
- [ ] Grid rendering + drag selection with live highlight and correct/wrong resolution
- [ ] Word list check-off, level timer, win detection, next-level flow

### P1 — full rules & feel

- [ ] 4 themes × 3 levels data (`themes.json`) + data lint (lengths, dupes, charset)
- [ ] Reversed directions at L3; hints; star rating; color pills; red flash; pop anim
- [ ] Progress persistence + Continue; sound blips + mute

### P2 — persistence/share/QA

- [ ] Tap-tap + full keyboard path; a11y labels (§7.5–7.6)
- [ ] Share text (`{words} words in m:ss · ⭐⭐⭐`); QA gate (master README §5)

### P3 — polish

- [ ] Daily puzzle (seed = `YYYYMMDD` hash → same grid for everyone, share-friendly);
      confetti on theme completion; more themes

## 10. Acceptance criteria

- §8 tests green; every shipped level solvable and every word placeable (generator proof).
- Wrong picks never permanently mark letters; found letters stay locked.
- Drag usable at 360 px without zoom; grid + chips visible during a drag.
- Seeded daily mode reproduces identical grids across reloads.

## 11. Deferred coupling (intentionally NOT built)

Riddle/content-pipeline integration (backend word lists), footer/nav links, analytics
events, achievements — per master README §7.
