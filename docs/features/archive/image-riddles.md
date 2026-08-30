# Image Riddles (Full Stack)

## 1. Scope & File Inventory

### Backend — Public module (`apps/backend/src/image-riddles/`)

| File                                       | Purpose                                                                                                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `image-riddles.controller.ts`              | REST controller `@Controller('image-riddles')` — public read endpoints plus admin-guarded CRUD, bulk actions, stats                                                                                 |
| `image-riddles.service.ts`                 | Core service: category CRUD, riddle CRUD, random/search/difficulty queries, transactional bulk create, bulk actions, stats                                                                          |
| `image-riddles-update.helper.ts`           | Pure helpers (`updateBasicFields`, `updateCategory`, `updateActionOptions`) extracted from the update path                                                                                          |
| `entities/image-riddle.entity.ts`          | `image_riddles` table: title, imageUrl, answer, hint, difficulty enum, timerSeconds/showTimer, altText, categoryId FK, isActive, ContentStatus, `actionOptions` JSONB + rich in-entity action logic |
| `entities/image-riddle-category.entity.ts` | `image_riddle_categories` table: name, emoji, description, OneToMany riddles                                                                                                                        |
| `entities/image-riddle-action.entity.ts`   | **Not a DB entity** — TS interface/types + `DEFAULT_ACTION_PRESETS`, validation and default-application functions for per-riddle configurable buttons                                               |
| `index.ts`                                 | Barrel export                                                                                                                                                                                       |

### Backend — Admin module (`apps/backend/src/admin/image-riddles/`)

| File                                | Purpose                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin-image-riddles.controller.ts` | `@Controller('admin/image-riddles')`, JWT+admin guarded; filtered list, CRUD, soft delete, toggle-active, categories CRUD, dashboard stats/recent |
| `admin-image-riddles.service.ts`    | Admin logic: pagination+filters, duplicate-name checks (409), soft delete, toggleActive, dashboard aggregation                                    |
| `admin-image-riddles.module.ts`     | Wires repos + CacheService                                                                                                                        |

### Sample data / setup scripts

| File                                      | Purpose                                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `apps/backend/sample-image-riddles.sql`   | Seeds 4 categories + 5 riddles via raw SQL                                                                                 |
| `apps/backend/setup-riddles-database.ps1` | Runs TypeORM migration + seed script — **targets text-riddle tables (`riddle_subjects/chapters/mcqs`), not image riddles** |

### Frontend (`apps/frontend/src/`)

| File                                                         | Purpose                                                                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `app/image-riddles/page.tsx`                                 | Entire public page (grid, filters, modal game) — **localStorage only, no backend calls**                                      |
| `app/image-riddles/layout.tsx` / `loading.tsx` / `error.tsx` | Metadata, skeleton, error boundary                                                                                            |
| `components/image-riddles/ActionOptions.tsx`                 | Configurable action-button renderer (visibility conditions, keyboard shortcuts, tooltips, confirm dialogs, ripple animations) |
| `lib/initial-data.ts:34-325`                                 | `initialImageRiddles` / `initialImageRiddleCategories` hardcoded fallback arrays                                              |
| `lib/storage.ts:29-34`                                       | `STORAGE_KEYS.IMAGE_RIDDLES`, `IMAGE_RIDDLE_CATEGORIES`, `IMAGE_RIDDLE_ITEMS`                                                 |
| `app/admin/components/ImageRiddlesAdminSection.tsx`          | Admin UI — also localStorage-only                                                                                             |
| `app/admin/hooks/useAdminData.ts:72-99`                      | Persists `allImageRiddles` to localStorage                                                                                    |
| `components/MobileFooter.tsx:24-29,252-265`                  | Difficulty drawer links (hardcoded, all point at `/image-riddles`)                                                            |

## 2. What Is Done (implemented & working)

**Backend (complete and reasonably robust):**

- Full public API: paginated list, by-id, random (offset-based), search (title/answer ILIKE with `%`/`_` sanitization — controller `image-riddles.controller.ts:68-73`, service `image-riddles.service.ts:217-250`), categories list/detail, by-category, by-difficulty with level validation (`controller:100-115`).
- Stats endpoint aggregating totals, difficulty histogram (single GROUP BY query), average timer (`service:487-540`).
- Admin API on same controller (JWT + RolesGuard): create/update/delete, bulk create (max 100, transactional, batch category fetch avoids N+1 — `service:305-376`), bulk actions via shared `BulkActionService`, status counts, category CRUD.
- Separate `/admin/image-riddles/*` module with extra features: filtered/paginated listing incl. search, soft delete (`isActive=false`, `admin-image-riddles.service.ts:230-236`), `POST :id/toggle-active` (`controller:149-157`), duplicate category-name conflict checks (409, `admin service:295,326`), dashboard stats + recent items (`admin service:378-431`).
- Entity model: difficulty enum, nullable timer with `getEffectiveTimer()` (`entity:105-107`), ContentStatus workflow (default DRAFT), soft-disable via `isActive`.
- Sophisticated action-options system: JSONB column of button descriptors with presets (submit/hint/skip/reveal/timer controls/fullscreen/share/report), validation hook (`validateBeforeSave`, `entity:338-348`), default generation when `useDefaultActions=true` (`entity:132-210`).
- Cache invalidation via `CacheService.delPattern('image-riddles:*')` on every mutation.
- Frontend page is functionally complete _as a standalone client-side app_: sticky category sidebar, difficulty filter, search, recent/random sort, pagination (12/page), modal game with countdown timer + progress bar, answer checking, hints, reveal, keyboard nav (arrows/Esc), score header (`page.tsx:131-658`).
- `ActionOptions.tsx` fully implements rendering of the BE `IActionOption` contract including visibility-condition evaluation (`shouldShowAction`, `:179-215`), confirm dialogs, tooltips, loading spinners, ripple animations.

## 3. What Is Partially Done / In Progress

- **FE-BE integration**: ✅ DONE — `lib/image-riddles-api.ts` added; `page.tsx` fetches `GET /image-riddles?limit=200` + `/categories` on mount with `initial-data.ts` kept only as offline fallback (banner shows on failure).
- **Admin FE vs Admin BE**: `ImageRiddlesAdminSection.tsx` mirrors admin capabilities (CSV/JSON import-export, trash, status filters) but writes to localStorage; none of `/admin/image-riddles/*` endpoints are consumed and no JWT wiring exists for this admin section.
- **Status workflow half-wired**: ✅ FIXED — `findAllRiddles` and `findRiddleById` now hard-filter `status = PUBLISHED` (mirrors riddle-mcq's public-read rule); the public list no longer accepts a `status` query param (admins use `/admin/image-riddles`). Also fixed while rewiring: the public page's category sidebar set `activeCategory` but `filteredRiddles` never applied it — category filtering now works.
- **Seeding**: `sample-image-riddles.sql` inserts a `points` column that no longer exists on the entity (`:10`) and omits `status`; the setup script seeds the text-riddle system instead. Neither path reliably produces playable image-riddle rows.
- **Upload/storage approach**: None. Images are external URL strings only (`imageUrl` text column). No upload endpoint, no local/S3 storage, no `next/image` (raw `<img>` at `page.tsx:435,579`). URL validation exists only in the bulk path (`isValidImageUrl`, `service:383-403`), not single-create/update.

## 4. What Is Missing / Needs To Be Done

1. Frontend API layer (`image-riddles-api.ts`) plus rewiring `page.tsx` to `GET /image-riddles`, `/categories`, `/search`.
2. Wiring `ImageRiddlesAdminSection.tsx` to `/admin/image-riddles/*` with JWT auth.
3. Image upload pipeline (multipart endpoint or presigned URLs); URL validation on create/update too.
4. Like/view tracking: there is **no** counter table â€” despite its filename, `image-riddle-action.entity.ts` holds only UI button metadata. No views/likes/attempts persistence anywhere.
5. Consistent published-only filtering on `GET /image-riddles` and `/image-riddles/:id`.
6. Fixed seed SQL matching current schema (`status='published'`, drop `points`) plus corrected setup script.
7. Deep links: mobile drawer should pass `/image-riddles?difficulty=...`; page currently ignores query params entirely.
8. Consolidate the duplicate admin CRUD surface (see issues below) into one canonical module.

## 5. Known Issues, Bugs & Tech Debt

- **Architectural split-brain (biggest issue)**: two parallel implementations of one domain â€” BE API vs FE localStorage â€” that share nothing. Admin-entered data never reaches the DB; API data never reaches users (`page.tsx:19,133-138`; `ImageRiddlesAdminSection.tsx:365-375`).
- **DRAFT leak**: `findAllRiddles` enforces PUBLISHED only if `?status=` given (`image-riddles.service.ts:126-146`).
- **Sample SQL schema drift**: `sample-image-riddles.sql:10` inserts a nonexistent `points` column; seeded rows default to DRAFT and become invisible to random/category/search endpoints.
- **Wrong setup script**: `setup-riddles-database.ps1:63,73-74` seeds/verifies `riddle_subjects/riddle_chapters/riddle_mcqs` (text riddles) â€” misleading ops tooling.
- **Duplicate CRUD with divergent semantics**: hard delete via `DELETE /image-riddles/:id` (`service:442-448`) vs soft delete via `/admin/image-riddles/:id` (`admin service:230-236`); category deletion hard-removes riddles in one path (`service:107-122`) vs soft-deletes them in the other (`admin service:351-369`).
- **FK cascade mismatch**: entity declares `onDelete: 'SET NULL'` (`entity:57`) yet both services manually remove/save riddles before deleting categories â€” redundant, can double-delete.
- **500 instead of 400**: `processActionOptions` throws a bare `Error` on invalid actions during create (`service:297`); the update-helper correctly throws `BadRequestException` (`image-riddles-update.helper.ts:114`).
- **Dead code**: `getDefaultTimerForDifficulty()` ignores its argument and returns a constant (`service:542-545`); unused `_openDropdown/_setOpenDropdown` state (`ActionOptions.tsx:487`); share/report/fullscreen presets never handled in the modal (`page.tsx:272-294` handles only 3 action ids).
- **Code-evaluation risk**: `ActionOptions.tsx:202-212` evaluates `visibilityConditions.customCondition` with `new Function(...)` â€” server-controlled JS execution in the browser if an admin account is compromised; comment admits it needs sandboxing.
- **Keyboard-shortcut collisions**: ActionOptions registers global keydown matching `Space`/`Enter` shortcuts (`ActionOptions.tsx:550-577`) which can fight the modal's own Enter submit handler (`page.tsx:604`) and page scrolling.
- **Conflicting timer defaults**: BE uses flat 90s for all difficulties (`settings.imageRiddles.defaults.timerSeconds`); FE hardcodes `{easy:90, medium:120, hard:150, expert:180}` (`page.tsx:69-74`).
- **Query inefficiency**: `getDashboardStats` runs 4 separate counts plus loads all categories with relations (`admin service:387-405`); `deleteCategory` saves riddles one-by-one in a loop (`admin service:358-361`).
- **No analytics plumbing**: `analyticsEvent` strings exist but nothing posts them; the `onAnalytics` prop of ActionOptions is never supplied (`page.tsx:611-624`).

## 6. How It Works (architecture / data flow / API endpoint list)

### Current data flow

Fully API-backed. The public page fetches `GET /image-riddles?limit=200` + `GET /image-riddles/categories` on mount (hardcoded arrays in `initial-data.ts` are a cold-start/offline fallback only, surfaced with an amber banner when the API fails). Admin UI (`ImageRiddlesAdminSection`) writes via `/admin/image-riddles/*` with the admin JWT; both paths share the PostgreSQL tables through TypeORM.

### Entity relationships

- `ImageRiddleCategory` 1-to-many `ImageRiddle` (`categoryId` uuid FK, SET NULL).
- `ImageRiddle.actionOptions`: JSONB array of `IActionOption` button configs; defaults auto-generated at runtime when empty and `useDefaultActions=true`.
- `image-riddle-action.entity.ts` contributes types/presets/validation only; maps to no table.

### Public API endpoints (unauthenticated)

| Method | Path                                                            | Notes                                        |
| ------ | --------------------------------------------------------------- | -------------------------------------------- |
| GET    | `/image-riddles?page&limit&status`                              | paginated; status optional (draft-leak risk) |
| GET    | `/image-riddles/random`                                         | PUBLISHED only                               |
| GET    | `/image-riddles/search?search&categoryId&difficulty&page&limit` | PUBLISHED only                               |
| GET    | `/image-riddles/categories`                                     | cached under `image-riddles:categories`      |
| GET    | `/image-riddles/categories/:id`                                 | includes riddles relation                    |
| GET    | `/image-riddles/category/:id?page&limit`                        | PUBLISHED only                               |
| GET    | `/image-riddles/difficulty/:level?page&limit`                   | validates easy/medium/hard/expert            |
| GET    | `/image-riddles/stats/overview`                                 | totals + difficulty histogram + avg timer    |
| GET    | `/image-riddles/:id`                                            | isActive only, any status                    |

### Admin API endpoints (JWT + role admin)

| Method              | Path                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| POST                | `/image-riddles`, `/image-riddles/bulk` (max 100, transactional), `/image-riddles/bulk-action`, `/image-riddles/categories` |
| PUT                 | `/image-riddles/:id`, `/image-riddles/categories/:id`                                                                       |
| DELETE              | `/image-riddles/:id` (hard), `/image-riddles/categories/:id` (cascades)                                                     |
| GET                 | `/image-riddles/status-counts`                                                                                              |
| GET/POST/PUT/DELETE | `/admin/image-riddles`, `/admin/image-riddles/:id`, `/admin/image-riddles/bulk`, `/admin/image-riddles/categories(/all      | /:id)` |
| POST                | `/admin/image-riddles/:id/toggle-active`                                                                                    |
| GET                 | `/admin/image-riddles/dashboard/stats`, `/admin/image-riddles/dashboard/recent?limit`                                       |

Response shapes: public lists return `{ data, total }`; the admin list returns `{ data, total, page, limit, totalPages }`.

### FE page behavior (`page.tsx`)

1. On mount, fetch riddles/categories from the API (offline fallback arrays + amber failure banner); restore persisted score progress from localStorage (`aiquiz:image-riddle-solved` / `aiquiz:image-riddle-revealed`).
2. Client-side filter (published status, difficulty, search), then sort (recent, or a seeded deterministic "Mix" shuffle that stays stable while filtering).
3. Paginate to 12 cards per page; render card grid with difficulty badge top-left (difficulty-coded colors), timer badge top-right (hidden when `showTimer=false`), and a non-blurred "Answer Hidden" placeholder (answer text only mounted once revealed).
4. Clicking a card opens a modal: countdown timer starts (untimed when `showTimer=false`); user types a guess, Enter or "Check Answer" compares via the normalized matcher (`lib/image-riddle-answer.ts` — case/whitespace/article/punctuation tolerant, plus `alternativeAnswers` synonyms); wrong answers shake the input and show an inline "Not quite — try again!" with a live Attempts chip; on timeout the player chooses "Reveal Answer" or "Keep Trying" (no auto-reveal).
5. Actions render via `ActionOptions` using per-riddle `actionOptions` from data or three locally-defined defaults (check/hint/give-up); the Hint action is filtered out when the riddle has no hint. A toggleable letter-count chip ("8 letters") sits next to the guess input (default on for hard/expert).
6. The answer panel is green with a celebration burst on a correct guess; neutral indigo with "The answer was:" copy for give-up/time-out reveals.
7. Arrow keys navigate prev/next within the filtered list; Escape closes the modal. Correct guesses (solved) and reveals are tracked separately in the header ("Solved X · Revealed Y · of Z") and persist across reloads.

## 7. Recommended Process To Proceed (prioritized action plan)

1. ✅ DONE — `lib/image-riddles-api.ts` created; `page.tsx` rewired to `GET /image-riddles` + `/categories`; initial-data kept as offline fallback only.
2. ✅ DONE — public list + by-id hard-filter PUBLISHED; `status` query param removed from the public list.
3. ✅ DONE — `ImageRiddlesAdminSection.tsx` wired to `/admin/image-riddles/*` with JWT (`adminApi`): server-backed list/categories, create/update/duplicate/import (bulk create + auto category creation), trash/undo via `POST /image-riddles/bulk-action`, hard delete for trashed rows, inline status cycling via bulk-action, reload-from-server replaces localStorage "Sync Source".
4. ✅ DONE — duplicate admin CRUD removed from `ImageRiddlesController`; `/admin/image-riddles/*` is now the canonical CRUD surface. The public controller keeps reads + `POST /image-riddles/bulk-action` + `GET /image-riddles/status-counts` (the single status-change surface consumed by the admin panel). Orphaned service methods (`createRiddle`/`updateRiddle`/`deleteRiddle`/category CRUD/bulk-create) and `image-riddles-update.helper.ts` were deleted.
5. ✅ DONE — `sample-image-riddles.sql` rewritten against the current entity (no `points`, `status='published'`, timer/`useDefaultActions` columns); `setup-riddles-database.ps1` now migrates + seeds image-riddle tables instead of text riddles.
6. ✅ DONE — media library ported from affiliate site: backend `MediaModule` (`media.entity`, `media.service` with sharp WebP q80, `media.controller` for upload/list/delete/stats, `storage.service` local-disk); frontend `lib/media-api.ts` + `MediaPicker` component integrated into `ImageRiddlesAdminSection` (🖼️ Library button in the Image URL field).
7. ✅ DONE — `MediaPicker` component added: browse, upload, select, delete; backend WebP conversion at upload time.
8. ✅ DONE — `MobileFooter` difficulty links now pass `/image-riddles?difficulty=<level>`; public page reads `?category=<name>&difficulty=<level>` from the URL on mount.
9. ✅ DONE — `ActionOptions`: `new Function` eval of `customCondition` removed (security: arbitrary server JS execution no longer runs in the browser); keyboard shortcuts scoped to modifier-combination-only (`Alt+`/`Ctrl+`/`Shift+`/`Cmd+`) and suppressed when focus is inside an input/textarea/select/contentEditable element.
10. ✅ DONE — unified timer defaults: public page now mirrors backend `RIDDLE_TIMERS` values (easy=60, medium=90, hard=120, expert=180) instead of the stale hardcoded map.

## Code Quality Notes

Standards, budgets, and phase exit criteria: [../../plan/code-quality-plan.md](../../plan/code-quality-plan.md). Feature-specific debt tracked there in �5.
