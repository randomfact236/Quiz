# Feature 16 — Liked Categories (User Category Preferences) + Sample-Data Provenance

> **Status:** Proposal / not built. Sections 1–5 capture the two "liked
> categories" implementation paths discussed on 2026-09-15. Section 6 records
> the provenance of the image-riddle seed data replaced the same day. Nothing
> in sections 1–5 is implemented yet; this is an owner-decision document.

## 1. Problem statement

We want to know which **image-riddle categories users like** so the category
sidebar ("Topics") can be ranked by real preference instead of seed order, and
so the admin dashboard can show which topics to invest in.

**Current state (verified 2026-09-15):**

- The `image_riddles` table has aggregate counters only: `views`, `attempts`,
  `solves` (incremented via `POST /image-riddles/:id/engage`, no per-user
  attribution).
- There is **no `likes` column, no like button, and no per-user like record
  anywhere**. `plan/04-image-riddles.md` P1 #1 explicitly notes: "a `likes`
  counter needs a user-facing like button (not built)".
- The closest shipped feature is the **device-local Save bookmark**
  (`src/lib/saved-items.ts`, localStorage `aiquiz:saved-items`, namespace
  `image-riddles`). It saves individual riddles, not categories, and never
  reaches the server, so it cannot power server-side rankings.

## 2. Option A — True likes (recommended for a real feature)

A per-riddle like button backed by a real counter, aggregated per category.

### 2.1 Schema

Two viable shapes:

- **A1 (simple, matches existing style):** add `likes: int, default 0` to
  `image_riddles` (same family as `views/attempts/solves`). Likes are
  aggregate-only like every other counter — no per-user attribution, so a
  player can like repeatedly. Cheapest option; consistent with the current
  "aggregate counters, no user accounts required" design.
- **A2 (dedup per device/user):** new table `image_riddle_likes`
  (`riddleId uuid FK`, `userId uuid null`, `guestId varchar null`,
  `createdAt timestamp`, unique index on `(riddleId, userId, guestId)`).
  Accurate counts and toggle-off support; requires the guest-user identity
  that already exists (`guest-users` module) or JWT when logged in.

Migration file: follow `src/migrations/` naming (`1788…-ImageRiddleLikes.ts`).

### 2.2 Backend

- New endpoint on `ImageRiddlesController`, mirroring the existing
  `POST /image-riddles/:id/engage` pattern (throttled 30/min, PUBLISHED-only):
  - `POST /image-riddles/:id/like` → increments, returns `{ liked: true, likes: n }`
  - `DELETE /image-riddles/:id/like` (A2 only) → decrement / remove record
- Public `GET /image-riddles/categories` gains a `likes` rollup per category:
  `SELECT "categoryId", SUM(likes) FROM image_riddles WHERE status='published' AND "categoryId" IS NOT NULL GROUP BY "categoryId"`
  (cache under the existing `image-riddles:categories` CacheService key
  family, invalidated on like + on riddle status change).

### 2.3 Frontend

- Heart/thumb button on `RiddleCard` (next to the existing amber Save chip,
  top-right) and inside `RiddleModal`'s answer panel, showing the live count.
- Optimistic toggle with rollback on error; device-level dedup for A1 via a
  localStorage `aiquiz:liked-items` mirror of `saved-items.ts` (prevents
  accidental double-taps, not a security boundary).
- `CategorySidebar` sorts tiles by category likes (owner toggle: alphabetical
  vs "Most loved"); zero-count topics stay pinned last and dimmed as today.

### 2.4 Effort

A1 ≈ half a day (one migration, one endpoint, one button + count badge).
A2 ≈ 1–2 days (table, identity plumbing, toggle semantics, throttler covers
like-spam basics).

## 3. Option B — Derived "popularity" from existing counters (zero schema change)

No new endpoint, no migration: rank categories by engagement that already
exists.

- **Metric:** `solves` per category (primary) with solve rate
  `solves / NULLIF(attempts, 0)` as tiebreaker. Views inflate raw popularity
  (they fire on modal open), while solves indicate players actually finished
  and presumably enjoyed the category.
- **Where:** one admin-only dashboard query first
  (`GET /admin/image-riddles/dashboard/stats` already embeds engagement; add a
  `byCategory` rollup next to `riddlesByCategory`), and — if the owner wants it
  user-visible — a `?sort=popular` mode for the sidebar built on the same
  rollup exposed via `GET /image-riddles/categories?include=stats`.
- **Limitation:** this measures _activity_, not affection. A rage-solve and a
  delighted solve look identical. It also inherits the aggregate-counter
  caveat: no per-user dedup.

Effort ≈ 1–2 hours for the dashboard rollup; +2–3 hours to expose it publicly
with sorting.

## 4. Recommendation

1. **Ship Option B now** (dashboard rollup first) — instant insight from data
   that already accumulates, zero risk.
2. **Build Option A1 when a like button is wanted as a product feature** —
   it matches the app's anonymous, no-login play style. Upgrade path to A2
   (dedup table) stays open; A1's column simply becomes the cached rollup.
3. Revisit A2 only if/when user accounts land (`plan/01-user-accounts.md`) or
   like-manipulation becomes an observed problem (throttler already blunts it).

## 5. Touchpoints (for whoever implements)

| Area                    | File                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Entity + counters       | `apps/backend/src/image-riddles/entities/image-riddle.entity.ts`                                                                     |
| Engage pattern to copy  | `POST :id/engage` in `apps/backend/src/image-riddles/image-riddles.controller.ts` + `recordEngagement` in `image-riddles.service.ts` |
| Categories rollup/cache | `findAllCategories` in `image-riddles.service.ts` (CacheService key `image-riddles:categories`)                                      |
| Sidebar ranking         | `apps/frontend/src/features/image-riddles/components/CategorySidebar.tsx`                                                            |
| Like button UI          | `RiddleCard.tsx` save-chip block; `RiddleModal.tsx` answer panel                                                                     |
| Device-local mirror     | `apps/frontend/src/lib/saved-items.ts` (clone as `liked-items` for A1)                                                               |
| Dashboard stats         | `apps/backend/src/admin/image-riddles/admin-image-riddles.service.ts`                                                                |
| Plan family             | `plan/04-image-riddles.md` (P1 #1), `plan/13-analytics.md`                                                                           |

## 6. Sample-data provenance (seed rewritten 2026-09-15)

The old 5-row sample set (5 unsplash stock URLs, mojibake '?' category emoji) was
replaced by a curated 25-row seed built from **real, publicly-served Wikimedia
Commons images** — no AI-generated placeholder art.
Selection rules:

1. **Extraction, not invention:** every riddle references a real, existing
   Commons file (classic published illusions + wildlife camouflage photos).
   Riddle titles/answers/hints were written to match what each image actually
   shows; images were downloaded and visually verified before seeding.
2. **Direct URLs:** `imageUrl` uses `upload.wikimedia.org` (originals for
   photos, 1280px render thumbnails for SVGs). These URLs are the stable
   "direct image URL" that Special:FilePath resolves to; they were verified
   with HTTP 200 + `image/*` content type at seed time.
3. **Licensing:** only permissive licenses (Public domain / CC0 / CC BY /
   CC BY-SA). Each riddle carries a `source` **link action** (rendered by the
   existing ActionOptions machinery as a "Source" button) pointing at the
   Commons file page, which shows author + license. CC BY / CC BY-SA require
   attribution — this button is the attribution surface; do not remove it.
4. **Verification trail:** URL + license lookups used the Commons API
   (`prop=imageinfo&iiprop=url|size|extmetadata`, UA-identified); every final
   URL was downloaded and the image content checked against the riddle text.
5. **Reseedable:** `sample-image-riddles.sql` is idempotent
   (`ON CONFLICT DO UPDATE` for riddles and categories). The superseded
   660e8400-… sample rows are moved to `status='trash'` (the app's soft-delete
   convention) so re-seeding retires them without destroying data. The three
   guest comments attached to the old samples were blanked once during the
   2026-09-15 migration (direct DB action, not part of the seed file).
6. **Cache:** `GET /image-riddles/categories` is served from Redis key
   `image-riddles:categories` (long TTL, see `settings.imageRiddles.cache.categoriesTtl`).
   After reseeding, flush it:
   `docker exec ai-quiz-redis redis-cli DEL image-riddles:categories`

## 7. Incident log — stale categories cache after direct reseed (2026-09-15)

**Symptom (user-visible):** after the sample-data reseed, the public
Image Riddles page showed only the **3 old categories with mojibake `?`
emoji** in the Topics sidebar, while the riddle grid correctly showed all 25
new riddles across 5 categories.

**Root cause (confirmed):** `GET /image-riddles/categories` is served through
`CacheService.getOrSet` from the Redis key `image-riddles:categories`
(24h TTL via `settings.imageRiddles.cache.categoriesTtl`). The reseed wrote
directly to Postgres, bypassing the app, so no invalidation fired and the key
kept serving its pre-reseed snapshot (~16h remaining at diagnosis). The
backend restart did not help — Redis is an external store. The riddle grid
looked correct because `/search` is not cached.

**Evidence:** frontend network capture showed `/categories` returning the old
3-category array while per-category `/search?categoryId=…&limit=1` probes
returned 5 riddles each for all 5 categories; psql confirmed 5 rows in
`image_riddle_categories`.

**Resolution (applied):** `docker exec ai-quiz-redis redis-cli EXPIRE
image-riddles:categories 2` — set a 2s TTL so the key self-expired (no hard
delete needed); the next request repopulated the cache from the DB. Verified
at three levels afterwards: key TTL back to 86400, `/categories` returning 5
categories with correct UTF-8 emoji, and the live page sidebar showing all 5
topics with real emoji and 5-riddle counts.

**Recurrence rules (who can trigger it again):**

- **Admin panel writes: safe.** Every mutation in
  `admin-image-riddles.service.ts` (6 call sites) calls `invalidateCache()` →
  `delPattern('image-riddles:*')`, which flushes this exact key. Managing
  categories/riddles through the admin UI can never leave a stale cache.
- **Direct DB writes: unsafe.** Raw SQL reseeds, manual psql edits, or backup
  restores bypass the app and will leave the stale snapshot in place for up
  to 24h. Always flush the key afterwards (`EXPIRE … 2` or `DEL`).

**Open hardening item (not yet applied):** add an automatic cache flush to
`apps/backend/scripts/dev/setup-riddles-database.ps1` right after the seed
step, so the repo's own seed script can never re-introduce this. Drafted but
blocked by a tooling approval timeout on 2026-09-15; the manual rule above
applies until it lands.

Known trade-off: Wikimedia serves these images from `upload.wikimedia.org`
(hot-linking permitted per their robot policy for normal use; keep the polite
User-Agent when bulk-fetching). If the owner later prefers zero external
dependencies, the same 25 files can be pulled into the Media library (WebP
pipeline) and the `imageUrl`s swapped — the Source action preserves the
license link either way.
