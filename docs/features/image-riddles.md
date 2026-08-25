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

- **FE-BE integration**: backend finished, frontend never calls it. `page.tsx:133-138` hydrates from localStorage with `initial-data.ts` fallbacks. There is no `image-riddles-api.ts`; grep shows zero frontend references to `/image-riddles` endpoints.
- **Admin FE vs Admin BE**: `ImageRiddlesAdminSection.tsx` mirrors admin capabilities (CSV/JSON import-export, trash, status filters) but writes to localStorage; none of `/admin/image-riddles/*` endpoints are consumed and no JWT wiring exists for this admin section.
- **Status workflow half-wired**: BE creates riddles as DRAFT (`service:267`); the public list filters only `isActive=true` and applies the `status` filter only when explicitly passed (`service:133-136`) â€” DRAFT items are publicly listed by default, while random/category/difficulty/search DO enforce PUBLISHED.
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

The two halves are not connected. Admin UI writes riddle JSON to browser localStorage; the public page reads that same key (falling back to hardcoded arrays in `initial-data.ts`). Both backend modules serve PostgreSQL-backed REST APIs that no frontend code consumes.

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

1. On mount, read riddles/categories from localStorage, falling back to hardcoded arrays.
2. Client-side filter (published status, difficulty, search), then sort (recent or random shuffle).
3. Paginate to 12 cards per page; render card grid with difficulty badge top-left and timer badge top-right.
4. Clicking a card opens a modal: countdown timer starts, user types a guess, Enter or "Check Answer" compares against `riddle.answer` (case-insensitive); wrong answers shake the input, timeout auto-reveals the answer.
5. Actions render via `ActionOptions` using per-riddle `actionOptions` from data or three locally-defined defaults (check/hint/give-up).
6. Arrow keys navigate prev/next within the filtered list; Escape closes the modal.

## 7. Recommended Process To Proceed (prioritized action plan)

1. **Connect the public page to the API** (P0): create `lib/image-riddles-api.ts` mirroring `jokes-api.ts`; replace localStorage hydration in `page.tsx` with fetches to `/image-riddles`, `/image-riddles/categories`, `/image-riddles/search`; keep initial-data only as an offline fallback.
2. **Fix the DRAFT leak** (P0): default `findAllRiddles` to PUBLISHED for the public controller (or split public/admin finders).
3. **Wire the admin section** (P1): point `ImageRiddlesAdminSection.tsx` at `/admin/image-riddles/*`, add JWT handling, map soft delete/toggle-active/status-counts to existing UI.
4. **De-duplicate admin CRUD** (P1): remove admin endpoints from `ImageRiddlesController` (or the whole admin module) and keep one canonical surface with consistent soft-delete semantics.
5. **Repair seeding** (P1): rewrite `sample-image-riddles.sql` against the current entity (drop `points`, set `status='published'`), fix or remove `setup-riddles-database.ps1`.
6. **Add view/like tracking** (P2): new `image_riddle_actions` table or counter columns plus `POST /image-riddles/:id/view|like`; wire ActionOptions `onAnalytics` to it.
7. **Add image upload** (P2): multipart upload endpoint or presigned URLs; validate URL on create/update (reuse `isValidImageUrl`).
8. **Harden ActionOptions** (P2): remove `new Function` evaluation of `customCondition` or sandbox it; scope keyboard shortcuts so Space/Enter do not leak globally.
9. **Polish** (P3): unify timer defaults via settings API; support `?difficulty=` / `?category=` query params; adopt `next/image`; batch admin dashboard queries.

## Code Quality Notes

Standards, budgets, and phase exit criteria: [../plans/code-quality-plan.md](../plans/code-quality-plan.md). Feature-specific debt tracked there in �5.
