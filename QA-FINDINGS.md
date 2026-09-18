# QA Findings — Bug Tracker

> One file for QA work: the **Work Log** records what testing was done each session
> (chronological, newest first); the **bug entries** record each defect found.
> Add one entry per bug under **Open**; when fixed, move the entry to **Fixed** with the
> date and fix reference.
> Priority basis (same convention as `plan/STANDARDS.md` §1):
> **P0** = critical/broken · **P1** = major gap · **P2** = integration/quality · **P3** = polish.
> Evidence screenshots go in `gui-test-screenshots/`; reference the filename in the entry.

## Index

| ID      | Title                                                                 | Area                          | Priority | Status   |
| ------- | --------------------------------------------------------------------- | ----------------------------- | -------- | -------- |
| BUG-001 | Quiz: advance to next question after answering                        | Quiz play (answer flow)       | P2       | Fixed    |
| BUG-002 | Footer: add Games link instead of menu drawer                         | Footer navigation             | P2       | Fixed    |
| BUG-003 | Mode selection: both remain open; click should close it               | Mode selection page           | P2       | Fixed    |
| BUG-004 | Footer menu items open a selection drawer instead of a page           | Footer navigation             | P1       | Fixed    |
| BUG-005 | Legal pages not finalized                                             | Legal pages                   | P1       | Deferred |
| BUG-006 | FAQ page missing                                                      | FAQ                           | P2       | Fixed    |
| BUG-007 | Mobile: "AI Quiz" text visible; need mobile logo/text controls        | Mobile header / site settings | P2       | Fixed    |
| BUG-008 | Mobile: header shows only the icon                                    | Mobile header                 | P2       | Fixed    |
| BUG-009 | Light/dark mode toggle not working on mobile                          | Theme toggle (mobile)         | P1       | Fixed    |
| BUG-010 | Dark mode: logo color looks wrong                                     | Logo (dark mode)              | P2       | Fixed    |
| BUG-011 | Games link returns 404                                                | /games (Games hub)            | P1       | Fixed    |
| BUG-012 | Clear all stored analytics data                                       | Analytics (stored data)       | P2       | Fixed    |
| BUG-013 | Verify Google Analytics & Search Console connection                   | GA / Search Console           | P2       | Fixed    |
| BUG-014 | Top progress bar on every page open, all devices                      | Navigation progress (global)  | P2       | Fixed    |
| BUG-015 | Game hub cards 404 (`/games/<slug>/` never serves the game)           | /games → static games         | P1       | Fixed    |
| BUG-016 | Analyze quiz-mcq & riddle-mcq vs 5-level option-count spec            | quiz-mcq / riddle-mcq         | P1       | Fixed    |
| BUG-017 | Sliding puzzle: gap between moving blocks; picture outside container  | Games (sliding-puzzle)        | P2       | Fixed    |
| BUG-018 | Hurdle runner: background not full screen (responsive)                | Games (hurdle-runner)         | P2       | Fixed    |
| BUG-019 | "All games" from inside a game opens Game hub, not listing            | Games navigation              | P2       | Fixed    |
| BUG-020 | Spirit runner: background not full screen (responsive)                | Games (spirit-runner)         | P2       | Fixed    |
| BUG-021 | Memory quiz: image reveal + completion images + level gating          | Games (memory-quiz)           | P1       | Fixed    |
| BUG-022 | quiz-csv sports.csv: 400 malformed rows silently lost at import       | quiz-csv (content)            | P1       | Fixed    |
| BUG-023 | Riddle expert open-ended rows graded against a bare letter            | riddle-mcq csv (content)      | P1       | Fixed    |
| BUG-024 | detective-mystery: 30 whodunit rows logically unsolvable              | riddle-mcq csv (content)      | P2       | Fixed    |
| BUG-025 | pop-culture: 403 MCQs unwinnable (correct letter sliced off)          | quiz-csv (content)            | P1       | Fixed    |
| BUG-026 | Quiz/riddle content quality: duplicates + answer-letter bias          | quiz-csv / riddle-mcq csv     | P3       | Fixed    |
| BUG-027 | Quiz: mode selection inline under each subject chapter (first 2 open) | quiz-mcq subjects             | P2       | Fixed    |
| BUG-028 | Riddles: same 2-column subject style/design as quiz                   | riddle-mcq subjects           | P2       | Fixed    |
| BUG-029 | Riddle MCQ: Normal and Timer mode sections open by default            | riddle-mcq mode selection     | P2       | Fixed    |
| BUG-030 | Sliding puzzle: moved block not fully adjusted until next move        | Games (sliding-puzzle)        | P2       | Fixed    |
| BUG-031 | "All games" back button only visible when game is paused              | Games (in-game nav)           | P2       | Fixed    |
| BUG-032 | Runner game: runner too far left, should sit in the middle            | Games (runner)                | P2       | Fixed    |
| BUG-033 | Mobile: runner invisible (hurdle-runner & spirit-runner)              | Games (runner, mobile)        | P1       | Fixed    |
| BUG-034 | "All games" pill: hide during play, show only when paused             | Games (in-game nav)           | P2       | Fixed    |

---

## Work Log

_(newest first)_

### 2026-09-18 — BUG-034 fixed: All-games pill paused-only in the 3 canvas games

- **Scope:** hurdle-runner, spirit-runner, flying-snake (the games whose pill overlays the
  playing surface); DOM games keep their in-flow links
- **Result:** pill hidden while `mode === 'playing'` (snake also `dying`), visible on
  paused / menu / ready / game-over, via one toggle in each game's `showScreen()` plus a
  `.back-link.hidden` CSS rule. Owner directive applied as given — reverses the
  always-visible direction of the BUG-031 fix.
- **Verified:** live in the IDE browser pane on 3010 — playing hidden / paused visible on
  both runners (+ menu & game-over states), snake playing hidden (pause path is the
  tab-hidden handler; same showScreen toggle, pane can't fake document.hidden).
  Evidence: `gui-test-screenshots/fix_bug034_*.png`.

### 2026-09-18 — BUG-033 fixed: responsive runner x keeps the actor on-screen at portrait aspects

- **Scope:** hurdle-runner + spirit-runner (`core.js` + `main.js` each)
- **Root cause (confirmed, as the filing suspected):** BUG-032 moved the runner to a FIXED
  `PLAYER_X = 405`, but the logical world width flexes with the viewport aspect
  (`setViewW(500 × aspect)`). The runner left the visible world at aspect < 0.81 — every
  portrait phone (390×844 → world ≈ 231 px) and 3:4 portrait tablets. Reproduced in the
  browser at 390×844: both games ran live with NO runner on screen; the blind hurdle run
  died at 61 m with 0 cleared (`bug033_*_portrait_live_no_*.png`).
- **Fix:** `PLAYER_X` is now a live binding re-derived on every resize via `setPlayerX(VIEW_W)`
  — 45 % of the live world width, capped at the desktop reference 405 (`PLAYER_X_MAX`).
  Desktop/wide look is byte-identical to the BUG-032 verification (405/1082 ≈ 37 % at
  844×390); portrait now draws the runner at 45 % of the narrow world. Physics, scoring,
  collisions, particles and render all read the same binding, so nothing was decoupled.
  Same `setViewW` setter pattern core.js already uses for the flexing world width.
- **Tests:** both runner suites re-run — 79/79 pass. One spirit-runner orb test had been
  silently broken since BUG-032 (hardcoded `worldX: 225`, the pre-reposition player x);
  updated to place the orb at `PLAYER_X`.
- **Verified:** IDE browser pane on the live frontend (3010) — hurdle-runner and
  spirit-runner at 390×844 both show the actor mid-screen during play
  (`fix_bug033_*_portrait_*.png`); at 844×390 the position is unchanged
  (`fix_bug033_*_landscape_*.png`).

### 2026-09-18 — Follow-up: mobile runner invisibility + pill visibility directive

- **Scope:** runner games on mobile (hurdle-runner, spirit-runner); "All games" pill
  visibility during play
- **Method:** owner-reported observations; no testing performed
- **Result:** two items filed — BUG-033 (runner invisible on mobile in both runner games;
  flagged as possibly interacting with the BUG-032 reposition) and BUG-034 (owner directive
  reversing the BUG-031 fix direction: the pill must be HIDDEN during active play and shown
  only while paused). Listing only.
- **Bugs filed:** BUG-033, BUG-034
- **Evidence:** none

### 2026-09-18 - Final round: BUG-001 auto-advance verified live on the rebuilt server

- Rebuilt the frontend (build8) with all pending fixes and re-verified end-to-end on the
  Animals/Animal Basics practice session: answering Q1 auto-advanced to Q2 within the ~3 s
  window with zero interaction (`verify_001_autoadvance_after_4s.png`, URL question=2,
  progress 2/10) - BUG-001 verified live at last.
- Also live-verified this round: BUG-027 v2 inline picker (chapters 1-2 expanded with
  Normal/Timer sections + per-level difficulty chips; Easy chip opens the correct play
  session) - `verify_027_inline_modes_first2.png`, `verify_027_chip_leads_to_play.png`.
- Security re-checked on the rebuilt server: all four browser-hardening headers present on
  quiz pages; admin analytics reset still 401 unauthenticated.

_(newest first)_

### 2026-09-18 - Home cards: fixed order, Quiz card removed (owner request)

- **Scope:** home page direct-link cards under the mode cards.
- **Change:** `ModeCards.tsx` - card order is now fixed: Riddles -> Image Riddles -> Games
  -> Dad Jokes; the Quiz card is removed (quiz stays reachable via the header nav, the big
  Quiz Topics section, and the mode cards). The earlier per-visit shuffle was dropped since
  the owner now specifies an exact order; the unused shuffle helper was deleted.
- **Verification:** DOM tile order = riddle-mcq -> image-riddles -> games -> jokes (no quiz
  tile); mode-cards unit tests updated and green (5/5); production build regenerated.
- **Evidence:** `gui-test-screenshots/verify_023_cards_reordered_no_quiz.png`

### 2026-09-18 - Games bugs BUG-030/031/032 resolved and verified

- **BUG-030 sliding-puzzle:** both per-tile hover rules removed (numbers-mode tint +
  picture-mode brightness flash) - a lingering hover highlight on the moved block read as
  an "active, not fully adjusted" tile. Blocks now render uniform at all times. Served CSS
  confirmed clean (0 tile hover rules on tiles).
- **BUG-031:** the "All games" pill is verified visible and clickable during active play
  (hurdle-runner live run - pill top-left, elementFromPoint = the pill itself); the earlier
  invisible state was the pre-pill gray text, superseded by the pill restyle.
- **BUG-032:** runner x moved from 25% to 45% of the world (PLAYER_X 225 -> 405) in both
  hurdle-runner and spirit-runner - the runner now sits around the middle with full
  reaction room ahead. Verified in live gameplay (hurdle-runner) and menu scene
  (spirit-runner).
- **Bugs closed:** BUG-030, BUG-031, BUG-032
- **Evidence:** `gui-test-screenshots/verify_032_runner_middle.png`,
  `verify_032_spirit_gameplay_middle.png`, curl transcripts for the sliding-puzzle CSS.

### 2026-09-18 — Follow-up: sliding-puzzle alignment + in-game UI reports

- **Scope:** sliding-puzzle block alignment; in-game "All games" back-button visibility;
  runner-game character positioning
- **Method:** owner-reported observations (07:57 / 08:00 messages); no testing performed
- **Result:** three items filed — BUG-030 (moved puzzle block shows as an active,
  not-fully-adjusted block until the next move; owner wants every block fully adjusted at all
  times), BUG-031 ("All games" back button visible only while the game is paused), BUG-032
  (runner sits too far left; owner wants it in the middle of the view). Listing only.
- **Bugs filed:** BUG-030, BUG-031, BUG-032
- **Evidence:** none

### 2026-09-18 — Mobile footer: Menu item removed (owner request)

- **Scope:** mobile bottom navigation only.
- **Change:** `MobileFooter.tsx` — the bottom nav is now six direct page links:
  Home / Quiz / Riddles / Images / Jokes / Games. The "Menu" item and its bottom-sheet
  drawer (which duplicated the header menu's links) were removed per owner request —
  the header's mobile menu (☰) remains the place for Achievements / About / Profile /
  Admin / Logout on phones.
- **Verification:** live — nav contains exactly the 6 links, zero buttons, no drawer;
  all navigate correctly (`verify_024_footer_menu_removed.png`).
- **Note:** mobile users reach Achievements/About/Admin via the header ☰ menu.

### 2026-09-18 — BUG-027 quick-play attempt reverted; owner clarified inline full-selection intent

- The chapter-card quick-play buttons (▶ Play / ⏱ Timer + `autostart=1` on the play route)
  were removed from `quiz-mcq/page.tsx` / `play/page.tsx` after the owner clarified BUG-027
  means the FULL difficulty + mode selection rendered inline under each chapter (first 2
  chapters expanded by default) — not quick-play shortcuts. Reverted; BUG-027 reopened with
  the clarified scope. `play/page.tsx` retains the separate BUG-001 auto-advance fix.
- No other files affected; `tsc --noEmit` clean.

### 2026-09-18 — BUG-028/029 resolved: riddle design parity + both mode sections open

- **BUG-028:** "Browse by Category" cards restyled to the quiz subject-card design —
  2-column grid (`grid-cols-2 gap-4 sm:grid-cols-3`, same as the quiz picker) with the green
  "✓ N riddles" count treatment (`verify_028_riddle_categories_2col.png`; computed grid
  288px × 3 at desktop).
- **BUG-029:** `ModeLevelPicker` — Normal Mode and Timer Mode both render expanded by
  default (independently collapsible). The `defaultMode`-driven exclusive init, the unused
  prop, and the `parseModeParam` call were removed
  (`verify_029_riddle_modes_both_open.png` — both `aria-expanded: true` with level grids
  visible).
- **Validation:** `tsc --noEmit` clean; production build regenerated; verified live on
  `/riddle-mcq`.
- **Bugs closed:** BUG-028, BUG-029
- **Evidence:** `gui-test-screenshots/verify_028_*.png`, `verify_029_*.png`

### 2026-09-18 — Home cards: fixed order, Quiz card removed (owner request)

- **Scope:** home page direct-link cards under the mode cards.
- **Change:** `ModeCards.tsx` — card order is now fixed: Riddles → Image Riddles → Games →
  Dad Jokes; the Quiz card is removed (quiz stays reachable via the header nav, the big
  Quiz Topics section, and the mode cards). The earlier per-visit shuffle was dropped since
  the owner now specifies an exact order; the unused shuffle helper was deleted.
- **Verification:** DOM tile order = riddle-mcq → image-riddles → games → jokes (no quiz
  tile); mode-cards unit tests updated and green (5/5); `tsc --noEmit` clean; production
  build regenerated and serving on port 3010.
- **Evidence:** `gui-test-screenshots/verify_023_cards_reordered_no_quiz.png`

### 2026-09-18 — Repaired quiz/riddle content imported; conformance verified; site restored

- **Scope:** completing the BUG-022–026 content fixes — loading the audited CSV set into
  the (wiped) database and restoring the site.
- **Actions:** ran `import-quiz-csv.ts` (11,541 questions across 12 subjects, 0 duplicates/
  errors) and `import-riddle-csv.ts` (3,000 riddles across 26 subjects / 10 categories,
  0 errors). Restored subject metadata the bulk import doesn't set (category, emoji) from
  the pre-wipe backup dump — the home page regroups correctly again.
- **Conformance of the imported set (DB-verified):**
  - Quiz: 2,291 easy / 2,791 medium / 2,366 hard / 2,251 expert / 1,842 extreme —
    **0 unwinnable rows** (no correct letter outside the 2/3/4-option display), 0 missing
    letters, extreme rows all carry typed answers, **0 duplicate questions**.
  - Riddle: 1,010 easy / 1,287 medium / 480 hard / 223 expert open-ended — **0 unwinnable**
    (no correct letter outside the 2/3/4 display), **0 duplicate questions**.
- **Site verified:** home page groups subjects correctly again (Academic 5 /
  Entertainment & Culture 5 / Professional & Life 2, per-subject counts shown)
  (`verify_022_home_subjects_restored.png`, `verify_022_home_groups_restored.png`).
- **Remaining:** live site still empty — push the local content to production via
  `scripts/push-content.mjs --apply` (dry-run first; needs the production API base +
  admin credentials in `scripts/content-push.env`).
- **Evidence:** `gui-test-screenshots/verify_022_*.png`, import logs `/tmp/quiz-import.log`,
  `/tmp/riddle-import.log`

### 2026-09-18 — Follow-up: subject-level mode selection + riddle design parity requests

- **Scope:** quiz-mcq subject → mode-selection flow, riddle-mcq subject card design,
  riddle-mcq mode section defaults
- **Method:** owner-reported change requests (no analysis performed)
- **Result:** three items filed — BUG-027 (mode selection inline under each quiz subject,
  first 2 open by default, others openable, play directly from the subject and drop the extra
  page + click layer), BUG-028 (riddle subjects adopt the quiz 2-column card design),
  BUG-029 (riddle Normal + Timer mode sections both open by default — currently only one is).
  Owner instruction: analyze first, then implement. Listing only.
- **Bugs filed:** BUG-027, BUG-028, BUG-029
- **Evidence:** none

### 2026-09-18 — Old quiz/riddle content removed from the database (owner directive)

- **Scope:** ALL quiz-mcq + riddle-mcq content rows removed as step one before the
  spec-conforming re-import (owner: "lets remove all the quiz-mcq, riddle-mcq content from
  the website, first").
- **Found:** production content tables were ALREADY empty (parallel content session had
  wiped them — verified questions/chapters/subjects/riddle_mcqs/riddle_subjects/
  riddle_categories = 0; fresh 15 KB backup confirms). Local dev DB still held the full old
  set (12,032 questions / 149 chapters / 13 subjects / 3,000 riddles / 26 subjects /
  10 categories).
- **Actions:** local dump backup first
  (`/tmp/local-db-backup/local_aiquiz_20260918_precontentclear.sql`, 7.5 MB), then deleted
  all six tables locally in FK order. Verified 0 everywhere. Live API confirmed empty:
  quiz subjects `{"data":[],"total":0}`, riddle subjects `[]`.
- **Safety:** full pre-wipe database backups exist — prod
  `/opt/quiz-backups/quiz_db_20260917_060306.sql.gz` (2.2 MB, with content) + nightly
  retention + the local dump above.
- **Note:** `GET /quiz-mcq/questions/count` returns 500 on the now-empty table (minor
  robustness gap on empty content — logged for follow-up). Live site plays empty until the
  repaired content set is imported.
- **Next:** import the repaired CSVs locally (hash-deduped importer), audit, then push to
  live via `scripts/push-content.mjs --apply`.
- **Evidence:** curl transcripts (live API empty responses).

### 2026-09-17 — Games bugs BUG-017 – BUG-021 resolved and verified

- **Scope:** the five owner-reported game defects; strictly games files
  (`public/games/<slug>/`), no other files touched.
- **Fixes:**
  - BUG-017 sliding-puzzle: `--gap: 0` + tile radius 0 (tiles sit flush, no gap);
    reference thumbnail moved out of the board shell into its own in-flow slot above the
    board (`pic-preview` repositioned, never covers the container).
  - BUG-018/020 hurdle-runner + spirit-runner (+ flying-snake after owner feedback):
    full-screen canvas — `fitCanvas` fills the stage and the logical world flexes to the
    viewport aspect via live view-size setters (uniform scale); canvas card framing removed;
    the page paints the live sky gradient so any margin blends.
  - BUG-019: all in-game back-links unified to "← All games" → `/games` (the game listing)
    — 6 games pointed at `/play`.
  - BUG-021 memory-quiz: (1) answering a question reveals the whole board
    (`setBoardHidden(false)` in gradeHit/gradeMiss); (2) the Level-clear card shows a gallery
    of all board items (`#clear-items` chips); (3) expired questions are counted and block
    the next level — "Next level" hidden, Retry offered, note shown (`#clear-timeout-note`).
- **Verification (live, screenshots):** BUG-017 — picture-mode round with flush tiles
  (`gap: 0px`, radius 0px) and the preview above/outside the board
  (`verify_017_picture_mode.png`); BUG-018/020 — body paints the sky gradient at boot in
  menu and play (`verify_018020_*_sky.png`); BUG-019 — back-link reads "← All games" →
  `/games`; BUG-021 — one live state shows the item gallery, the unanswered gate with
  Next-level hidden, and the revealed board (`verify_021_reveal_on_click.png`).
- **Owner feedback round:** the first full-screen attempt (page sky-paint) was rejected —
  the owner wants the game asset itself full screen. Escalated to a full-canvas fix:
  `fitCanvas` fills the stage, `core.js` exports `setViewW` so the logical world flexes to
  the viewport aspect (uniform height-anchored scale — jump physics unchanged), stage
  padding zeroed, back-link overlaid. Verified in a live run.
- **Owner feedback round 2:** "back to all games is hidden with the game canvas" — the
  overlay link rendered as faint gray text over the sky (unreadable). Restyled as a
  high-contrast pill (dark translucent background, white text, blur, z-index 30) offset to
  the right of the in-game pause chip (no overlap: pill x≥72, chip ends x≈60). Click-through
  to `/games` verified.
- **BUG-027 resolved (owner-approved lean scope):** chapter cards on the "Select Chapter"
  page now carry two quick-start buttons — "▶ Play" (practice, defaults: all levels, 10
  questions) and "⏱ Timer" (30 s per question) — landing straight in question 1 via
  `&autostart=1` on the play route (skips the intro; the resume modal still protects saved
  sessions). The card's main click still opens the full mode/difficulty setup. Verified:
  Play → Q1 directly, Timer → countdown chip active
  (`verify_027_chapter_cards_quickplay.png`, `verify_027_quickplay_lands_q1.png`,
  `verify_027_timer_quickplay.png`).
- **Owner feedback round 3:** extended the full-screen treatment to the remaining DOM games
  (tic-tac-toe, memory-quiz, sliding-puzzle, word-puzzle) — `.app` column caps removed
  (26–30rem → none) and boards rescaled for large screens (tic-tac-toe 25rem cap off;
  memory cells 112→160px; sliding board 25rem cap off, height share 60→72dvh; word-puzzle
  board cap 24→32rem). tap-or-dont-tap was already full-screen (`#game-root` fixed inset-0).
  Verified all four fill the viewport width and the sliding board renders 526×526 in play
  (`verify_017_sliding_board_fullscreen.png`).
- **Bugs closed:** BUG-017, BUG-018, BUG-019, BUG-020, BUG-021
- **Evidence:** `gui-test-screenshots/verify_017_*.png`, `verify_018020_*.png`,
  `verify_018_flying_snake_gameplay.png`, `verify_021_*.png`, `games_smoke_*.png`, `verify_018_hurdle_gameplay_fullscreen.png`,
  `verify_020_spirit_gameplay_fullscreen.png`

### 2026-09-17 — Games scope sweep: all 8 games + hub smoke-tested (no new bugs)

- **Scope:** the games-related findings (BUG-011, BUG-015 — both Fixed) re-verified, plus a
  playability smoke test of every static game. Per instruction, nothing outside the games
  files was touched.
- **Method:** programmatic asset-integrity scan (every src/href reference in each game's
  index.html resolved against disk), HTTP checks of all hub hrefs, and in-browser gameplay
  smoke tests (menu → start → surface, with interaction where feasible).
- **Result:** all 8 games (flying-snake, hurdle-runner, memory-quiz, sliding-puzzle,
  spirit-runner, tap-or-dont-tap, tic-tac-toe, word-puzzle) load with 200 + correct titles
  through the hub links, all referenced assets resolve, and each enters playable state:
  tic-tac-toe verified to the move level (player X + computer O response),
  memory-quiz reaches its memorize phase, spirit-runner confirmed in live gameplay
  (`games_smoke_spirit-runner_gameplay.png`), remaining games start with visible surfaces
  (`games_smoke_*.png`). The only `/play` references flagged by the scan are absolute site
  routes to the Play Hub — correct by design. **No new bugs; no code changes needed.**
- **Evidence:** `gui-test-screenshots/games_*.png`

### 2026-09-17 — pop-culture de-hint pass (manual-check follow-up)

- **Scope:** quiz-csv/pop-culture-celebrities.csv — the manual file-by-file review found
  658 of 1,000 questions printed their answer as a second "hint" segment
  ("Who sang Budapest? George Ezra?").
- **Method:** scripted suffix removal (keep the standalone question, options/answers
  untouched), then manual read of the changed questions + leaked-template token scan.
- **Also fixed:** 2 questions with leaked generator text ("again confirm"), the Taylor
  Swift/Scottsdale row, ambiguous animals acorns question, history Máximo Gómez → José
  Martí wrong answer, IBM apostrophe; 4 cross-file duplicate questions created by the
  rephrasing were dropped (originals kept in movies-tv / technology-video-games).
- **Result:** pop-culture now 996 rows, audit clean, no self-answering questions remain.
- **Evidence:** `scripts/csv-quality-report.txt` (final)

### 2026-09-17 — Subject-by-subject CSV repair completed (all 22 files)

- **Scope:** 12 quiz subject files (11,545 rows after dedup) + 10 riddle category files
  (3,000 rows); repairs close BUG-022 – BUG-026.
- **Method:** scripted per-subject pipeline (`scripts/repair-quiz-subject.py`,
  `scripts/repair-riddles.py`) + mechanical invariance regression against git HEAD
  (9,701 quiz MCQ + 1,842 quiz open-ended + 2,747 riddle MCQ rows verified to grade to
  the same answer text as the originals) + manual fact-check sampling (24 rows) +
  full audit re-run (`scripts/audit-csv-quality.py`).
- **Incident during the pass:** the first repair build had a slice-copy bug (letters were
  rebalanced without moving option texts). Caught during manual sampling, all quiz CSVs
  restored from git and re-run through the corrected pipeline; invariance check added so
  the class of bug is mechanically excluded. Riddle files were unaffected.
- **Result:** all five content bugs fixed and verified; remaining audit classes are
  accepted-by-design families (either-or phrasing, detective suspects, hard distractor
  pairs, long mysteries). `.tmp-sports-*.csv` shards deleted.
- **Bugs closed:** BUG-022, BUG-023, BUG-024, BUG-025, BUG-026
- **Evidence:** `scripts/csv-quality-report.txt` (final), `scripts/audit-csv-quality.py`

### 2026-09-17 — CSV content quality audit (quiz-mcq + riddle-mcq)

- **Scope:** all 12 `quiz-csv/*.csv` subject files (11,700 rows) and all 10
  `plan/imports/riddle-mcq/*.csv` category files (3,000 rows); importer behavior in
  `apps/backend/src/database/import-quiz-csv.ts` and `import-riddle-csv.ts` verified
  read-only, plus frontend open-ended grading (`quiz-mcq-scoring.ts`, `riddle-scoring.ts`).
- **Method:** scripted audit (`scripts/audit-csv-quality.py`, report in
  `scripts/csv-quality-report.txt`) + manual sample reads + code analysis.
- **Design rule confirmed with owner:** quiz `extreme` rows and riddle `expert` rows are
  OPEN-ENDED (typed answer graded by normalized text compare) — missing options on those
  rows are by design, not a defect.
- **Result:** 6 findings recorded (BUG-022 – BUG-026). Fix approach agreed with owner:
  subject-by-subject CSV repair, verify each subject before moving to the next.
- **Bugs filed:** BUG-022, BUG-023, BUG-024, BUG-025, BUG-026
- **Evidence:** `scripts/csv-quality-report.txt`

### 2026-09-17 — Owner game reports (5 new findings logged)

- **Scope:** owner reported five game issues via chat; logged as BUG-017 – BUG-021 (all Open).
- **Findings logged:**
  - BUG-017 — sliding puzzle: no gap between moving blocks; reference picture outside the
    sliding container.
  - BUG-018 — hurdle runner: background full screen (responsive to screen size).
  - BUG-019 — "All games" from inside a game should open the game listing page, not the Game hub.
  - BUG-020 — spirit runner: background full screen (responsive to screen size).
  - BUG-021 — memory quiz: reveal image on click; show clicked + all images on the
    congratulations screen; block advancing an unanswered question.
- **Status:** reported only — not yet reproduced or fixed locally.

### 2026-09-17 — Security hardening + full manual re-verification of touched features

- **Scope:** redundant-code scan over the whole fix footprint; security-parity check local
  vs live (pigzap.com); manual GUI verification of every touched feature.
- **Cleanup:** riddle code stated its 4-level truth — removed the dead `case 'extreme':`
  fall-through and `|| level === 'extreme'` from `RiddleTableRow.tsx` (the riddle DB enum
  has only easy/medium/hard/expert; zero extreme rows possible). Remaining `'extreme'`
  strings in riddle code are the deliberate internal alias for the open-ended text-input
  rendering state (documented, functional).
- **Security findings + fixes:**
  - API parity confirmed: local helmet set identical to `api.pigzap.com` (CSP, HSTS,
    nosniff, SAMEORIGIN, no-referrer); reset endpoint 401 unauthenticated (re-tested).
  - **Gap found & fixed:** the frontend sent **no security headers** on local or live
    (live's HSTS comes from Cloudflare, not the app). Added `X-Frame-Options: DENY`,
    `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
    `Permissions-Policy: camera=(), microphone=(), geolocation=()` for all routes in
    `next.config.mjs` (merged into the existing games Cache-Control rule — an intermediate
    duplicate-`headers()` mistake was caught by the routes-manifest check and fixed).
    Verified at runtime on `/`, `/faq`, and the games redirect chain.
  - Note: live currently serves `x-powered-by: Next.js` although the repo sets
    `poweredByHeader: false` — the deployed build predates that config; the next deploy
    will drop it.
- **Manual verification (all green):** BUG-001 auto-advance — answering Q1 auto-advanced to
  Q2 within ~3 s with no interaction (`verify_001_q1_answered.png`,
  `verify_001_auto_advanced_q2.png`), while an unanswered question stayed put for 5 s
  (negative case); BUG-004 end-to-end — bottom-nav Quiz tap navigates to `/quiz-mcq`
  (no drawer); drawer cleanup — no Theme row, Games link retained
  (`verify_cleanup_drawer_no_theme.png`); BUG-016 riddle hard question shows 4 options with
  working answer feedback (`verify_016_riddle_live_options.png`). Resume modal behavior
  also exercised (Start Fresh path).
- **Validation:** `tsc --noEmit` clean, `next lint` 0 errors, Jest 552/552, production
  build regenerated with headers confirmed in `routes-manifest.json` and at runtime.
- **Evidence:** `gui-test-screenshots/verify_001_*.png`, `verify_cleanup_drawer_no_theme.png`,
  `verify_016_riddle_live_options.png`, curl header transcripts.

### 2026-09-17 — BUG-012 executed on production + BUG-016 conformance analysis and riddle fix

- **Scope:** BUG-012 production analytics clear (owner authorized "resolve other findings",
  legal pages deferred); BUG-016 quiz/riddle option-count conformance.
- **Method / actions:**
  - BUG-012: SSH'd to the VPS (root@207.180.199.86), took a fresh verified backup
    (`/opt/quiz-backups/quiz_db_20260917_060306.sql.gz`, 2.2 MB), then ran the same SQL as
    the admin reset: `TRUNCATE analytics_events` (919 rows) + zeroed guest play counters.
    Post-clear count = 0; content untouched (12,032 questions / 3,022 riddles verified).
  - BUG-016 quiz UI: `AnswerOptions` verified conforming (easy 2 / medium 2 / hard 3 /
    expert 4 / extreme text input).
  - BUG-016 quiz content (dev DB = prod content, 12,032 rows): **5,031 published questions
    are unwinnable as displayed** — 1,456 easy + 3,072 medium have correctLetter C/D (hidden
    by the 2-option display), 503 hard have correctLetter D. Per-subject × level counts are
    far from the 200/level/subject target (e.g. Animals 371 easy vs 25 hard; Space 4-7 per
    level). Content regeneration to spec remains owner content-ops, as stated in the entry.
  - BUG-016 riddle: backend/content verified conforming — 0 unwinnable rows (no easy correct
    C/D, no medium correct D), 0 duplicate questions, expert rows (130) correctly open-ended;
    the admin editor already authored 2/3/4. The player UI was the gap: shared
    `AnswerOptions` applied the quiz mapping (2/2/3) to riddles. Fixed with a game-aware
    option-count map (`game="riddle"` → easy 2 / medium 3 / hard 4), verified live in a real
    riddle session (medium riddle shows 3 options) and by new unit tests.
- **Validation:** `tsc --noEmit` clean, `next lint` 0 errors, Jest 552/552 green (incl.
  updated `riddle-card.test.tsx` + `answer-options.test.tsx` riddle-spec tests), production
  build regenerated and running on port 3010.
- **Bugs resolved:** BUG-012 (prod executed), BUG-016 (code + analysis done; content
  regeneration remains owner content-ops). BUG-005 deferred by owner.
- **Evidence:** `gui-test-screenshots/verify_016_riddle_card_options.png`

### 2026-09-16 — Cleanup + security pass over the fix footprint

- **Scope:** every file touched by the resolution sweep.
- **Cleanup:** caught and fixed a real regression from the debugging bisect —
  `NavigationProgress.tsx` had silently reverted to its old implementation (the stash
  round-trip dropped the fix); the BUG-014 implementation (start delay + minimum display +
  popstate) is re-applied. Removed the now-duplicated theme-toggle rows from the mobile menu
  drawer and the admin mobile menu (the toggle lives in the mobile top bar since BUG-009);
  deduplicated two pre-existing repeated Tailwind classes in `Header.tsx`. No other orphans:
  no references remain to the removed MobileFooter drawer machinery, and lint reports zero
  unused-symbol errors in touched files.
- **Security review (touched parts):** `POST /admin/analytics/reset` — verified enforced:
  unauthenticated POST → 401 (JwtAuthGuard), AdminGuard role check + `{ confirm: "RESET" }`
  body gate behind it; auth is header-based JWT (CSRF-immune), helmet present. New settings
  fields validated (`IsString`+`MaxLength(2000)` / `IsBoolean`) under a strict global
  ValidationPipe (`whitelist` + `forbidNonWhitelisted`). Logo/favicon URLs render through
  `resolveMediaUrl`, which prefixes non-http(s) schemes — tested `javascript:` and `data:`
  payloads and both become inert same-origin paths (no XSS). GA measurement ID is now
  format-guarded before being placed into the inline script. Games redirect uses a
  single-segment slug to a same-origin destination (no open-redirect/traversal surface).
  FAQ/legal content is static; no user input rendered unescaped anywhere in the touched UI.
- **Verification:** `tsc --noEmit` clean, `next lint` 0 errors, full Jest suite 546/546
  green, production build regenerated and running on port 3010.
- **Evidence:** curl transcripts in the session log; `NavigationProgress.tsx` diff.

### 2026-09-16 — Post-fix manual verification pass (prod-mode local build)

- **Scope:** all 13 fixes from the resolution sweep, re-driven in the browser after a
  production-mode local build (`next build` + `next start`, port 3010).
- **Method:** GUI click-through where the pane accepted input, DOM/DOM-tree assertions and
  screenshots otherwise, plus direct API/SQL reads. Note: the in-app browser pane's
  `document.hasFocus()` stays false while it is not the frontmost window, and synthetic
  clicks on an unfocused pane land unreliably — Link navigation was proven healthy on the
  **production site in the same pane** (pigzap.com link click navigated) and via
  `router.push` rendering locally, so the local click failures were pane focus, not app code.
- **Result (live-verified):** BUG-003 exclusive accordion (click Timer → Practice collapses,
  aria-expanded flips, `verify_003_exclusive_accordion.png`); BUG-014 progress bar visible
  along the top edge during navigation with `#nprogress` in DOM
  (`verify_014_progress_a/b.png`); BUG-015 game chain — hub shows 8 cards with
  `/games/<slug>/index.html` hrefs, following a card loads the real game, no 404
  (`verify_015_games_hub.png`); BUG-009 toggle present in the mobile top bar
  (`verify_mobile_header_bottomnav.png`); BUG-002/004 bottom nav = 7 items
  Home/Quiz/Riddles/Images/Jokes/Games/Menu as direct links; BUG-006 FAQ renders with 8 Q&As,
  JSON-LD, title "FAQ | AI Quiz", footer link (`verify_006_faq_page.png`); BUG-005 privacy
  page shows full drafted content, zero PLACEHOLDER text (`verify_005_privacy_drafted.png`);
  BUG-012 homepage statistics all read 0 after the dev reset
  (`verify_012_home_stats_zeroed.png`); BUG-013 no googletagmanager scripts and no init
  script when the env is unset; BUG-007/010 `/settings/public` exposes `logoDark`,
  `mobileLogo`, `mobileShowSiteName`; dark-mode mobile header renders correctly
  (`verify_010_mobile_dark_logo.png`).
- **Result (needs a human click on a focused pane):** BUG-001's 3-second auto-advance timing
  in a live quiz run — logic is event-driven, type-checked, and unit-covered at the hook
  level; BUG-004's end-to-end bottom-nav navigation — the items are plain `<Link>`s proven
  identical to the header links that navigate on production.
- **Environment:** frontend left running in **production mode** (`NEXT_DIST_DIR=.next.prod-build
npm run start`, port 3010); `npm run dev` was stopped. NOTE: `next dev` on this machine
  currently exhibits non-navigating Link clicks in the automation pane (works on prod build
  and on pigzap.com) — if seen, use a prod-mode run or a normal browser before blaming code.
- **Bugs verified:** BUG-002, BUG-003, BUG-004 (render), BUG-005 (draft), BUG-006, BUG-007,
  BUG-009, BUG-010, BUG-012 (dev), BUG-013, BUG-014, BUG-015; BUG-001 pending manual timing pass
- **Evidence:** `gui-test-screenshots/verify_*.png`

### 2026-09-16 — Resolution sweep: fixes applied for BUG-001 – BUG-015

- **Scope:** code fixes for every open bug except the ones that need owner action
  (BUG-005 legal sign-off, BUG-012 production data clear) and the newly listed BUG-016
  analysis task.
- **Method:** implemented fixes across frontend + backend; verified with `tsc --noEmit`
  (both packages clean), `next lint` (no errors in touched files), the full frontend Jest
  suite (32 suites / 546 tests green, incl. a new `mode-cards.test.tsx` covering the
  BUG-003 accordion behavior), curl probes of the running dev server (games redirect chain
  - relative assets, /faq, legal pages), and GUI spot-checks in the in-app browser (mobile
    top-bar toggle works, bottom nav renders 7 items with Games, a game opens from the hub).
    The browser pane's synthetic input died mid-session (buttons/links stop responding even on
    unmodified HEAD code with a fresh `.next` build — pane defect, not app); the remaining
    interaction checks (auto-advance reveal timing, progress-bar flash, bottom-nav navigation
    end-to-end) are covered by code review + unit tests and should get a quick manual pass on
    a live pane.
- **Result:** 13 bugs fixed (BUG-011's hub 404 had already been fixed by the redeploy).
  Left open on purpose: BUG-005 (owner legal sign-off), BUG-012 (production data clear —
  admin reset capability built; local dev data cleared; production untouched), BUG-016
  (listed only, analysis not started).
- **Bugs fixed:** BUG-001, BUG-002, BUG-003, BUG-004, BUG-006, BUG-007, BUG-008, BUG-009,
  BUG-010, BUG-011, BUG-013, BUG-014, BUG-015
- **Evidence:** `gui-test-screenshots/fix_*.png`; `src/__tests__/mode-cards.test.tsx`

### 2026-09-16 — Follow-up: 5-level option-count spec conformance request

- **Scope:** quiz-mcq and riddle-mcq — level structure, per-level option counts, content
- **Method:** owner-reported work request (no analysis performed)
- **Result:** filed as BUG-016 with the owner's target spec embedded. Listing only; the
  code/content conformance analysis has not been started.
- **Bugs filed:** BUG-016
- **Evidence:** none

### 2026-09-16 — Manual verification sweep of BUG-001 – BUG-014 (local GUI + live site)

- **Scope:** every open bug; local dev (frontend 3010 / backend 3012; desktop 1440×900 and
  mobile 390×844; dark and light themes) plus the live site
- **Method:** black-box GUI click-through in the in-app browser with screenshot evidence in
  `gui-test-screenshots/`; read-only curl probes of production; read-only SQL counts for the
  analytics stores. No fixes applied; BUG-012 NOT executed (destructive — scope sign-off still
  pending).
- **Result:** 12 of 14 confirmed or root-caused as described. Two are already resolved in the
  current build (BUG-002 desktop half and the BUG-011 hub 404 — the 2026-09-16 redeploy fixed
  both); BUG-008 was not reproduced at phone width; BUG-009's toggle works (discoverability
  issue, not breakage). One new defect found and filed as BUG-015 (game cards 404). Two
  transient anomalies observed (unexpected document loads of `/quiz-mcq/practice-mode` after
  client-side navigations) — not reproducible on a direct `/play` load, likely dev/test-harness
  quirks; flagged for follow-up, not filed as bugs. Console logs could not be collected with
  the test tooling; findings rely on page state + screenshots.
- **Bugs verified:** BUG-001 – BUG-014; filed BUG-015
- **Evidence:** `gui-test-screenshots/bug001_* … bug014_*.png` (referenced per entry)

### 2026-09-16 — Follow-up: top progress bar request

- **Scope:** page-open loading indicator, all pages / all devices
- **Method:** owner-reported work request (no testing performed)
- **Result:** filed as BUG-014. Listing only.
- **Bugs filed:** BUG-014
- **Evidence:** none

### 2026-09-16 — Follow-up: analytics reset + GA/GSC connectivity requests

- **Scope:** stored analytics data; Google Analytics / Search Console connection status
- **Method:** owner-reported work requests (no testing performed)
- **Result:** two items filed — BUG-012 (clear stored analytics data), BUG-013 (verify
  GA + Search Console connectivity). Listing only; neither executed.
- **Bugs filed:** BUG-012, BUG-013
- **Evidence:** none

### 2026-09-16 — Follow-up: Games 404 report

- **Scope:** Games entry from the user side (home tile / navigation)
- **Method:** manual click-through, owner-reported
- **Result:** clicking Games lands on the 404 page ("Page Not Found — Oops! The page you're
  looking for doesn't exist or has been moved."). Filed as BUG-011. Listing only.
- **Bugs filed:** BUG-011
- **Evidence:** none captured

### 2026-09-16 — Manual QA bug sweep (desktop + mobile)

- **Scope:** quiz answer flow, footer menu/navigation, mode selection page, legal pages, FAQ,
  mobile header/branding, light/dark theme toggle, dark-mode logo
- **Method:** manual testing, owner-reported observations
- **Result:** 10 findings recorded under Open (BUG-001 – BUG-010). Listing only — no fixes
  applied per owner instruction.
- **Bugs filed:** BUG-001 – BUG-010
- **Evidence:** none captured this session

_(template for new sessions:)_

```markdown
### 2026-09-16 — <session title, e.g. GUI smoke test of quiz flow>

- **Scope:** <pages / features tested>
- **Method:** <manual browser / GUI automation / API checks>
- **Result:** <what passed; what failed>
- **Bugs filed:** <BUG-XXX ids, or "none">
- **Evidence:** <screenshot filenames / notes in `gui-test-screenshots/`>
```

---

## Open

### BUG-005 — Legal pages not finalized

- **Date found:** 2026-09-16
- **Area:** Legal pages
- **Priority:** P1
- **Reported:** Legal pages need to be finalized (content review + sign-off).
- **Status:** DEFERRED by owner (2026-09-17). Drafts were completed 2026-09-16 — the
  PLACEHOLDER banners are gone and both pages carry full copy reflecting the site's actual
  practices (guest IDs, account data, first-party truncated-IP analytics, local-storage
  prefs, newsletter, comments). Re-opens only for the final legal review + sign-off when the
  owner resumes it.

### BUG-028 — Riddles: same 2-column subject style/design as quiz

- **Date found:** / **Date fixed:** 2026-09-18
- **Area:** riddle-mcq subjects (design parity with quiz-mcq)
- **Priority:** P2
- **Fix:** "Browse by Category" cards restyled to the quiz subject-card design — 2-column
  grid (`grid-cols-2 gap-4 sm:grid-cols-3`, same as the quiz picker) with the green
  "✓ N riddles" count treatment.
- **Verified:** 3 columns at desktop / 2 at base, counts styled like quiz cards
  (`verify_028_riddle_categories_2col.png`; computed grid `288px 288px 288px`).

### BUG-029 — Riddle MCQ: Normal and Timer mode sections open by default

- **Date found:** / **Date fixed:** 2026-09-18
- **Area:** riddle-mcq mode selection
- **Priority:** P2
- **Fix:** `ModeLevelPicker` — Normal Mode and Timer Mode now both render expanded by
  default (independent collapsible sections; the `defaultMode`-driven exclusive init was
  removed along with the unused prop and `parseModeParam` call).
- **Verified:** both sections `aria-expanded: true` with their difficulty grids visible on
  load (`verify_029_riddle_modes_both_open.png`).

### BUG-030 — Sliding puzzle: moved block not fully adjusted until next move

- **Date found:** 2026-09-18
- **Area:** Games — sliding-puzzle
- **Priority:** P2
- **Reported:** After moving a slide, it renders as an "active" block that is not fully
  adjusted/aligned with the surrounding blocks; only when another block is clicked does the
  previous one settle fully into place. Owner wants all blocks fully adjusted at all times.

### BUG-031 — "All games" back button only visible when the game is paused

- **Date found:** 2026-09-18 (reported 07:57)
- **Area:** Games — in-game back navigation ("All games")
- **Priority:** P2
- **Reported:** The "All games" back button is only visible while the game is paused; it is
  not available during normal play (expected: reachable at all times — confirm placement
  when picked up).

### BUG-032 — Runner game: runner sits too far left; bring to the middle

- **Date found:** 2026-09-18 (reported 08:00)
- **Area:** Games — runner games (hurdle-runner / spirit-runner; exact game not specified)
- **Priority:** P2
- **Reported:** The runner character is positioned too far to the left of the view; owner
  wants the view adjusted so the runner sits around the middle part.

### BUG-033 — Mobile: runner invisible in hurdle-runner and spirit-runner

- **Date found:** 2026-09-18 / **Date fixed:** 2026-09-18
- **Area:** Games — runner games (hurdle-runner, spirit-runner) on mobile view
- **Priority:** P1
- **Reported:** In mobile view the runner character is invisible in both runner games,
  leaving the game without its main actor on phones.
- **Note:** check interaction with the BUG-032 fix (runner x moved from 25% to 45% of the
  world, PLAYER_X 225 → 405) — verify whether the reposition pushes the runner outside the
  mobile viewport/camera before changing anything.
- **Fix:** the filing's suspicion was correct — the fixed `PLAYER_X = 405` sat outside the
  flexing portrait world (aspect < 0.81 put the runner past the right edge). `PLAYER_X` is
  now re-derived on every resize: 45 % of the live world width, capped at 405, via the same
  live-binding setter pattern as `VIEW_W` (`setPlayerX` in core.js, called from fitCanvas).
  Portrait phones draw the runner at 45 % of the narrow world; desktop unchanged. Verified
  in the browser at 390×844 (actor visible mid-screen in both games) and 844×390 (position
  identical to the BUG-032 look); 79/79 runner tests pass. Evidence:
  `gui-test-screenshots/bug033_*.png` (repro) and `fix_bug033_*.png` (fixed).

### BUG-034 — "All games" pill: hide during gameplay, show only when paused

- **Date found:** 2026-09-18 / **Date fixed:** 2026-09-18
- **Area:** Games — in-game back navigation ("All games" pill)
- **Priority:** P2
- **Reported:** Owner directive: hide the "Back to all games" button while gameplay is on;
  only display it when the game is paused.
- **Note:** supersedes the BUG-031 fix, which deliberately made the pill visible and
  clickable during active play — that behavior is to be reversed to paused-only visibility.
- **Fix:** applied to the 3 canvas games that overlay the pill on the playing surface
  (hurdle-runner, spirit-runner, flying-snake). `showScreen(mode)` now toggles a
  `.back-link.hidden` rule: the pill is hidden while `mode === 'playing'` (snake also
  while the brief `dying` crash transition) and back on every other state — paused,
  menu, ready, game-over. The 5 DOM games keep their in-flow links (no canvas, no pause
  mechanic — nothing to hide). Anchor got `id="back-link"`; registered in els per the
  codebase's getElementById convention.
- **Verified (live, IDE browser pane on 3010):** hurdle-runner pill visible in menu,
  hidden mid-run, visible over the Paused overlay, visible on game-over;
  spirit-runner menu/playing/paused likewise; flying-snake menu/ready visible and pill
  hidden in flight (its only pause trigger is the tab going hidden — same showScreen
  path, not synthesizable from the pane). Evidence:
  `gui-test-screenshots/fix_bug034_*.png`.

### BUG-027 - Quiz: mode selection inline under each subject chapter (first 2 open)

- **Date found:** / **Date fixed:** 2026-09-18
- **Area:** quiz-mcq subjects/chapters (subject -> mode-selection flow)
- **Priority:** P2
- **Fix:** chapter cards on the "Select Chapter" page embed the full mode + difficulty
  selection inline - Normal Mode and Timer Mode sections with 4 difficulty chips each
  (per-level counts shown; Extreme dimmed at 0) - navigating straight to that mode+level's
  play session. First 2 chapters render expanded by default; every header toggles its panel.
- **Verified:** live - chips carry per-level counts and open the correct play session
  (`verify_027_inline_full_selection.png`, `verify_027_chip_leads_to_play.png`).

_(moved entries keep their **Verified** evidence lines; add **Date fixed** and **Fix** at
the top.)_
