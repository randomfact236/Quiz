# Feature: Riddle-MCQ (Full Stack)

Merged from former sections 03 (frontend) and 04 (backend). Frontend paths relative to `apps/frontend/`, backend to `apps/backend/src/riddle-mcq/`.

## A. Backend

### File inventory (`apps/backend/src/riddle-mcq/`)

| File | Purpose |
|---|---|
| `riddle-mcq.module.ts` | 3 controllers + 7 services, TypeORM repos + CacheModule |
| `controllers/riddle-mqc.controller.ts` family | main `/riddle-mcq`, `/categories`, `/subjects` controllers |
| `entities/` | `riddle_mcqs` (composite index subjectId+level+status), `riddle_categories`, `riddle_subjects` (Category 1–N Subjects 1–N Riddles) |
| `services/riddle-mcq-question.service.ts` | cached paginated list, by-subject read, random/mixed with UUID Fisher-Yates |
| `services/...-category/-subject.service.ts` | CRUD + transactional cascade deletes + counts |
| `services/riddle-mcq-bulk.service.ts` | thin facade → Import/BulkActions services; CSV export builder |
| `services/riddle-mcq-bulk-actions.service.ts` | per-id delete/publish/draft/trash/restore |
| `services/riddle-mcq-import.service.ts` | chunked (100) transactional import, auto-creates categories/subjects |
| `services/riddle-mcq-stats.service.ts` | getStats(), cached filterCounts, statusCountsBySubject |
| `dto/`, `validators/`, `utils/` | DTOs (create/update split), pagination/difficulty validators, slug util, csv-export util |

### Endpoint map

| Method & Path | Auth |
|---|---|
| GET `/riddle-mcq/all?...filters` | admin (`controller:42-71`) |
| GET `/riddle-mcq/subjects/:subjectId/riddles?page&limit&level` | public (`:73-86`) |
| GET `/riddle-mcq/mixed?count<=100`, `/random/:level?count<=50` | public (`:88-105`) |
| POST/PATCH/DELETE `/riddle-mcq/riddles[/:id]`, `/bulk`, `/bulk-action`, GET `/export` | admin (`:107-167`) |
| GET `/riddle-mcq/stats/overview`, `/filter-counts` | public (`:169-202`) |
| GET `/riddle-mcq/stats/status-counts?subject` | admin (`:204-217`) |
| Categories & subjects full CRUD (`/all`, `?hasContent=true`, `/:slug`) | mixed |

### Backend status

**Done:** complete module wiring; public reads (mixed/random PUBLISHED-only); admin CRUD with JWT+RolesGuard; bulk actions incl. restore→DRAFT; category-grouped CSV export; chunked transactional import with error collection; caching (600s/300s TTLs); draft/published/trash DB enum workflow.

**Partially done:** level option rules only floor-enforced (≥2 options; strict 2/3/4 rules exist only in frontend zod); legacy `extreme` rows never migrated from the Postgres enum; controller still monolithic (pagination DTO exported but unused).

**Backend bugs/gaps:**
1. **stats payload mismatch + swapped values** — returns `{totalRiddles, riddlesByLevel}` and assigns `totalSubjects = categories.length` / vice versa (`stats.service.ts:36-40`), while FE expects `{totalRiddleMcqs, mcqsByLevel}` → all public counts render 0.
2. **By-subject endpoint leaks unpublished content** — filters only `subject.isActive`, not riddle status (`question.service.ts:63-81`).
3. Orphaned/broken migrations: two hand-written files lack timestamp prefixes and reference dropped tables/columns; no `migrations` array registered anywhere.
4. Dead code: `findRiddleById()` has no route; bulk facade duplicates naming.
5. Divergent duplicate slug helpers; DTO marks expert `options/correctLetter` required though import supports them absent.
6. Sledgehammer cache invalidation; in-memory counts; random loads all IDs.

## B. Frontend — gameplay (`app/riddle-mcq/`)

### Files

| Area | Files |
|---|---|
| Pages | `page.tsx` home (141), `challenge/page.tsx` (388), `practice/page.tsx` (390 clone), `play/page.tsx` (763), `results/page.tsx` (351), error/loading |
| Components | `RiddleCard.tsx` (354; reuses shared AnswerOptions/BubbleEmojiEffect), `RiddleReview`, `RiddleStatsBanner` |
| Libs | `lib/riddle-mcq-api.ts` (474 LOC typed client), `lib/riddle-session.ts` (221 LOC persistence: auto-save/resume/24h expiry/beforeunload), `types/riddles.ts` (320 LOC incl. adaptRiddleMcq), duplicate `lib/useRiddleMcqFilters.ts` |

### Frontend status

**Done:** full game loop backed by real endpoints; session persistence (10s autosave, resume dialog, expiry cleanup); timer + practice modes with extend-session modal; expert open-ended path; results experience; URL-state sync.

**Partially done / fake:** challenge/practice level counts divided evenly across subjects with placeholder comment; history/streak/favorites storage keys exist but nothing writes them; `hintsUsed`/`skippedRiddles` initialized but never updated.

**Frontend bugs:**
1. **Subject-wise play broken end-to-end**: hubs send `?subjectId=` but play reads only `chapterId` (`play/page.tsx:81`) → silently becomes "all subjects".
2. Stale cache keys in `useRiddleMutations.ts` — invalidates `['riddle-categories']` vs actual `['riddle-mcq-categories']` → stale lists after mutations.
3. Results redirect to non-existent `/riddles` route (`results/page.tsx:107`) → 404.
4. Duplicate hooks/implementations (two useRiddleMcqFilters with divergent defaults; dead `useRiddleMcqModals.ts`; duplicated `isAnswerCorrect` with a live-score variant that ignores expert text).
5. Submit fired inside timer's state updater (`play/page.tsx:232-240`); biased re-shuffling sort; cosmetic practice countdown; silent empty catches; phantom `order` field; hardcoded `status:'published'` in adapter.

## C. Admin surface (`features/riddle-mcq/`)

`RiddleMcqContainer` (334 LOC) orchestrates React Query hooks (categories/subjects/questions/filter-counts/filters/mutations/bulk-actions/debounce), modals (create/edit with zod level-based option counts, category/subject modals, ImportModal with CSV preview + chunked upload, extracted csv-parser). Status dashboard, live filter counts, pagination, row selection + bulk toolbar, CSV export.

Refactor-plan progress: Priority 1 (bulk service split) ✅, Priority 2 (csv-parser extraction) ✅, form split ✅; Priority 3 half-abandoned (modal hook created but unused, logic re-inlined).

Admin-plan gaps: JSON import/export planned but not built (CSV only).

## D. Cross-Stack Integration Gaps

| Gap | Impact |
|---|---|
| stats contract mismatch (A1) | Home banner + mode-picker counts always 0/disabled |
| subjectId vs chapterId params (B1) | Subject-specific gameplay impossible |
| No per-subject×level counts endpoint | Fake even distribution stays |
| History write never implemented either side | Single-slot localStorage sessions overwrite |

## E. Roadmap (prioritized)

1. **P0**: fix stats swap + reshape payload (A1); add published-status filter to by-subject read (A2); unify query params to `subjectId` (B1); fix `/riddles` redirect (B3).
2. **P1**: fix mutation invalidation keys (B2); consolidate duplicate hooks; single `isAnswerCorrect`; move submit out of state updater; migration hygiene (timestamp prefixes, rewrite against current entities, register migrations).
3. **P1 backend**: enforce 2/3/4 option rules server-side; delete bulk facade or rename; one slug helper.
4. **P2**: JSON import/export both sides; real per-level counts via filter-counts reuse; expose `GET /riddles/:id`; align BulkCreateRiddleDto with expert reality; slim controller.
5. **P3**: targeted cache invalidation; LEFT JOIN aggregates + `ORDER BY random()`; session history writes; hint tracking; remove dead chapter-naming layer (`RiddleChapter`/`adaptChapter`, DEFAULT_CHAPTER_ICONS); correct documentation claims (Zustand, flat architecture); add tests (csv-parser, adapter, scoring; e2e happy path).

