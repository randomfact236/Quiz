# TODO — Tracked Follow-ups

Logged decisions/flags from the capacity build so they don't get lost. Completed items move to the bottom.

## Open

### Run summary — SEO social overrides + Pages audit table (2026-09-05)

- **Social Sharing:** `seo` settings gained per-platform overrides (facebook/twitter: image+title+
  description; google: description) end-to-end — backend defaults/DTO/public payload, frontend
  types, and `generateMetadata` fallback chain (page → platform override → global → auto image).
  E2E-probed with a minted admin JWT: PATCH a Facebook title override → homepage `og:title` flips
  (after the 5-min metadata fetch cache) → reverted clean.
- **SeoSection reworked into 4 tabs** (General / Social Sharing / Pages / Technical): character
  budgets on every title/description field (FB 60/110, TW 70/200, Google 155), share-image
  "Choose" uploads through the media library, and a live **Pages audit table** crawling the 11
  indexable routes (title/description quality vs 30–65/110–165 budgets, robots, OG image, JSON-LD,
  sitemap membership + summary counts). Audit helpers in `lib/seo-audit.ts`, 8 new unit tests.
- **Verified:** backend rebuilt + restarted (public payload includes the overrides); tsc clean
  both apps; tests 60/60 backend, **189/189** frontend; audit table live in the dashboard
  (11 rows, "4 fully optimized · 7 with warnings · 0 failing" against real pages).
- **Uncommitted** with today's SEO work.

### Run summary — full-SEO plan created + P1 implemented (2026-09-05)

- **Plan:** new `plan/15-seo.md` owns the SEO roadmap (baseline inventory, target architecture,
  P0–P3). P2 (RSC conversion, per-subject route segments, content JSON-LD, per-page OG) is gated
  on the plan/09 server-rendering owner decision; P3 (Search Console integration, audit panel,
  organic segmentation) needs owner input on external accounts.
- **P1 implemented + verified live:** JSON-LD `WebSite`+`Organization` graph injected site-wide
  (fed by the `seo` settings group, `</script>`-safe escaping); `BreadcrumbList` builders ready in
  `lib/seo.ts` with module meta presets; dynamic OG image `app/opengraph-image.tsx`
  (ImageResponse 1200×630, 200 image/png, inherited site-wide); metadata coverage for
  play/achievements/riddle-mcq/quiz-mcq (client pages get server layouts); 14 noindex layouts for
  auth/gameplay-state/profile routes; sitemap drops auth pages, adds /achievements, lastmod from
  content updatedAt, rebalanced priorities.
- **Probed:** home HTML carries the JSON-LD graph + og:image; login renders
  `noindex, follow`; quiz/riddle/play/achievements titles all flow through the title template;
  sitemap has no /login, has /achievements. tsc clean; frontend 181/181.
- **Uncommitted** with the rest of today's SEO work.

### Run summary — admin SEO section + sidebar reorder (2026-09-05)

- **SEO menu built:** new "SEO" section in the admin dashboard, placed between Analytics and
  Settings (also the previous request's reorder: Analytics now sits directly before Settings,
  with its dashboard tabs as a collapsible sidebar sub-menu that deep-links `?section=analytics&tab=…`).
- **SEO section scope:** edits the new `seo` settings group (site name, default title, title
  template, description, keywords, OG image, Twitter handle, Google Search Console token) via
  `PATCH /settings`, and shows robots.txt/sitemap.xml reachability badges. Backend: `seo` added to
  settings defaults (`config/settings.ts`), update-DTO whitelist, and `GET /settings/public`
  (public-safe — it renders into public meta tags anyway). Frontend root layout now uses
  `generateMetadata` reading `/settings/public` (5-min server cache, full fallback to built-ins).
- **Verified live:** backend rebuilt + restarted; `PATCH /settings {seo}` with a locally minted
  admin JWT → public payload reflects it → reverted (200s); homepage `<title>`/description now
  served from generateMetadata; SeoSection renders the saved values with robots/sitemap both
  Reachable; sidebar order confirmed via DOM. tsc clean both apps; backend tests 60/60, frontend 181/181.
- **Plan docs:** plan/09 P1 updated with the new done item; plan/13 + docs banner unchanged from earlier today.

### Run summary — jokes comments modal: punchline reveal completed (2026-09-05)

- **Finished the leftover WIP** in the working tree: `JokeCommentsModal` gained an optional
  `jokePunchline` prop with a "Show punchline" header reveal, so commenters can see the answer
  without closing the modal and flipping the card; `jokes/page.tsx` passes it for non-one-liners
  only (`isOneLiner ? undefined : punchline`). The modal is conditionally mounted per joke, so the
  reveal state resets on every open.
- **New test** `joke-comments-modal.test.tsx` (3 cases): reveal on demand, one-liners offer no
  reveal, fresh mount starts hidden. Also fixed the stale `@/lib/riddle-resume` import in
  `riddle-resume.test.ts` (module is now `@/lib/riddle-persistence`).
- **Verified:** frontend `tsc` clean; jest 181/181 (was 178); `/jokes` renders on the dev server
  and the jokes API probed 200. Browser-side modal click-through was attempted via the in-app
  browser but abandoned — the IAB kept resetting tabs to about:blank mid-flow (flaky localhost
  goto + intermittent localStorage denials in fresh tabs); the Jest coverage above pins the
  behavior deterministically instead.
- **Uncommitted** (feature-scoped): the two jokes files + both touched tests.

### Run summary — stale-backlog closeout: Newsletter admin tab (2026-09-05)

- **Built:** `NewsletterSection` admin tab (sidebar: Newsletter, `?section=newsletter`) —
  subscriber list with active/unsubscribed/all filters, email search, pagination and CSV
  export via `GET /newsletter/export`. Consumes the previously-unused newsletter admin
  endpoints; this closes the last unfinished item from the "already done" backlog audit.
- **BACKLOG.md rewritten** (now committed) to match verified code state: done items moved to a
  closed checklist; the true remaining backlog is riddle server-side sessions, achievements for
  image-riddles/jokes (needs owner decision on definitions), JokesSection pattern unification,
  CSV import/export consistency, sidebar grouping, retention tests, per-question accuracy join.
- **Verified:** tsc clean; `/admin?section=newsletter` compiles via dev server; list + export
  endpoints probed live with an admin JWT (real rows + CSV returned).

### Run summary — tabbed analytics dashboard + geo/device capture (2026-09-04)

- **Built:** admin Analytics reworked into a dark tabbed dashboard (Overview / Quiz MCQ / Riddle MCQ /
  Image Riddles / Dad Jokes / Users / Audience & Geo / Retention / Raw Events), fed by the new
  `GET /admin/analytics/dashboard?days=` endpoint (60s cache). Range selector (24h/7d/30d/90d),
  per-tab client-side CSV export, `?tab=` deep links. Events enriched server-side at ingest with
  country/region/city (geoip-lite), device/browser/OS (ua-parser-js) and referrer domain; raw IPs are
  never stored — `ipAnon` keeps a /24 truncation (migration `AddAnalyticsGeoDevice1789500000000`).
- **New events tracked:** `joke_viewed` / `joke_shared` (client, jokes page), `newsletter_subscribed`
  / `newsletter_unsubscribed` (server), `comment_posted` (server), `settings_updated` (server).
  Dashboard aggregates signups/logins per day, web vitals avg+p75, geo breakdowns, device mix and
  per-module funnels/accuracy-by-level.
- **Verified live:** dashboard/overview/retention probed with a locally minted admin JWT (all 200,
  real aggregates); ingest enrichment confirmed in DB (Chrome/Windows/desktop + google.com referrer
  - truncated IP); backend type-check + build clean; backend tests 20/20 (newsletter/settings/
    comments specs updated for the new constructor arg); frontend tests 178/178.
- **Environment note:** the frontend dev server (:3010) was wedged (500 on every route, including
  untouched ones) after the backend `npm install` mutated the hoisted root `node_modules` under it —
  restarted, all routes 200 again. `next build` cannot run while the dev server holds `.next/trace`
  (EPERM); stop the dev server first if a prod build is needed.
- **Known limits:** geo stays null for local/private IPs (loopback has no country) — populates with
  real traffic. Web-vitals p75 for CLS is on the ×1000 integer scale. Dashboard cache is per-range
  (`analytics:dashboard:<days>`, 60s TTL).

### Run summary — master tracker pass complete (2026-08-30)

All 14 features worked in table order (P0 → P1 → P2 → P3, feature-scoped commits, pushed).
**RESOLVED 2026-09-03:** the project's own `ai-quiz-postgres` / `ai-quiz-redis` Docker containers (credentials match
`apps/backend/.env`; volume `backend_postgres_data` holds the full current schema) were started via `docker start`,
all five pending migrations applied, the backend rebuilt (F11–F14 code) and restarted, and the frontend dev server
brought back up on :3010. Live probes passed: newsletter subscribe/duplicate/honeypot/unsubscribe/400,
`GET /settings/public` levelTimers, image-riddle engage, quiz session create + history. Probe rows cleaned up.
Remaining known environment quirk: `/health` reports 503 on the disk-usage threshold (machine-level, not code).
**Owner decisions logged below (§0) and in each plan file.**

### 0. Needs owner decision — from the feature-01 pass (2026-08-30)

- **Needs owner decision: block login until email verified?** Feature 01 P1 built the full email-verification mechanism (commit `f0bed06`): registration emails a 24h one-time link, `POST /auth/verify-email` flips the flag, resend endpoint is anti-enumeration, `/verify-email` page handles the flow. The plan did not specify whether unverified users are locked out of login. **Currently non-blocking** (least-surprise; nobody gets locked out). If you want a hard gate, say so and login will 403 with a "verify your email" pointer until `emailVerified` is true.
- **Needs owner decision: build an admin user-editing UI?** Feature 01 P2 (`plan/01-user-accounts.md`): role change and delete exist as endpoints (`PUT/DELETE /admin/users/:id`, role now enum-constrained) but admin views are read-only lists — changes require raw API calls. Building a `JokesSection`-style editing UI was flagged in the plan as "check whether wanted".

### 1. BullMQ reshuffle job for `random_weight`

- **Status:** deliberately not built (per scope decision).
- When mass deletions accumulate, weight distribution develops gaps near 1.0 → wrap-around logic covers correctness, but if uniformity matters add a periodic job: `UPDATE <table> SET random_weight = RANDOM()` for questions/riddle_mcqs.

### 2. Quiz MCQ — correctness backlog (from quiz-mcq.md audit; owner-directed logging)

Backend:

- **~~[P0] `updateQuestion` dead extreme-level logic~~** — FIXED 2026-08-25: `applyUpdate` now uses `(dto.level ?? level) === 'extreme'`; verified live — PATCH with options+level:'extreme' nulls options (old code kept them).
- **~~[P1] Chapter numbering race~~** — FIXED 2026-08-25: `createChapter` and bulk imports now use MAX(chapterNumber)+1 (imports carry a per-subject counter across chapters created in one chunk). Residual: two _simultaneous_ imports could still race on MAX — acceptable until imports go concurrent.
- **~~[P1] Bulk-import slug collisions~~** — FIXED 2026-08-25: `resolveUniqueSubjectSlug` picks the next free `-N` suffix when a sanitized slug already exists ("C++" vs "C" no longer abort the chunk); verified live with a previously-failing pair.
- **~~[P1] N-delete loop in `deleteSubject`~~** — FIXED 2026-08-25: cascade uses a single `IN` query inside the same transaction; verified live.
- **~~[was P1] random/:level + mixed not random~~** — FIXED by Track A/B (random_weight via shared pickRandomByWeight); doc claim now stale.
- **~~[P1] `GET /quiz-mcq/questions/:chapterId` requires auth despite PUBLIC contract~~** — FIXED 2026-08-25: `@_Public()` added to the route; verified live (no-token → 200, admin routes still 401, PUBLISHED-only filter intact).
- **~~[P2] quiz-mcq.md endpoint table still claims `random`/`mixed` are updatedAt-ordered~~** — FIXED 2026-08-25: doc refreshed (random_weight pools, fixed-bug sections, roadmap status).

Frontend:

- **~~[P0] QuestionReview marks correct MCQs wrong~~** — FIXED 2026-08-25: compares via shared scorer (`isAnswerCorrect`, letter-based) and highlights correct option by `correctLetter`; was comparing letter against answer text.
- **~~[P0] Extreme answers always scored incorrect in results~~** — FIXED 2026-08-25: results page now uses the shared scorer (`lib/quiz-mcq-scoring.ts`) — same case-insensitive text matching as play time; score/percentage recomputed from it.
- **~~[P0] Crash on unknown difficulty level~~** — FIXED 2026-08-25: `calculateResult` guards unknown levels (counted in totals, skipped in grid); regression-tested.
- Regression tests for all of the above: `src/__tests__/quiz-mcq-scoring.test.ts` (16/16 passing).
- **~~[P1] Progress/achievements never written on completion~~** — FIXED 2026-08-25: both completion paths funnel through `saveToHistory`, which now calls `saveQuizResult()` + `checkAchievements()` (+ unlock toasts).

(Refactor-class items — hub duplication, dead components, resume bloat, monolith splits — are tracked in plan/STANDARDS.md §3, not duplicated here.)

### 3. Riddle MCQ — correctness backlog (from riddle-mcq.md audit; owner-directed logging)

Backend:

- **~~[P0] stats payload mismatch + swapped totalSubjects/totalCategories~~** — FIXED 2026-08-26: payload reshaped to FE contract (`totalRiddleMcqs`/`mcqsByLevel`), swap corrected; `stats/overview` + `filter-counts` restored to `@_Public()` (default-deny JWT had silently locked them). Verified live.
- **~~[P0] By-subject read leaked drafts/trash~~** — FIXED 2026-08-26: filters `status = PUBLISHED`; verified live.
- **~~[P1] No server-side level option rules~~** — FIXED 2026-08-26: min options per level (2/3/4), correctLetter range A–B/C/D, expert text answer enforced on create + update; five live probe paths.
- **~~[P1] Bulk facade / duplicate slug helpers / orphaned migrations~~** — FIXED 2026-08-26 (facade dissolved into import/bulk-actions services; single `utils/slug.util`) and upstream (migrations rebuilt + registered in phase 0.5).
- **~~[P2] No per-subject×level counts endpoint; no public single-riddle read~~** — DONE 2026-08-26: `@_Public GET /riddle-mcq/level-counts` (one GROUP BY, 300s cache) and `@_Public GET /riddle-mcq/riddles/:id` (PUBLISHED only).
- **~~ContentServiceBase migration~~** — DONE 2026-08-26: question service extends ContentServiceBase via new opt-in flat-taxonomy mode (Subject→items, no chapter layer); quiz-mcq behavior unchanged (regression-probed).

Frontend:

- **~~[P0] Subject-wise play broken end-to-end~~** — FIXED 2026-08-26: play page reads `subjectId` (canonical) with `chapterId` legacy fallback; results retry link canonicalized.
- **~~[P0] Results redirect to non-existent `/riddles`~~** — FIXED 2026-08-26: targets `/riddle-mcq`.
- **~~[P1] Stale mutation invalidation keys~~** — FIXED 2026-08-26: `useRiddleMutations` keys match actual query caches; category delete also clears questions.
- **~~[P1] Duplicate hooks / duplicated scorer~~** — FIXED 2026-08-26: dead `lib/useRiddleMcqFilters`, `RiddleMcqSection`, `useRiddleMcqModals` deleted; single shared `lib/riddle-scoring.ts`.
- **~~[P1] Submit fired inside timer's setState updater~~** — FIXED 2026-08-26: pure tick + guarded auto-submit effect.
- **~~[P2] Fake even distribution of level counts~~** — FIXED 2026-08-26: challenge/practice hubs consume the real cached `level-counts` endpoint.

Deferred (owner-accepted 2026-08-26): JSON import/export; targeted stats cache tuning; session history writes + hint/skip tracking; tests backlog (csv-parser/adapter/scoring/e2e).

Quality-gate pass (2026-08-26, mirrors quiz-mcq):

- **~~Dead code~~** — chapter-layer types (`adaptChapter`/`RiddleChapter`/`ChapterDisplay`/`DEFAULT_CHAPTER_ICONS`/`toBackendRiddle`), unused session helpers (`createAutoSaveInterval`, `getRiddleHistory`, module-level `calculateTimeTaken`), backend `RiddleMcqPaginationDto` deleted.
- **~~Hub duplication~~** — challenge/practice pages deduplicated into shared `components/riddle-mcq/RiddleChallengeHub.tsx`.
- **~~Play page monolith~~** — modals split into `play/components/` (ResumePrompt/SubmitConfirm/ExtendSession).
- **~~Resume/session bloat~~** — two-key resume store (`lib/riddle-resume.ts`: snapshot once + lightweight progress); stable autosave interval; session fields renamed `chapterId/chapterName` → `subjectId/subjectName`; live score moved to the shared scorer.

Optimization pass (2026-08-26):

- **~~[perf] filter-counts query fan-out~~** — 5 GROUP BY queries consolidated to 3; total derived from combined status rows; semantics preserved. Verified live against DB.
- **~~[fix] biased shuffle~~** — play page uses shared Fisher-Yates `shuffle()` (`lib/utils.ts`) instead of `sort(() => Math.random() - 0.5)`.
- **~~[refactor] play page orchestration~~** — extracted to `hooks/use-riddle-play/useRiddlePlay.ts` (+ `useRiddleTimers` clocks module); page is render-only at 285 lines (was 787).
- ~~Open: cosmetic practice countdown~~ — REMOVED 2026-08-26 per owner decision (no enforcement existed; challenge ring unaffected).
- DONE 2026-08-26 — unified Quiz/Riddle picker built at `/play`: content-type step then mode step, routed into existing quiz/riddle flows; linked from riddles home.

### 4. ToastContainer is mounted nowhere — repo-wide toast gap

- **Status:** RESOLVED 2026-08-30 — `<ToastContainer />` mounted globally in `app/providers.tsx` (feature 09 P0, commit `f6d6847`); the riddle-mcq admin's local interim mount removed as instructed. Item kept for history.
- **Problem:** every `toast.success()/error()/...` call (singleton `lib/toast.ts#toastManager`) renders nothing because the subscribing UI, `components/ui/ToastContainer.tsx`, is not mounted anywhere in the app tree (verified by repo-wide grep 2026-08-30). Affected surfaces include quiz-mcq results (`app/quiz-mcq/results/page.tsx:70-74`), admin sections (JokesSection, MediaLibrarySection, ImageRiddlesAdminSection, CommentsSection), and others.
- **Fix:** mount `<ToastContainer />` once in `app/providers.tsx` (inside `QueryClientProvider`). **Blocked:** `providers.tsx` is currently being edited by the concurrent analytics session — do it once that session lands.
- **Interim workaround:** riddle-mcq admin mounts `ToastContainer` locally inside `RiddleMcqContainer` (commit `2834b54`) so its import toast works. Remove the local mount when the global one lands.
- Note: `lib/toast.ts` has no DOM fallback; without a mounted container, toasts fire and silently auto-dismiss.

## Resolved

### image-riddles `stats/overview`: public vs admin-only — **RESOLVED: keep public**

- **Decision:** 2026-08-25, confirmed by owner. Endpoint stays public, consistent with sibling endpoints (`riddle-mcq/stats/overview`, quiz/jokes/image-riddles public count surfaces).
- **Reasoning:** payload is pure aggregates (total riddles/categories, per-difficulty breakdown, average timer) with no user data; frontend home/mode-picker surfaces consume it for display; single count query, Redis-cacheable. No code change required.

## Done

- [x] 2026-08-25 — image-riddles route shadowing fixed: `GET :id` moved below literal routes (`status-counts`, `stats/overview`). Verified live: status-counts → 401 unauthenticated (was unreachable/shadowed), stats → 200, `:id` lookups unaffected. Commit: see git log "image-riddles route order".
- [x] 2026-08-25 — apps/backend/.env untracked (credential exposure); rotation of dev creds done; prod rotation pending before any deploy (see plan/STANDARDS.md §6 security note).
