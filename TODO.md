# TODO — Tracked Follow-ups

Logged decisions/flags from the capacity build so they don't get lost. Completed items move to the bottom.

## Open

### Run summary — master tracker pass complete (2026-08-30)

All 14 features worked in table order (P0 → P1 → P2 → P3, feature-scoped commits, pushed).
**Blocked items:** dev Postgres on :5432 died mid-session (see plan/TODO.md anomalies) — migrations
`1789000000000` (image-riddle counters), `1789100000000` (joke_votes), `1789200000000` (user_achievements),
`1789300000000` (comment userId/flagged), `1789400000000` (newsletter) are committed but NOT YET APPLIED;
run `npm run migration:run` in apps/backend when the DB returns, then restart the backend.
**Owner decisions logged below (§0) and in each plan file.**

### 0. Needs owner decision — from the feature-01 pass (2026-08-30)

- **Needs owner decision: block login until email verified?** Feature 01 P1 built the full email-verification mechanism (commit `f0bed06`): registration emails a 24h one-time link, `POST /auth/verify-email` flips the flag, resend endpoint is anti-enumeration, `/verify-email` page handles the flow. The plan did not specify whether unverified users are locked out of login. **Currently non-blocking** (least-surprise; nobody gets locked out). If you want a hard gate, say so and login will 403 with a "verify your email" pointer until `emailVerified` is true.
- **Needs owner decision: build an admin user-editing UI?** Feature 01 P2 (`plan/01-user-accounts.md`): role change and delete exist as endpoints (`PUT/DELETE /admin/users/:id`, role now enum-constrained) but admin views are read-only lists — changes require raw API calls. Building a `JokesSection`-style editing UI was flagged in the plan as "check whether wanted".

### 1. BullMQ reshuffle job for `random_weight`

- **Status:** deliberately not built (per scope decision).
- When mass deletions accumulate, weight distribution develops gaps near 1.0 → wrap-around logic covers correctness, but if uniformity matters add a periodic job: `UPDATE <table> SET random_weight = RANDOM()` for questions/riddle_mcqs.

### 2. Quiz MCQ — correctness backlog (from quiz-mcq.md audit; owner-directed logging)

Backend:

- **~~[P0] `updateQuestion` dead extreme-level logic~~** — FIXED 2026-08-25: `applyUpdate` now uses `(dto.level ?? level) === 'extreme'`; verified live — PATCH with options+level:'extreme' nulls options (old code kept them).
- **~~[P1] Chapter numbering race~~** — FIXED 2026-08-25: `createChapter` and bulk imports now use MAX(chapterNumber)+1 (imports carry a per-subject counter across chapters created in one chunk). Residual: two _simultaneous_ imports could still race on MAX — acceptable until imports go concurrent.
- **~~[P1] Bulk-import slug collisions~~** — FIXED 2026-08-25: `resolveUniqueSubjectSlug` picks the next free `-N` suffix when a sanitized slug already exists ("C++" vs "C" no longer abort the chunk); verified live with a previously-failing pair.
- **~~[P1] N-delete loop in `deleteSubject`~~** — FIXED 2026-08-25: cascade uses a single `IN` query inside the same transaction; verified live.
- **~~[was P1] random/:level + mixed not random~~** — FIXED by Track A/B (random_weight via shared pickRandomByWeight); doc claim now stale.
- **~~[P1] `GET /quiz-mcq/questions/:chapterId` requires auth despite PUBLIC contract~~** — FIXED 2026-08-25: `@_Public()` added to the route; verified live (no-token → 200, admin routes still 401, PUBLISHED-only filter intact).
- **~~[P2] quiz-mcq.md endpoint table still claims `random`/`mixed` are updatedAt-ordered~~** — FIXED 2026-08-25: doc refreshed (random_weight pools, fixed-bug sections, roadmap status).

Frontend:

- **~~[P0] QuestionReview marks correct MCQs wrong~~** — FIXED 2026-08-25: compares via shared scorer (`isAnswerCorrect`, letter-based) and highlights correct option by `correctLetter`; was comparing letter against answer text.
- **~~[P0] Extreme answers always scored incorrect in results~~** — FIXED 2026-08-25: results page now uses the shared scorer (`lib/quiz-mcq-scoring.ts`) — same case-insensitive text matching as play time; score/percentage recomputed from it.
- **~~[P0] Crash on unknown difficulty level~~** — FIXED 2026-08-25: `calculateResult` guards unknown levels (counted in totals, skipped in grid); regression-tested.
- Regression tests for all of the above: `src/__tests__/quiz-mcq-scoring.test.ts` (16/16 passing).
- **~~[P1] Progress/achievements never written on completion~~** — FIXED 2026-08-25: both completion paths funnel through `saveToHistory`, which now calls `saveQuizResult()` + `checkAchievements()` (+ unlock toasts).

(Refactor-class items — hub duplication, dead components, resume bloat, monolith splits — are tracked in plan/STANDARDS.md §3, not duplicated here.)

### 3. Riddle MCQ — correctness backlog (from riddle-mcq.md audit; owner-directed logging)

Backend:

- **~~[P0] stats payload mismatch + swapped totalSubjects/totalCategories~~** — FIXED 2026-08-26: payload reshaped to FE contract (`totalRiddleMcqs`/`mcqsByLevel`), swap corrected; `stats/overview` + `filter-counts` restored to `@_Public()` (default-deny JWT had silently locked them). Verified live.
- **~~[P0] By-subject read leaked drafts/trash~~** — FIXED 2026-08-26: filters `status = PUBLISHED`; verified live.
- **~~[P1] No server-side level option rules~~** — FIXED 2026-08-26: min options per level (2/3/4), correctLetter range A–B/C/D, expert text answer enforced on create + update; five live probe paths.
- **~~[P1] Bulk facade / duplicate slug helpers / orphaned migrations~~** — FIXED 2026-08-26 (facade dissolved into import/bulk-actions services; single `utils/slug.util`) and upstream (migrations rebuilt + registered in phase 0.5).
- **~~[P2] No per-subject×level counts endpoint; no public single-riddle read~~** — DONE 2026-08-26: `@_Public GET /riddle-mcq/level-counts` (one GROUP BY, 300s cache) and `@_Public GET /riddle-mcq/riddles/:id` (PUBLISHED only).
- **~~ContentServiceBase migration~~** — DONE 2026-08-26: question service extends ContentServiceBase via new opt-in flat-taxonomy mode (Subject→items, no chapter layer); quiz-mcq behavior unchanged (regression-probed).

Frontend:

- **~~[P0] Subject-wise play broken end-to-end~~** — FIXED 2026-08-26: play page reads `subjectId` (canonical) with `chapterId` legacy fallback; results retry link canonicalized.
- **~~[P0] Results redirect to non-existent `/riddles`~~** — FIXED 2026-08-26: targets `/riddle-mcq`.
- **~~[P1] Stale mutation invalidation keys~~** — FIXED 2026-08-26: `useRiddleMutations` keys match actual query caches; category delete also clears questions.
- **~~[P1] Duplicate hooks / duplicated scorer~~** — FIXED 2026-08-26: dead `lib/useRiddleMcqFilters`, `RiddleMcqSection`, `useRiddleMcqModals` deleted; single shared `lib/riddle-scoring.ts`.
- **~~[P1] Submit fired inside timer's setState updater~~** — FIXED 2026-08-26: pure tick + guarded auto-submit effect.
- **~~[P2] Fake even distribution of level counts~~** — FIXED 2026-08-26: challenge/practice hubs consume the real cached `level-counts` endpoint.

Deferred (owner-accepted 2026-08-26): JSON import/export; targeted stats cache tuning; session history writes + hint/skip tracking; tests backlog (csv-parser/adapter/scoring/e2e).

Quality-gate pass (2026-08-26, mirrors quiz-mcq):

- **~~Dead code~~** — chapter-layer types (`adaptChapter`/`RiddleChapter`/`ChapterDisplay`/`DEFAULT_CHAPTER_ICONS`/`toBackendRiddle`), unused session helpers (`createAutoSaveInterval`, `getRiddleHistory`, module-level `calculateTimeTaken`), backend `RiddleMcqPaginationDto` deleted.
- **~~Hub duplication~~** — challenge/practice pages deduplicated into shared `components/riddle-mcq/RiddleChallengeHub.tsx`.
- **~~Play page monolith~~** — modals split into `play/components/` (ResumePrompt/SubmitConfirm/ExtendSession).
- **~~Resume/session bloat~~** — two-key resume store (`lib/riddle-resume.ts`: snapshot once + lightweight progress); stable autosave interval; session fields renamed `chapterId/chapterName` → `subjectId/subjectName`; live score moved to the shared scorer.

Optimization pass (2026-08-26):

- **~~[perf] filter-counts query fan-out~~** — 5 GROUP BY queries consolidated to 3; total derived from combined status rows; semantics preserved. Verified live against DB.
- **~~[fix] biased shuffle~~** — play page uses shared Fisher-Yates `shuffle()` (`lib/utils.ts`) instead of `sort(() => Math.random() - 0.5)`.
- **~~[refactor] play page orchestration~~** — extracted to `hooks/use-riddle-play/useRiddlePlay.ts` (+ `useRiddleTimers` clocks module); page is render-only at 285 lines (was 787).
- ~~Open: cosmetic practice countdown~~ — REMOVED 2026-08-26 per owner decision (no enforcement existed; challenge ring unaffected).
- DONE 2026-08-26 — unified Quiz/Riddle picker built at `/play`: content-type step then mode step, routed into existing quiz/riddle flows; linked from riddles home.

### 4. ToastContainer is mounted nowhere — repo-wide toast gap

- **Status:** RESOLVED 2026-08-30 — `<ToastContainer />` mounted globally in `app/providers.tsx` (feature 09 P0, commit `f6d6847`); the riddle-mcq admin's local interim mount removed as instructed. Item kept for history.
- **Problem:** every `toast.success()/error()/...` call (singleton `lib/toast.ts#toastManager`) renders nothing because the subscribing UI, `components/ui/ToastContainer.tsx`, is not mounted anywhere in the app tree (verified by repo-wide grep 2026-08-30). Affected surfaces include quiz-mcq results (`app/quiz-mcq/results/page.tsx:70-74`), admin sections (JokesSection, MediaLibrarySection, ImageRiddlesAdminSection, CommentsSection), and others.
- **Fix:** mount `<ToastContainer />` once in `app/providers.tsx` (inside `QueryClientProvider`). **Blocked:** `providers.tsx` is currently being edited by the concurrent analytics session — do it once that session lands.
- **Interim workaround:** riddle-mcq admin mounts `ToastContainer` locally inside `RiddleMcqContainer` (commit `2834b54`) so its import toast works. Remove the local mount when the global one lands.
- Note: `lib/toast.ts` has no DOM fallback; without a mounted container, toasts fire and silently auto-dismiss.

## Resolved

### image-riddles `stats/overview`: public vs admin-only — **RESOLVED: keep public**

- **Decision:** 2026-08-25, confirmed by owner. Endpoint stays public, consistent with sibling endpoints (`riddle-mcq/stats/overview`, quiz/jokes/image-riddles public count surfaces).
- **Reasoning:** payload is pure aggregates (total riddles/categories, per-difficulty breakdown, average timer) with no user data; frontend home/mode-picker surfaces consume it for display; single count query, Redis-cacheable. No code change required.

## Done

- [x] 2026-08-25 — image-riddles route shadowing fixed: `GET :id` moved below literal routes (`status-counts`, `stats/overview`). Verified live: status-counts → 401 unauthenticated (was unreachable/shadowed), stats → 200, `:id` lookups unaffected. Commit: see git log "image-riddles route order".
- [x] 2026-08-25 — apps/backend/.env untracked (credential exposure); rotation of dev creds done; prod rotation pending before any deploy (see plan/STANDARDS.md §6 security note).
