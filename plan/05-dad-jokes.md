# Feature 05 — Dad Jokes (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: **2026-09-05** (previous audit 2026-08-30; analytics-related
> "(uncommitted)" markers from that audit are resolved — everything landed in `7d20864`/`ecd2eac`).
> Supersedes `docs/features/archive/dad-jokes.md`
> (archived 2026-08-30 via `git mv`, history preserved; every claim re-checked against code —
> stale claims from the old doc were dropped or corrected).

---

## 1. File inventory

Backend (`apps/backend/src/dad-jokes/`):

| File                               | Purpose                                                                                                                                                        | Size (verified) |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `dad-jokes.module.ts`              | 2 controllers + service; repos for 2 entities; CacheModule; imports AnalyticsModule                                                                            | 32 lines        |
| `dad-jokes.controller.ts`          | `/jokes` — public list/random/search/categories/vote + admin CRUD/bulk/bulk-action/category CRUD                                                               | 240 lines       |
| `dad-jokes-stats.controller.ts`    | `GET /jokes/stats/overview` (admin-only)                                                                                                                       | —               |
| `dad-jokes-stats.util.ts`          | `computeDadJokeStats()` — parallel counts across joke + category repos                                                                                         | 38 lines        |
| `dad-jokes.service.ts`             | All business logic: jokes, categories, voting (with toggle/remove), bulk ops, stats. Records `joke_voted` analytics events on every vote (committed `ecd2eac`) | 400 lines       |
| `entities/dad-joke.entity.ts`      | `dad_jokes`: joke text, category FK, ContentStatus (default DRAFT), likes/dislikes counters                                                                    | —               |
| `entities/joke-category.entity.ts` | `joke_categories`: name, emoji, OneToMany jokes                                                                                                                | —               |

Frontend (`apps/frontend/src/`):

| File                                                 | Purpose                                                                                                                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/jokes/page.tsx`                                 | Public jokes page (1253 lines) — flip cards, vote buttons with toggle-off, Joke of the Day, search/sort/pagination, comments modal; API-backed with localStorage offline fallback + vote-state cache |
| `app/jokes/layout.tsx` / `loading.tsx` / `error.tsx` | Metadata, skeleton, themed error boundary                                                                                                                                                            |
| `components/jokes/JokeCommentsModal.tsx`             | Per-joke comments modal (new since the archived doc); since 2026-09-05 carries an optional `jokePunchline` prop with a "Show punchline" header reveal (one-liners omit it)                           |
| `lib/jokes-api.ts`                                   | API client with `adaptJoke()` mapper + `voteJoke(id, type, remove)` targeting `/jokes/classic*`                                                                                                      |
| `components/MobileFooter.tsx`                        | Consumes `getJokeCategories(true)`; drawer links to `/jokes?category=<uuid>`                                                                                                                         |
| `app/admin/components/JokesSection.tsx`              | Admin joke CRUD — wired to backend API with auth (CRUD/bulk/CSV+JSON import)                                                                                                                         |
| `app/admin/components/SettingsSection.tsx`           | Dad-jokes settings tab (category emoji, cache TTL) — see feature 11                                                                                                                                  |

Frontend tests: `joke-comments-modal.test.tsx` (3 tests — punchline reveal on demand, one-liner
suppression, fresh-mount reset; added 2026-09-05). Backend: `dad-jokes.service.spec.ts` (8 vote
tests). `adaptJoke` mapper + category cascade remain uncovered (mapper is a thin field rename).

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

**Done:** fully API-backed public page and admin section; PUBLISHED hard-filtering; **voting is fully wired** — `handleVote` calls `voteJoke()` fire-and-forget with localStorage vote-state, double-click guard, cross-tab sync, and toggle-off (`remove` flag decrements counters; backend clamps at 0). `joke_voted` analytics events are recorded on every vote (module `jokes`, committed in `ecd2eac`), surfaced in the admin analytics dashboard's Joke-votes panel. "Newest" sort now uses real `createdAt` (old `Number(uuid)` bug fixed). Comments are integrated on the public page via `JokeCommentsModal` (comments module `targetType: 'joke'`), which since 2026-09-05 offers a "Show punchline" header reveal so commenters can check the answer without closing the modal and flipping the card (commit `15adb1f`). Admin section: CRUD, bulk actions, CSV/JSON import with category auto-resolution; dead setters cleaned; a11y fix applied.

**Corrected/stale vs the archived doc:**

- "Votes are device-local / backend vote endpoint idle" is **no longer true** — both directions are wired, with vote removal added.
- "Newest sort broken" is **fixed**.
- The old doc didn't mention **comments at all** — jokes are now a first-class comment target with a modal on the public page.
- Still true: category delete **hard-cascades** its jokes (bypasses the DRAFT/TRASH workflow); `/jokes/stats/overview` has **no frontend consumer**; `defaultJokeCategories` fallback with numeric ids remains.

## 4. Task breakdown

### P0 — critical / broken

- None open.

### P1 — major gaps

- [x] **Per-voter vote persistence** — BUILT 2026-08-30 (code-complete; live probe pending DB restore — see anomalies): `joke_votes` table (migration `1789100000000`, UNIQUE jokeId+voterKey, FK cascade); `voteForJoke` is now one-vote-per-voter — re-voting same type is a no-op, switching flips both counters, remove deletes the record; legacy anonymous path (no identity) unchanged; `POST /jokes/classic/:id/vote` resolves voterKey from the optional JWT or a `guestId` body field (frontend sends it). 8 service tests.
- [ ] Server-side personal state: **saved jokes / seen jokes need owner decision** — a "saved jokes" bookmark feature is a product surface (new UI + endpoint), not a technical gap. Vote history is now covered by `joke_votes` (P1 #1).
- [ ] Joke-of-the-Day SSR — **needs owner decision: does SEO for /jokes matter enough to warrant RSC/scrape-target rendering?** The client-only deterministic pick works and costs nothing.

### P2 — integration / quality

- [x] **`joke_voted` analytics record** — VERIFIED ALREADY COMMITTED 2026-08-30 (plan claim stale): the record exists in the committed service (now extended with a `persisted` flag); analytics (feature 13) consumes it.
- [x] **Comments-modal punchline reveal** — DONE 2026-09-05 (commit `15adb1f`): `JokeCommentsModal` takes an optional `jokePunchline` and renders a "Show punchline" header reveal; `jokes/page.tsx` passes it for non-one-liners only. The modal is conditionally mounted per joke, so the reveal state resets on every open. Covered by `joke-comments-modal.test.tsx` (3 tests); frontend suite 181/181, tsc clean.
- [x] **Test suite** — PARTIALLY DONE 2026-08-30, EXTENDED 2026-09-05: `dad-jokes.service.spec.ts` (8 tests) covers `voteForJoke` incl. insert/idempotent/switch/remove/no-vote-remove/anonymous/clamp/404; `joke-comments-modal.test.tsx` (3 tests) covers the modal reveal behavior. `adaptJoke` mapper + category cascade behavior still uncovered (mapper is a thin field rename; cascade now goes through the shared bulk path). **Needs owner decision if more is wanted.**
- [x] **Consume `/jokes/stats/overview`** — DONE 2026-08-30: admin JokesSection header now shows joke/category count badges fetched from the endpoint (endpoint kept).
- [x] **Category delete soft-deletes jokes** — DONE 2026-08-30: jokes of a deleted category are moved to TRASH via one bulk UPDATE inside the delete transaction (was `jokeRepo.remove` hard delete), matching the content workflow.

### P3 — polish / tech debt

- [x] **`defaultJokeCategories` fallback** — ACCEPTED 2026-08-30: used only in the offline catch path of the public page (render-only when the API is unreachable), so the numeric-id/UUID mismatch never interacts with real data. Removing it would leave the offline page with no categories.
- [ ] `page.tsx` is 1253 lines — extraction into `features/jokes/` hooks mirrors the image-riddles refactor but is cosmetic: the page is stable, tested through the API client, and no second consumer exists. **Deferred as tech debt (revisit if the page grows or a bug forces a rewrite).**
- [ ] Trending sort and share buttons — **needs owner decision:** both are new product surfaces (a trending metric definition; share targets/placement), not gaps in shipped behavior.
- [ ] Server-side search + true server pagination — **deferred (owner-accepted until >500 jokes; reaffirmed 2026-08-30).**

## 5. Cross-feature touchpoints

- **Comments** — jokes are a comment target (`targetType: 'joke'`); `JokeCommentsModal` on the public page (with the punchline reveal since 2026-09-05).
- **Analytics** — server `joke_voted` (commit `ecd2eac`) + client `joke_viewed`/`joke_shared` events feed the admin analytics dashboard's Jokes tab (feature 13).
- **Site Settings** — SettingsSection "Dad Jokes" tab (category emoji, cache TTL).
- **Admin Dashboard** — `JokesSection` under the admin shell; shared BulkActionService + CacheService patterns.
- **Guest users** — public voting and comments work without an account (guest-id convention).

- **Sample import file:** `plan/imports/dad-jokes-food-and-animals.csv` — 20 food/animal/tech jokes ready for the CSV import.

## 6. Extras (2026-09-05 F05 five-step pass — noted, not acted on)

- **Seeded test content:** category **"E2E Test"** + 20 published dad jokes (classic one-liners)
  via `POST /jokes/classic/bulk` — kept in the dev DB.
- **Jokes bulk import has no `status` field** (CreateDadJokeDto) — bulk-created jokes land as
  DRAFT and need `POST /jokes/classic/bulk-action` → publish. Same gap as image-riddles
  (plan/04 §6); quiz and riddle imports DO accept `status`. Cross-module consistency candidate
  if one-shot published imports are wanted.
- **Voting contract re-verified live 2026-09-05** with a guest identity: like (+1), re-like
  (no-op), switch (like −1 / dislike +1), remove (−1) — all four paths behave per P1 #1.
- **Voting data note:** the pre-existing seed jokes carry large counters (e.g. the scarecrow
  joke at 38 likes) from earlier bulk seeding — cosmetic.
