# Dad Jokes / Joke Section (Full Stack)

## 1. Scope & File Inventory

### Backend (`apps/backend/src/dad-jokes/`)

| File                               | Purpose                                                                                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dad-jokes.module.ts`              | Registers 3 controllers, service, TypeORM repos for 5 entities, CacheModule, BulkActionService; module exported for reuse                                       |
| `dad-jokes.controller.ts`          | `@Controller('jokes')` — classic-format endpoints: public list/random/search/categories/vote plus admin CRUD/bulk/bulk-action/status-counts/category CRUD       |
| `dad-jokes-quiz.controller.ts`     | `@Controller('jokes')` — quiz-format endpoints: subjects, chapters, per-chapter quiz jokes, random-by-level, mixed; admin CRUD for subjects/chapters/quiz jokes |
| `dad-jokes-stats.controller.ts`    | `GET /jokes/stats/overview` (admin-only) aggregate counts                                                                                                       |
| `dad-jokes-stats.util.ts`          | `computeDadJokeStats()` — parallel counts across all five repos                                                                                                 |
| `dad-jokes.service.ts`             | All business logic: classic jokes, categories, subjects/chapters/quiz jokes, voting, bulk ops, stats                                                            |
| `entities/dad-joke.entity.ts`      | `dad_jokes`: text joke, category FK, ContentStatus (default DRAFT), likes/dislikes counters, timestamps                                                         |
| `entities/joke-category.entity.ts` | `joke_categories`: name, emoji, OneToMany jokes                                                                                                                 |
| `entities/joke-subject.entity.ts`  | `joke_subjects`: unique slug, name, emoji, description, isActive, order, OneToMany chapters                                                                     |
| `entities/joke-chapter.entity.ts`  | `joke_chapters`: name, chapterNumber, subject FK, OneToMany quizJokes                                                                                           |
| `entities/quiz-joke.entity.ts`     | `quiz_jokes`: question, options (simple-array), correctAnswer, level enum (easy..extreme), chapter FK, explanation, punchline                                   |

### Frontend

| File                                                 | Purpose                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `app/jokes/page.tsx`                                 | Entire public jokes page — **localStorage only**; flip cards, vote buttons, Joke of the Day, search/sort/pagination |
| `app/jokes/layout.tsx` / `loading.tsx` / `error.tsx` | SEO metadata, skeleton, themed error boundary                                                                       |
| `lib/jokes-api.ts`                                   | API client (`getJokes`, `getJokeCategories`, `voteJoke`) targeting `/jokes/classic*` — exists but barely used       |
| `components/MobileFooter.tsx`                        | Only live consumer of `getJokeCategories(true)`; drawer links to `/jokes?category=<id>`                             |
| `lib/initial-data.ts:1-23`                           | 21 hardcoded fallback jokes (setup/punchline shape)                                                                 |
| `lib/storage.ts`                                     | Keys: `JOKES`, `JOKE_CATEGORIES`, `JOKE_VOTE_COUNTS`, `VOTED_JOKES`                                                 |
| `app/admin/components/JokesSection.tsx`              | Admin joke CRUD UI — localStorage-based via `useAdminData`                                                          |
| `app/admin/components/SettingsSection.tsx:407-441`   | Dad-jokes settings tab (category emoji, cache TTL)                                                                  |
| `apps/frontend/JOKE_SECTION_AUDIT.md`                | Prior audit doc; most items already applied (verified below)                                                        |

## 2. What Is Done (implemented & working)

**Backend — classic format:**

- Public: paginated list with optional status filter (`findAllClassic`, controller:48-56), random published joke via count+offset (`service:78-101`), search on joke ILIKE with `%`/`_` sanitization and category filter (`service:119-146`), categories with `?hasContent=true` inner-join filter and caching (`service:277-292`), category detail.
- Public unauthenticated voting: `POST /jokes/classic/:id/vote` increments likes/dislikes and invalidates cache (`controller:100-113`, `service:253-273`).
- Admin: create (forces DRAFT), bulk create (max 100, transactional, batched category lookup — `service:159-212`), update, delete, bulk actions via shared BulkActionService (`service:640-648`), status counts, category CRUD with cascade delete of its jokes (`service:331-346`).
- Stats: `GET /jokes/stats/overview` returns counts of classic jokes, categories, quiz jokes, subjects, chapters in one Promise.all (`stats.util:30-56`).

**Backend — quiz format (subject > chapter > quiz-joke hierarchy):**

- Public: `GET /jokes/subjects` (cached, active-only, ordered), `GET /jokes/subjects/:slug` with chapters, `GET /jokes/chapters/:subjectId`, `GET /jokes/quiz/:chapterId` paginated, `GET /jokes/random/:level?count=` (level validated easy-medium-hard-expert-extreme; ID fetch + shuffle, `service:466-500`), `GET /jokes/mixed?count=`.
- Admin: full subject/chapter/quiz-joke CRUD incl. bulk quiz creation with level validation (`service:548-608`) and count validation helper (`quiz controller:214-235`).

**Frontend page (complete as a client-side app):**

- Flip-card grid (front setup / back punchline) with accessible keyboard flipping (`page.tsx:533-600`).
- Voting implemented client-side against localStorage (`JOKE_VOTE_COUNTS`, `VOTED_JOKES`) with ref-based double-click guard (`page.tsx:144-176`), cross-tab sync via storage events (`:224-239`), toast feedback.
- Deterministic Joke of the Day seeded from the date so it changes at midnight (`:215-220`).
- Category sidebar with live counts, search across setup+punchline, sort Newest / Top liked / seeded-shuffle Random, ellipsis pagination (12/page).
- Legacy-data shim splitting single-string joke fields into setup/punchline at load (`:187-203`).

## 3. What Is Partially Done / In Progress

- **FE-BE integration**: `lib/jokes-api.ts` is a working client for list/categories/vote, but the public page ignores it entirely (imports only `initial-data` + `storage`, `page.tsx:6-7`). Only `MobileFooter.tsx:99` calls the real API (categories for the drawer). Votes cast on the page never reach `POST /jokes/classic/:id/vote`.
- **Admin**: `JokesSection.tsx` manages jokes purely in localStorage via `useAdminData`; no backend admin endpoints called, no JWT auth wiring.
- **Quiz format has zero frontend**: no pages/routes consume `/jokes/subjects`, `/jokes/chapters/:id`, `/jokes/quiz/:chapterId`, `/jokes/random/:level`, or `/jokes/mixed`. The whole subject/chapter/quiz-joke hierarchy is backend-only from the user perspective.
- **Audit doc status** (`JOKE_SECTION_AUDIT.md`): several recommendations already implemented â€” VoteButtons extracted (`page.tsx:61-89`), proper Fisher-Yates seeded shuffle replacing the charCode hack (`:35-47`), multi-tab sync (`:224-239`), keyword search (`:344-361`). Still open per the audit: deep linking (`/jokes?id=...`), share buttons, dark mode, server-side prefetch, trending sort (client "Top" sort runs over local data only).
- **Category param mismatch**: mobile footer links `/jokes?category=<uuid>` but the page filters by category _name_ and never reads query params.

## 4. What Is Missing / Needs To Be Done

1. Rewire `page.tsx` to use `getJokes()` / `getJokeCategories()` / `voteJoke()` instead of localStorage; keep localStorage only as voted-state cache.
2. Read `?category=` (and ideally `?id=` deep link) from URL; align footer link payload with what the page expects.
3. Build frontend for quiz format, e.g. `/jokes/quiz/[slug]` listing chapters then a playable quiz using `/jokes/quiz/:chapterId` and `/jokes/random/:level`; nothing exists today.
4. Wire admin `JokesSection.tsx` to backend endpoints with auth; map its CSV/JSON import-export to `POST /jokes/classic/bulk`.
5. Stats surface: `/jokes/stats/overview` is admin-only and unconsumed; either expose public counts or use it in the admin dashboard.
6. Vote integrity: current public vote endpoint allows unlimited anonymous increments; needs per-user/per-IP dedup or auth before FE switches to it.
7. Joke-of-the-day on the server if SEO matters (currently client-only render inside useEffect).

## 5. Known Issues, Bugs & Tech Debt

- **Split-brain architecture (same disease as image riddles)**: BE APIs + FE localStorage evolve independently; admin-entered jokes never reach the DB (`JokesSection.tsx` vs `dad-jokes.controller.ts`), and DB jokes never reach users (`page.tsx:186` reads only `STORAGE_KEYS.JOKES`).
- **Votes are device-local** (`page.tsx:152-157`): likes/dislikes reset per browser; the backend `likes/dislikes` columns and vote endpoint sit idle. Once both paths exist they will disagree.
- **Update DTO abuse**: `PUT /jokes/classic/:id` declares `UpdateJokeCategoryDto` then casts it to a joke update DTO (`dad-jokes.controller.ts:145-148`) â€” misleading Swagger docs; an `UpdateDadJokeDto` exists unused in `base.dto.ts:182-195`. Similarly `updateSubject` uses blanket `Object.assign(subject, dto)` (`service:390`) bypassing whitelist semantics.
- **Cache-key inconsistency**: category mutations invalidate `'jokes:categories'` but the cached key is `'jokes:categories:hasContent:true|false'` (`service:279` vs `:311,327,345`) â€” stale categories after create/update/delete unless TTL expires. Joke mutations use `delPattern('jokes:*')` which does cover it.
- **findAllClassic exposes DRAFT/TRASH by default** when no `status` query is passed (`service:56-76`) while random/search/category enforce PUBLISHED â€” inconsistent public exposure (same bug class as image riddles).
- **Quiz-format cache gap**: subject mutations invalidate `'jokes:subjects'`, but chapter/quiz-joke changes invalidate nothing (`service:414-446, 531-636`); subjects list embeds chapters so stale chapter data can persist until TTL.
- **Weak shuffle**: random quiz selection uses `.sort(() => Math.random() - 0.5)` (`service:493,522`) despite the comment claiming Fisher-Yates â€” biased and O(n log n) over all IDs; classic random (count+offset) is fine.
- **Bulk-create crash risk**: `createJokesBulk` builds `[...new Set(dto.map(j => j.categoryId))]` without filtering null/undefined (`service:175`) unlike the image-riddles equivalent; an item missing categoryId yields `In([null,...])` behavior differences/errors. Also `createJoke` requires categoryId (`base.dto.ts:179`) so bulk items lacking it fail late.
- **No status field on QuizJoke/JokeChapter/JokeSubject** beyond `isActive` on subject â€” no draft workflow for quiz content, unlike classic jokes.
- **Dead/legacy code**: `delivery`/`type` fields in `lib/jokes-api.ts:21-22` (icanhazdad-joke API shape) unused; legacy `joke?: string` shim in page; `_setJokeFilterCategory`/`_setSelectedJoke` underscore-disabled setters in `JokesSection.tsx:19-20,49` leave filter/search UI non-functional in admin.
- **Hardcoded categories duplicated**: `defaultJokeCategories` in `page.tsx:26-31` duplicates what should come from the categories API/table (and uses numeric ids vs uuids).
- **Accessibility note carried from audit**: like/dislike buttons remain nested inside the card's `role="button"` wrapper (`page.tsx:534-600`), the anti-pattern the audit flagged; stopPropagation handles clicks but not the nested-control semantics.

## 6. How It Works (architecture / data flow / API endpoint list)

### Data flow today

- Public page: browser loads `/jokes` -> useEffect reads localStorage keys (`JOKES`, `JOKE_CATEGORIES`, `JOKE_VOTE_COUNTS`, `VOTED_JOKES`), falls back to 21 hardcoded jokes; all filtering/sorting/voting stays in memory + localStorage. No HTTP calls.
- Mobile footer drawer: real API call `GET /jokes/classic/categories?hasContent=true`, then links to `/jokes?category=<uuid>` (param unread by the page).
- Admin panel: reads/writes localStorage through `useAdminData`; backend admin endpoints unused.
- Backend: three controllers share one service over five TypeORM entities; CacheService caches category/subject lists; mutations invalidate `jokes:*`.

### Hierarchy

- Classic: `JokeCategory` 1-to-many `DadJoke` (status workflow DRAFT/PUBLISHED/TRASH, likes/dislikes counters).
- Quiz: `JokeSubject` (slug, order) 1-to-many `JokeChapter` (chapterNumber) 1-to-many `QuizJoke` (question/options/correctAnswer, level easy-extreme).

### API endpoint list

Classic format (`dad-jokes.controller.ts`):

| Method | Path                                                                                               | Auth   | Notes                                                                |
| ------ | -------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------- |
| GET    | `/jokes/classic?page&limit&status`                                                                 | public | paginated; status optional (draft-leak risk)                         |
| GET    | `/jokes/classic/random`                                                                            | public | random PUBLISHED joke                                                |
| GET    | `/jokes/classic/search?search&categoryId&page&limit`                                               | public | ILIKE on joke text                                                   |
| GET    | `/jokes/classic/categories?hasContent=`                                                            | public | cached; innerJoin filter                                             |
| GET    | `/jokes/classic/categories/:id`                                                                    | public | includes jokes relation                                              |
| GET    | `/jokes/classic/category/:id?page&limit`                                                           | public | PUBLISHED only                                                       |
| POST   | `/jokes/classic/:id/vote`                                                                          | public | body `{ voteType: like/dislike }`; unauthenticated counter increment |
| POST   | `/jokes/classic`, `/jokes/classic/bulk`, `/jokes/classic/bulk-action`, `/jokes/classic/categories` | admin  | create/bulk/bulk-action/category-create                              |
| PUT    | `/jokes/classic/:id`, `/jokes/classic/categories/:id`                                              | admin  | update (DTO cast issue)                                              |
| DELETE | `/jokes/classic/:id`, `/jokes/classic/categories/:id`                                              | admin  | hard delete; category delete cascades jokes                          |
| GET    | `/jokes/classic/status-counts`                                                                     | admin  | counts by ContentStatus                                              |

Quiz format (`dad-jokes-quiz.controller.ts`):

| Method          | Path                                                                                      | Auth   | Notes                             |
| --------------- | ----------------------------------------------------------------------------------------- | ------ | --------------------------------- |
| GET             | `/jokes/subjects`                                                                         | public | cached, active only, ordered      |
| GET             | `/jokes/subjects/:slug`                                                                   | public | subject + chapters                |
| GET             | `/jokes/chapters/:subjectId`                                                              | public | chapters by subject               |
| GET             | `/jokes/quiz/:chapterId?page&limit`                                                       | public | quiz jokes by chapter             |
| GET             | `/jokes/random/:level?count=1..50`                                                        | public | random quiz jokes by level        |
| GET             | `/jokes/mixed?count=1..100`                                                               | public | random quiz jokes across chapters |
| POST/PUT/DELETE | `/jokes/subjects(/:id)`, `/jokes/chapters(/:id)`, `/jokes/quiz(/:id)`, `/jokes/quiz/bulk` | admin  | CRUD                              |

Stats (`dad-jokes-stats.controller.ts`):

| Method | Path                    | Auth                                                                                               |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/jokes/stats/overview` | admin â€” returns totalClassicJokes, totalCategories, totalQuizJokes, totalSubjects, totalChapters |

### Frontend field expectations vs backend responses

- FE `Joke` uses `setup` + `punchline` strings; BE `DadJoke` returns a single `joke` string plus a nested `category` object (not a name string). The page's split-shim (`page.tsx:190-202`) and name-based category filtering would both break against real API payloads.
- FE categories carry numeric `id` and `description`; BE `JokeCategory` has uuid `id`, no description column (`joke-category.entity.ts`).
- FE votes read per-joke `likes/dislikes` from localStorage; BE vote response returns the updated DadJoke entity.

## 7. Recommended Process To Proceed (prioritized action plan)

1. **Bridge the classic page to the API** (P0): extend `lib/jokes-api.ts` with a mapper (BE `joke` string to setup/punchline; category object to name), switch `page.tsx` data load to `getJokes()` + `getJokeCategories()`, keep localStorage only for `VOTED_JOKES`.
2. **Switch voting to the backend** (P0): call `voteJoke(id, type)` and hydrate counts from API responses; add basic dedup (per-user token or IP) server-side before enabling.
3. **Fix URL contract** (P1): make `page.tsx` read `?category=<uuid>` (or change footer to pass name); add `?id=` deep-link scroll/flip per the audit.
4. **Fix backend inconsistencies** (P1): default public finders to PUBLISHED only; use real `UpdateDadJokeDto`; align category cache invalidation keys (`delPattern('jokes:categories:*')`); invalidate subject cache on chapter/quiz mutations.
5. **Ship a minimal quiz-format UI** (P2): `/jokes/quiz/[slug]` chapter listing plus a play view using `/jokes/quiz/:chapterId` and `/jokes/random/:level`.
6. **Wire admin JokesSection to the API** (P2): CRUD + bulk import mapped to backend bulk endpoints, with JWT.
7. **Clean up** (P3): remove legacy `delivery/type` fields and the unused `UpdateDadJokeDto` ambiguity, replace biased `.sort(random)` shuffle with Fisher-Yates, dedupe hardcoded categories, address nested-interactive-element a11y finding from the audit.

## Code Quality Notes

Standards, budgets, and phase exit criteria: [../../plan/code-quality-plan.md](../../plan/code-quality-plan.md). Feature-specific debt tracked there in �5.
