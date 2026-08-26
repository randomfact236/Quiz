# Feature: Riddle MCQ (Full Stack)

Merged from former sections 03 (frontend) and 04 (backend). Frontend paths relative to `apps/frontend/`, backend to `apps/backend/src/riddle-mcq/`.

## A. Backend (`apps/backend/src/riddle-mcq/`)

### File inventory

| File                                                              | Purpose                                                                                                                                                                     |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `riddle-mcq.module.ts`                                            | 3 controllers + 6 services, TypeORM repos + CacheModule                                                                                                                     |
| `controllers/riddle-mcq.controller.ts`                            | main `/riddle-mcq` endpoints (Swagger-tagged)                                                                                                                               |
| `controllers/riddle-mcq-subject.controller.ts`                    | `/subjects` CRUD + `:slug` reads                                                                                                                                            |
| `controllers/riddle-mcq-category.controller.ts`                   | `/categories` CRUD                                                                                                                                                          |
| `entities/riddle-mcq.entity.ts`                                   | `riddle_mcqs`: jsonb options, correctLetter/answer, level enum easy..expert, status enum published/draft/trash, composite index (subjectId, level, status), `random_weight` |
| `entities/riddle-subject.entity.ts`                               | `riddle_subjects`: unique slug, isActive; Category 1–N Subjects 1–N Riddles                                                                                                 |
| `services/riddle-mcq-question.service.ts`                         | extends shared ContentServiceBase (**flat taxonomy mode** — Subject→riddles, no chapter layer); level answer rules, published-only public reads                             |
| `services/riddle-mcq-category.service.ts` / `-subject.service.ts` | CRUD + transactional cascade deletes + counts; shared slug helper                                                                                                           |
| `services/riddle-mcq-import.service.ts`                           | chunked (100) transactional import with auto-created categories/subjects; category-grouped CSV export                                                                       |
| `services/riddle-mcq-bulk-actions.service.ts`                     | per-id delete/publish/draft/trash/restore                                                                                                                                   |
| `services/riddle-mcq-stats.service.ts`                            | getStats(), cached filterCounts, public per-subject×level counts, statusCountsBySubject                                                                                     |
| `dto/`, `validators/`, `utils/`                                   | DTOs (create/update split), pagination/difficulty validators, slug util, csv-export util                                                                                    |

### Endpoint map

| Method & Path                                                                         | Auth   | Notes                                                                    |
| ------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| GET `/riddle-mcq/all?...filters`                                                      | admin  | paginated cached list (`controller:46`)                                  |
| GET `/riddle-mcq/level-counts`                                                        | public | per-subject×level published counts, one GROUP BY, 300s cache (`:78`)     |
| GET `/riddle-mcq/subjects/:subjectId/riddles`                                         | public | PUBLISHED only (`:88`)                                                   |
| GET `/riddle-mcq/mixed?count<=100`, `/random/:level?count<=50`                        | public | index-seek random via `random_weight` + wrap-around (`:105-114`)         |
| GET `/riddle-mcq/riddles/:id`                                                         | public | single read, PUBLISHED only (`:128`)                                     |
| POST/PATCH/DELETE `/riddle-mcq/riddles[/:id]`, `/bulk`, `/bulk-action`, GET `/export` | admin  | (`:134-184`)                                                             |
| GET `/riddle-mcq/stats/overview`, `/filter-counts`                                    | public | FE contract `{totalRiddleMcqs, totalSubjects, mcqsByLevel}` (`:197-208`) |
| GET `/riddle-mcq/stats/status-counts?subject`                                         | admin  | (`:232`)                                                                 |
| Categories & subjects full CRUD (`/all`, `?hasContent=true`, `/:slug`)                | mixed  |                                                                          |

### Backend status

**Done:** module wiring on the shared content kit — question service extends ContentServiceBase (flat mode added for chapter-less modules; quiz-mcq behavior unchanged); family-scoped cache invalidation (`questions`/`filter-counts`/`stats` families, no `riddle-mcq:*` sledgehammer); public reads hard-filter PUBLISHED; server-side level answer rules (min options per level, in-range correctLetter A–B/C/D, expert text answer) enforced on create and update; chunked transactional CSV import with auto-created categories/subjects; bulk actions incl. restore→DRAFT; category-grouped CSV export; draft/published/trash workflow; `pickRandomByWeight` random pools.

**Backend bugs/gaps — ALL FIXED 2026-08-25/26:**

1. ~~Stats payload mismatch + swapped totalSubjects/totalCategories~~ — returns the FE contract with correct values; `stats/overview` + `filter-counts` restored to public via `@_Public()` (default-deny JWT had silently locked them). Verified live.
2. ~~By-subject endpoint leaked unpublished content~~ — filters `status = PUBLISHED`; verified live.
3. ~~Orphaned/broken migrations~~ — rebuilt as timestamped baseline + scale-index migrations, registered in app.module (`migrationsRun`). Done upstream in phase 0.5.
4. ~~Dead code~~ — `findRiddleById()` now exposed via public `GET riddles/:id`; bulk facade deleted (commit `2b5caff` removed an earlier facade; the re-introduced thin facade was dissolved into import/bulk-actions services).
5. ~~Divergent duplicate slug helpers~~ — single `utils/slug.util.generateSlug`.
6. ~~Level option rules floor-enforced only~~ — strict 2/3/4 min-option rules + letter ranges + expert answer requirement now mirrored from FE zod, server-side.

## B. Frontend — gameplay (`app/riddle-mcq/`)

### Files

| Area       | Files                                                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages      | `page.tsx` home, `challenge/page.tsx`, `practice/page.tsx`, `play/page.tsx`, `results/page.tsx`, error/loading                                                                                                             |
| Components | `RiddleCard.tsx` (reuses shared AnswerOptions/BubbleEmojiEffect), `RiddleReview`, `RiddleStatsBanner`                                                                                                                      |
| Libs       | `lib/riddle-mcq-api.ts` (typed client incl. `getPublicLevelCounts`), `lib/riddle-scoring.ts` (single `isRiddleAnswerCorrect`), `lib/riddle-session.ts` (autosave/resume/expiry), `types/riddles.ts` (incl. adaptRiddleMcq) |

### Frontend status

**Done:** full game loop backed by real endpoints; session persistence (10s autosave, resume dialog, expiry cleanup); timer + practice modes with extend-session modal; timer auto-submit runs in a dedicated effect (no side effects inside setState updaters); play/results share one scorer (`lib/riddle-scoring.ts`); challenge/practice hubs use real per-subject×level counts from the public `level-counts` endpoint; subject-wise play works end-to-end (`subjectId` param is canonical, `chapterId` accepted as legacy fallback).

**Fixed 2026-08-26:**

1. ~~Subject-wise play broken end-to-end~~ — hubs sent `?subjectId=` but play read only `chapterId`; unified (results retry link canonicalized too).
2. ~~Stale mutation invalidation keys~~ — `useRiddleMutations` now invalidates `['riddle-mcq-categories']`/`['riddle-mcq-subjects']`; category delete also clears questions.
3. ~~Results redirected to non-existent `/riddles`~~ — targets `/riddle-mcq`.
4. ~~Duplicate hooks/implementations~~ — dead `lib/useRiddleMcqFilters` (with its unused consumer `RiddleMcqSection`) and unused `useRiddleMcqModals` deleted; duplicated `isAnswerCorrect` consolidated into `lib/riddle-scoring.ts`.
5. ~~Submit fired inside timer's state updater~~ — pure decrement tick + guarded auto-submit effect.
6. ~~Fake even distribution of level counts across subjects~~ — replaced by the backend `level-counts` endpoint.

## C. Admin surface (`features/riddle-mcq/`)

`RiddleMcqContainer` orchestrates React Query hooks (categories/subjects/questions/filter-counts/filters/mutations/bulk-actions/debounce), modals (create/edit with zod level-based option counts, category/subject modals, ImportModal with CSV preview + chunked upload, extracted csv-parser). Status dashboard, live filter counts, pagination, row selection + bulk toolbar, CSV export. Mutation keys match query caches; cascade deletes invalidate all affected lists.

Refactor-plan progress: Priority 1 (bulk service split) ✅, Priority 2 (csv-parser extraction) ✅, form split ✅; Priority 3 half-abandoned (modal hook created but unused — hook since deleted as dead code).

Admin-plan gaps: JSON import/export planned but not built (CSV only).

## D. Cross-Stack Integration Gaps — RESOLVED 2026-08-26

| Gap                                         | Status                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| stats contract mismatch                     | FIXED — payload reshaped to FE contract, swap corrected, made public again |
| subjectId vs chapterId params               | FIXED — `subjectId` canonical everywhere                                   |
| No per-subject×level counts endpoint        | DONE — public `level-counts`; hubs consume it                              |
| History write never implemented either side | DEFERRED (P3, owner-accepted)                                              |

## E. Roadmap

Completed 2026-08-25/26: all P0s (stats, published-only by-subject, subjectId unification, results redirect), all P1s (mutation keys, duplicate hooks, single scorer, submit-out-of-updater, migration hygiene [done upstream], server-side option rules, bulk facade removal, single slug helper), P2 (level-counts endpoint, `GET riddles/:id`), ContentServiceBase migration with flat-taxonomy support.

Deferred (owner-accepted 2026-08-26):

- JSON import/export both sides (CSV covers current workflow)
- Targeted cache invalidation tuning for stats/filter counts
- Session history writes + hint/skip tracking (needs product decision)
- Tests backlog (csv-parser, adapter, scoring; e2e happy path)
- Doc claims cleanup for sibling features where stale

## Code Quality Notes

Standards, budgets, and phase exit criteria: [../../plan/code-quality-plan.md](../../plan/code-quality-plan.md). Feature-specific debt tracked there in §5.
