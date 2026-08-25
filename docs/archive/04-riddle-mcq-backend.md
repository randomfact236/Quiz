# Riddle-MCQ Backend

## 1. Scope & File Inventory

All under `apps/backend/src/riddle-mcq/` (wired into the app via `app.module.ts:22` import and `app.module.ts:87` registration as `RiddleMcqModule`):

| File | Purpose |
|---|---|
| `riddle-mcq.module.ts` | Registers 3 controllers + 7 services; `TypeOrmModule.forFeature([RiddleMcqCategory, RiddleMcqSubject, RiddleMcq])` + `CacheModule` |
| `controllers/riddle-mcq.controller.ts` (218 LOC) | Main `@Controller('riddle-mcq')`: admin list, public subject/mixed/random reads, riddle CRUD, bulk endpoints, CSV export, stats, filter-counts |
| `controllers/riddle-mcq-category.controller.ts` | `/riddle-mcq/categories` CRUD (+ `/all` admin variant) |
| `controllers/riddle-mcq-subject.controller.ts` | `/riddle-mcq/subjects` CRUD (+ `?hasContent=true`, `/all`, `/:slug`) |
| `entities/riddle-mcq.entity.ts` | Table `riddle_mcqs`; composite index `(subjectId, level, status)`; enum columns `level` (`RiddleMcqLevel`) and `status` (`RiddleStatus`) |
| `entities/riddle-category.entity.ts` | Table `riddle_categories` (slug unique, emoji, isActive) |
| `entities/riddle-subject.entity.ts` | Table `riddle_subjects` (slug unique, emoji, nullable categoryId FK, isActive) |
| `services/riddle-mcq-question.service.ts` (331 LOC) | Paginated cached admin list, by-subject read, random & mixed selection with UUID-based Fisher-Yates shuffle, create/update/delete |
| `services/riddle-mcq-category.service.ts` | Category CRUD + transactional cascade delete + `getCategoryCounts()` |
| `services/riddle-mcq-subject.service.ts` | Subject CRUD (incl. `hasContentOnly` inner-join query), slug/id lookup, transactional delete, `getSubjectCounts()` |
| `services/riddle-mcq-bulk.service.ts` (84 LOC) | Facade: delegates to ImportService / BulkActionsService; owns the CSV export builder |
| `services/riddle-mcq-bulk-actions.service.ts` (106 LOC) | Per-id loop executing delete/publish/draft/trash/restore + cache clear |
| `services/riddle-mcq-import.service.ts` (177 LOC) | Chunked (100/chunk) transactional bulk import; auto-creates categories/subjects from names |
| `services/riddle-mcq-stats.service.ts` (238 LOC) | `getStats()`, cached `getFilterCounts()`, `getStatusCountsBySubject()` |
| `dto/riddle-mcq.dto.ts` | Barrel: pagination DTO + re-exports of `create/` and `update/` DTO folders (refactor plan Priority 5) |
| `dto/create/*.ts`, `dto/update/*.ts` | class-validator DTOs with Swagger decorators |
| `validators/pagination.validator.ts`, `difficulty.validator.ts` | Manual query validators for count/level params |
| `utils/csv-export.util.ts` | CSV header/row builders, expert-answer formatting |
| `utils/slug.util.ts` | `generateSlug()` helper |

Migrations touching this feature (NOT wired up - see section 4): `src/migrations/AddRiddleCategories.ts`, `src/migrations/AddRiddleMcqIndexes.ts`.

Planning docs compared: `docs/archive/riddle-mcq-backend-plan.md`, `docs/archive/riddle-mcq-implementation-plan.md`, `RIDDLE-MCQ-REFACTOR-PLAN.md`, `RIDDLE-RENAME-PLAN.md`, `RIDDLE-MCQ-DOCUMENTATION.md`.

## 2. What Is Done (implemented & working)

- **Complete module wiring**: imported in `app.module.ts:87`; entities auto-discovered via glob (`app.module.ts:70`); Swagger tag "Riddle MCQ" registered in `main.ts:75`.
- **Public read API**: active subjects (optionally only those with content - `findAllSubjects(hasContentOnly)` uses `innerJoin('subject.riddles')`, `riddle-mcq-subject.service.ts:58-60`); paginated riddles per subject with optional level filter; mixed riddles (default 50, max 100) and per-level random riddles (max 50), both restricted to `status = PUBLISHED` (`riddle-mcq-question.service.ts:151-217`).
- **Admin content management**: full CRUD for categories, subjects and riddles; slug generation + uniqueness checks on create/update; JWT + `RolesGuard` + `@Roles('admin')` on every write/list-all route.
- **Bulk actions** (`POST /riddle-mcq/riddles/bulk-action`): delete/publish/draft/trash/restore implemented per-id with success/failure accounting and cache invalidation (`riddle-mcq-bulk-actions.service.ts:24-105`). Restore maps status back to DRAFT.
- **CSV export** (`GET /riddle-mcq/export`): category-grouped output with `# Category:` comment lines, escaped cells, expert text answers via `formatAnswerText`, dated filenames (`riddle-mcq-bulk.service.ts:27-79`).
- **Bulk import** (`POST /riddle-mcq/riddles/bulk`): chunked at 100 rows inside transactions, auto-creates missing categories and subjects by name, row-level validation errors collected instead of failing the whole batch (`riddle-mcq-import.service.ts:41-176`).
- **Caching layer**: question lists (600 s TTL, key includes all filters+page+limit), category/subject lists (600 s), filter-counts (300 s); all mutations call `cacheService.delPattern('riddle-mcq:*')`.
- **Filter counts endpoint**: single cached aggregate of categoryCounts, subjectCounts, levelCounts, statusCounts and total with slug-based filtering through joins (`riddle-mcq-stats.service.ts:102-237`).
- **Status workflow**: draft/published/trash enforced by DB enum; default DRAFT on create (`riddle-mcq-question.service.ts:254`).
- **Refactor plan Priority 1 complete**: bulk logic split out of the old 370-LOC bulk service into import/bulk-actions services plus `utils/slug.util.ts` and `utils/csv-export.util.ts`. Priority 5's DTO folder split also structurally exists.

## 3. What Is Partially Done / In Progress (planned vs built)

| Planned (doc) | Actual state |
|---|---|
| Backend plan sections 1.3/3.1: level-specific option rules - Easy exactly 2 options, Medium exactly 3, Hard exactly 4, enforced in DTO/service | Only a floor is enforced: non-expert needs at least 2 options plus a correctLetter (`riddle-mcq-question.service.ts:232-238`); nothing prevents 4 options on an Easy riddle. The strict rules exist only in the frontend zod schema (`RiddleMcqModal.tsx:17-47`). |
| Backend plan 1.2: remove `extreme` from the level enum | Enum cleaned (`common/enums/riddle-mcq-level.enum.ts:10-15`), but no data migration converts legacy `extreme` rows in the Postgres enum column. |
| Refactor plan Priority 4: split controller (~180 LOC target) | Controller still monolithic at 218 LOC with manual `parseInt` pagination instead of the already-written `RiddleMcqPaginationDto` (`dto/riddle-mcq.dto.ts:5-19` is exported but unused by controllers). |
| RIDDLE-MCQ-DOCUMENTATION.md architecture diagram showing flat `riddle-mcq.controller.ts` / `riddle-mcq.service.ts`, plus JSON import/export listed as a feature | Actual layout is the split controllers/services/utils tree; JSON import/export does not exist anywhere (CSV only). Doc is stale. |
| RIDDLE-RENAME-PLAN.md: rename classes `RiddleSubject` -> `RiddleMcqSubject`, `RiddleCategory` -> `RiddleMcqCategory` | Class renames applied in code; legacy naming survives elsewhere: entity files still named `riddle-category.entity.ts` / `riddle-subject.entity.ts`, tables keep old names (intentional per plan), and the separate `image-riddles` / `admin/image-riddles` modules duplicate a parallel "riddle" domain whose services expose identically-named methods (`findRiddleById`, `createRiddle`) - constant confusion risk. |

## 4. What Is Missing / Needs To Be Done

1. **Migrations are orphaned**: neither `AppModule` (`app.module.ts:50-82`) nor `src/database/data-source.ts` registers a `migrations` array or `migrationsRun`; the npm `migration:*` scripts point at `data-source.ts`, which loads no migrations. Schema currently relies entirely on `DB_SYNCHRONIZE=true`, which the code comments themselves forbid in production (`app.module.ts:71-73`, `database-config.ts:72-74`).
2. **The two hand-written riddle migrations are broken as-is**:
   - Filenames lack the `<timestamp>-<Name>.ts` pattern TypeORM's CLI expects (`AddRiddleMcqIndexes.ts`, `AddRiddleCategories.ts` vs valid `1773514916703-AddQuestionTypeAndCorrectLetter.ts`); they will not load via `migration:run`.
   - `AddRiddleMcqIndexes.ts` references tables/columns that no longer exist in any entity: `riddle_mcqs.chapterId`, `riddle_chapters`, `riddle_chapter_slug_history`, `riddle_subjects.order`.
   - `AddRiddleCategories.ts` creates `riddle_categories` with an `order` column and adds `riddle_subjects."order"` - the current `RiddleMcqCategory` entity has no `order` field (entity drift; the frontend type also declares `order`, see the frontend analysis doc).
3. **No single-riddle GET route**: `RiddleMcqQuestionService.findRiddleById()` (`riddle-mcq-question.service.ts:321-330`) is dead code - no controller exposes `GET /riddle-mcq/riddles/:id`.
4. **Stats payload mismatch with its only consumer** (frontend `getStats()`); also no per-subject x level counts endpoint despite both mode-picker pages needing real numbers.
5. **JSON import/export** promised in docs/admin plan - absent server-side too.
6. **No tests**: zero `.spec.ts` files in the backend tree.

## 5. Known Issues, Bugs & Tech Debt

1. **BUG - stats response contract mismatch (cross-stack)**: `getStats()` returns `{ totalRiddles, totalSubjects, totalCategories, riddlesByLevel }` (`riddle-mcq-stats.service.ts:30-59`) while the frontend expects `{ totalRiddleMcqs, mcqsByLevel, ... }` - every count on the public pages renders as 0. Worse, lines 36-40 **swap the values**: `totalSubjects` is assigned `categories.length` and `totalCategories` is assigned `subs.length`.
2. **BUG - public by-subject endpoint leaks unpublished content**: `findRiddlesBySubject()` filters only `subject.isActive`, never `riddle.status = 'published'` (`riddle-mcq-question.service.ts:63-81`). Draft/trash riddles are served to players via this route, unlike mixed/random which do filter.
3. **Service duplication / confusing facade**: `riddle-mcq-bulk.service.ts` is now a thin pass-through (`createRiddlesBulk` at lines 23-25 and `bulkActionRiddles` at lines 81-83 merely delegate) yet remains registered/injected alongside `RiddleMcqBulkActionsService` and `RiddleMcqImportService`. Either delete the facade or rename it; today the two similarly named bulk services invite wrong injection.
4. **Duplicated slug logic with divergent behavior**: private `generateSlug()` copies exist in `riddle-mcq-category.service.ts:36-41` and `riddle-mcq-subject.service.ts:33-38` (replace non-alphanumeric runs with `-`), different from `utils/slug.util.ts:1-8` used by the import service (replace spaces, then strip). The same name can produce different slugs depending on code path.
5. **Controller/service type drift**: `getFilterCounts` controller return type omits `statusCounts` (`riddle-mcq.controller.ts:189-200`) although the service returns it and the admin UI consumes it; the `stats/overview` Swagger shape likewise mis-documents reality.
6. **DTO inconsistency for bulk import**: `BulkCreateRiddleDto` marks `options` and `correctLetter` required (`dto/create/bulk-create-riddle.dto.ts:10-17`) while the import service explicitly supports expert rows with neither (`riddle-mcq-import.service.ts:130-138`). Expert imports fail if a global ValidationPipe rejects the payload before the service runs.
7. **Cache invalidation is a sledgehammer**: every mutation clears the entire `riddle-mcq:*` pattern rather than targeted keys (question/category/subject/import services); fine at small scale but defeats TTL purpose under write load. Admin list caching keyed by raw search strings creates an unbounded key space.
8. **Postgres-only SQL**: `ILIKE` search (`riddle-mcq-question.service.ts:135`); acceptable for this stack but undocumented.
9. **Inefficient count queries**: `getCategoryCounts` / `getSubjectCounts` fetch all rows then map in memory (`riddle-mcq-category.service.ts:162-193`, `riddle-mcq-subject.service.ts:187-239`) instead of LEFT JOIN aggregates.
10. **Random selection loads all IDs into memory** before shuffling (`findRandomRiddles` / `findMixedRiddles`, `riddle-mcq-question.service.ts:172-180,204-211`); `TABLESAMPLE` or `ORDER BY random() LIMIT n` would avoid full scans as content grows.

## 6. How It Works (architecture / data flow / API endpoint list)

```
Client
  |
  v
Controllers (JWT+RolesGuard on admin routes)
  RiddleMcqController ............ /riddle-mcq
  RiddleMcqCategoryController ... /riddle-mcq/categories
  RiddleMcqSubjectController .... /riddle-mcq/subjects
  |
  v
Services (each clears cache pattern riddle-mcq:* after writes)
  QuestionService  -> RiddleMcq repo (cached reads)
  CategoryService  -> RiddleMcqCategory repo + cascade deletes via DataSource tx
  SubjectService   -> RiddleMcqSubject repo + cascade deletes via DataSource tx
  BulkService (facade) -> ImportService (chunked tx bulk create) + BulkActionsService (per-id status ops)
  StatsService     -> aggregate queries + CacheService (filter-counts TTL 300s)
```

Data model: `riddle_categories` 1--N `riddle_subjects` (nullable categoryId) 1--N `riddle_mcqs`. A riddle is MCQ (`options[]` + `correctLetter`) for easy/medium/hard, or open-ended (null options/correctLetter, text in `answer`) at expert level. Status workflow: draft -> published -> trash.

Endpoint list:

| Method & Path | Auth | Handler |
|---|---|---|
| GET `/riddle-mcq/all?category&subject&level&status&search&page&limit` | admin | `riddle-mcq.controller.ts:42-71` |
| GET `/riddle-mcq/subjects/:subjectId/riddles?page&limit&level` | public | `:73-86` |
| GET `/riddle-mcq/mixed?count<=100` | public | `:88-93` |
| GET `/riddle-mcq/random/:level?count<=50` | public | `:95-105` |
| POST `/riddle-mcq/riddles` | admin | `:107-114` |
| POST `/riddle-mcq/riddles/bulk` | admin | `:116-125` |
| PATCH `/riddle-mcq/riddles/:id` | admin | `:127-134` |
| DELETE `/riddle-mcq/riddles/:id` | admin | `:136-145` |
| POST `/riddle-mcq/riddles/bulk-action` | admin | `:147-155` |
| GET `/riddle-mcq/export?category` | admin | `:157-167` |
| GET `/riddle-mcq/stats/overview` | public | `:169-178` |
| GET `/riddle-mcq/filter-counts?category&subject&level` | public | `:180-202` |
| GET `/riddle-mcq/stats/status-counts?subject` | admin | `:204-217` |
| GET/POST `/riddle-mcq/categories`, GET `/categories/all`, GET/PATCH/DELETE `/categories/:id` | mixed | category controller |
| GET `/riddle-mcq/subjects[?hasContent=true]`, GET `/subjects/all`, GET `/subjects/:slug`, POST/PATCH/DELETE subjects | mixed | subject controller |

## 7. Recommended Process To Proceed (prioritized step-by-step action plan)

1. **P0 - Fix the stats bug**: swap-correct lines 36-40 and reshape the payload to `{ totalRiddleMcqs, totalSubjects, mcqsByLevel }` (or update the frontend adapter); keep `totalRiddles` as an alias if other consumers appear.
2. **P0 - Add `andWhere('riddle.status = :status', { status: 'published' })`** to `findRiddlesBySubject()` to stop leaking drafts/trash to players.
3. **P1 - Migration hygiene**: rename both files to timestamp-prefixed names, rewrite their contents against current entities (drop chapter tables/order column; add the composite `(subjectId, level, status)` index matching the entity decorator), register `migrations` + `migrationsRun` in `data-source.ts`/`AppModule`, and run them once with `DB_SYNCHRONIZE=false` to verify.
4. **P1 - Resolve the bulk service duplication**: delete `RiddleMcqBulkService` and point the controller directly at `ImportService`/`BulkActionsService`, or rename it explicitly as a facade; keep only one slug helper (`utils/slug.util.ts`) and delete the private copies.
5. **P1 - Enforce level option rules server-side** (2/3/4 options per easy/medium/hard) in `CreateRiddleMcqDto`/service so the frontend zod rules are backed by the API.
6. **P2 - Expose `GET /riddle-mcq/riddles/:id`** wired to the existing dead `findRiddleById()`; use it in the admin edit flow instead of relying on list data.
7. **P2 - Align DTO validation with import reality**: make `options`/`correctLetter` optional in `BulkCreateRiddleDto` (expert rows), or split into MCQ vs open-ended DTOs; confirm the global ValidationPipe config tolerates arrays of body DTOs.
8. **P2 - Refactor Priority 4**: slim the controller using `RiddleMcqPaginationDto` + a shared parse helper; target under ~180 LOC.
9. **P3 - Replace whole-pattern cache clearing** with targeted key invalidation; bound the admin-list cache key space (hash search strings, cap entries).
10. **P3 - Optimize counts and random selection** (LEFT JOIN aggregates; `ORDER BY random()`/`TABLESAMPLE`).
11. **P3 - Add tests**: controller e2e for auth boundaries (public vs admin), service tests for cascade deletes, bulk import chunking/error collection, and stats output shape.
12. **P3 - Update `RIDDLE-MCQ-DOCUMENTATION.md`** to describe the real file tree, CSV-only import/export, and the actual stats payload once fixed.
