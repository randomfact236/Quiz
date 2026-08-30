# Dad Jokes (Full Stack)

## 1. Scope & File Inventory

### Backend (`apps/backend/src/dad-jokes/`)

| File                               | Purpose                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `dad-jokes.module.ts`              | Registers 2 controllers + service, TypeORM repos for 2 entities, CacheModule, BulkActionService                |
| `dad-jokes.controller.ts`          | `@Controller('jokes')` — public list/random/search/categories/vote + admin CRUD/bulk/bulk-action/category CRUD |
| `dad-jokes-stats.controller.ts`    | `GET /jokes/stats/overview` (admin-only) aggregate counts                                                      |
| `dad-jokes-stats.util.ts`          | `computeDadJokeStats()` — parallel counts across joke + category repos                                         |
| `dad-jokes.service.ts`             | All business logic: jokes, categories, voting, bulk ops, stats                                                 |
| `entities/dad-joke.entity.ts`      | `dad_jokes`: text joke, category FK, ContentStatus (default DRAFT), likes/dislikes counters, timestamps        |
| `entities/joke-category.entity.ts` | `joke_categories`: name, emoji, OneToMany jokes                                                                |

### Frontend

| File                                                 | Purpose                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `app/jokes/page.tsx`                                 | Public jokes page — flip cards, vote buttons, Joke of the Day, search/sort/pagination; API + localStorage |
| `app/jokes/layout.tsx` / `loading.tsx` / `error.tsx` | SEO metadata, skeleton, themed error boundary                                                             |
| `lib/jokes-api.ts`                                   | API client (`getJokes`, `getJokeCategories`, `voteJoke`) targeting `/jokes/classic*`                      |
| `components/MobileFooter.tsx`                        | Consumer of `getJokeCategories(true)`; drawer links to `/jokes?category=<id>`                             |
| `app/admin/components/JokesSection.tsx`              | Admin joke CRUD UI — wired to backend API with auth                                                       |
| `app/admin/components/SettingsSection.tsx`           | Dad-jokes settings tab (category emoji, cache TTL)                                                        |

## 2. What Is Done (implemented & working)

**Backend:**

- Public: paginated list hard-filters PUBLISHED (`findAllJokes`, `service:59-76`), random published joke via count+offset (`service:92-115`), search on joke ILIKE with `%`/`_` sanitization and category filter (`service:133-160`), categories with `?hasContent=true` inner-join filter and caching (`service:296-312`), category detail.
- Public unauthenticated voting: `POST /jokes/classic/:id/vote` increments likes/dislikes (`controller:121-136`, `service:272-292`).
- Admin: create (forces DRAFT), bulk create (max 100, transactional, batched category lookup — `service:173-231`), update, delete, bulk actions via shared BulkActionService, status counts, category CRUD with cascade delete of its jokes (`service:358-376`).
- Stats: `GET /jokes/stats/overview` returns `{ totalJokes, totalCategories }`.

**Frontend:**

- Public page wired to API: `getJokes(1, 100)` + `getJokeCategories()` on mount; localStorage kept only as offline fallback + vote-state cache.
- `?category=<uuid>` deep link + sidebar counts keyed by UUID.
- Flip-card grid (front setup / back punchline) with accessible keyboard flipping.
- Voting via localStorage with ref-based double-click guard, cross-tab sync via storage events, toast feedback.
- Deterministic Joke of the Day seeded from the date.
- Category sidebar with live counts, search across setup+punchline, sort Newest / Top / seeded-shuffle Random, ellipsis pagination (12/page).
- Admin `JokesSection` wired to API: mount-time fetch, CRUD, bulk actions, category CRUD, CSV/JSON import via `POST /jokes/classic/bulk` with category auto-resolution.
- PaginationDto clamp: `limit` is clamped to `[1, 100]` via `@Transform` instead of rejecting with 400.

## 3. What Is Partially Done / In Progress

- **Vote integration**: `page.tsx` `handleVote` still writes localStorage only; `voteJoke()` from `jokes-api.ts` is not called. Backend vote endpoint and likes/dislikes columns idle.
- **Audit doc status** (`JOKE_SECTION_AUDIT.md`): VoteButtons extracted, Fisher-Yates shuffle, multi-tab sync, keyword search done. Still open: deep linking, share buttons, dark mode, server-side prefetch, trending sort.
- **Hardcoded fallback categories**: `defaultJokeCategories` in `page.tsx:24-29` with numeric ids, only used when API fails.

## 4. What Is Missing / Needs To Be Done

1. Wire `page.tsx` `handleVote` to `voteJoke()` so engagement persists server-side.
2. Consume `/jokes/stats/overview` in the admin dashboard or a public widget.
3. Fix "Newest" sort: `Number(uuid)` → NaN (`page.tsx:346`); use `createdAt` instead.
4. Joke-of-the-day server-side if SEO matters (currently client-only in `useEffect`).

## 5. Known Issues, Bugs & Tech Debt

- **Votes are device-local**: likes/dislikes reset per browser; backend vote endpoint and DB counters sit idle.
- **"Newest" sort broken**: `Number(uuid)` → NaN on UUIDs; jokes render but unordered.
- **Category delete hard-cascades**: `deleteCategory` removes jokes permanently, bypassing the DRAFT/TRASH workflow.
- **Dead setters**: `_setJokeFilterCategory`, `_setSelectedJoke`, `_showTrashConfirm` in `JokesSection.tsx:68-100`.
- **Hardcoded fallback categories**: `defaultJokeCategories` with numeric ids duplicates API data.
- **Stats unconsumed**: `/jokes/stats/overview` exists but no frontend surface.
- **Accessibility**: like/dislike buttons nested inside card `role="article"` container.

## 6. How It Works (architecture / data flow / API endpoint list)

### Data flow

- Public page: browser loads `/jokes` → `useEffect` calls `getJokes()` + `getJokeCategories()` via API; falls back to localStorage + hardcoded jokes if API fails. Votes write to localStorage; not synced to backend.
- Mobile footer drawer: API call `GET /jokes/classic/categories?hasContent=true`, links to `/jokes?category=<uuid>`.
- Admin panel: `JokesSection` loads from `GET /jokes/classic/all` (all statuses) + categories on mount; CRUD/bulk/import via backend API with JWT auth.
- Backend: 2 controllers + 1 stats controller share one service over 2 TypeORM entities; CacheService caches category lists; mutations invalidate `jokes:categories:hasContent:*`.

### Hierarchy

`JokeCategory` 1-to-many `DadJoke` (status workflow DRAFT/PUBLISHED/TRASH, likes/dislikes counters).

### API endpoint list

| Method | Path                                                                                               | Auth   | Notes                                       |
| ------ | -------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------- |
| GET    | `/jokes/classic?page&limit`                                                                        | public | paginated; PUBLISHED only                   |
| GET    | `/jokes/classic/all?page&limit`                                                                    | admin  | all statuses                                |
| GET    | `/jokes/classic/random`                                                                            | public | random PUBLISHED joke                       |
| GET    | `/jokes/classic/search?search&categoryId&page&limit`                                               | public | ILIKE on joke text                          |
| GET    | `/jokes/classic/categories?hasContent=`                                                            | public | cached; innerJoin filter                    |
| GET    | `/jokes/classic/categories/:id`                                                                    | public | includes jokes relation                     |
| GET    | `/jokes/classic/category/:id?page&limit`                                                           | public | PUBLISHED only                              |
| POST   | `/jokes/classic/:id/vote`                                                                          | public | body `{ voteType: like/dislike }`           |
| POST   | `/jokes/classic`, `/jokes/classic/bulk`, `/jokes/classic/bulk-action`, `/jokes/classic/categories` | admin  | create/bulk/bulk-action/category-create     |
| PUT    | `/jokes/classic/:id`, `/jokes/classic/categories/:id`                                              | admin  | update                                      |
| DELETE | `/jokes/classic/:id`, `/jokes/classic/categories/:id`                                              | admin  | hard delete; category delete cascades jokes |
| GET    | `/jokes/classic/status-counts`                                                                     | admin  | counts by ContentStatus                     |
| GET    | `/jokes/stats/overview`                                                                            | admin  | returns `{ totalJokes, totalCategories }`   |

### Frontend field expectations vs backend responses

- FE `Joke` uses `setup` + `punchline` strings; BE `DadJoke` returns a single `joke` string plus a nested `category` object. The page's `splitJoke()` shim and `adaptJoke()` mapper bridge the gap.
- FE categories carry numeric `id`; BE `JokeCategory` has uuid `id` (sidebar filters by `categoryId` matching API UUIDs).
- FE votes read per-joke `likes/dislikes` from localStorage; BE vote response returns the updated DadJoke entity (not yet wired).

## 7. Recommended Process To Proceed (prioritized action plan)

1. ✅ DONE — `lib/jokes-api.ts` rewritten with `adaptJoke()` mapper; public page rewired to API; localStorage kept as offline fallback.
2. ✅ DONE — public `GET /jokes/classic` hard-filters PUBLISHED.
3. ✅ DONE — `page.tsx` reads `?category=<uuid>` from URL; category sidebar filters by `categoryId`.
4. ✅ DONE — cache invalidation fixed; null-categoryId crash fixed; pagination clamp (limit capped at 100).
5. ✅ DONE — `sample-dad-jokes.sql` seed: 4 categories + 15 published jokes.
6. ✅ DONE — `JokesSection.tsx` wired to API with auth; CRUD/bulk/import.
7. ✅ DONE — dead code cleanup; DTO cast fix; a11y fix.
8. ✅ DONE — emoji encoding fix; limit 500→100 at both call sites.

## Code Quality Notes

Standards, budgets, and phase exit criteria: [../../plan/code-quality-plan.md](../../plan/code-quality-plan.md). Feature-specific debt tracked there in §5.
