# QA Findings — Bug Tracker (OPEN ITEMS ONLY)

> **Policy (owner, 2026-09-19/20):** this file lists **open work only**. Resolved findings and
> logs are removed once fixed — resolved behaviours are documented in their respective feature
> files under `plan/` (quiz/riddle refinements in `plan/02`/`plan/03` §6; question engagement in
> `plan/17-question-engagement.md`); full history lives in **git history** (`git log --grep=BUG`).
> Verification screenshots remain in `gui-test-screenshots/`.
> Priority basis: **P0** = critical/broken · **P1** = major gap · **P2** = integration/quality ·
> **P3** = polish.
> **Ordering rule (owner, 2026-09-20):** entries stay strictly chronological — **oldest on top,
> latest at the bottom**, in the exact order they were reported. Never grouped by feature/area
> and never re-sorted.

## Index

| ID      | Title                                                                              | Area                     | Pri | Status           |
| ------- | ---------------------------------------------------------------------------------- | ------------------------ | --- | ---------------- |
| TASK-01 | Question-likes do not survive a refresh                                            | engagement               | P1  | Fixed 2026-09-22 |
| TASK-02 | Analytics ingest retry can double-count events (C4)                                | analytics                | P1  | Fixed 2026-09-22 |
| TASK-03 | BE-09 CSV leakage/ambiguity repairs + re-audit                                     | content data             | P1  | Fixed 2026-09-22 |
| TASK-04 | H8 remainder: CSP nonces + HttpOnly token storage                                  | security                 | P2  | Open             |
| TASK-05 | Bulk import lacks status (image riddles, jokes) / hint (riddles)                   | import (3 modules)       | P2  | Open             |
| TASK-06 | Analytics gaps: A5 events, A10 resume, A7 anchor, C1 purge, C2 tests, C3 cache     | analytics                | P2  | Open             |
| TASK-07 | Analytics deferred: funnels, accuracy join, retention tests, ops metrics           | analytics                | P3  | Open             |
| TASK-08 | 10 TODO/FIXME markers in src                                                       | code cleanup             | P3  | Open             |
| TASK-09 | Games debt: AA contrast, reduced-motion, focus, daily picture, phone QA            | games                    | P3  | Open             |
| TASK-10 | Dad jokes: saved jokes, JotD SSR, trending + share buttons                         | jokes (decision)         | P2  | Open             |
| TASK-11 | SEO: RSC landing pages, per-content routes, JSON-LD, OG, audit panel               | seo (decision)           | P2  | Open             |
| TASK-12 | Comments on quiz/riddle content (decision)                                         | comments (decision)      | P3  | Open             |
| TASK-13 | SEC-07 email-verification gate (decision)                                          | auth (decision)          | P2  | Open             |
| TASK-14 | SEC-10/12 signed guest token for anonymous writes (decision)                       | security (decision)      | P2  | Open             |
| TASK-15 | H1 server-side grading phase 2c (decision)                                         | security (decision)      | P1  | Open             |
| TASK-16 | Admin user-mgmt UI; dashboard unification; guest-users activity                    | admin (decision)         | P3  | Open             |
| TASK-17 | Installability: full manifest / theme-color (decision)                             | pwa (decision)           | P3  | Open             |
| TASK-18 | H9 rotate credentials + SSH/secrets hygiene                                        | ops (owner)              | P1  | Open             |
| TASK-19 | H6 restrict origin firewall to Cloudflare IPs                                      | ops (owner)              | P1  | Open             |
| TASK-20 | OPS-19 off-box backup replication + restore drill                                  | ops (owner)              | P2  | Open             |
| TASK-21 | OPS-21 uptime/error alerting wiring                                                | ops (owner)              | P2  | Open             |
| TASK-22 | R2: confirm upload, custom domain, migrate media, token hygiene                    | media (owner)            | P2  | Open             |
| TASK-23 | Deferred by owner (no action unless re-opened)                                     | various                  | P3  | Deferred         |
| TASK-24 | Memory Quiz: grid-answer questions (where/swap) unanswerable by tap                | games / memory-quiz      | P1  | Fixed 2026-09-22 |
| TASK-25 | Memory Quiz: swap reveal announced the pre-swap layout                             | games / memory-quiz      | P2  | Fixed 2026-09-22 |
| TASK-26 | Memory Quiz: level-clear crash (focus on undefined btnRetry2)                      | games / memory-quiz      | P2  | Fixed 2026-09-22 |
| TASK-27 | Shared question link should land on that question (others skipped, opt-in to play) | share / play (deep link) | P2  | Fixed 2026-09-22 |

---

## Open

### TASK-01 - Question-likes do not survive a refresh - FIXED 2026-09-22

- **Fixed 2026-09-22:** persistence was already shipped in `5ee5ab7`/`2c86cfc`
  (question_likes table + per-guest unique constraint + `/question-likes/my` restore).
  Verified end-to-end: API (POST -> persisted row -> GET /my true -> dedupe
  alreadyLiked=true) AND Playwright UI (like Q1 -> refresh -> Resume -> same question
  restored with the heart filled and the public count shown).

### TASK-02 - Analytics ingest retry can double-count events - FIXED 2026-09-22

- **Fixed 2026-09-22:** client mints a `clientEventId` (uuid v4 + fallback chain) once per
  queued event; flush/beacon/re-queue reuse it. Backend accepts optional `clientEventId`
  (varchar(64), unique index `uq_analytics_events_client_event_id`), dedupes in-batch,
  pre-filters stored ids, and degrades to row-by-row on a 23505 race. Reply is now
  `{accepted, rejected, skipped}`; side effects fire only for accepted rows. Migration
  `1793100000000-AddAnalyticsClientEventId` applied to the dev DB.
- **Verified:** analytics.service.spec.ts 8/8; full backend suite 117 tests; live
  double-POST `{accepted:2}` then `{accepted:0,skipped:2}`; DB count 2 (not 4).
  Two inert `test_idem_recheck` probe rows remain in analytics_events (retention purge
  C1 ages them out; deletion was blocked by the ops safety guard).

### TASK-03 - BE-09 CSV leakage/ambiguity repairs + re-audit - FIXED 2026-09-22

- **Fixed 2026-09-22:** `scripts/repair-be09-csv.py` (idempotent, line-splice) repaired the
  9 pop-culture-celebrities rows (CJK mojibake + literal "none skip" fragments) and
  reworded food-cooking ID 378 (the one true leak: "Gouda cheese is named after which
  Dutch city?"). `scripts/repair-be09-db.sql` applied the same 10 fixes to the serving DB,
  recomputing `content_hash` for the 2 retexted rows; both verified idempotent.
- **Re-audit:** true quiz answer-in-question count 436 -> 435 (the audit prints a capped
  400); CJK/none-skip defect rows in `questions` now 0.
- **Documented false positives (unchanged):** quiz "X or Y?" choice rows (381),
  true/false statements (1), brand-ask rows (~52), riddle logic/detective entity rows
  (171), Code-Breaking truncated distractors (20), hidden-word rows (4), A/B letter skew
  (expected; serve-time shuffle mitigates).
- **Deferred (owner decision):** 60 DB-only riddle questions exceed 220 chars (CSVs have
  30); list captured in the repair report - needs wording rewrites.
- **Pending (owner):** live push via `scripts/push-content.mjs` (dry-run first).

### TASK-04 - H8 remainder: CSP nonces + HttpOnly token storage

- **Date found:** 2026-09-22 (source: audit)
- **Area:** security / frontend
- **Priority:** P2
- **Reported:** baseline CSP ships with unsafe-inline; tokens sit in localStorage. Nonce the inline scripts; plan HttpOnly refresh cookies.

### TASK-05 - Bulk import lacks status / hint

- **Date found:** 2026-09-22 (source: plan/03, 04, 05)
- **Area:** import (3 modules)
- **Priority:** P2
- **Reported:** imported image riddles/jokes land DRAFT with no publish step; riddle bulk import drops hint (no hint button / hint_used analytics).

### TASK-06 - Analytics coverage gaps

- **Date found:** 2026-09-22 (source: plan/13: A5, A7 partial, A10, C1, C2, C3, D1)
- **Area:** analytics
- **Priority:** P2
- **Reported:** no content_viewed/search_performed events; resume-prompt decisions untracked; guest->registered anchor partial; no retention purge job; module has zero tests; 60s cache only; one stale doc section.

### TASK-07 - Analytics deferred items (rationale recorded)

- **Date found:** 2026-09-22 (source: plan/13: funnels, accuracy join, retention tests, B6/B7)
- **Area:** analytics
- **Priority:** P3
- **Reported:** additive once picked up; collection already in place.

### TASK-08 - TODO/FIXME markers in source (10)

- **Date found:** 2026-09-22 (code scan)
- **Area:** code cleanup
- **Priority:** P3

### TASK-09 - Games quality debt

- **Date found:** 2026-09-22 (source: plan/games/\*)
- **Area:** games
- **Priority:** P3
- **Reported:** AA contrast, reduced-motion variants, roving focus/arrow keys, daily-picture determinism, plus the owner""s 10-minute phone QA.

### TASK-10 to TASK-17 - Owner decisions (scope choices)

- **Date found:** 2026-09-22 (source: plan/05, 15, 07, audit, 01/12, 09)
- **Priority:** P1-P3
- **Reported:** dad-joke surfaces (saved jokes, JotD SSR, trending/share); SEO big rock (RSC landing pages, per-content routes+metadata, JSON-LD, per-module OG, audit panel, organic segmentation, robots control); comments on quiz/riddle; SEC-07 gate; SEC-10/12 guest token; H1 phase 2c grading; admin user-mgmt UI + dashboard unification; installability manifest.

### TASK-18 to TASK-21 - Owner / VPS operations

- **Date found:** 2026-09-22 (source: audit + plan/push-ownership-contract.md)
- **Priority:** P1-P2
- **Reported:** rotate credentials (admin/DB/Redis/JWT/OAuth) + SSH hardening + secret-history scan + audit logging; restrict origin firewall to Cloudflare IPs; off-box backups + restore drill; uptime/error alerting.

### TASK-22 - R2 media follow-ups

- **Date found:** 2026-09-22 (source: plan/17-r2-storage-setup.md)
- **Area:** media
- **Priority:** P2
- **Reported:** confirm one admin Media upload end-to-end; move off r2.dev to a custom domain; rclone-migrate existing media; token hygiene.

### TASK-23 - Deferred by owner (no action unless re-opened)

- **Date found:** 2026-09-22 (various plans, marked deferred/owner-accepted)
- **Priority:** P3
- **Reported:** riddle-mcq session persistence / JSON import-export / cache tuning; image-riddle server-side progress; admin-dashboard unification; games R2-2/R2-3 extras; LinkedIn + Pinterest share previews.

### TASK-24 - Memory Quiz: grid-answer questions could not be answered by tapping

- **Date found:** 2026-09-22 (owner: "in memory quiz when I click the box it doesn't show what was hidden")
- **Area:** games / memory-quiz - `public/games/memory-quiz/game.js`
- **Priority:** P1
- **Root cause:** `where` ("Where is the pizza?") and `swap` questions declare `answerUi: 'grid'` and `answer(picked)` takes a **cell index** for them - but the board cells (created as `<button>`s) had **no click listener**, so those questions were unanswerable: taps did nothing and the timer expired (losing a heart).
- **Fix:** each cell answers when the active question is a grid type, with the plan's 50 ms double-tap debounce (commit `bf55e38` + follow-ups).
- **Verified:** the repo Playwright driver `verify-memory-quiz.mjs` clicks `.cell[data-index=...]` for exactly these types - **39/39 checks pass**.

### TASK-25 - Memory Quiz: swap reveal announced the pre-swap layout

- **Date found:** 2026-09-22 (E2E check "l04: swap hit reveals the exchange")
- **Area:** games / memory-quiz - `game.js` (`gradeHit` / `gradeMiss`)
- **Priority:** P2
- **Root cause:** `applyTruth(...)` ran **before** `setBoardHidden(false)`, and the un-hide re-applies the **canonical** board aria labels - clobbering `swap`'s phantom exchange (item visually moved, announcement reverted to pre-swap).
- **Fix:** un-hide first, then reveal (both paths) so the truth wins over the canonical aria.
- **Verified:** E2E l04 check passes.

### TASK-26 - Memory Quiz: level-clear crash focusing an undefined button

- **Date found:** 2026-09-22 (E2E: "pageerror: Cannot read properties of undefined (reading 'focus')")
- **Area:** games / memory-quiz - `game.js` (`showLevelClear`)
- **Priority:** P2
- **Root cause:** `els.btnRetry2` is referenced but never assigned (unlike `#btn-next` / `#btn-cards`), so the level-clear focus chain called `.focus()` on `undefined`.
- **Fix:** guarded focus target (`clearTarget?.focus?.()`); the missing `#btn-retry2` mapping remains the underlying gap if that button is added later.
- **Verified:** E2E "zero console/page errors across the session" passes.

### TASK-27 - Shared question link should land on that question (others skipped, opt-in to play) - FIXED 2026-09-22

- **Fixed:** quiz question shares now emit a play deep link:
  `/quiz-mcq/play?subject=<slug>&chapter=<name>&level=<level>&mode=<mode>&shared=true&total=<N>&qid=<uuid>`.
  The play flow resolves the shared question BY IDENTITY (uuid), not by the sharer's
  index - the visitor's session is a fresh random set. If the question is in the fetched
  set, the session starts at its position; otherwise it is fetched by id
  (`GET /quiz-mcq/questions/:id/play`, public, same exposure as the random feed, options
  served-shuffled per BUG-041) and pinned as the entry point with the other slots
  unvisited before it. An unresolvable id degrades to a plain session from Q1.
- **Opt-in/continue:** the existing GameHeader "Unvisited (N)" chip is the way back into
  the flow - tapping it jumps to Q1 (dismissUnvisited). Verified: landing shows the shared
  question + chip; tapping the chip advances into the session.
- **No regression:** the hub `?q=<uuid>` OG question preview still renders
  (og:image /og/quiz-question/<uuid>.png, og:description = question text).
- **Verified:** tsc clean; Playwright (play URL -> h2 == shared question text -> chip ->
  opt-in moves to Q1) all PASS; screenshots 23/24.
- **Not done (reported):** riddle question shares still use the hub `?q=` form - the
  riddle play flow has no equivalent shared-start contract (subjectId/level based, no
  in-session question identity); implementing it means changing the riddle session
  contract. Deferred with reason.

### BUG-XXX — <title>

- **Date found:** YYYY-MM-DD
- **Area:** <module / page>
- **Priority:** P0–P3
- **Reported:** <what is wrong, from the owner's or tester's view>
- **Evidence:** <screenshot filenames / notes in `gui-test-screenshots/`>

```

```
