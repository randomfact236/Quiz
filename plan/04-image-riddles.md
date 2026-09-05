# Feature 04 — Image Riddles (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30; **re-audited + E2E-tested 2026-09-05** (20 image riddles seeded via the admin bulk endpoint + a seeded category). Supersedes `docs/features/archive/image-riddles.md`
> (archived 2026-08-30 via `git mv`, history preserved; every claim re-checked against code —
> stale claims from the old doc were dropped or corrected).

---

## 1. File inventory

Backend — public module (`apps/backend/src/image-riddles/`):

| File                                       | Purpose                                                                                                                                                                                                                                                                                            | Size (verified) |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `image-riddles.controller.ts`              | Public reads only + `POST bulk-action` + `GET status-counts` (the single status-change surface used by the admin panel)                                                                                                                                                                            | 177 lines       |
| `image-riddles.service.ts`                 | Read queries: paginated list, by-id, random, search (ILIKE with `%`/`_` sanitization), by-category, by-difficulty, stats                                                                                                                                                                           | 273 lines       |
| `entities/image-riddle.entity.ts`          | `image_riddles`: title, imageUrl, answer, **alternativeAnswers** (synonym list, added by migration `1788000000000`), hint, difficulty enum, timerSeconds/showTimer with difficulty-based defaults, altText, categoryId FK, isActive, ContentStatus, JSONB `actionOptions` + in-entity action logic | —               |
| `entities/image-riddle-category.entity.ts` | `image_riddle_categories`: name, emoji, description                                                                                                                                                                                                                                                | —               |
| `entities/image-riddle-action.entity.ts`   | **Not a DB entity** — TS types + `DEFAULT_ACTION_PRESETS` + validation for per-riddle configurable buttons                                                                                                                                                                                         | —               |

Backend — admin module (`apps/backend/src/admin/image-riddles/`) — **canonical CRUD surface**:

| File                                | Purpose                                                                                                                                    | Size (verified) |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `admin-image-riddles.controller.ts` | `/admin/image-riddles` JWT+admin: list, by-id, create, bulk, update, delete (soft), toggle-active, categories CRUD, dashboard stats/recent | 246 lines       |
| `admin-image-riddles.service.ts`    | Pagination+filters, duplicate-name checks (409), soft delete, dashboard aggregation                                                        | 516 lines       |
| `admin-image-riddles.module.ts`     | Repos + CacheService wiring                                                                                                                | 20 lines        |

Setup: `apps/backend/sample-image-riddles.sql` (rewritten against current entity) + `setup-riddles-database.ps1` (now migrates/seeds image-riddle tables).

Frontend (`apps/frontend/src/`):

| File / dir                                                                      | Purpose                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/image-riddles/page.tsx`                                                    | Public page shell; fetches `GET /image-riddles?limit=200` + `/categories` (initial-data arrays are offline fallback only); reads `?category=` / `?difficulty=` URL params                                                                                                                                    |
| `features/image-riddles/components/*`                                           | Public UI: RiddleCard, RiddleModal, RiddleGuessPanel, RiddleAnswerPanel, GuessFeed, ChipRevealStep, CategorySidebar, RiddlesToolbar, PaginationControls, skeletons                                                                                                                                           |
| `features/image-riddles/hooks/*`                                                | Public game hooks: useImageRiddleCatalog, Filters, Game, Score, Timers, useRiddleKeyboardNav                                                                                                                                                                                                                 |
| `features/image-riddles/lib/analytics.ts`                                       | **Committed:** analytics sink shim now forwards preset action events (`answer_submitted`, `hint_revealed`, `riddle_skipped`, `answer_revealed`, `share_opened`, …) to the shared tracker (`lib/analytics.ts` → `POST /analytics/events`); console.debug kept behind the `image-riddles:analytics-debug` flag |
| `features/image-riddles/lib/game.ts`, `default-actions.ts`                      | Game logic + action presets (`analyticsEvent` names)                                                                                                                                                                                                                                                         |
| `features/image-riddles/admin/**`                                               | Full admin implementation (structural refactor of the former 2090-LOC monolith): `components/` (table, rows, toolbar, filters, modals incl. ImportModal), `hooks/` (8 React Query hooks: data, filters, form, mutations, bulk, delete, categories, import), `lib/` (csv, json, import-export, filters, form) |
| `app/admin/components/ImageRiddlesAdminSection.tsx`                             | Thin 200-line composition layer wiring the feature hooks/components; consumed by the admin dashboard                                                                                                                                                                                                         |
| `components/image-riddles/ActionOptions.tsx`                                    | Configurable action-button renderer (visibility conditions, **modifier-only** keyboard shortcuts, tooltips, confirm dialogs, ripples)                                                                                                                                                                        |
| `lib/image-riddles-api.ts`, `lib/image-riddle-answer.ts`, `lib/initial-data.ts` | Typed API client; normalized answer matcher (case/whitespace/article/punctuation tolerant + `alternativeAnswers`); offline fallback data                                                                                                                                                                     |
| `lib/media-api.ts` + `MediaPicker`                                              | Media-library integration (upload/browse/select in the Image URL field)                                                                                                                                                                                                                                      |
| `__tests__/image-riddle-*.test.tsx` (6) + `useAdminImageRiddleHooks.test.tsx`   | **85/85 passing (verified 2026-08-30)** — admin, answer matching, comments, game, keyboard, URL sync, admin hooks                                                                                                                                                                                            |

## 2. Endpoint map (verified against controllers 2026-08-30)

Public (unauthenticated):

| Method & Path                                                       | Notes                                             |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| GET `/image-riddles?page&limit`                                     | PUBLISHED only (hard-filtered; no `status` param) |
| GET `/image-riddles/random`                                         | PUBLISHED only                                    |
| GET `/image-riddles/search?search&categoryId&difficulty&page&limit` | PUBLISHED only                                    |
| GET `/image-riddles/categories`, `/categories/:id`                  | cached under `image-riddles:categories`           |
| GET `/image-riddles/category/:id?page&limit`                        | PUBLISHED only                                    |
| GET `/image-riddles/difficulty/:level?page&limit`                   | validates easy/medium/hard/expert                 |
| GET `/image-riddles/stats/overview`                                 | totals + difficulty histogram + avg timer         |
| GET `/image-riddles/:id`                                            | PUBLISHED only                                    |
| POST `/image-riddles/bulk-action`                                   | admin-guarded; single status-change surface       |
| GET `/image-riddles/status-counts`                                  | admin-guarded                                     |

Admin (JWT + role admin) — canonical CRUD:

| Method & Path                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/admin/image-riddles` (filtered/paginated), `/admin/image-riddles/:id`, `/categories/all`, `/categories/:id`, `/dashboard/stats`, `/dashboard/recent?limit`, `/status-counts` |
| POST `/admin/image-riddles`, `/bulk`, `/categories`, `/:id/toggle-active`                                                                                                          |
| PUT `/admin/image-riddles/:id`, `/categories/:id`                                                                                                                                  |
| DELETE `/admin/image-riddles/:id` (soft), `/categories/:id`                                                                                                                        |

## 3. Current status (verified)

**Done:** fully API-backed on both public and admin sides; duplicate CRUD removed (public controller is reads-only; `/admin/image-riddles/*` canonical); PUBLISHED hard-filtering everywhere public; media pipeline (backend `MediaModule` with sharp WebP q80 local-disk storage + `MediaPicker` in the admin form); CSV **and** JSON import/export in the admin lib; URL deep links (`?category=`, `?difficulty=`) wired from MobileFooter; unified timer defaults (easy=60, medium=90, hard=120, expert=180 via `RIDDLE_TIMERS`); the `new Function` eval of `customCondition` removed and keyboard shortcuts scoped to modifier combos (both security fixes from the old doc verified); seed SQL + setup script corrected; alternative-answers synonyms live.

**Corrected/stale vs the archived doc:**

- The old doc's issue list is largely **resolved**: the split-brain FE/BE architecture, DRAFT leak, duplicate admin CRUD, wrong setup script, `new Function` eval, shortcut collisions, and conflicting timer defaults are all fixed in current code.
- The "500 instead of 400" issue is **moot** — the create/update path moved to the admin service (the public service no longer validates actions), and no bare `throw new Error` remains in it.
- The old doc's file inventory is stale: the frontend was refactored into `features/image-riddles/**` (public + admin sub-trees), with `ImageRiddlesAdminSection.tsx` reduced to a thin composition layer.
- View/like/attempt counters still do **not** exist anywhere (no columns, no table).
- Analytics: the shim forwards to the real tracker (committed).

## 4. Task breakdown

### P0 — critical / broken

- None open. 85/85 tests pass; no blocking bugs found in the verified code.

### P1 — major gaps

- [x] **Engagement counters** — BUILT 2026-08-30 (code-complete; live probe pending DB restore — see anomalies): `views`/`attempts`/`solves` int columns on `image_riddles` (migration `1789000000000`), public throttled `POST /image-riddles/:id/engage` (PUBLISHED-only atomic increments), dashboard stats gains an `engagement` aggregate, frontend fires view (modal open) / attempt (guess submit) / solve (correct guess) fire-and-forget. **Needs owner decision:** a `likes` counter requires a user-facing like button (product surface) — not built.
- [ ] Server-side progress (solved/revealed beyond localStorage) — **deferred: same family the owner deferred for riddle-mcq (03 P1 #2, owner-accepted)**; quiz-mcq got `quiz_sessions` in F02 and the same design can be extended here when the owner green-lights the family.
- [x] **Image URL validation on create/update** — DONE 2026-08-30: shared `@IsImageUrl()` validator (http(s) URL or local `/uploads/...`; rejects `javascript:`/`data:`/junk) applied to `CreateImageRiddleDto` + `UpdateImageRiddleDto`. 12 validator/DTO tests.

### P2 — integration / quality

- [x] Analytics parity — RESOLVED 2026-09-05 (supersedes the deferral): the shim is committed and forwards preset action events to the shared tracker.
- [x] **Action preset audit** — DONE 2026-08-30: `default-actions.ts` ships exactly 4 presets (check-answer, show-hint, give-up, share) and `useImageRiddleGame.handleAction` handles all 4 (+ legacy aliases submit-answer/reveal-answer and a skip). There are **no** `report`/`fullscreen` presets in the file — the old doc's concern is resolved; share opens the ShareMenu.
- [x] **Query efficiency** — VERIFIED 2026-08-30: both claims are stale in current code — `getDashboardStats` already uses one GROUP BY per dimension, and `deleteCategory` already soft-deletes via a single bulk UPDATE inside a transaction. (The engagement aggregate added in P1 #1 is one more single aggregate query.)
- [x] **Comments parity** — VERIFIED 2026-08-30: backend comments service validates `IMAGE_RIDDLE` content type against the entity; the admin CommentsSection has an image-riddle filter chip and renders its rows. No gap.

### P3 — polish / tech debt

- [x] **Next-gen images** — VERIFIED ALREADY DONE 2026-08-30 (plan claim stale): RiddleCard uses `next/image` (`fill`, `sizes`, blur placeholder) and `next.config.mjs` carries `images.remotePatterns` (optimization off in dev, patterns belt-and-suspenders for prod). Nothing to do.
- [x] **`initial-data.ts` fallback** — KEPT 2026-08-30: the page consumes the arrays as offline fallback and the RiddleCard family handles the offline case gracefully (chips stay hidden, "Image unavailable" placeholder). The offline story is a deliberate feature; removal would regress it.
- [x] **MobileFooter difficulty drawer** — ACCEPTED 2026-08-30: it deep-links image-riddles difficulty routes, which is the only module with a difficulty-filtered landing surface; generalizing it is a cross-feature refactor with no second consumer today. Revisit when a second module gains a difficulty route.

## 5. Cross-feature touchpoints

- **Admin Dashboard** — `ImageRiddlesAdminSection` (thin layer over `features/image-riddles/admin`) under the admin shell; dashboard stats/recent endpoints feed the section.
- **Media** — upload pipeline shared with admin: `MediaModule` (JWT-guarded `POST /media/upload`, WebP conversion) + `MediaPicker` in the riddle form.
- **Comments** — image riddles are a first-class comment target (`targetType: 'image-riddle'` in the comments module).
- **Analytics** — preset action events forwarded via the committed shim; dashboard module breakdowns label `image-riddles`.
- **MCQ / Riddle MCQ** — shares the shared UI kit (AnswerOptions heritage, BubbleEmojiEffect), BulkActionService, CacheService patterns, and ContentStatus workflow.

## 6. Extras (2026-09-05 audit — noted, not acted on)

- **P0 fixed during this pass:** creating an image riddle **without** `actionOptions` crashed on
  insert (`validateBeforeSave` checked `!== null` while TypeORM leaves the property `undefined`)
  — every API/bulk create without the field failed with a TypeError. Guard now uses
  `Array.isArray`; the same latent hole on `hint` hardened to `!= null`. The admin UI masked it
  (its form always sends the field) — bulk import and raw API creates did not.
- **`GET /admin/image-riddles` without `page` returned 500** ("Provided skip value is not a
  number") — the controller now coerces page/limit defensively (NaN → defaults, limit capped
  100). Fixed in this pass.
- **`CreateImageRiddleDto` has no `status` field** — bulk-imported riddles always land as DRAFT
  and must be published via `POST /image-riddles/bulk-action` (the seed flow for this pass did
  exactly that). Consider accepting `status` in the bulk DTO for parity with quiz/riddle
  imports if owner wants one-shot published imports.
- **Seeded test content:** category **"E2E Test"** + 20 published riddles ("E2E …" titles,
  picsum placeholder images, hints included) — kept in the dev DB.
- **plan/13 A4 downgraded:** the `UNSUPPORTED_ACTION_IDS` set in `game.ts` is a defensive
  filter for DB-configured per-riddle `actionOptions`; `default-actions.ts` ships only the 4
  supported presets, and the DB contains zero riddles referencing unsupported ids. Verified
  non-issue.
