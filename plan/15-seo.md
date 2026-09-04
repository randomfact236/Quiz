# Feature 15 — Full SEO Implementation (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Created 2026-09-05 after the owner asked for "full SEO" beyond the metadata layer built the same
> day (SeoSection + `seo` settings group, see plan/09 P1). Owns everything search-visibility related;
> plan/09 keeps the shell/UI items and links here for SEO.

---

## 1. Baseline inventory (what existed before this feature)

| Piece                     | State                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Root layout metadata      | hardcoded static `metadata` → now `generateMetadata` driven by the `seo` settings group (2026-09-05)         |
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

- [x] **Metadata coverage + noindex policy** — BUILT 2026-09-05: added route metadata for
      `/play`, `/achievements`, `/riddle-mcq` and a new `quiz-mcq/layout.tsx` (client page, server
      layout pattern). Auth pages (login/register/forgot/reset/verify), profile, and all gameplay/
      results sub-routes are `noindex, follow` via tiny server layouts using the shared `NOINDEX`
      const from `lib/seo.ts`.
- [x] **JSON-LD structured data** — BUILT 2026-09-05: `JsonLd` component + `lib/seo.ts` builders;
      `Organization` + `WebSite` injected site-wide from the root layout (fields from the `seo`
      settings group); `BreadcrumbList` on the four module landing pages.
- [x] **Dynamic OG image** — BUILT 2026-09-05: `app/opengraph-image.tsx` (Next `ImageResponse`,
      1200×630) renders the branded card from the `seo` settings (site name + description over a
      brand gradient); inherited by every page without its own og:image.
- [x] **Sitemap/robots depth** — BUILT 2026-09-05: sitemap gains `lastmod` from content
      `updatedAt` where the API returns it, adds `/achievements`, and drops the auth pages (they are
      noindex — sitemap/noindex conflicts hurt); priorities rebalanced (module landings 0.8).
- [x] **Social Sharing settings + Pages audit table** — BUILT 2026-09-05 (owner-requested full
      version of the SeoSection): the `seo` settings group gained per-platform overrides
      (`facebook`/`twitter`: image+title+description, `google`: description) — defaults, update DTO
      whitelist and the public payload all extended; `generateMetadata` implements the fallback chain
      **page content → platform override → global fallback → auto-generated image** (verified E2E:
      PATCH a Facebook title override → homepage `og:title` flips after the fetch-cache window → reverts).
      SeoSection reworked into tabs: General (site metadata), Social Sharing (default fallbacks +
      Facebook/Twitter-X/Google override cards with character budgets — FB 60/110, TW 70/200, Google 155 —
      and image "Choose" uploads through the media library), Pages (live audit table crawling the 11
      indexable routes: title/description lengths with 30–65/110–165 budgets, robots, OG image,
      JSON-LD, sitemap membership, plus an "N fully optimized · warnings · failing" summary), Technical.
      Audit logic extracted to `lib/seo-audit.ts` with 8 unit tests (suite 189/189).

### P2 — integration / quality (next tier; needs the RSC decision or new routes)

- [ ] **Server-rendered content (the big one)** — convert the module landing pages to RSC data
      fetching (subjects/categories rendered server-side), then gameplay surfaces as feasible. This is
      the plan/09 "server-rendering strategy" owner decision — **do not start without the owner's
      go-ahead**. Prerequisite for items below.
- [ ] **Per-content route segments + metadata** — subjects/categories are query params today
      (`/quiz-mcq?subject=…`), so per-subject titles/canonicals are impossible. Introduce real
      segments (`/quiz-mcq/[subject]`) with `generateMetadata` (title/description from content,
      canonical, `EXCLUDE_DATE`-style lastmod in sitemap) once RSC lands.
- [ ] **Content-level JSON-LD** — `Quiz`/`Question` schema on quiz pages, `FAQPage` where
      content fits, per-item breadcrumbs. Client-computed JotD needs SSR first.
- [ ] **Per-page dynamic OG images** — `opengraph-image.tsx` per module segment rendering the
      content name into the card (reusable `OgCard` builder extracted from the root one).

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
