# Feature: Quiz (Classic MCQ Quiz — Full Stack)

Merged from former sections 02 (frontend) and 05 (backend). Frontend paths relative to `apps/frontend/`, backend to `apps/backend/src/`.

## A. Backend (`apps/backend/src/quiz/`)

### File inventory

| File | Purpose |
|---|---|
| `quiz.module.ts` | Controller + service, repos for 3 entities, CacheService, BulkActionService; exports QuizService |
| `quiz.controller.ts` | ~19 endpoints under `/quiz` (Swagger-tagged) |
| `quiz.service.ts` | 959 lines: CRUD, bulk import, filter counts, CSV export |
| `dto/export-query.dto.ts` | Export query DTO |
| `entities/subject.entity.ts` | `subjects`: unique slug, name, emoji, category, isActive, order |
| `entities/chapter.entity.ts` | `chapters`: name, chapterNumber, unique(name+subjectId) |
| `entities/question.entity.ts` | `questions`: jsonb options, correctAnswer/Letter, level enum easy..extreme, ContentStatus default DRAFT, composite index (chapterId, level, status) |

### Endpoint map

| Method & Path | Auth | Notes |
|---|---|---|
| GET `/quiz/subjects` | public | optional `?hasContent=true` (`controller:83-89`) |
| GET `/quiz/subjects/:slug/meta` | public | lightweight meta (`:91-96`) |
| GET `/quiz/subjects/:slug` | public | with chapters (`:98-103`) |
| GET `/quiz/subjects/:slug/questions` | public | PUBLISHED only, unbounded by default (`:105-121`) |
| GET `/quiz/subjects/:slug/status-counts` | admin | (`:375-388`) |
| GET `/quiz/filter-counts` | admin | unified facet counts (`:123-156`) |
| POST/PUT/DELETE `/quiz/subjects[/:id]` | admin | CRUD (`:158-187`) |
| GET `/quiz/chapters`, `/quiz/chapters/:subjectId` | public | (`:191-201`) |
| POST/PATCH/DELETE `/quiz/chapters[/:id]` | admin | CRUD (`:203-232`) |
| GET `/quiz/questions` | admin | paginated + filters (`:236-260`) |
| GET `/quiz/questions/export` | admin | CSV (`:262-277`) |
| GET `/quiz/questions/:chapterId` | public | PUBLISHED only (`:279-286`) |
| GET `/quiz/mixed`, `/quiz/random/:level` | public | challenge pools (`:302-314`) |
| POST `/quiz/questions[/bulk]` | admin | single + chunked import (`:316-339`) |
| PATCH/DELETE `/quiz/questions/:id` | admin | (`:341-361`) |
| POST `/quiz/bulk-action` | admin | shared BulkActionService (`:365-373`) |

### Backend status

**Done:** transactional cascade deletes for subjects/chapters (`service:140-172, 229-259`); Redis caching with pattern invalidation (`service:41-73`); parent-cascading filter counts (`getFilterCounts`, `service:332-537`); chunked bulk import with auto-created subjects/chapters and row-level error collection (`service:598-756`); level/type validation on create (`service:569-582`); escaped CSV export (`service:885-958`); public reads hard-filter PUBLISHED.

**Backend bugs:**
1. **Dead logic in `updateQuestion`** — `const level = dto.level != null || question.level;` (`service:776`) is always truthy; the extreme check never works. Fix: `(dto.level ?? question.level) === 'extreme'`.
2. **`random/:level` and `mixed` are not random** — both return `updatedAt DESC` with no shuffle (`service:539-561`).
3. Chapter numbering race: `length + 1` (`service:204-205`); imports set `chapterNumber: 0` (`service:681`).
4. Bulk-import slug collisions ("C++" vs "C") abort a whole 100-row chunk (`service:648-651`).
5. N-delete loop in subject delete (`service:156-158`).

## B. Frontend — gameplay (`apps/frontend/src/`)

### File inventory

| File | Purpose | Status |
|---|---|---|
| `app/quiz/page.tsx` | 767-line wizard: Subject→Chapter→Mode→Level via URL params | Done; monolithic |
| `app/quiz/play/page.tsx` | Gameplay (849 lines): summary, timer, skip/share, resume, submit+extend modals | Done; very large |
| `app/quiz/timer-challenge/page.tsx` / `practice-mode/page.tsx` | Challenge hubs (~95% clones) | Done; duplicated |
| `app/quiz/practice/page.tsx`, `challenge/page.tsx` | Redirect shims | Done |
| `app/quiz/results/page.tsx` | Results from localStorage history | Done; scoring bugs (§D) |
| `hooks/useQuiz.ts` | Engine hook (641 lines): loading, scoring, timers, resume | Done; hotspot |
| `components/quiz/*` | QuestionCard, AnswerOptions (level-aware), BubbleEmojiEffect, FloatingBackground, ScoreCard, QuestionReview, ResultsCelebration | Done; QuizTimer.tsx + QuizNavigation.tsx **dead code** |
| `features/quiz/**` | Admin CRUD: QuizContainer, FilterPanel, QuestionManager/Table, modals (subject/chapter/question/import), TanStack Query hooks with optimistic updates | Done; admin-only consumer |

### Frontend status

**Done:** URL-driven 4-stage wizard with "Coming Soon" zero-question disabling; full engine (MCQ + open-ended scoring, total/per-question timers, visited/skipped sets, resume persistence, shared-link deep start `?shared=true`); results page (grades, breakdown, review, share); timer urgency visuals; complete admin CRUD against backend (optimistic mutations, CSV import/export).

**Partially done:** chapter progress is read but never written (`saveQuizResult` has no callers); achievements never triggered on completion; per-level timers fall back to hardcoded defaults (`play/page.tsx:25-31`); explanations typed but unsupplied; ResultsCelebration tiers unfinished (only `perfect` used).

**Missing (frontend):**
- Server-side session/result persistence (all history/resume/high-scores in localStorage only)
- Challenge streak tracking (achievement condition exists, no tracker)
- Unanswered-review handling ('N/A' letter never matches)
- Pagination safety — fetches ALL questions of a subject client-side
- Accessibility (aria-live feedback, label association in AnswerOptions)
- Tests for useQuiz (zero exist)

## C. How It Works (data flow)

```
/quiz (wizard) ──?subject&chapter&mode&level──▶ /quiz/play
     useQuiz → lib/quiz-api → NestJS /quiz endpoints (public PUBLISHED-only reads)
     state machine loading→playing⇄paused→completed; localStorage resume/history keys:
     aiquiz:current-session / quiz-resume-session / quiz-history / chapter-progress (read-only)
completed → /quiz/results?session=<uuid> → calculateResult → ScoreCard + QuestionReview
Admin: app/admin?section=quiz → features/quiz (TanStack Query, URL filters, optimistic CRUD,
       CSV import/export) → admin-guarded /quiz endpoints
```

Admin path uses idiomatic React Query with key-based invalidation; gameplay is one useState-style reducer object in useQuiz. Persistence is localStorage-only end-to-end.

## D. Known Bugs (frontend)

1. **QuestionReview compares letter vs text** — `isCorrect = userAnswer === question.correctAnswer` (`QuestionReview.tsx:32`) marks almost every MCQ red; should compare `correctLetter`.
2. **Extreme questions mis-scored in results** — `calculateResult` checks `answers[q.id] === q.correctLetter` (`results/page.tsx:59`); free-text answers always counted wrong though useQuiz scored them right.
3. **Crash risk** — `byDifficulty[q.level]` assumes known levels (`results/page.tsx:61`).
4. Hub duplication (timer-challenge ≈ practice-mode; level maps declared 3×).
5. Resume-state bloat — serializes entire `availableQuestions` every change (`useQuiz.ts:439-452`); quota blowout silent.
6. Per-question timer resets on going *back* (`useQuiz.ts:363,379,556,573`) — free time.
7. Double-completion race — history saved inside setState updater AND effect (`useQuiz.ts:384-425`); StrictMode risk.
8. `router.replace` churn on every answer (`play/page.tsx:159-169`).
9. ModeSelection perpetual "Loading..." when a chapter has zero questions (`app/quiz/page.tsx:566`).
10. Admin coupling — `features/quiz` hardcodes `isAdmin: true`; misleading naming (admin CRUD called "QuizContainer"); outside tailwind globs.

## E. Roadmap (prioritized)

1. **P0 correctness**: fix §B-bug1 updateQuestion logic + §D bugs 1–3; add regression tests.
2. **P0 wiring**: call `saveQuizResult()` + `checkAchievements()` in completion effect.
3. **P0 backend**: server-side shuffle or rename random/mixed; fix slug collisions.
4. **P1 refactor**: merge challenge hubs into one parameterized component; extract save-path out of setState updaters; trim resume payload; delete dead components.
5. **P2**: `POST /quiz/sessions` for cross-device history; replace client-side count loops with `GET /quiz/filter-counts`.
6. **P3**: split play page into subcomponents; rename `features/quiz` → `features/quiz-admin`; finish celebration tiers; backfill chapterNumber strategy.

