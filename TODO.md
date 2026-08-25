# TODO — Tracked Follow-ups

Logged decisions/flags from the capacity build so they don't get lost. Completed items move to the bottom.

## Open

### 1. BullMQ reshuffle job for `random_weight`

- **Status:** deliberately not built (per scope decision).
- When mass deletions accumulate, weight distribution develops gaps near 1.0 → wrap-around logic covers correctness, but if uniformity matters add a periodic job: `UPDATE <table> SET random_weight = RANDOM()` for questions/riddle_mcqs.

### 2. Quiz — correctness backlog (from features/quiz-mcq.md audit; owner-directed logging)

Backend:

- **[P0] `updateQuestion` dead extreme-level logic** — `const level = dto.level != null || question.level` (quiz-mcq/quiz-mcq.service.ts, was :776) is always truthy so the extreme check never fires; fix: `(dto.level ?? question.level) === 'extreme'`.
- **[P1] Chapter numbering race** — `createChapter` sets `chapterNumber = length + 1` under concurrency; bulk imports write `chapterNumber: 0`.
- **[P1] Bulk-import slug collisions** — sanitization maps distinct names to the same slug ("C++"/"C Basics"), aborting the whole 100-row chunk transaction.
- **[P1] N-delete loop in `deleteSubject`** — one DELETE per chapter's questions instead of a single IN query.
- **~~[was P1] random/:level + mixed not random~~** — FIXED by Track A/B (random_weight via shared pickRandomByWeight); doc claim now stale.

Frontend:

- **[P0] QuestionReview marks correct MCQs wrong** — compares stored letter against answer text (`QuestionReview.tsx:32`); must compare `correctLetter`.
- **[P0] Extreme answers always scored incorrect in results** — `results/page.tsx:59` checks free text against `correctLetter`; unify with useQuiz scorer into one shared util.
- **[P0] Crash on unknown difficulty level** — `byDifficulty[q.level]` assumes known levels (`results/page.tsx:61`).
- **[P1] Progress/achievements never written on completion** — `saveQuizResult()`/`checkAchievements()` have no callers; chapter badges stay frozen.

(Refactor-class items — hub duplication, dead components, resume bloat, monolith splits — are tracked in plan/code-quality-plan.md §2/§5, not duplicated here.)

## Resolved

### image-riddles `stats/overview`: public vs admin-only — **RESOLVED: keep public**

- **Decision:** 2026-08-25, confirmed by owner. Endpoint stays public, consistent with sibling endpoints (`riddle-mcq/stats/overview`, quiz/jokes/image-riddles public count surfaces).
- **Reasoning:** payload is pure aggregates (total riddles/categories, per-difficulty breakdown, average timer) with no user data; frontend home/mode-picker surfaces consume it for display; single count query, Redis-cacheable. No code change required.

## Done

- [x] 2026-08-25 — image-riddles route shadowing fixed: `GET :id` moved below literal routes (`status-counts`, `stats/overview`). Verified live: status-counts → 401 unauthenticated (was unreachable/shadowed), stats → 200, `:id` lookups unaffected. Commit: see git log "image-riddles route order".
- [x] 2026-08-25 — apps/backend/.env untracked (credential exposure); rotation of dev creds done; prod rotation pending before any deploy (see plan/capacity-plan.md Track C security note).
