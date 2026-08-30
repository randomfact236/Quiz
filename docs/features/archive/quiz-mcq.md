> **OBSOLETE (2026-08-30)** — superseded by `plan/02-mcq-quiz.md`, which re-verified every claim against the current code. This ledger is kept only for history and is **safe to delete**; all references elsewhere in the repo now point at the new file.

# Feature: Quiz MCQ (Classic MCQ — Full Stack)

Merged from former sections 02 (frontend) and 05 (backend). Frontend paths relative to `apps/frontend/`, backend to `apps/backend/src/`.

## A. Backend (`apps/backend/src/quiz-mcq/`)

### File inventory

| File                          | Purpose                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quiz-mcq.module.ts`          | Controller + service, repos for 3 entities, CacheService, BulkActionService; exports QuizMcqService                                                 |
| `quiz-mcq.controller.ts`      | ~19 endpoints under `/quiz-mcq` (Swagger-tagged)                                                                                                    |
| `quiz-mcq.service.ts`         | ~650 lines: extends shared ContentServiceBase (common/content); quiz-specific filter counts, CSV export, chapter taxonomy                           |
| `dto/export-query.dto.ts`     | Export query DTO                                                                                                                                    |
| `entities/subject.entity.ts`  | `subjects`: unique slug, name, emoji, category, isActive, order                                                                                     |
| `entities/chapter.entity.ts`  | `chapters`: name, chapterNumber, unique(name+subjectId)                                                                                             |
| `entities/question.entity.ts` | `questions`: jsonb options, correctAnswer/Letter, level enum easy..extreme, ContentStatus default DRAFT, composite index (chapterId, level, status) |

### Endpoint map

| Method & Path                                             | Auth   | Notes                                                                            |
| --------------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| GET `/quiz-mcq/subjects`                                  | public | optional `?hasContent=true` (`controller:83-89`)                                 |
| GET `/quiz-mcq/subjects/:slug/meta`                       | public | lightweight meta (`:91-96`)                                                      |
| GET `/quiz-mcq/subjects/:slug`                            | public | with chapters (`:98-103`)                                                        |
| GET `/quiz-mcq/subjects/:slug/questions`                  | public | PUBLISHED only, unbounded by default (`:105-121`)                                |
| GET `/quiz-mcq/subjects/:slug/status-counts`              | admin  | (`:375-388`)                                                                     |
| GET `/quiz-mcq/filter-counts`                             | admin  | unified facet counts (`:123-156`)                                                |
| POST/PUT/DELETE `/quiz-mcq/subjects[/:id]`                | admin  | CRUD (`:158-187`)                                                                |
| GET `/quiz-mcq/chapters`, `/quiz-mcq/chapters/:subjectId` | public | (`:191-201`)                                                                     |
| POST/PATCH/DELETE `/quiz-mcq/chapters[/:id]`              | admin  | CRUD (`:203-232`)                                                                |
| GET `/quiz-mcq/questions`                                 | admin  | paginated + filters (`:236-260`)                                                 |
| GET `/quiz-mcq/questions/export`                          | admin  | CSV (`:262-277`)                                                                 |
| GET `/quiz-mcq/questions/:chapterId`                      | public | PUBLISHED only (`:279-286`)                                                      |
| GET `/quiz-mcq/random/:level`, `/quiz-mcq/mixed`          | public | challenge pools — index-seek random via `random_weight` + wrap-around (Track A2) |
| POST `/quiz-mcq/questions[/bulk]`                         | admin  | single + chunked import (auto subject/chapter creation, unique-slug resolution)  |
| PATCH/DELETE `/quiz-mcq/questions/:id`                    | admin  | (`:341-361`)                                                                     |
| POST `/quiz-mcq/bulk-action`                              | admin  | shared BulkActionService (`:365-373`)                                            |

### Backend status

**Done:** transactional cascade deletes for subjects/chapters with single-query item cascade; family-scoped cache invalidation (Track B — only `quiz:questions` / `quiz:filter-counts` families cleared, no `quiz:*` sledgehammer); parent-cascading filter counts; chunked bulk import with auto-created subjects/chapters (MAX+1 chapter numbers, collision-free slugs) and row-level error collection; level/type validation on create/update (extreme options nulling works); escaped CSV export; public reads hard-filter PUBLISHED.

**Backend bugs — ALL FIXED 2026-08-25:**

1. ~~Dead logic in `updateQuestion`~~ — `(dto.level ?? level) === 'extreme'`; verified live.
2. ~~`random/:level` and `mixed` not random~~ — replaced by `random_weight` index-seek + wrap-around (Track A2).
3. ~~Chapter numbering race~~ — MAX(chapterNumber)+1 in createChapter and imports.
4. ~~Bulk-import slug collisions~~ — `resolveUniqueSubjectSlug` picks next free `-N` suffix.
5. ~~N-delete loop in subject delete~~ — single `IN` query cascade.

## B. Frontend — gameplay (`apps/frontend/src/`)

### File inventory

| File                                                               | Purpose                                                                                                                                                    | Status                                                      |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `app/quiz-mcq/page.tsx`                                            | 674-line wizard: Subject→Chapter→Mode→Level via URL params; uses shared level constants                                                                    | Done; still large                                           |
| `app/quiz-mcq/play/page.tsx` + `play/components/*`                 | Gameplay orchestration (486 lines) + 5 subcomponents: PreQuizSummary, GameHeader, SubmitConfirmModal, ExtendSessionModal, ResumePromptModal                | Done; split 2026-08-25                                      |
| `app/quiz-mcq/timer-challenge/page.tsx` / `practice-mode/page.tsx` | Thin wrappers (~30 lines each) around shared `components/quiz-mcq/ChallengeHub.tsx`; counts via cached public `/quiz-mcq/level-counts`                     | Done; deduplicated 2026-08-25                               |
| `app/quiz-mcq/practice/page.tsx`, `challenge/page.tsx`             | Redirect shims                                                                                                                                             | Done                                                        |
| `app/quiz-mcq/results/page.tsx`                                    | Results from localStorage history                                                                                                                          | Done; scoring via shared lib/quiz-mcq-scoring               |
| `hooks/useQuizMcq.ts` (484 lines) + `hooks/use-quiz-mcq/*`         | Engine orchestration + extracted modules: `quiz-engine.utils` (UUID/conversion/loader/timer-nav), `useQuizTimers`, `useQuizResume`                         | Done; split 2026-08-25                                      |
| `lib/quiz-mcq-scoring.ts`                                          | Single source of truth: isAnswerCorrect / calculateScore / calculateResult / calculateGrade (16 regression tests)                                          | Done                                                        |
| `lib/quiz-mcq-constants.ts`                                        | Shared QUIZ_LEVELS / emojis / colors (was declared 4×)                                                                                                     | Done                                                        |
| `components/quiz-mcq/*`                                            | ChallengeHub (shared hub), QuestionCard, AnswerOptions (level-aware), BubbleEmojiEffect, FloatingBackground, ScoreCard, QuestionReview, ResultsCelebration | Done; dead QuizMcqTimer/Navigation deleted 2026-08-25       |
| `features/quiz-mcq/**`                                             | Admin CRUD: QuizMcqContainer, FilterPanel, QuestionManager/Table, modals (subject/chapter/question/import), TanStack Query hooks with optimistic updates   | Done; admin-only consumer; adminApi auth (no isAdmin flags) |

### Tests

`src/__tests__/`: `quiz-mcq-scoring.test.ts` (16) + `useQuizMcq.test.tsx` (6 — completion idempotence, progress/achievements wiring, resume round-trip, pause/resume, extend clamping). 22/22 passing.

### Frontend status

**Done:** URL-driven 4-stage wizard with "Coming Soon" zero-question disabling; full engine (MCQ + open-ended scoring, total/per-question timers, visited/skipped sets, resume persistence, shared-link deep start `?shared=true`); results page (grades, breakdown, review, share); timer urgency visuals; complete admin CRUD against backend (optimistic mutations, CSV import/export).

**Partially done:** per-level timers fall back to hardcoded defaults (`play/page.tsx:25-31`); explanations typed but unsupplied; ResultsCelebration tiers unfinished (only `perfect` used). Chapter progress + achievements ARE now written on completion (`saveToHistory` → `saveQuizResult()` + `checkAchievements()`).

**Missing (frontend):**

- Server-side session/result persistence (all history/resume/high-scores in localStorage only)
- Challenge streak tracking (achievement condition exists, no tracker)
- Unanswered-review handling ('N/A' letter never matches)
- Pagination safety — fetches ALL questions of a subject client-side
- Accessibility (aria-live feedback, label association in AnswerOptions)
- Scoring + engine regression tests exist (`__tests__/quiz-mcq-scoring.test.ts` ×16, `__tests__/useQuizMcq.test.tsx` ×6); component-level tests not yet covered

## C. How It Works (data flow)

```
/quiz-mcq (wizard) ──?subject&chapter&mode&level──▶ /quiz-mcq/play
     useQuizMcq → lib/quiz-mcq-api → NestJS /quiz-mcq endpoints (public PUBLISHED-only reads)
     state machine loading→playing⇄paused→completed; localStorage resume/history keys:
     aiquiz:current-session / quiz-resume-session / quiz-history / chapter-progress (read-only)
completed → /quiz-mcq/results?session=<uuid> → calculateResult → ScoreCard + QuestionReview
Admin: app/admin?section=quiz-mcq → features/quiz-mcq (TanStack Query, URL filters, optimistic CRUD,
       CSV import/export) → admin-guarded /quiz-mcq endpoints
```

Admin path uses idiomatic React Query with key-based invalidation; gameplay is one useState-style reducer object in useQuizMcq. Persistence is localStorage-only end-to-end.

## D. Known Bugs (frontend)

Fixed 2026-08-25 (shared scorer + guards, regression-tested in `__tests__/quiz-mcq-scoring.test.ts`): ~~1. QuestionReview letter-vs-text~~ · ~~2. extreme mis-scoring in results~~ · ~~3. crash on unknown difficulty~~.

Still open (refactor-class, tracked in plan/code-quality-plan.md):

1. ~~Hub duplication~~ — FIXED 2026-08-25: shared `ChallengeHub` component + thin route wrappers; level maps deduped into `lib/quiz-mcq-constants.ts`.
2. ~~Resume-state bloat~~ — FIXED 2026-08-25: two-key store (`quiz-resume-questions` snapshot written once + lightweight progress key per change).
3. ~~Per-question timer resets on going _back_~~ — FIXED 2026-08-25: only forward navigation resets the per-question clock.
4. ~~Double-completion race~~ — FIXED 2026-08-25: single guarded completion effect (`didSaveRef`); no side effects inside setState updaters.
5. ~~`router.replace` churn on every answer~~ — FIXED 2026-08-25: question-number URL sync uses `history.replaceState`.
6. ModeSelection perpetual "Loading..." when a chapter has zero questions.
7. ~~Admin coupling — hardcoded isAdmin flags~~ — FIXED 2026-08-25: `adminApi` wrapper; tailwind globs include `src/features/**`.
8. ~~Dead components~~ — QuizMcqTimer/QuizMcqNavigation deleted 2026-08-25.
9. ~~Engine untested~~ — `__tests__/useQuizMcq.test.tsx` (6 tests): completion idempotence, wiring, resume round-trip, pause/resume, extend clamping.
10. ~~Hook monolith / hub N+1 counts~~ — useQuizMcq split into utils/timers/resume modules (~484 lines); hubs use the public cached `/quiz-mcq/level-counts` endpoint.
11. **P2**: `POST /quiz-mcq/sessions` for cross-device history; replace client-side count loops with `GET /quiz-mcq/filter-counts`.
12. **P3**: split play page into subcomponents; rename `features/quiz-mcq` → `features/quiz-mcq-admin`; finish celebration tiers.

## Code Quality Notes

Standards, budgets, and phase exit criteria: [../../plan/code-quality-plan.md](../../plan/code-quality-plan.md). Feature-specific debt tracked there in �5.
