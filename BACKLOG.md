# Backlog — Feature & Tracking List

> Status snapshot 2026-09-05. This file lists what remains; completed work is tracked in
> TODO.md (run log) and git history. Verified against the codebase on 2026-09-05.

---

## Admin Tabs (Sidebar)

Summary · Quiz MCQ · Riddle MCQ · Image Riddles · Dad Jokes · Users · Analytics · Media ·
Comments · **Newsletter** · Settings

All eleven tabs are live. Analytics is a dark tabbed dashboard (Overview, Quiz MCQ, Riddle MCQ,
Image Riddles, Dad Jokes, Users, Audience & Geo, Retention, Raw Events) fed by
`GET /admin/analytics/dashboard` with geo/device enrichment — built 2026-09-04, see TODO.md.

---

## Done — verified in code (kept here so they stop reappearing as open)

- ✅ Dad Jokes render on the public side (`/jokes`, API-first with localStorage fallback)
- ✅ Site Settings: real API on both sides (no localStorage split-brain)
- ✅ SEO basics: `sitemap.ts`, `robots.ts`, OG/Twitter metadata in root layout
- ✅ Legal pages: `/privacy`, `/terms`, `/contact`
- ✅ Profile page: `/profile`
- ✅ Newsletter: subscribe/unsubscribe endpoints, footer form, **admin tab** with list,
  status filter, search and CSV export (added 2026-09-05)
- ✅ Engagement counters (image-riddle views) and quiz question `explanation` (review UI shows it)
- ✅ Analytics event coverage: page views, web vitals (avg+p75), sessions, answers, skips,
  achievements, joke votes/views/shares, newsletter events, comments, settings changes,
  geo (country/region/city), device/browser/OS, referrer domain
- ✅ Analytics CSV export (per-tab, client-side), funnel views, retention cohorts,
  raw-events browser
- ✅ Admin user-editing UI (role change + delete in Users tab)
- ✅ Achievements: quiz-mcq AND riddle-mcq unlock server-side with progress sync

---

## Remaining Open Work

### P1 — Major

- **Riddle MCQ server-side sessions/results** — quiz-mcq has `POST /sessions`,
  `sessions/history`, `sessions/high-scores`; riddle history/resume is still localStorage-only
  (`lib/riddle-progress.ts`, `lib/riddle-resume.ts`). Largest remaining item.
- **Achievements for image-riddles / dad-jokes** — no achievement definitions exist for these
  games. Needs an owner decision first: what should unlock? (e.g. "10 riddles solved", "voted on
  5 jokes"). The sync pipeline (`lib/achievements.ts` → `POST /achievements/sync`) is reusable.

### P2 — Integration / Quality

- **Unify admin section data patterns** — `JokesSection` still takes `allJokes`/`setAllJokes`
  lifted-state props (it does use the API now, unlike its localStorage ancestor) while newer
  sections are self-contained.
- **Consistent CSV import/export across admin modules** — quiz/riddle/newsletter export
  server-side; jokes exports client-side; image-riddles has import but no export parity.
- **Retention tests** — needs a DB-backed test harness.

### P3 — Polish / Tech Debt

- **Admin sidebar grouping** — flat list; group into Content / People / Insights / System.
- **Analytics: accuracy joined to content** — per-question drill-down (per-module and
  per-level accuracy exist). Under discussion.

---

## Analytics Design Reference

The tabbed analytics dashboard was built natively (2026-09-04). The ecommerce repo's
`admin/analytics/page.tsx` was used as a _style_ reference only (dark full-dashboard, KPI cards,
sticky tab strip, range selector, export menu); its revenue/affiliate tabs do not apply here.
Reference path: `E:\webiste theme and plugin\ai-product-ecommerce\product-ecommerce-affiliate-website\apps\web\src\app\admin\analytics\page.tsx`
