# Feature 05 — Dad Jokes (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30. Supersedes `docs/features/archive/dad-jokes.md`
> (archived 2026-08-30 via `git mv`, history preserved; every claim re-checked against code —
> stale claims from the old doc were dropped or corrected).

---

## 1. File inventory

Backend (`apps/backend/src/dad-jokes/`):

| File                               | Purpose                                                                                                                                                   | Size (verified) |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `dad-jokes.module.ts`              | 2 controllers + service; repos for 2 entities; CacheModule; **uncommitted:** now imports AnalyticsModule                                                  | 32 lines        |
| `dad-jokes.controller.ts`          | `/jokes` — public list/random/search/categories/vote + admin CRUD/bulk/bulk-action/category CRUD                                                          | 240 lines       |
| `dad-jokes-stats.controller.ts`    | `GET /jokes/stats/overview` (admin-only)                                                                                                                  | —               |
| `dad-jokes-stats.util.ts`          | `computeDadJokeStats()` — parallel counts across joke + category repos                                                                                    | 38 lines        |
| `dad-jokes.service.ts`             | All business logic: jokes, categories, voting (with toggle/remove), bulk ops, stats. **Uncommitted:** records `joke_voted` analytics events on every vote | 400 lines       |
| `entities/dad-joke.entity.ts`      | `dad_jokes`: joke text, category FK, ContentStatus (default DRAFT), likes/dislikes counters                                                               | —               |
| `entities/joke-category.entity.ts` | `joke_categories`: name, emoji, OneToMany jokes                                                                                                           | —               |

Frontend (`apps/frontend/src/`):

| File                                                 | Purpose                                                                                                                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/jokes/page.tsx`                                 | Public jokes page (1253 lines) — flip cards, vote buttons with toggle-off, Joke of the Day, search/sort/pagination, comments modal; API-backed with localStorage offline fallback + vote-state cache |
| `app/jokes/layout.tsx` / `loading.tsx` / `error.tsx` | Metadata, skeleton, themed error boundary                                                                                                                                                            |
| `components/jokes/JokeCommentsModal.tsx`             | Per-joke comments modal (new since the archived doc)                                                                                                                                                 |
| `lib/jokes-api.ts`                                   | API client with `adaptJoke()` mapper + `voteJoke(id, type, remove)` targeting `/jokes/classic*`                                                                                                      |
| `components/MobileFooter.tsx`                        | Consumes `getJokeCategories(true)`; drawer links to `/jokes?category=<uuid>`                                                                                                                         |
| `app/admin/components/JokesSection.tsx`              | Admin joke CRUD — wired to backend API with auth (CRUD/bulk/CSV+JSON import)                                                                                                                         |
| `app/admin/components/SettingsSection.tsx`           | Dad-jokes settings tab (category emoji, cache TTL) — see feature 11                                                                                                                                  |

No dedicated test suite exists for dad-jokes (no `*joke*.test.ts` in `__tests__/`).

## 2. Endpoint map (verified against controllers 2026-08-30)

| Method & Path                                                                                                  | Auth   | Notes                                                         |
| -------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------- |
| GET `/jokes/classic?page&limit`                                                                                | public | PUBLISHED only; `limit` clamped to [1,100]                    |
| GET `/jokes/classic/all?page&limit`                                                                            | admin  | all statuses                                                  |
| GET `/jokes/classic/random`                                                                                    | public | random PUBLISHED joke (count+offset)                          |
| GET `/jokes/classic/search?search&categoryId&page&limit`                                                       | public | ILIKE with `%`/`_` sanitization                               |
| GET `/jokes/classic/categories?hasContent=`                                                                    | public | cached; innerJoin filter                                      |
| GET `/jokes/classic/categories/:id`                                                                            | public | includes jokes relation                                       |
| GET `/jokes/classic/category/:id?page&limit`                                                                   | public | PUBLISHED only                                                |
| POST `/jokes/classic/:id/vote`                                                                                 | public | body `{ voteType, remove? }` — increments/decrements counters |
| POST `/jokes/classic`, `/classic/bulk` (max 100, transactional), `/classic/bulk-action`, `/classic/categories` | admin  | create/bulk/bulk-action/category-create                       |
| PUT `/jokes/classic/:id`, `/classic/categories/:id`                                                            | admin  | update                                                        |
| DELETE `/jokes/classic/:id`, `/classic/categories/:id`                                                         | admin  | hard delete; category delete hard-cascades jokes              |
| GET `/jokes/classic/status-counts`                                                                             | admin  | counts by ContentStatus                                       |
| GET `/jokes/stats/overview`                                                                                    | admin  | `{ totalJokes, totalCategories }`                             |

## 3. Current status (verified)

**Done:** fully API-backed public page and admin section; PUBLISHED hard-filtering; **voting is fully wired** — `handleVote` calls `voteJoke()` fire-and-forget with localStorage vote-state, double-click guard, cross-tab sync, and toggle-off (`remove` flag decrements counters; backend clamps at 0). **Uncommitted backend work:** `joke_voted` analytics events recorded on every vote (module `jokes`), surfaced in the admin analytics dashboard's Joke-votes panel. "Newest" sort now uses real `createdAt` (old `Number(uuid)` bug fixed). Comments are integrated on the public page via `JokeCommentsModal` (comments module `targetType: 'joke'`). Admin section: CRUD, bulk actions, CSV/JSON import with category auto-resolution; dead setters cleaned; a11y fix applied.

**Corrected/stale vs the archived doc:**

- "Votes are device-local / backend vote endpoint idle" is **no longer true** — both directions are wired, with vote removal added.
- "Newest sort broken" is **fixed**.
- The old doc didn't mention **comments at all** — jokes are now a first-class comment target with a modal on the public page.
- Still true: category delete **hard-cascades** its jokes (bypasses the DRAFT/TRASH workflow); `/jokes/stats/overview` has **no frontend consumer**; `defaultJokeCategories` fallback with numeric ids remains.

## 4. Task breakdown

### P0 — critical / broken

- None open.

### P1 — major gaps

- [ ] Engagement depth: votes are counters only — no per-user vote persistence (a vote can be re-cast from another browser; dedup/analytics rely on the uncommitted event stream).
- [ ] Server-side personal state: saved jokes / seen jokes / vote history live in localStorage only.
- [ ] Joke-of-the-Day is client-only (`useEffect`) — server-side render if SEO matters.

### P2 — integration / quality

- [ ] Commit the `joke_voted` analytics record (module + service diffs) when the analytics feature is revisited (paused by decision 2026-08-30 — do not build out further for now).
- [ ] No test suite at all — add at minimum: `voteForJoke` (increment/clamp/remove), `adaptJoke` mapper, category cascade behavior.
- [ ] Consume `/jokes/stats/overview` somewhere (admin Jokes section header or a public widget), or drop the endpoint.
- [ ] Category delete should soft-delete (TRASH) its jokes instead of hard-removing them, matching the content workflow used elsewhere.

### P3 — polish / tech debt

- [ ] `defaultJokeCategories` hardcoded fallback duplicates API data (numeric ids vs backend UUIDs).
- [ ] `page.tsx` is 1253 lines — extract the sort/filter/pagination logic into `features/jokes/` hooks (mirroring the image-riddles refactor).
- [ ] Trending sort (audit-doc leftover) and share buttons.
- [ ] Server-side search + true server pagination (deferred until >500 jokes — former improvement-plan item, owner-accepted).

## 5. Cross-feature touchpoints

- **Comments** — jokes are a comment target (`targetType: 'joke'`); `JokeCommentsModal` on the public page.
- **Analytics** — `joke_voted` events (uncommitted) feed the admin analytics dashboard's Joke-votes panel.
- **Site Settings** — SettingsSection "Dad Jokes" tab (category emoji, cache TTL).
- **Admin Dashboard** — `JokesSection` under the admin shell; shared BulkActionService + CacheService patterns.
- **Guest users** — public voting and comments work without an account (guest-id convention).
