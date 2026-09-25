# Feature 15 — Full SEO Implementation (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
> Owns everything search-visibility related; plan/09 keeps the shell/UI items and links here for SEO.

---

## 1. Baseline inventory (what existed before this feature)

| Piece                     | State                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Root layout metadata      | hardcoded static `metadata` → now `generateMetadata` driven by the `seo` settings group                      |
| Admin SEO surface         | `SeoSection` (metadata editor + robots/sitemap reachability badges)                                          |
| `app/robots.ts`           | allow all, disallow `/admin` + `/api`, sitemap pointer — not dashboard-editable                              |
| `app/sitemap.ts`          | static routes + quiz/riddle subjects + image categories via public APIs; no lastmod; included login/register |
| Per-route metadata        | only about / contact / privacy / terms / jokes (layout) / image-riddles (layout)                             |
| Structured data (JSON-LD) | **none**                                                                                                     |
| OG images                 | **none** (no file, no dynamic generation)                                                                    |
| Rendering                 | gameplay content is client-rendered (`'use client'` pages) — invisible beyond initial HTML                   |
| Search Console            | verification token only; no API integration                                                                  |

## 2. Target architecture (what "full" means here)

1. **Metadata coverage** — every indexable route exports accurate title/description/OG; every
   non-indexable route (auth, gameplay-state, profile) is explicitly `noindex`.
2. **Structured data** — JSON-LD on every indexable page: Organization + WebSite (site-wide),
   BreadcrumbList on module landings, content-level schemas once content is server-rendered.
3. **Rich previews** — dynamic OG image (1200×630) generated from the `seo` settings, inherited
   by pages without their own image.
4. **Crawl surface** — sitemap with lastmod where the content API provides it, priorities that
   reflect real landing pages, no indexability conflicts (nothing in the sitemap is noindex).
5. **Server-rendered content** — the RSC conversion of gameplay/landing pages so crawlers see
   full HTML (the single biggest item; gated on the owner decision already logged in plan/09).
6. **Monitoring** — Search Console integration + organic segmentation + an SEO audit report.

## 3. Task breakdown

### P0 — critical / broken

- None. Nothing user-facing breaks today; this is a capability build-out.

### P1 — major gaps (site is indexable and presentable)

- [x] **Metadata coverage + noindex policy** — route metadata for `/play`, `/achievements`, `/riddle-mcq` + `quiz-mcq/layout.tsx`; auth/profile/gameplay sub-routes `noindex, follow` via the shared `NOINDEX` const.
- [x] **JSON-LD structured data** — `JsonLd` component + `lib/seo.ts` builders; Organization + WebSite site-wide from the `seo` settings, BreadcrumbList on module landings.
- [x] **Dynamic OG image** — `app/opengraph-image.tsx` (1200×630) renders the branded card from `seo` settings; inherited by pages without their own og:image.
- [x] **Sitemap/robots depth** — `lastmod` from content `updatedAt`, `/achievements` added, noindex auth pages dropped, priorities rebalanced (module landings 0.8).
- [x] **Social Sharing settings + Pages audit table** — per-platform OG overrides in the `seo` group with a page-level fallback chain; SeoSection tabs (General / Social Sharing / Pages audit / Technical); audit logic in `lib/seo-audit.ts`.
- [x] **SEO Dashboard redesign** — SeoSection opens on a dark Dashboard tab: gradient hero, GSC "Top Queries" placeholder panel, four KPI cards, per-module health breakdowns, filter chips, audit table with health badges, SEO tools card.

### P2 — integration / quality (next tier; needs the RSC decision or new routes)

- [ ] **Server-rendered content (the big one)** — PARTIAL 2026-09-22 (owner go via
      "implement group 1"): the per-content landings below are server routes that
      server-fetch subject/category meta, emit metadata + BreadcrumbList JSON-LD, and 404
      unknown slugs; the hub bodies themselves still hydrate client-side. Full RSC
      conversion of the hub grid/section bodies remains future work.
      UPDATE 2026-09-23 (NOW-03): chapter-level landings `/quiz-mcq/[subject]/[chapter]`
      SHIPPED — 92 chapters (all descriptive names, DB-verified), slugs derived from
      chapter names via `lib/slug.ts` (shared by pages/sitemap/middleware), live chapter
      counts in titles, BreadcrumbList JSON-LD, easy-level sample questions (answer-key
      stripped), sibling-chapter grids on subject landings (crawlable), middleware
      two-segment 307 validation, all 92 sitemap entries. Verified live + GUI.
- [x] **Per-content route segments + metadata** — DONE 2026-09-22: `/quiz-mcq/[subject]`
      and `/riddle-mcq/[category]` (server pages, `revalidate = 3600`, `notFound()` on
      unknown slugs) with `generateMetadata` (title/description/canonical/per-page OG via
      the existing `/api/og` types). Hub views accept `initialSubject`/`initialCategory`
      props (?subject=/​?category= still win, so share/play links are unchanged);
      subject cards, category cards and back-links now link the segment form; sitemap
      emits segment URLs (and its riddle section was fixed — it emitted `?subject=` URLs
      the riddle hub never read); the `?subject=`/`?category=` wrappers canonicalize onto
      the segments while `?q=`/`?score=` share surfaces stay self-canonical (SHARE-01).
- [x] **Content-level JSON-LD** — DONE 2026-09-22 (scoped): BreadcrumbList on the
      per-content landings. `Quiz`/`FAQPage` on gameplay surfaces still deferred —
      gameplay stays client-side/noindex by design.
- [x] **Per-page dynamic OG images** — DONE 2026-09-22: landings reuse the existing
      `/api/og` generators (`quiz-subject` with live count, `riddle-category`) instead of
      a new per-segment `opengraph-image.tsx` — same card, no duplication.

### P3 — polish / monitoring (owner decision: external accounts / scope)

- [ ] **Search Console integration** — service-account or OAuth ingestion of coverage/click data
      into the admin (new backend module + SeoSection panel). Needs an owner-provided GSC property.
- [ ] **SEO audit panel** — admin report scanning key routes for missing/duplicate metas,
      canonical correctness, sitemap/noindex conflicts, and JSON-LD validity (self-crawl from the
      backend on a schedule).
- [ ] **Organic segmentation in analytics** — referrer classification (search/social/direct)
      in the analytics dashboard Audience tab; data already collected (`referrerDomain`).
- [ ] **robots.txt dashboard control** — only worthwhile once there are rules worth toggling
      (e.g. staging lockout); today's rules are correct and static.

## 4. Cross-feature touchpoints

- **Feature 09 (shell/SEO)** — SEO history lives here; plan/09 links to this file.
- **Feature 11 (settings)** — the `seo` settings group (backend defaults, whitelist, public
  payload) is the storage layer for all metadata fields.
- **Feature 13 (analytics)** — referrerDomain already lands in `analytics_events`; the P3
  organic segmentation is a dashboard aggregation, not new collection.
- **Feature 12 (admin dashboard)** — SeoSection is a dashboard section; P2/P3 panels would sit
  inside it.
- **Features 02–05 (content)** — sitemap + future per-content metadata read the public content
  APIs; RSC conversion touches their pages.

## 5. RSC residual — CLOSED 2026-09-25 (NOW-03 complete)

- The hub bodies are now server-rendered: `/quiz-mcq` renders a crawlable
  "Browse all quiz subjects" grid (live counts, sorted), `/riddle-mcq` renders
  "Browse all riddle categories" — both in the initial HTML, with the
  interactive hubs hydrating below. Payload unwrapping is defensive (`{data,
total}` vs array) so prerendering with a reachable backend cannot crash the
  build (that crash shipped twice to Dokploy before the fix, `2c7f58b`).
- Verified live on production: both catalogs present in fetched HTML, 200 on
  hub/chapter/daily/duel pages, 92 chapter sitemap entries.
- NOW-03 residual is COMPLETE; organic segmentation (P3) remains under NOW-18-adjacent
  analytics items.
