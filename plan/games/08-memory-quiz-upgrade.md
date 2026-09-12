# Game 08 — Memory Quiz: Future-Proof Upgrade Plan

> Owner request (2026-09-12): _"proper future proof plan that can be upgraded to any level."_
> This document is the **extension architecture** for `apps/frontend/public/games/memory-quiz/`.
> It is additive to `08-memory-quiz.md` (the build plan, P0–P2 shipped) and obeys the master
> `README.md` conventions (§5 QA gate, §7 isolation, Rev 2 architecture).
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

---

## 1. What "upgraded to any level" has to mean

Three readings, all covered by this plan (they are not mutually exclusive):

| #   | Reading                                                                        | Structural requirement                                                                                                        |
| --- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| L1  | **Player-facing levels** — pick/enter any level, see records, unlock as you go | Level descriptors are **data**, the menu is a level picker, records/unlocks persist                                           |
| L2  | **Unbounded difficulty** — the ladder does not stop at 3 tiers                 | A level is a **spec** (grid, items, questions, timers, rules); higher levels are new data rows or a generator, never new code |
| L3  | **Extensible content & rules** — new question types, packs, modes              | Question types, packs and modes are **registries** the engine iterates; adding one never edits the state machine              |

---

## 2. Current architecture (verified 2026-09-12) and what is already future-proof

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

---

## 3. Gap analysis — the hardcoded assumptions that block "any level"

Everything below is index-parallel data tuned for exactly three tiers. These are the specific
places to change; no other module needs rewriting.

| #   | Location            | Hardcoded today                                                                                          | Needed                                                                                           |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----- | ------------------------------------------------------------------------------- |
| G1  | `core.js:34-43`     | `GRID_TIERS` / `ITEMS_PER_TIER` / `QUESTIONS_PER_TIER` / `CANDIDATES` are 4 parallel 3-element arrays    | One `LEVELS` array of self-contained specs                                                       |
| G2  | `core.js:50`        | `tierFor(boardNumber)` → 1–2 / 3–5 / 6+, capped at 2                                                     | `levelFor(run)` over the ladder (explicit rows, or a generator for endless)                      |
| G3  | `core.js:147`       | `pickQuestions` hardcodes the mix (`whereCount = questions − (tier ≥ 1 ? 1 : 0)`) and the two kinds      | Question **composition per level** + a question-type registry                                    |
| G4  | `core.js:214`       | `resolveAnswer` branches `if (kind === 'where' … else missing)`                                          | Registry: each type resolves itself (incl. its own truth reveal)                                 |
| G5  | `core.js:58`        | `memorizeWindowS` is one global ramp + floor                                                             | Per-level `memorizeS` (or ramp params) in the spec                                               |
| G6  | `core.js:203`       | `pointsFor` uses global `BASE_POINTS` / `STREAK_BONUS` / `MAX_POINTS`                                    | Scoring hooks: defaults + per-level/per-mode overrides (time bonus, perfect board)               |
| G7  | `core.js:274`       | `lintPacks` minimums are emoji-tier math (`≥ 8`, spares for 8+3)                                         | Per-kind validators + limits derived from the level ladder's max demands                         |
| G8  | `storage.js:17-20`  | One global `best` + `history`; no unlocks, no per-level records, no meta                                 | Save **v2**: per-level records/unlocks/XP + v1→v2 migration                                      |
| G9  | `config.js:20`      | Only `dailyEnabled`                                                                                      | Flags per mode/level, level-lock policy, host unlock injection, CTA/telemetry seams              |
| G10 | `game.js:227-330`   | State machine knows exactly two question kinds and one flow; UI is hardcoded to hearts/score/board chips | `renderQuestion(ctx)`/`announce` per type; HUD composed from the active mode's spec              |
| G11 | `data/packs.js`     | Emoji-only items; single difficulty                                                                      | Pack `kind` (`emoji                                                                              | image | shape`) + optional `difficulty`/tags (photo packs are plan §11's deferred item) |
| G12 | menu (`index.html`) | Pack chips, ▶ Start, daily button — no level surface                                                     | Level picker (locked/unlocked/records) + mode selector                                           |
| G13 | grid CSS            | Fixed `min(92vw/cols, 88px)` cell sizing; 20-cell max in practice                                        | Density breakpoints + a documented cell-count cap and/or canvas render seam for very large grids |

---

## 4. Target architecture — the extension contracts

### 4.1 `data/levels.js` — the ladder (the core of L1+L2)

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
- grid caps: `cols × rows ≤ MAX_CELLS` (recommend 30 with the DOM renderer; see §4.7);
- memorize floor (3 s) and question-window floor are enforced by the resolver;
- level ids are stable strings — they are storage keys, never array indices.

### 4.2 `data/questions.js` — question-type registry (L3)

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

### 4.3 `data/modes.js` — modes as data (L1+L3)

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

### 4.4 Storage save **v2** (with v1 migration)

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

### 4.5 Scoring, stars and unlock rules (data, not branches)

- `scoreFor(level, outcome, { streak, timeLeftMs, boardPerfect, mode })` — defaults reproduce
  today's formula exactly (so existing bests stay comparable); per-level/per-mode overrides are
  fields, and a `timeBonus`/`perfectBoard` term is opt-in per level.
- `starsFor(level, run)` (0–3) and `unlock: { requires: { levelId, stars } }` are **level data**;
  the menu reads them to render locks. A host can override unlocks via config (see §4.6).

### 4.6 Config / host surface (no forking)

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

### 4.7 Rendering at scale (the only genuinely new engineering)

- Keep DOM buttons (a11y, keyboard, 1-tap) as the default strategy up to `MAX_CELLS` (≈30–40).
- Add a `renderStrategy` seam: `dom` (today) and, only if the owner wants 6×5+ grids or photo packs
  with animation, a `canvas` strategy behind the same `renderBoard(ctx)` interface.
- Density breakpoints in `style.css`: cell size from `clamp()` on a `--cols`-aware token; item glyph
  scaling per cell count; cap grid height so the play screen never scrolls (the current 360 px
  acceptance test extends to the biggest level as a **hard gate**).

### 4.8 i18n & a11y per extension

- `LOCALES` (`core.js:265`) grows; level labels live in `config.strings.<locale>.levels.<id>`.
- Every question type ships its own `announce()` and cell-label rules; the level picker is a
  keyboard/SR-first radiogroup with lock state announced ("Level 4, locked — earn 2 stars on Level 3").

---

## 5. Roadmap — four shippable phases

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
7. Two new types as proof: **swap** (two items silently exchange — "where is it now?"; grids are fully filled so nothing moves into a blank, plan §9-P3)
   and **oddOne** ("which snack was NOT on the board?" — the deliberate inverse of the missing
   rule) — each with invariants + announce.
8. Mode registry: zen / hard / kids / time-attack on top of classic + daily (G9, §4.3); kids adds
   names under items and a memorize bonus; time attack tightens the window and pays a time bonus.
9. Pack schema v2 groundwork: packs sized to 14 items with level-aware `lintPacks(packs, levels,
types)` (G11) — actual photo packs remain the owner's deferred decision (plan §11).
10. Tests: every type × level × 100 seeds invariants; mode matrix; per-kind pack lint.

### Phase C — Ladder & meta depth · ✅ BUILT 2026-09-12 (meta kept local)

11. Curated campaign of **30 levels** (three bands of ten — Easy 1–10: 4 blocks, Medium 11–20: 6, Hard 21–30: 8; grids fully filled, no blank cells; owner request 2026-09-13) + `makeEndlessLevel()` with hard caps (≤ `MAX_CELLS`, ≤ pack
    spare budget, memorize floor) and rule unlocks — deterministic per position (L2).
12. Stars (+perfect = no hearts lost), per-level records, campaign star total on the menu; share
    text per level (`shareLevel`); history tagged with mode + level.
13. Tests: endless generator bounds (never an invalid spec), star math, XP reserved (not built —
    D7 kept it out until wanted).

### Phase D — Scale & polish (owner-triggered, NOT built)

14. Canvas render strategy + confetti (plan §9-P3) if grids exceed the DOM cap (`MAX_CELLS = 40`).
15. Photo-pack builder tool (the "Library Builder"-style idea recorded in plan §11) and i18n expansion.
16. Gated leaderboards/analytics **only** if the owner reverses the isolation decision (README §7).

---

## 6. Test & QA contract for every future upgrade

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

---

## 7. Decisions needed from the owner (before Phase A starts)

| #   | Decision                            | Options (recommendation in bold)                                                                       | Why it matters                                           |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| D1  | What is a "level"?                  | **curated campaign rows (8–12) + optional endless generator** · only curated · only endless            | Sets ids, unlock UX and storage shape                    |
| D2  | Unlock policy                       | **progress (stars/score) with a host override to open everything** · all unlocked · progress-only      | Menu lock rendering + config surface                     |
| D3  | Level boards randomness             | **random per attempt, daily stays seeded** · seeds per level (like a puzzle set)                       | Whether a level can be "learned" or must be played fresh |
| D4  | Difficulty source for growth        | **timers + grid + question mix + rule unlocks (swap/naming), capped by pack size** · new art per level | Keeps the zero-asset rule and the packs/bits we have     |
| D5  | Photo/image packs                   | **stay deferred (plan §11) until Phase D** · build now                                                 | Extra schema + render strategy + asset policy            |
| D6  | Modes scope                         | **classic, daily, zen, hard, kids, time-attack** · smaller                                             | Menu complexity vs replayability                         |
| D7  | Meta (XP/achievements/leaderboards) | **XP + local achievements, no network** · skip meta · gated backend                                    | Stays inside isolation unless reversed                   |

---

## 8. Guardrails (non-negotiable)

- **v1 saves are never lost** — migrations are additive and read-compatible forever.
- **Isolation holds** — no site links, no analytics, no network; telemetry only as an injected no-op seam.
- **Zero assets / zero build step** by default (photo packs are an explicit Phase D owner decision).
- **The pure core stays pure** — new rules/questions/levels go in `data/` + registries; `game.js`
  remains a thin shell.
- **Each phase keeps P0–P2 acceptance green** (README §5) before the next one starts.
