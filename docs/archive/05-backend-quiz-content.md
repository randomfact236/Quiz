# Backend Quiz Content Module (`apps/backend/src/quiz/`)

Core content-management backend for the classic quiz format: subjects > chapters > questions. Companion to `02-quiz-module.md` (frontend). All paths relative to `apps/backend/src/` unless noted.

## 1. Scope & File Inventory

| File | Purpose |
|---|---|
| `quiz.module.ts` | Registers controller + service, TypeORM repos for 3 entities, CacheService, BulkActionService; exports QuizService |
| `quiz.controller.ts` | 389 lines, ~19 endpoints under `/quiz` (Swagger-tagged), public read vs admin-guarded write split |
| `quiz.service.ts` | 959 lines of business logic: subject/chapter/question CRUD, bulk import, filter counts, CSV export |
| `dto/export-query.dto.ts` | Query DTO for CSV export (subject/level/chapter/status) |
| `entities/subject.entity.ts` | `subjects`: unique slug, name, emoji, category, isActive, order, OneToMany chapters |
| `entities/chapter.entity.ts` | `chapters`: name, chapterNumber, ManyToOne subject, unique(name+subjectId) |
| `entities/question.entity.ts` | `questions`: text, jsonb options, correctAnswer, nullable correctLetter, level enum (easy..extreme), ContentStatus (default DRAFT), order, composite index (chapterId, level, status) |

## 2. Endpoint Map

| Method & Path | Auth | Notes (controller line) |
|---|---|---|
| GET `/quiz/subjects` | public | optional `?hasContent=true` inner-join filter (`:83-89`) |
| GET `/quiz/subjects/:slug/meta` | public | lightweight name/emoji/slug (`:91-96`) |
| GET `/quiz/subjects/:slug` | public | with chapters (`:98-103`) |
| GET `/quiz/subjects/:slug/questions` | public | PUBLISHED only, unlimited by default (`:105-121`) |
| GET `/quiz/subjects/:slug/status-counts` | admin | per-subject status counts (`:375-388`) |
| GET `/quiz/filter-counts` | admin | unified counts for all filter facets (`:123-156`) |
| POST/PUT/DELETE `/quiz/subjects[/:id]` | admin | CRUD (`:158-187`) |
| GET `/quiz/chapters`, `/quiz/chapters/:subjectId` | public | lists (`:191-201`) |
| POST/PATCH/DELETE `/quiz/chapters[/:id]` | admin | CRUD (`:203-232`) |
| GET `/quiz/questions` | admin | paginated + filters (`:236-260`) |
| GET `/quiz/questions/export` | admin | CSV export (`:262-277`) |
| GET `/quiz/questions/:chapterId` | public | PUBLISHED only (`:279-286`) |
| GET `/quiz/mixed`, `/quiz/random/:level` | public | pools for challenge modes (`:302-314`) |
| POST `/quiz/questions`, `/quiz/questions/bulk` | admin | single + chunked bulk import (`:316-339`) |
| PATCH/DELETE `/quiz/questions/:id` | admin | update/delete (`:341-361`) |
| POST `/quiz/bulk-action` | admin | shared BulkActionService (`:365-373`) |

## 3. What Is Done (implemented & working)

- **Full CRUD for all three levels** with transactional cascading deletes: subject delete removes questions then chapters then subject inside one transaction with rollback (`service:140-172`); chapter delete likewise (`service:229-259`).
- **Caching**: question list + filter-counts cached in Redis (600s / 300s TTLs, `service:41-44`); every mutation calls `delPattern('quiz:*')` (`service:71-73`). Subjects deliberately uncached so deletes reflect instantly (`service:81`).
- **Filter counts with parent-cascading semantics** (`getFilterCounts`, `service:332-537`): subjects always show totals, chapters respect subject filter, levels add chapter, statuses add level — implemented via a parameterized `applyParentFilters` helper; zero-count chapters still returned via map seeding.
- **Bulk import**: chunked (100/chunk) each in its own transaction (`createQuestionsBulkFromImport`, `service:598-756`); auto-creates subjects (slugified, emoji 📚) and chapters; invalid rows collected into `errors[]` instead of failing the batch; extreme rows handled as open-ended (options/correctLetter nulled).
- **Level/type validation on create**: MCQ requires correctLetter A-D + ≥2 options; open-ended requires both null (`service:569-582`).
- **CSV export** with proper escaping (`""` doubling), `# Subject:` header comment, dated filename (`service:885-958`).
- **Public/private data split**: public question reads hard-filter `ContentStatus.PUBLISHED` at service level (`service:263, 546, 555`).
- **Status counts per subject** via single GROUP BY query (`service:849-883`).

## 4. What Is Broken / Buggy

1. **Dead logic in `updateQuestion`** — `const level = dto.level != null || question.level;` (`service:776`) is always truthy (boolean OR string), so the subsequent `level === 'extreme'` check never clears options correctly when updating options on an extreme question. Should be `(dto.level ?? question.level) === 'extreme'`.
2. **`GET /quiz/random/:level` and `/quiz/mixed` return non-random data** — both fetch ordered by `updatedAt DESC` (`service:539-561`) with no shuffle; "random" exists only client-side. Name misleads; also returns *all* matching questions (no limit on random path).
3. **Chapter numbering race/gap**: `createChapter` sets `chapterNumber = existingChapters.length + 1` (`service:204-205`) — duplicates possible under concurrency; bulk-imported chapters get `chapterNumber: 0` (`service:681`), breaking any ordering assumptions.
4. **Bulk-import slug collisions**: slug sanitization strips chars (`service:648-651`) so "C++ Basics" and "C Basics" collide → unique-violation aborts that whole 100-row chunk transaction even though other chunks succeed.
5. **N-delete loop** in `deleteSubject` issues one DELETE per chapter's questions (`service:156-158`) instead of a single `IN` delete.
6. **No route-level pagination guard** on public subject questions: `limit || 0` means unbounded payload (`controller:120`); fine today, risky as content grows.

## 5. What Is Missing / Needs To Be Done

1. Fix the `updateQuestion` level bug and add server-side shuffle (or rename endpoints to `/by-level`, `/mixed-pool`) for random/mixed.
2. Add integration tests (currently **zero spec files** cover this module) — see `10-testing-quality-tooling.md`.
3. Backfill/migrate `chapterNumber: 0` rows from imports; derive numbering consistently.
4. Consider soft-delete/trash parity with riddle-mcq module (questions here hard-delete; riddle-mcq has trash workflow) for consistent UX.
5. Rate-limit or cap the unbounded public question endpoint once content scales.

## 6. Process To Proceed

1. Write regression tests for bugs #1/#2 first (jest + sqlite or testcontainers).
2. Apply small fixes (one PR per bug), verify with `npm run test --workspace=apps/backend`.
3. Then structural improvements (bulk-delete optimization, chapterNumber strategy).
