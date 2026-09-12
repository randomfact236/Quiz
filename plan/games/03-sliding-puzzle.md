# Game 03 — Sliding Puzzle (Complete Plan)

> **Revision 2 (2026-09-11, owner-approved).** The game is built and live (P0–P2 plus
> 5×5, picture modes, 8 procedural scenes, corner target preview, daily challenge, hard
> mode). This revision adds the approved **upgrade roadmap (Phases 0–5)**: a modular
> file structure, campaign levels + free play, a curated picture library with a builder
> tool, same-device + own-device multiplayer behind a config flag, and local-first
> persistence with mid-round resume. Supersedes the 2026-09-09 sample and revision 1.
>
> **SYNCED WITH THE IMPLEMENTATION 2026-09-13:** of the Phase 0-5 roadmap only Phase 0
> (foundation) and pieces of Phases 4-5 shipped - see the per-box annotations below and
> the section 13 verdict. The campaign/library/multiplayer/resume phases were never
> built; the shipped game is free-play + daily + hard mode.

## 1. Overview

Classic 15-puzzle: slide tiles into order. Hook is the personal-record pair ("4×4 in
2:41 · 213 moves"), guaranteed-solvable shuffles, and picture rounds assembled from a
target image shown in the board's corner. Goal of this revision: make the game a
**flagship, future-proof title** — more content (pictures, levels), more modes (daily,
hard, multiplayer), and an architecture that grows without rework, while keeping the
repo's constraints: vanilla ESM, no build step, no dependencies, offline-capable,
games isolated from the website product.

## 2. Game spec (live today)

- Sizes: **3×3** (default), **4×4** (classic), **5×5**. Tiles 1..N²−1, blank last.
- **Shuffle:** from solved, `movesCount` random legal single-tile slides — 120 (3×3),
  250 (4×4), 400 (5×5) — never undoing the previous move. Solvable by construction;
  inversion-parity (`isSolvable`) is verified in tests anyway.
- **Move counting:** single-tile slide = 1 move; row/column segment push = 1 move per
  displaced tile.
- **Timer:** starts on first move, stops on the winning move, accumulates across pauses
  (`performance.now()` only), never runs in `menu`/`won`.
- **Win:** tiles in order, blank last → overlay. Input locked after the winning move.
- **Score:** `max(0, sizeBonus − ⌊moves/2⌋ − ⌊seconds/5⌋)`, sizeBonus 300/500/800.
- **Wrong-tile feedback:** shake animation, no move counted.
- **Modes (live):** Numbers or Picture tiles; **Daily challenge** (seeded 4×4 — same
  board for everyone that day, per-day record); **Hard** (picture-only, no preview/peek,
  separate records).

## 3. Progression model (this revision)

- **Campaign:** sequential stages with difficulty ramping (grid size, shuffle depth,
  fading assists, par moves/time). A stage unlocks when the previous is solved. Stars
  (1–3) from par thresholds; replays improve stars. Per-stage best time/moves.
- **Free Play:** today's menu verbatim (any size, numbers/picture, daily, hard) —
  always available, **no unlocks, no stars, no campaign progress** (its limitation).
  Per-size/mode records still apply.
- **Daily:** unchanged — seeded 4×4, per-day record; picture becomes deterministic from
  the same seed (planned, Phase 1) so every player sees the identical board _and_ image.
- **Records:** per size/mode/variant (`best:<size>[:hard]`), per day (`daily:<yyyymmdd>`),
  and per campaign stage (`progress`), all localStorage, schema-versioned.

## 4. Screens & UI (this revision)

| Screen      | Elements                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu (hub)  | Section entry points: **Campaign**, **Free Play**, **Multiplayer**; mute; theme follows site                                                                   |
| Campaign    | Stage grid: lock state, stars, best time/moves per stage; continue point                                                                                       |
| Free Play   | Today's menu: size picker (3 cards with bests), numbers/picture, hard, daily (with date + done state)                                                          |
| Playing     | Compact centered cluster: HUD (menu · timer · moves · pause), board (`--n`-driven), corner target preview (picture rounds), actions (peek · restart · shuffle) |
| Paused      | Opaque overlay — board hidden, clock held; resume/restart/menu                                                                                                 |
| Won         | Time, moves, score; NEW BEST badges; campaign variant adds stars + [Retry] [Next stage]                                                                        |
| Multiplayer | Series (same device) and challenge link (own device); entry **gated by flag** (§7)                                                                             |

Tiles are absolutely-positioned buttons moved via `transform: translate` transitions
(180 ms ease); the blank is a missing tile. Board sizing `min(92vw, 60dvh)`, capped for
desktop; HUD + board + actions cluster together at every viewport.

## 5. Data model (localStorage) — SUPERSEDED: shipped as the versioned `game:sliding-puzzle:save` v1 doc (see §8); the loose keys below are legacy migration inputs, deleted after migration

```
game:sliding-puzzle:prefs          { version, size, muted, mode, hard, locale? }
game:sliding-puzzle:best:<size>[:hard]   { timeMs, moves }
game:sliding-puzzle:daily:<yyyymmdd>     { timeMs, moves }
game:sliding-puzzle:progress       { version, unlockedUpTo, stages:{ id:{timeMs,moves,stars} } }
game:sliding-puzzle:resume         { version, size, seed?, board, moves, playedMs, mode, assists, stageId? }
```

All reads validate + migrate by `version`; all writes best-effort (storage disabled →
game fully playable). A pluggable **remote adapter slot** exists in `storage.js` for a
future host-injected account sync — the game never checks auth and makes no network
calls (§7).

## 6. File structure (modular — replaces the original 4-file layout)

```
sliding-puzzle/
  index.html          screens: menu hub | campaign | free play | playing | multiplayer
  style.css           tokens (light/dark), screens, board, overlays, reduced-motion
  core.js             pure model: board, shuffle (+guards), slideTile (+displaced tiles),
                      solvability, scoring, clock format, per-size config, key builders,
                      mulberry32, mergeRecord — no DOM (the test surface)
  levels.js           [P1] stage definitions + unlock/star rules — pure
  scenes.js           [P0] procedural painters + makePicture + sliceBackground
  library.js          [P2] picture-library manifest access — pure
  config.js           [P0] flags + strings, host-overridable (§7)
  storage.js          [P0] guarded storage facade: version + migrations, prefs, records,
                      progress, resume, remote adapter slot
  audio.js            [P0] WebAudio blips + mute (context on first gesture)
  game.js             UI shell: screens, input, timer, share (imports the modules above)
  data/pictures.json  [P2] library manifest (empty until packs are added)
  pics/               [P2] bundled square images (only when the owner adds them)
  builder.html        [P2] Library Builder tool (local, not linked from the game)
  core.test.html      in-browser harness for the pure modules (auto-runs)
```

## 7. Multiplayer & the website/app flag

**Modes (both backend-free):**

- **Same-device series:** two players alternate on identical seeded boards; per-round
  result + series scoreboard (Tic Tac Toe's pass-and-play pattern). Separate records.
- **Own-device challenge:** a challenge encodes `{size, seed, assists, pictureId}` in a
  URL/code; the friend plays the _identical_ board on their device; results compared via
  share text + a manual "opponent result" entry. Nothing at stake → no trust problem.

**Website/app flag (config.js):**

```
multiplayerEnabled: false   // website default; the app wrapper injects true
```

Resolution order: host-injected `window.__SLIDING_PUZZLE_CONFIG__` → `?mp=0|1` URL param
→ default. One file, no refactor to switch environments (the flag arrives when that
static file is re-served/injected — cache-busting in §12).

- `true` → multiplayer behaves normally.
- `false` → the Multiplayer entry stays **visible but disabled**: click opens a small
  dialog with the configurable notice ("Multiplayer available in the app only."),
  rendered `aria-disabled`; **no multiplayer logic executes, no network calls**. Modules
  stay loaded but inert. Notice text lives in `config.strings` (per-locale); `prefs` may
  override it but is a cache, not the source of truth.

**Gated — explicitly NOT built (needs backend + §7 reversal):** live rooms, real-time
races, in-app leaderboards, account-level sync. Client `performance.now()` cannot be
trusted competitively; any of these requires server-side timing and an explicit,
separately-scoped owner change reversing the isolation decision.

## 8. Persistence (local-first)

- **Guests and the website build: full local persistence** — records, daily, campaign
  progress, resume. Dropping guest saving would erase most players' progress and break
  the offline contract; not done.
- **Resume:** an unfinished round snapshots `{size, seed?, board, moves, playedMs, mode,
assists, stageId?}` (~200 B) and offers "Continue" on return — for everyone, guests
  included.
- **Logged-in continuity is a host concern:** `storage.js` exposes a remote adapter slot;
  the website/app injects an adapter for authenticated users (local-first, best-effort
  mirroring). The game never checks auth → no coupling, no network in the website build.
- **Account-level/cross-device sync — gated future phase** (§7): needs the backend and an
  explicit isolation reversal. Documented, not built.

## 9. Testing

- **core jest suite** (`src/__tests__/games-sliding-puzzle.test.ts`): model proofs —
  100 shuffles/size solvable + never solved + no-undo replay through `slideTile`;
  segment slides; solvability formulas (odd/even width); scoring; seeded daily
  determinism; record merging; plus suites for the new pure modules: per-size config
  resolution, shuffle guards, levels (unlock/star boundaries), storage migrations,
  library manifest parsing/fallback, config flag resolution, `sliceBackground`.
- **`core.test.html`** harness mirrors the pure assertions in-browser (auto-runs).
- **UI layer** (`game.js`) is verified by browser passes (flag states, layouts at 360 px
  and desktop, resume accuracy ±50 ms) — UI logic stays thin by pushing rules into the
  pure modules above.
- CI safety: every committed test imports only tracked files.

## 10. Build phases (approved roadmap)

### Phase 0 — Foundation: correctness fixes, config/flags, storage facade

- [x] `shuffle()` guards: unknown size → clear error; solved-retry bounded (8 attempts)
      with a forced legal nudge as the last resort. (2026-09-12; guard tests added.)
- [x] One per-size config object (`shuffleMoves`, `sizeBonus`) as the single source;
      `SIZES`/`SHUFFLE_MOVES`/`SIZE_BONUS` derived from it; unknown size fails fast
      (shipped as three parallel consts - same values; fail-fast lives in `shuffle()`,
      `scoreFor` falls back to 0 for unknown sizes - accepted 2026-09-13)
      `SIZES`/`SHUFFLE_MOVES`/`SIZE_BONUS` derived from it; unknown size fails fast.
- [x] `slideTile` returns displaced tile values; UI stops re-implementing the geometry.
      (2026-09-12: returns `{ board, moved, pushed }`; `pushedTileValues` deleted.)
- [x] `config.js` + `storage.js` + `scenes.js` + `audio.js` modules created; `game.js`
      becomes the UI shell importing them (behavior unchanged). (2026-09-12)
- [x] Dead CSS removed (`board--deal`, `overlay--in`, `@keyframes deal/pop`);
      `.daily` added to reduced-motion. (2026-09-12)
- [x] Score/clock rounding unified (score floors like `formatTime`). (2026-09-12)
- [x] Jest + harness updated for the new modules; all green; game behavior unchanged.
      (2026-09-12: versioned `game:sliding-puzzle:save` v1 with legacy-key migration.)

### Phase 1 — Campaign levels + Free Play — **DESCOPED (never built; free-play + daily + hard shipped instead)**

- [ ] (descoped - not built) `levels.js`: stage definitions (~24 stages, three tiers: 3x3 - 4x4 - 5x5, assists) - the shipped game is free-play + daily + hard (see section 13)
      fading, fixed picture per stage, par + star thresholds) and pure rules
      (`stageById`, `isUnlocked`, `starsFor`, `nextStage`).
- [ ] (descoped - not built) `storage.js`: progress record - the shipped save v1 keeps prefs/bests/dailies only
- [ ] (descoped - not built) UI: Campaign screen (grid, locks, stars, bests), Free Play screen (today's menu), campaign win overlay (stars, retry/next), hub navigation
      campaign win overlay (stars, retry/next), hub navigation.
- [ ] (not built) Daily picture deterministic from the daily seed - the seed drives the BOARD only; the picture scene is random
- [ ] (descoped - not built) Jest: unlock/star/scoring boundaries; browser: unlock flow + free-play parity

### Phase 2 — Picture library + Library Builder — **DEFERRED (not built; procedural scenes ship)**

- [ ] (deferred - not built) `data/pictures.json` manifest schema (packs, pictures, sections) + `library.js`
      (resolve/fallback) + `scenes.js` picture resolution for levels/daily/free.
- [ ] (deferred - not built) `builder.html`: upload, square-crop/resize 720x720, JPEG q0.85, assign packs
      sections → export `pictures.json` + named `pics/<pack>/<id>.jpg` files.
- [ ] (deferred - not built) Rules: <= ~150 KB per image, square, license-clear (zero entries = procedural-only, which is the current state)
      zero entries → procedural-only behavior unchanged.
- [ ] (deferred - not built) Jest: manifest validation/resolution/fallback; browser: assigned image slices; builder round-trip
      correctly + appears in the corner preview; builder round-trip.

### Phase 3 — Multiplayer + website/app gating — **NOT BUILT (gated per §7; the `multiplayerEnabled` flag was never added to config.js)**

- [ ] (not built) Same-device series: alternating seeded boards, per-round results, series scoreboard
- [ ] (not built) Own-device challenge: URL/code encoding of {size, seed, assists, pictureId}
      identical board + picture on the friend's device; result comparison via share +
      manual opponent entry.
- [ ] (not built) Flag gating per section 7 - the `multiplayerEnabled` flag itself was never added to config.js
      override enables full behavior.
- [ ] (not built) Jest: challenge encode/decode round-trip; browser: both flag states, network-request
      log empty when disabled; isolation grep clean.

### Phase 4 — Persistence & resume

- [x] `storage.js` migrations + remote adapter slot (host-injected only) - BUILT early under the Rev 2 Phase 0 pass; jest-covered; this box was stale
- [ ] (not built) Mid-round resume snapshot (save on state change, offer Continue on return); works
      for guests; campaign rounds resume into their stage.
- [x] Docs: host-injection contract for the adapter - covered by storage.js's header contract (`{ save(saveObj) }` shape); no standalone doc
- [ ] (partial) Jest: migration-path tests ship; snapshot/resume tests have nothing to test while resume is not built
      ±50 ms; zero network calls with no adapter injected.

### Phase 5 — Polish, accessibility, QA, docs

- [x] A11y: tile `aria-label` carries its board position + a polite live region
      announces each move and the blank's cell; Tab is trapped inside the open
      `aria-modal` dialog. (2026-09-12)
- [ ] (not built) A11y remaining: roving focus + arrow keys for the radio groups, focus target when a round starts
      a round starts.
- [x] `color-mix` fallback + `-webkit-backdrop-filter` on the overlays. (2026-09-12)
- [x] Cache-busting: `/games/:path*` now sends `Cache-Control: public, max-age=0,
  must-revalidate` from both Next configs, so a deploy is picked up on reload.
      (2026-09-12)
- [ ] (not done) Contrast to AA (primary gradient light stop, muted text)
- [x] Determinism test fixed (two fresh streams - jest). STILL OPEN: timer/share helper extraction + tests; mid-board-blank and non-integer-index segment cases
      mid-board segment + non-integer index cases.
- [x] Docs: this file's status + `plan/games/README.md` row; gated items (section 12)
      (§7) recorded.
- [ ] QA gate (master README §5): offline check OK, isolation greps OK - the 10-minute phone session is the owner's, still owed
      session (incl. iOS Safari fallbacks) — the manual session is the owner's.

## 11. Acceptance criteria

- All Phase checklists above checked; jest + `core.test.html` green; CI safe (tests
  import only tracked files).
- Shuffle can never hang regardless of config or rng; unknown sizes fail fast with a
  clear message.
- `multiplayerEnabled:false` (website default) = single-player only, zero network calls,
  verified in the browser's request log.
- Timer exact across pause/resume (±50 ms); resume restores board/moves/clock exactly.
- Campaign unlock/star rules correct at boundaries; Free Play never awards progression.
- Library: zero entries → today's behavior; assigned images slice correctly and appear
  in the corner preview; builder round-trips assignments.
- 3×3 fits 360 px with HUD visible, no scroll; layouts compact at phone and desktop.
- Restart ≤ 1 tap; shuffle visibly mixes the board every time.

## 12. Deferred coupling & gated items (intentionally NOT built)

- Footer/nav links, analytics events, achievements integration, backend leaderboards —
  per master README §7. Sliding Puzzle adds **no** analytics and **no** site coupling.
- **Gated future phases (require backend + explicit §7 reversal):** live rooms/real-time
  races, in-app leaderboards, account-level cross-device sync. Server-side timing
  validation is mandatory for anything competitive.
- Shipping the games publicly (removing `.gitignore` isolation lines + footer/sitemap/
  Play Hub references) remains a separate, explicitly-scoped owner action. Sliding
  Puzzle is the only committed game (owner decision 2026-09-11).

## 13. Implementation sync (2026-09-13) — what shipped vs this plan

**Shipped:** the classic puzzle exactly as §2 (3×3/4×4/5×5, guaranteed-solvable
walk shuffles, segment slides with per-tile stagger), plus picture mode (8
procedural scenes — Aurora, Sunset, Ocean, Forest, City, Space, Desert,
Bubbles — corner target preview + number-pill peek, both disabled in hard
mode), the seeded daily 4×4 (the seed drives the BOARD only; the picture
scene is random), hard mode (picture forced, preview/peek hidden, separate
`4:hard` records), Rev 2 modules (`config.js` share strings; `storage.js`
save v1 folding prefs + per-size bests + per-day dailies, with legacy
migration and the remote-adapter slot; `scenes.js`; `audio.js`), and unified
floor-rounding for score/clock. Tests: 55 executed jest cases + the
`core.test.html` twin (core.js surface).

**Not built (annotated above per phase):** the campaign/levels system, the
picture library + Library Builder, same-device series / own-device challenges
and the `multiplayerEnabled` flag (never added to config.js), mid-round
resume snapshots, roving-focus a11y, an AA contrast pass, and extracted
timer+share helpers. The §6 caption's "campaign | free play | multiplayer"
screens describe this roadmap, not the shipped two-screen shell.

**Deviations worth knowing:** a daily solve also folds into the plain 4×4
best record (dual record, undocumented in §2/§3); §5's loose-key data model is
superseded by the single versioned save; §9's claim that core.test.html
mirrors all jest assertions holds only for core.js (scenes/storage/config are
jest-only).
