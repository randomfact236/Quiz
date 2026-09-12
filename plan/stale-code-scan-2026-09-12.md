# Stale Code Scan — 2D Games (2026-09-12)

> Scan-and-record pass only. **No code was changed.** Scope: the 2D games feature only
> (explicitly requested by the owner), per `AGENTS.md`'s isolation exception.
>
> **Feature list source of truth:** `plan/games/README.md` (§1 status table) + per-game
> plans `plan/games/01…07-*.md`. Feature naming below matches those docs.
>
> **Method:** each game folder was audited against its plan doc in full. For every
> finding, the "reference universe" is the game folder itself + its jest suite
> (`apps/frontend/src/__tests__/games-*.test.ts`) + in-folder `*.test.html` harness —
> games are isolated by plan, so nothing else can consume their symbols. Every finding
> was verified by grep (per-symbol consumer search), file-reachability checks from
> `index.html`, CSS-selector vs HTML/JS cross-checks, storage-key reader/writer checks,
> hygiene sweeps (`console.log`, `TODO`/`FIXME`, `Date.now(`, `fetch(`/`/api/`,
> `localStorage` outside the facade), and git-history archaeology for pre-Rev-2
> remnants. Cross-cutting items (hub, plan previews, docs) were verified in the main
> pass. Spot re-verification of the highest-impact claims was done independently.
>
> **Confidence legend:** ✅ = confirmed unused (verified zero consumers/references);
> ⚠️ = likely unused (needs a second look before deleting).

---

## Consolidated totals

| Category                 | Count  | Findings                                                       |
| ------------------------ | ------ | -------------------------------------------------------------- |
| Dead                     | 20     | T1 T3 W1 W2 W3 W4 W5 W10 W11 W13 H1 H2 H3 H7 F1 F2 F4 P1 P3 P5 |
| Unused                   | 7      | T6 K4 H4 H9 F7 P13 P14                                         |
| Stale                    | 13     | K1 W8 W9 F5 F6 P11 P12 C3 C4 C5 C6 C7 C8                       |
| Half-used                | 6      | T4 K2 K3 F3 P8 P15                                             |
| Half-removed             | 3      | T5 H8 C1                                                       |
| Duplicate                | 9      | T2 S2 W6 W7 W12 H5 H6 P9 P10                                   |
| Half-implemented vs plan | 4      | S3 S4 C2 P2                                                    |
| **Total**                | **62** |                                                                |

- **Confirmed unused / safe to delete outright:** ~13 code findings (T1, T3, W2, W3, W4, W5, W10, W11, W13, H3, P3, P5, F5) + 2 stale comment fixes (T5, H8).
- **Confirmed but "merge" rather than "delete"** (one authoritative copy should win): 19 (T2, S2, W6, W7, W12, H2, H5, H6, K2, K3, H4, P6, P7, P9, P10, P11, P12, P13, P14).
- **Need owner decision:** ~18 (wired-or-deleted config seams, one migration-question, one likely bug P1, the sliding-puzzle Rev 2 gap, hub plumbing).
- **Informational / keep** (plan-sanctioned spec-of-record exports, documented-defensive branch): H9, F7, P16.
- **Stale docs/artifacts:** 6 (C3–C8).
- **Fully clean features:** none — all seven games have at least minor findings; no game had analytics/network leftovers, TODO/FIXME debris, or console.log remnants (all clean on those sweeps).

---

## Cross-cutting findings (hub, plan tooling, docs)

### C1 — Games hub `?api=` analytics plumbing is dead ✅ half-removed — needs owner decision

- **Files:** `apps/frontend/src/app/games/page.tsx:1-11` (header comment), `:40-45` (`gamesApiBase()`), `:62` (`?api=` appended to every game link).
- **Why flagged:** The Rev 2 commits (1594508, 0d412b6 — both titled "analytics removed") deleted every game's best-effort `game_played` POST, per plan/games/README §7. Grep across all 7 game folders shows **zero** consumption of an `api` URL param — games read only `?debug=1`, `?locale=`, `?seed=`, `?theme=`. The hub still appends `?api=<base>` "so each game's best-effort `game_played` beacon can find the analytics endpoint" (comment, lines 7-9) — describing behavior that no longer exists anywhere.
- **Confidence:** ✅ confirmed (grep: no `api` param read in any game; no analytics/fetch code in any game).
- **Recommendation:** needs owner decision — delete `gamesApiBase()` + the `?api=` suffix + the stale header paragraph (hub links become plain `/games/<slug>/`), or restore beacons if the isolation decision was reversed. Note the hub itself is **untracked** in git.

### C2 — Hub lists 2 of 7 built games ⚠️ half-implemented — needs owner decision

- **Files:** `apps/frontend/src/app/games/page.tsx:23-38` (`GAMES` array: only `tap-or-dont-tap`, `tic-tac-toe`).
- **Why flagged:** Five built games (sliding-puzzle, word-puzzle, hurdle-runner, flying-snake, spirit-runner) exist on disk and are committed, but are unreachable from the only hub surface. Plan README §7 says _no_ site links while isolation holds — so the hub's own existence is a local-only convenience; the 2/7 list matches neither "isolated" (hub exists) nor "complete" (5 missing).
- **Recommendation:** needs owner decision — complete the list, or treat the hub as frozen local scaffolding.

### C3 — Plan previews (html/pdf) stale for 4 games ✅ stale — regenerate

- **Files:** `plan/games/html/04…07*.html`, `plan/games/pdf/04…07*.pdf` (regenerated in commit `ade9e44`).
- **Why flagged:** `git log --oneline -- <md>` vs previews: plans 04/05/06/07 were edited **after** `ade9e44` by their Rev 2 commits (32dfcbc, 46639a7, 777bb20, eabb321). Plans 01/02/03 + README were last touched before `ade9e44` → their previews are current.
- **Recommendation:** regenerate (`node plan/games/build-html.mjs` + `build-pdf.mjs`) — matches README §6.

### C4 — AGENTS.md / .gitignore doc drift ✅ stale doc — needs owner decision

- **Files:** `AGENTS.md` (games section: "git-ignored" for `public/games/` and `src/app/games/`), `.gitignore:50-62`.
- **Why flagged:** `.gitignore` now carries an owner-exception (2026-09-11) committing **all seven** games; the hub `src/app/games/` is untracked-but-_not-ignored_. AGENTS.md still describes all games paths as git-ignored.
- **Recommendation:** owner decision — update AGENTS.md wording (owner-owned file; not edited in this pass).

### C5 — README §7 "CONFLICT TO RESOLVE" is resolved but still written open ✅ stale doc

- **Files:** `plan/games/README.md` §7 (lines 100-106).
- **Why flagged:** The block demands deletion of the two games' analytics POSTs. Verified done: `grep -rni "analytics|game_played|apiBase|/api/|fetch(|XMLHttpRequest|sendBeacon"` over all 7 folders → **0 hits** (Rev 2 commits 1594508, 0d412b6). The `app/play/page.tsx` half was already declared clean (2026-09-10).
- **Recommendation:** owner updates §7 to record the resolution (only remaining artifact of the conflict is C1).

### C6 — README §3 `shared/` utilities were never built ✅ stale doc — needs owner decision

- **Files:** `plan/games/README.md` §3 (table of `shared/storage.js`, `best-score.js`, `loop.js`, `input.js`, `audio.js`, `share.js`).
- **Why flagged:** `apps/frontend/public/games/shared/` does not exist; no game references `../shared/` (grep: 0 hits — the only mentions are prose comments, e.g. hurdle-runner `engine.js:17`). Rev 2 superseded the approach with **per-game** `config.js`/`storage.js` modules, which is what shipped.
- **Recommendation:** owner decision — rewrite §3 as historical / mark superseded-by-Rev-2, or schedule the extraction.

### C7 — README §1 status rows overstate Rev 2 completion ✅ stale doc — needs owner decision

- **Files:** `plan/games/README.md` §1 (rows 3, 5, 6, 7).
- **Why flagged:** Row 5/6 say "Rev 2 applied (config + versioned storage facade)" but hurdle-runner's and flying-snake's `config.js` is **imported by nothing** (H1/F1 — created by the Rev 2 commits but never wired); row 3 says "done" while plan 03's Rev 2 Phase 0 (config.js/storage.js/versioning) is entirely unchecked and missing (S3); row 7 claims a `storage.js` facade that **does not exist as a file** (P2 — inline in `main.js`).
- **Recommendation:** owner decision — finish Rev 2 for 03/05/06/07 or amend the status rows.

### C8 — Root `2d games plan.md` is a superseded brainstorm ✅ stale doc — informational

- **Files:** `2d games plan.md` (repo root).
- **Why flagged:** It predates the complete plans and contradicts the decisions log: game 1 "3 hearts" (built game has none), "Top 12% of players" (decision #3 → baked local percentile), "hand-drawn art + background music" (decision #7 → procedural art; no music shipped). README §1 supersedes it and only uses it as the original game list.
- **Recommendation:** needs owner decision — keep as historical (annotate), or fold its list into README and retire it.

---

## 1. Tap or Don't Tap (`plan/games/01-tap-or-dont-tap.md`)

### Findings

- **T1** `[tap-or-dont-tap/audio.js:21]` **dead** — `isMuted()` exported, zero consumers. Evidence: grep `isMuted` over folder + test → definition only; `game.js:38` imports only `{ blip, buzz, setMuted }`; test imports nothing from audio.js. Confidence: ✅. Recommendation: **delete**. Plan: §13 lists audio.js as "WebAudio + mute" — no getter mentioned.
- **T2** `[tap-or-dont-tap/storage.js:70]` **duplicate + dead** — `defaultSave()` never called; the save shape is built inline twice more (`storage.js:91-99`, `:119-132`). Evidence: grep `defaultSave` → single hit (definition). Confidence: ✅. Recommendation: **merge** — have loadSave's fallback call `defaultSave()` or delete it. Plan: no mention.
- **T3** `[tap-or-dont-tap/style.css:317]` **dead** — `#signal-surface.flash-yellow #signal-word` rule unreachable: decoys always carry `word: null` (`core.js:60`); words only on red/green Stroop traps (`core.js:72-74`); visibility driven only by `signalSpec.word` (`game.js:134-135`). Adjacent comment (`style.css:310-311`) contradicts the rule. Confidence: ✅. Recommendation: **delete**. Plan: §2 — decoys never word-bearing.
- **T4** `[tap-or-dont-tap/storage.js:172,183]` **half-used** — history fields `bestMs`, `rounds`, `ts` written every run, never read (only `h.score` is read, `game.js:110,309`; grep `h.rounds|h.bestMs|h.ts` → 0). `bestMs` **is** in the plan's history schema (§5); `rounds`/`ts` are not (plan says `date`). Confidence: ✅ (write-only). Recommendation: **needs owner decision** — keep `bestMs`, drop `rounds`/`ts` unless future features want them.
- **T5** `[src/__tests__/games-tap-or-dont-tap.test.ts:6]` **half-removed** — header comment claims "the same pure assertions ship in the game's own harness"; the folder contains no `*.test.html`. Evidence: `ls` folder → 7 product files only. Confidence: ✅. Recommendation: **fix the comment**. Plan: no in-folder harness required for game 01.
- **T6** `[tap-or-dont-tap/audio.js:26]` **unused** — `blip(freq, ms, type, whenSec = 0)`: no caller passes the 4th arg (game.js:188,192,196,216 — max 3); the "arpeggios" purpose has no call site. Confidence: ⚠️. Recommendation: **needs owner decision** (harmless param — keep or drop).

**Plan-contract drift (informational, not dead code — owner to reconcile code vs plan §2):** swap design (`SWAP_FROM_ROUND=12`+`SWAP_CHANCE=0.15` vs plan's fixed rounds 21-23, same name reused with different meaning), signal mix ratios flipped for rounds 1-9 and different for 10-14, `HISTORY_MAX=20` vs plan's "last 50" (×3 plan sites), feedback 400 ms without plan's "+250 ms blank" and hardcoded at 4 sites, config.js under-populated vs §13's copy scope (only `share` moved; menu/feedback/gameover copy hardcoded).

### Clean checks (all clean)

Analytics/network remnants 0; inline pre-Rev-2 storage/audio helpers 0 (modules imported properly); all 25 core.js + 6/7 storage.js exports consumed (the 7th, `setRemoteAdapter`, is the plan-sanctioned host seam); config.js fully consumed; index.html↔JS id mapping bijective (31/31); CSS classes/vars all consumed except T3; no console/TODO/FIXME/commented-out code; `performance.now()` only (the single `Date.now` stamps the unread `ts` field, T4); legacy-key migration matches plan §5's documented loose keys exactly; no deferred-feature stubs; no duplication between game.js and core.js.

---

## 2. Tic Tac Toe (`plan/games/02-tic-tac-toe.md`)

### Findings

- **K1** `[tic-tac-toe/storage.js:14-16,27-28,145-164]` **stale / migration risk** — the legacy migration reads a **single** key `game:tic-tac-toe:series` with colon-format setupKeys (`'1p:hard'`), but the plan's declared "spec of record" (§5 line 54; §12 line 158) specifies **per-mode loose keys** `game:tic-tac-toe:series:<modeKey>` with dash format (`'1p-easy'`). If the plan reflects the real pre-Rev-2 layout, the migration reads keys that never existed and silently orphans returning players' series. Git cannot adjudicate: the folder entered git in the Rev 2 commit itself (`0d412b6`, all files `A`) — no pre-Rev-2 blob exists. Confidence: ⚠️ (one of code/plan is wrong). Recommendation: **needs owner decision** — owner confirms the actual pre-Rev-2 layout; then remap the migration or correct plan §5/§12.
- **K2** `[tic-tac-toe/game.js:136]` **half-used** — `els.board.dataset.turn = mark` written every `renderTurn()`, read by nothing (grep `dataset.turn|data-turn` → only this line; CSS turn styling uses the separate `#turn`/`.turn[data-mark]` element). Confidence: ✅. Recommendation: **delete**. Plan: no mention.
- **K3** `[tic-tac-toe/core.js:69]` **half-used** — `roundOutcome()` returns `completedBy`, never read by any consumer (game.js uses `winner`/`line` only; all `completedBy` reads in both test surfaces are on `checkWinner()` results, not `roundOutcome`'s). Plan §6 specifies the outcome shape as `{ winner, line }`. Confidence: ✅. Recommendation: **delete the field** (derivable as `other(winner)`).
- **K4** `[tic-tac-toe/game.js:34]` **unused** — `s1` class on the X mark's first SVG stroke has no CSS rule and no JS consumer (only `s2` is targeted, `style.css:445`). Confidence: ⚠️ (harmless marker). Recommendation: **delete** from the class string. Plan: no mention.

**Plan-contract drift (informational):** §6 names `newBoard/applyMove/minimaxScore` vs built `emptyBoard/play/negamax+gameValue`; §2 "~300 ms" AI delay vs shipped `aiThinkDelayMs: 500`; §5's `muted` pref and `best` key were never implemented → plan §5 is stale doc regardless of K1's outcome.

### Clean checks (all clean)

Analytics/network remnants 0 (Rev 2 removal complete); no inline storage helpers left; all 13 core.js exports consumed; 11/12 storage.js exports consumed (`setRemoteAdapter` = sanctioned seam); all config.js keys consumed (`locale`, `aiThinkDelayMs`, `share1p/share2p`); all 7 files reachable; all 27 HTML ids consumed; every save-schema field read; CSS selectors/vars all consumed except K4; zero console/TODO/FIXME/Date.now; no core-logic duplication in game.js (jest's independent win-lines table is deliberate).

---

## 3. Sliding Puzzle (`plan/games/03-sliding-puzzle.md`)

### Findings

- **S1** `[sliding-puzzle/style.css:614-627, 662-675, 778, 780]` **dead** — `.board--deal` + `@keyframes deal` and `.overlay--in .overlay-card` + `@keyframes pop` (plus reduced-motion entries) have zero consumers: no HTML/JS builds those classes (all dynamic class sites grepped: `screen--active, hidden, board--picture, board--peek, tile, tile-num, tile--shake, tile--ghost, toast--in` only). Plan **line 176** has an _unchecked_ Phase 0 box: "Dead CSS removed (`board--deal`, `overlay--in`, `@keyframes deal/pop`)". Confidence: ✅. Recommendation: **delete**.
- **S2** `[sliding-puzzle/game.js:843-854]` **duplicate** — `pushedTileValues` re-implements `core.js slideTile`'s segment geometry line-for-line (`sameRow/sameCol/step/dist` identical at `core.js:119-123`), because `slideTile` returns only `{board, moved}`. Plan **line 173** prescribes the fix: "`slideTile` returns displaced tile values; UI stops re-implementing the geometry" (unchecked). Confidence: ✅. Recommendation: **merge** (owner sign-off needed — jest suite + harness pin the current `{board, moved}` shape).
- **S3** `[sliding-puzzle/ — whole folder]` **half-implemented vs plan** — the Rev 2 Phase 0 upgrade is owed but missing: no `config.js`, no `storage.js`, no scenes/audio extraction (plan §6 lines 93-96 require both files [P0]; §Phase 0 boxes lines 168-178 unchecked). Persistence is inline in `game.js:509-602` with **no schema `version`, no migrations, no remote adapter slot** — contradicting plan README §2 which names this very plan the "Rev 2 architecture reference" and says _every_ game adopts the facade, while README §1 row 3 says "done". Evidence: `ls` folder (5 files only); `grep -n version game.js core.js` → 0 storage-version fields; `grep config.js|storage.js|__SLIDING_PUZZLE_CONFIG__` → only a comment. Confidence: ✅ (absence verified). Recommendation: **needs owner decision** — approved-roadmap work to schedule, not deletable; README row 3 / §2 wording to amend if deferred.
- **S4** `[sliding-puzzle/style.css:772-790]` **half-implemented** — `button.daily` (has `transition: transform/border-color`, `style.css:199-202`) missing from the `prefers-reduced-motion` block. Plan line 178: "`.daily` added to reduced-motion" (unchecked). Confidence: ✅. Recommendation: **merge into the S3 pass** (one-line fix).

### Clean checks (all clean)

All 19 core.js exports consumed; all ~38 game.js internals called; index.html refs resolve; 57 CSS class selectors + all custom properties consumed (except S1's dead set); all 3 localStorage keys and every record field written-and-read; zero banned APIs (only harness `console.error`); `performance.now()` only; no deferred-feature stubs (undo/solve-demo/swipe left no skeletons); no v1/v2 leftovers (single commit history); all 8 picture scenes reachable; daily/hard/5×5/picture fully wired. Not flagged: `core.test.html:39` redundant module script — identical convention in all four harness games, test-file scope.

---

## 4. Word Puzzle (`plan/games/04-word-puzzle.md`)

### Findings

- **W1** `[word-puzzle/config.js:20,36,66-67]` **dead** — `dailyEnabled` flag + `?daily=` URL param parsed into `GAME_CONFIG` but consumed by nothing (grep `daily` over folder+test → config.js only; `grep GAME_CONFIG game.js` → line 34 import only). It "gates" nothing — plan lines 205-207 claim it "gates the mode". Deferred-feature stub left in code. Confidence: ✅. Recommendation: **needs owner decision** — remove until the P3 daily mode ships, or wire it then.
- **W2** `[word-puzzle/game.js:34]` **dead** — `GAME_CONFIG` imported, never used. Confidence: ✅. Recommendation: **delete** from the import.
- **W3** `[word-puzzle/game.js:24]` **dead** — `DIRS` imported from core.js, never used (direction logic lives in `lineCells`). Confidence: ✅. Recommendation: **delete**.
- **W4** `[word-puzzle/index.html:66]` **dead** — `id="chip-hints"` referenced nowhere (grep → only the HTML line; 0 in JS/CSS; all other 23 ids score ≥1). Confidence: ✅. Recommendation: **delete the id attribute** (keep the styled div).
- **W5** `[word-puzzle/style.css:25,46]` **dead** — custom property `--gold-bg` defined in both palettes, never consumed (gold consumers use `var(--gold)`). Confidence: ✅. Recommendation: **delete both lines**.
- **W6** `[word-puzzle/game.js:642-657 vs 704-722]` **duplicate** — tap-tap resolution (same-cell cancel / collinear submit / re-anchor) implemented twice with identical semantics: pointer branch in `onPointerDown` and the keyboard path `tapCell`. Plan §7.5 defines the semantics once. Confidence: ✅. Recommendation: **merge** — pointer branch delegates to `tapCell(cell)`.
- **W7** `[word-puzzle/storage.js:172-180]` **duplicate (redundant pass)** — `loadLevels()` re-runs `normalizeTally` over `save.levels`, which `normalizeSave()` (`:107-111`) already built exclusively from `normalizeTally` outputs. Confidence: ✅. Recommendation: **merge** — reduce to `return loadSave().levels;`.
- **W8** `[word-puzzle/config.js:3-14,21-27 + game.js hardcoded copy]` **stale (half-done migration marked done)** — plan §12 + R2-1 (lines 201-204, **checked**) claim strings moved out of game.js; only `share` moved (`t()` has exactly one lookup, `game.js:580`). Still hardcoded: hint wording (`index.html:70`), refound toast (`game.js:425`), theme-complete title/sub (`game.js:533,545-550`), clipboard/prompt copy (`game.js:598-603`). Confidence: ✅. Recommendation: **needs owner decision** — finish the extraction or correct the plan/config claim to "share template only".
- **W9** `[word-puzzle/index.html:9]` **stale** — meta description advertises "daily-seeded puzzles"; daily is deferred and gated off (`dailyEnabled: false`, zero daily code). Confidence: ✅. Recommendation: **fix the copy**.
- **W10** `[word-puzzle/storage.js:28]` **dead (export surface)** — `SAVE_VERSION` exported, never imported anywhere (used internally at :101/:113/:143; test import list omits it). The versioned schema itself is plan-sanctioned. Confidence: ✅ (the `export` keyword is the dead part). Recommendation: **un-export** (keep the const).
- **W11** `[word-puzzle/game.js:650]` **dead indirection** — `const judged = cells;` alias immediately passed to `evaluate(judged)`; rename leftover. Confidence: ✅. Recommendation: **delete** the alias.
- **W12** `[word-puzzle/game.js:399,503,512 + index.html:67]` **duplicate constant** — max-hints `3` hardcoded in four places, no single authority. Confidence: ✅. Recommendation: **merge** — hoist `MAX_HINTS` (or config key). Plan line 31: "Hints: 3 per level".
- **W13** `[word-puzzle/core.test.html:56]` **stale** — `'use strict';` sits mid-script after imports: a no-op string expression in an ES module (statement flagged, not the harness). Confidence: ✅. Recommendation: **delete** the line.

### Clean checks (all clean)

All 14 core.js exports consumed; `setRemoteAdapter` + legacy-key migration = sanctioned seams, verified against plan lines 23-27/184-189; index.html refs resolve; 23/24 ids consumed (W4 is the miss); strings table keys ↔ lookups match (no orphaned keys beyond W8's unwritten ones); every save-schema field read (`stars`, `bestTimeMs`, `prefs.muted`, `version`); all 4 themes × 3 tiers reachable incl. `?theme=`/`?level=` deep links; 45 CSS selector groups + keyframes consumed (except W5); zero console/TODO/FIXME/fetch/Date.now; no commented-out code; Rev 2 commit cleanly removed v1 storage from game.js (diff-verified).

---

## 5. Hurdle Runner (`plan/games/05-continuous-runner.md`)

### Findings

- **H1** `[hurdle-runner/config.js:1-73]` **dead — entire file unreachable** — nothing in the folder or the jest test imports it: index.html loads only style.css+main.js; main.js imports core/engine/render/storage only. `resolveConfig`/`GAME_CONFIG`/`t()` have zero consumers; `strings.en` is empty; main.js still hardcodes all UI copy ("Best ", share text, toast). Rev 2 commit `46639a7` created config.js **without wiring it** (`git show 46639a7:…main.js | grep config` → nothing). Confidence: ✅. Recommendation: **needs owner decision** — wire main.js copy through `t()`/host override (the plan §12 P0 intent), or remove until that pass lands. (The `window.__HURDLE_RUNNER_CONFIG__` seam is sanctioned; its zero-imports state is the finding.)
- **H2** `[hurdle-runner/core.js:277-278]` **dead + stale** — `PICKUP_AT_MIN_M`/`PICKUP_AT_MAX_M` (600/900 — the config-of-record for plan §2's "spawns 600-900 m") consumed nowhere; `main.js:167` re-derives the window with literals `600 + Math.random() * 300`. Confidence: ✅. Recommendation: **merge** — use the consts at main.js:167, or delete them.
- **H3** `[hurdle-runner/engine.js:157-160]` **dead** — exported `parallax(camX, factor)` has zero callers; render.js implements parallax inline (`render.js:705` `cam.x*0.2`, `:241` `camX*0.5`). Plan §6 assigns parallax to engine.js, so it's plan-intended but unwired. Confidence: ✅. Recommendation: **needs owner decision** — wire render.js's two factors through it or delete.
- **H4** `[hurdle-runner/render.js:301]` **unused** — `drawHurdle(ctx,x,y,w,h,pal)` accepts `pal` and never reads it (hardcoded hex; sibling `drawTall` at :328 correctly omits it); caller :364 passes it. Confidence: ✅. Recommendation: **delete the param** (or intentionally palette-shift obstacles).
- **H5** `[hurdle-runner/render.js:628-629]` **duplicate** — drawDebug hand-recomputes the player hitbox inset instead of sharing `aabbHit`'s math (core.js:246-249); plan §10 line 146 requires "?debug=1 boxes match shipped hitbox math exactly". Confidence: ✅. Recommendation: **merge** — export an `insetBox()` from core.js, use in both.
- **H6** `[hurdle-runner/main.js:122-124 ↔ render.js:512/515/517, 528/529, 608]` **duplicate** — timing constants exist twice: dust life 0.45 (`DUST_LIFE_S` vs literals ×3 in drawDust), floater life 0.8 (`FLOATER_LIFE_S` vs ×2), announce 1.6 (`ANNOUNCE_S` vs `const total = 1.6` in drawHUD). Changing one side desyncs pruning from drawing. Confidence: ✅. Recommendation: **merge** — pass through drawScene state or a shared constants module.
- **H7** `[hurdle-runner/storage.js:111-122]` **dead branch (latent bug)** — the `hasLegacy` guard is vacuous: `readJson(PREFS_KEY, {})` returns the truthy fallback when absent, so `!!legacyPrefs` is always true and `&& hasLegacy` can never short-circuit; legacy keys are removed even when only the versioned key existed (harmless removeItem, but the guard's intent is broken). Confidence: ✅. Recommendation: **fix** — default the legacy read to `null` (flagged only; no code changed).
- **H8** `[hurdle-runner/core.js:8-9]` **half-removed** — header claims consumers include "the folder's own core.test.html harness"; no such file exists (folder has only index.html). Same stale clause in the jest test header (`games-hurdle-runner.test.ts:7-8`). README row 5 correctly claims only "the jest suite is green". Confidence: ✅. Recommendation: **fix the comments**.
- **H9** `[core.js:39-51,159-161,274-275; render.js:107; storage.js:26; engine.js:27]` **unused (export surface)** — `SPEED_RAMP, SPEED_CAP, COYOTE_MS, BUFFER_MS, PLAYER_W/H, hurdleH, PICKUP_W/H, paletteFor, SAVE_KEY` consumed only inside their own modules; `createLoop`'s `fixedDt=1/120` default inert (main.js always passes `FIXED_DT=1/120` — plan constant lives in two files). Confidence: ⚠️. Recommendation: **keep** — they document the plan §2 spec table; optional un-export polish.

### Clean checks (all clean)

Every other export of all six .js files has ≥1 consumer; no unreachable branches or commented-out code; zero banned patterns (console/TODO/FIXME/fetch/Date.now); localStorage only in storage.js (+ the site-theme read in index.html, standard across all games); no `../shared/` refs (one prose comment only); **deferred P3 (fast-fall, gamepad) left zero stubs** (grep: none); `?debug=1` fully wired; all 19 element ids exist; CSS selectors/vars fully consumed; no unused imports; every drawScene state field read; physics constants single-sourced in core.js (the old rng double-call spawner path is gone; 2-commit history verified); pre-Rev-2 inline storage fully removed in `46639a7` (diff-verified, −65 lines).

---

## 6. Flying Snake (`plan/games/06-flying-snake.md`)

### Findings

- **F1** `[flying-snake/config.js:1-73]` **dead — entire file unreachable** — index.html loads style.css+main.js only; main.js imports core/render/storage only. The sanctioned `window.__FLYING_SNAKE_CONFIG__` / `?locale=` seam never executes in the browser. Rev 2 commit `777bb20` created it unwired. Confidence: ✅. Recommendation: **needs owner decision** — wire GAME_CONFIG/t into main.js now (R2-2), or accept the inert seam and note it in the plan.
- **F2** `[flying-snake/config.js:20-23,28,65,68]` **dead stubs** — `t()`, `GAME_CONFIG`, `resolveConfig` exported with zero consumers; `strings.en` is an empty "reserved" object (plan §12 says it should carry "share template, medal names/copy" — currently authored in main.js, see F6). Confidence: ✅. Recommendation: **needs owner decision** — tie to F1.
- **F3** `[flying-snake/main.js:119,199]` **half-used** — `state.deathCause` written in `die(cause)`, never read (gameOver card/debug never use it). Plan §2 defines the three causes but never asks to display them. Confidence: ✅ (write-only). Recommendation: **needs owner decision** — surface it (e.g. gameover copy) or delete.
- **F4** `[flying-snake/core.js:124,138]` **half-used** — `spawner.made` counter initialized and incremented, never read (main/render/both test surfaces). Plan §6 says the spawner "counts the pairs it has produced" — the count exists, nothing consumes it. Confidence: ✅. Recommendation: **delete the field** or assert on it in the spawner tests.
- **F5** `[flying-snake/main.js:48-51]` **stale husk** — empty numbered section header "1. Persistence — storage.js facade (Rev 2…)" with no code under it; `git show 777bb20~1` confirms inline storage lived there pre-Rev-2 and the move left the comment skeleton. Confidence: ✅. Recommendation: **delete** the empty section.
- **F6** `[flying-snake/main.js:44-46,105-106,213-215]` **stale/duplicate** — share + medal copy authored in main.js while plan §12 places them in config.js (config.js itself admits it), and the gameover nudge hardcodes the bronze threshold `'Reach 10 for a 🥉 medal'` duplicating `medalFor`'s `10` (core.js:212) — tier moves ⇒ copy silently desyncs. Confidence: ✅. Recommendation: **needs owner decision** — move copy into config.js strings as part of R2-2, or update plan wording.
- **F7** `[flying-snake/core.js:33-54; storage.js:26]` **unused (export surface)** — `FLAP_VY, SNAKE_X_FRACTION, HITBOX_SCALE, GAP_SHRINK, CEILING_GRACE_S, SAVE_KEY` internally used, zero external importers (tests pin values via literals). Confidence: ⚠️. Recommendation: **keep** — plan §12: "Physics constants stay in core.js — §2 tables are the spec of record".

### Clean checks (all clean)

All function exports consumed across core/storage/render/main; medals fully verified (4 tiers, boundaries 9/10/19/20/39/40/74/75 pinned in both test surfaces, displayed in menu + gameover); index.html refs resolve; 20/21 files reachable (config.js = F1); all 21 ids consumed; CSS selectors/vars fully consumed; physics constants single-sourced (no stale duplicated values; FIXED_DT defined once); zero console/TODO/FIXME/fetch/Date.now; localStorage only in storage.js (+ site-theme read); no commented-out code; Rev 2 migration diff-verified (v1 inline storage fully removed, durable-write-then-cleanup implemented); `?debug=1` wired end-to-end; deferred P3 (moving pipes/night palette/ghost/`?seed=`) left no stubs beyond F2/F6.

---

## 7. Spirit Runner (`plan/games/07-spirit-runner.md`)

### Findings

- **P1** `[spirit-runner/core.js:228, 314, 368]` **dead + likely functional bug** — `GUARDIAN_TALL_H = 96` has zero game-code consumers, and the gap bites: `guardianGroup` spawns tall guardians with `h: 0` (core.js:314) and `obstacleBox` has no `guardian-tall` branch (else-branch :368 uses `obs.h`) ⇒ spawner-spawned "Spirit guardian (tall)" gets a **zero-height hitbox (never lethal)** and `drawGuardianTall` receives `h=0` (degenerate render). Only the jest test + harness use the constant, hand-building the obstacle with explicit `h` and bypassing the spawner. Plan §2 Phase A: tall guardian "jump only", 800 m. Confidence: ✅ (dead constant; bug strongly implied). Recommendation: **needs owner decision** — wire the constant into spawner + `obstacleBox` (likely the intended behavior) or remove.
- **P2** `[spirit-runner/main.js:91-179 vs plan §12]` **stale / doc-location mismatch** — plan §12 lists `storage.js` ("versioned save + migrations + remote adapter slot") with R2-1 **checked done**, but the file was never created (`git log --all` → empty; 2-commit folder history). The facade (`storage` IIFE, `defaultSave`, `loadSave`, `saveSave`, `remoteAdapter`) lives inline in main.js; behavior matches R2-1 (versioned writes, normalized loads). Confidence: ✅. Recommendation: **needs owner decision** — extract to `storage.js` (matching 04/05/06) or amend plan §12's file list.
- **P3** `[spirit-runner/gates.js:44-49]` **dead** — exported `createGateState()` has zero consumers (main.js imports only `makeGate, resolveChoice, shuffledRules`; test/harness don't call it), and its doc comment ("main.js spreads this at run start") is false — `createRun` (core.js:563) builds the state inline; echo-rule survival is guaranteed by the `|| RUNE_ALPHABET[0]` fallback (gates.js:125) instead. Plan §6's API list has only `makeGate`/`resolveChoice`/`hintFor`. Confidence: ✅. Recommendation: **delete** (or wire per its comment).
- **P4** `[spirit-runner/config.js:25-27, 74-79]` **dead** — `t()` and the entire `strings` locale layer have zero consumers (`grep "\bt(" *.js` outside config.js → nothing); `GAME_CONFIG.locale` read only by the dead `t()`; `DEFAULT_CONFIG.strings.en` is `{}`. Gate hints hardcoded in gates.js:70-82, share template in main.js:68-79 — exactly the copy plan §12 said would move to config.js. (`remoteAdapter` half **is** consumed, main.js:273.) Confidence: ✅. Recommendation: **needs owner decision** — finish the deferred copy wiring or remove `t`/`strings`/`locale` until then.
- **P5** `[spirit-runner/engine.js:219-221]` **dead** — exported `parallax(camX, factor)`, zero consumers; render.js does parallax inline (`:309`, `:340`). Fork leftover (same as H3). Confidence: ✅. Recommendation: **delete**.
- **P6** `[spirit-runner/core.js:57]` **dead/unused** — `HEARTS_MAX = 2` consumed nowhere; `2` hardcoded at main.js:303 (`state.hearts = 2`), main.js:729 (`> 1`), render.js:1014 (HUD loop `i < 2`). Plan §2: "Hearts: 2" and a balance pass is still pending — single source of truth matters. Confidence: ✅. Recommendation: **merge** — consume the constant at the three sites, or delete it.
- **P7** `[spirit-runner/core.js:58]` **dead/unused** — `INVULN_S = 1.2` consumed nowhere; main.js:480 hardcodes `1.2`. Plan §2: "1.2 s invulnerability". Confidence: ✅. Recommendation: **merge**.
- **P8** `[spirit-runner/core.js:528,542,571]` **half-used** — run-state field `shadowShardPaid` written 3×, never read by game code (jest test:326 + harness:205 assert it). The once-only shard payout is structurally enforced by `tickShadow` returning true exactly once; the flag is the testable witness (plan §7.5 "pays shards exactly once"). Confidence: ⚠️. Recommendation: **needs owner decision** — keep as an asserted contract flag, or drop from writes+tests.
- **P9** `[spirit-runner/main.js:893]` **duplicate** — inline `{ double: '⇈', dash: '»', slow: '⏳' }` duplicates `POWER_GLYPH` (render.js:989), already exported and already imported-from by main.js (`POWER_LABEL`, main.js:60). Confidence: ✅. Recommendation: **merge** — import `POWER_GLYPH`.
- **P10** `[spirit-runner/render.js:1200]` **duplicate** — `ORB_R_DEBUG = 13` re-declares core.js's `ORB_R = 13`, which render.js already imports and uses in `drawOrbs`. Confidence: ✅. Recommendation: **merge** — use `ORB_R`.
- **P11** `[spirit-runner/render.js:1093]` **stale** — `1 - s.shadowS / 45` hardcodes the 45 s shadow duration that core.js owns as `SHADOW_S = 45` (:512); tuning SHADOW_S silently desyncs the vignette urgency. Plan §2 Phase C: "45 s". Confidence: ✅. Recommendation: **merge** — import `SHADOW_S`.
- **P12** `[spirit-runner/main.js:453]` **stale** — `save.shards >= 12` hardcodes Monk's unlock threshold instead of `CHARACTERS.monk.unlockAt` (main.js:88), which the unlock loop (:435) and picker already use. Plan §2 Phase D: "Monk | 12 shards". Confidence: ✅. Recommendation: **merge** — derive from `CHARACTERS`.
- **P13** `[spirit-runner/render.js:244]` **unused** — `drawCelestial(ctx, pal, t, m)`: `m` never referenced in the body (re-derives from `pal.depthIndex`); main.js:1218 passes `s.paletteM`. Confidence: ✅. Recommendation: **delete the param**.
- **P14** `[spirit-runner/render.js:500, 531]` **unused** — `pal` never referenced in `drawGuardianTall`/`drawGuardianLow` (hardcoded shadow-conditional colors). Confidence: ✅. Recommendation: **delete the params**.
- **P15** `[spirit-runner/engine.js:122,139,166,186,189]` **half-used** — input action payload carries `fy`, `code`, `event`; main.js's `onAction` reads only `.type`/`.fx` (main.js:914-934); the engine doc ("key actions carry the KeyboardEvent.code", :91) describes consumers that don't exist. Plan §4 documents fx door-zoning only (`fy` has no planned use). Confidence: ✅. Recommendation: **delete the dead payload fields** or fix the doc line.
- **P16** `[spirit-runner/gates.js:204-216]` **dead-by-authoring (documented-defensive)** — `makeGate` else-fallback unreachable with the authored `RULE_IDS` (5 rules = 5 switch cases); its own comment says so, and plan §8 requires "hint text present and never empty for any rule". Confidence: ✅ unreachable / intentional. Recommendation: **keep** (defensive default).

### Clean checks (all clean)

Fork-diff vs hurdle-runner verified: input layer rewritten for slide/swipe (no jump-only leftovers), spawner fully re-authored for the 5-type tier table, no hurdle-specific code carried — remaining cross-folder duplication is the sanctioned fork. All other exports of core (63)/gates (9)/engine (5)/render (6)/main (2) consumed. Exactly **5 gate rules**, all reachable via `gateIndex % length`. All 3 characters wired (picker, unlock eval, consumed modifiers). All 3 powers grantable AND effective. All element ids consumed; CSS selectors/vars fully consumed; every import used; save-schema fields all read (`version` write-only = sanctioned seam). Zero console/TODO/FIXME/fetch/Date.now; no `../shared/` refs; localStorage only in the main.js facade (+ site-theme read). Deferred R2-2 (`?seed=`) left no stubs beyond P3/P4.

---

## Verification notes

- Main-pass spot re-checks (independent greps) confirmed the highest-impact claims: H1/F1 zero-import config files; T1 `isMuted`; K2 `dataset.turn`; S1 dead keyframes; P1 `GUARDIAN_TALL_H`; P3 `createGateState`; C1 no game reads `?api=`.
- Cross-cutting sweeps over all 7 folders came back **clean**: zero `fetch(`/`/api/`/`XMLHttpRequest`/`sendBeacon`/`WebSocket`/`../shared/`; zero `console.log|debug` in product JS (only harness `console.error` guards); zero `TODO|FIXME|HACK`; `Date.now(` only in a comment + T4's unread `ts` stamp.
- No code, plan doc, or config was modified in this pass. All fixes are follow-up work pending owner review.

---

## Resolution log (2026-09-12 — follow-up pass, owner approved "resolve")

Every finding above was actioned the same day. Full games suite after all fixes:
**268/268 tests green across 7 suites**; `tsc --noEmit` clean (hub edit); all plan
previews regenerated (7 screen HTML + 7 print HTML + 8 PDFs incl. the combined doc).
No commits were made — the working tree holds the changes for owner review.

### Cross-cutting

- **C1** — hub rewritten: `gamesApiBase()`/`?api=` beacon plumbing and the stale header paragraph removed; links are plain `/games/<slug>/`. **C2** — hub card list completed to all 7 games.
- **C3** — previews regenerated: `build-html.mjs`, `build-pdf.mjs`, and the pdf skill's `html2pdf-next.js` (7 PDFs + `2d-games-all-plans.pdf`, 33-page merge).
- **C4** — AGENTS.md git-state annotations corrected (games committed via the owner's 2026-09-11 `.gitignore` allowlist; hub untracked; tests committed). Isolation rule itself unchanged.
- **C5/C6/C7/C8** — README §7 conflict block replaced with the resolution record; §3 marked superseded-by-Rev-2; §1 status rows updated for games 1/3/5/6/7; root `2d games plan.md` annotated as historical.

### Per game (IDs match the findings above)

- **tap-or-dont-tap** — T1 `isMuted` deleted; T2 `defaultSave()` now single-sources loadSave's fallback (normalizeSave left as-is: every field derives from parsed input); T3 dead flash-yellow word rule deleted; T4 `rounds`/`ts`/`Date.now` dropped, history = `{score, bestMs}`; T5 test header fixed; T6 `whenSec` param dropped; `FEEDBACK_MS` extracted (3 `after()` sites — the report's 4th citation was the same dwell); config strings completed (18 keys, all consumed). 31/31 green.
- **tic-tac-toe** — K1 migration now accepts **both** legacy layouts (plan §5 per-mode dash keys with `d`→`draw` remap + the single-key colon layout), merged field-wise (sum), legacy keys removed only after the durable versioned write; misère variants covered; 2 new jest tests + harness block; storage header honest. K2 `dataset.turn` deleted; K3 `roundOutcome.completedBy` removed; K4 `s1` class removed. 25/25 green.
- **sliding-puzzle** — S1 dead CSS (deal/pop + reduced-motion entries) deleted; S2 `slideTile` returns `{board, moved, pushed}`, `pushedTileValues` deleted, jest + harness updated; S3 **full Rev 2 Phase 0 built**: new `config.js` (host override → `?locale=` → defaults), `storage.js` (versioned `game:sliding-puzzle:save` v1: prefs/bests/daily, legacy-key migration with durable-write-then-cleanup, corrupt-entry sanitize, host-only remote slot), `scenes.js` (8 painters + `sliceBackground`), `audio.js`; game.js is now the UI shell. S4 `.daily` added to reduced-motion. Deviations: shuffle-guards/per-size-config/rounding-unification boxes remain open (never scan findings); plan §5's `locale?` pref not carried (would be write-only). 51/51 green.
- **word-puzzle** — W1 `dailyEnabled` + `?daily=` removed; W2/W3 dead imports removed; W4 `chip-hints` id removed; W5 `--gold-bg` ×2 removed; W6 pointer branch delegates to `tapCell` (subsumes W11's alias); W7 `loadLevels()` reduced; W8 strings extraction finished (8 new keys, all consumed; hint label set on init); W9 meta description fixed; W10 `SAVE_VERSION` un-exported; W12 `MAX_HINTS` hoisted (4 sites incl. the button-disable check the scan undercounted); W13 harness `'use strict'` removed. 43/43 green.
- **hurdle-runner** — H1 config.js wired into main.js (best/no-best/share/toast via `t()`); H2 pickup window uses the core consts; H3 `parallax` deleted; H4 unused `pal` dropped (cascaded out of `drawObstacles`); H5 `insetBox` exported from core and shared by `aabbHit` + drawDebug (bit-identical); H6 `fx` group carries dust/floater/announce lifetimes to render; H7 legacy read defaults to `null` — guard functional (runtime-verified migration + idempotence); H8 stale harness comments fixed; H9 kept. Deviation: main.js imports only `{ t }` (GAME_CONFIG is consumed inside config.js). 33/33 green.
- **flying-snake** — F1/F2 config.js wired (10 keys: share, 4 medal names, 4 medal emojis, noMedal); F6 `MEDAL_THRESHOLDS` exported from core and consumed by `medalFor` + the nudge template (bronze `10` exists once); F3 `deathCause` deleted; F4 `spawner.made` deleted; F5 section husk deleted + renumbered; F7 kept. Deviations: main.js imports only `{ t }`; the static gameover nudge placeholder in index.html emptied. 42/42 green.
- **spirit-runner** — P1 **tall guardians fixed per plan §2**: spawner emits `h = GUARDIAN_TALL_H` (96), `obstacleBox` gains the full-height jump-only `guardian-tall` branch, render receives a real height; new jest test pins spawner→hitbox. P2 inline facade extracted to `storage.js` (local `CHARACTER_IDS` schema const avoids a storage→main circular import). P3 `createGateState` deleted; P4 share template moved to config strings (`t()` live; gate hints stay in gates.js); P5 `parallax` deleted; P6 `HEARTS_MAX` consumed ×3; P7 `INVULN_S` consumed; P9/P10/P11/P12 constants single-sourced; P13/P14 unused params removed; P15 dead payload fields (`fy`/`code`/`event`) removed + engine doc fixed; P8 `shadowShardPaid` and P16 defensive fallback kept per report. 43/43 green.

### Judgment calls made (owner-relevant)

1. **Wired, not deleted**, the three half-dead config layers (H1/F1/F2/P4) — completing the plans' sanctioned Rev 2 strings pass rather than deleting committed Rev 2 scaffolding. Defaults are byte-identical to the previous hardcoded copy.
2. **TTT migration reads both layouts** (K1) — git cannot prove which pre-Rev-2 layout existed; supporting both is strictly loss-free.
3. **Spirit tall-guardian hitbox wired** (P1) — the one intended behavior change (tall guardians are now lethal, matching plan §2 "jump only").
4. **Plan 01 §2 amended to the shipped tuning** (swap design, signal mix, history cap 20, feedback timing) instead of retuning tested code.
5. **Hub completed to 7 cards + de-beaconed** — the hub is a games-owned local surface, not one of the product surfaces listed in AGENTS.md.
6. **Kept** per report: spec-documentation exports (H9/F7), `shadowShardPaid` (P8), the defensive gate fallback (P16).
