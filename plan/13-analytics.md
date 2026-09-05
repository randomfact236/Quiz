# Feature 13 — Analytics (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: **2026-09-05** (previous audit 2026-08-30).
> **Owner status:** the 2026-08-30 build pause ended — the tabbed dashboard + geo/device pass
> shipped 2026-09-04 (commit `e976b06`). New gap analysis recorded in §4b. **Owner go-ahead
> received 2026-09-05**: pickup-order steps 1–2 (A1, A2, A3, A6, A7, B4) were implemented
> same-day — see the ✅ markers in §4b.

---

## 1. File inventory (all committed)

Backend (`apps/backend/src/analytics/`):

| File                                                        | Purpose                                                                                                                                                                                                                                                                                                                                                                                             | Size (verified) |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `analytics.controller.ts`                                   | `POST /analytics/events` (public via OptionalJwtAuthGuard, throttled 30/min, ≤50/batch) + `GET /analytics/summary` (public, 5-min cache). Ingest enriches every row server-side via `buildRequestContext`                                                                                                                                                                                           | 52 lines        |
| `admin-analytics.controller.ts`                             | `GET /admin/analytics/overview`, `/dashboard?days`, `/retention?weeks`, `/events` (Jwt + AdminGuard)                                                                                                                                                                                                                                                                                                | 58 lines        |
| `analytics.service.ts`                                      | Fail-safe ingest (per-event validation, free-text stripping, 8KB properties cap) + guest-counter wiring on `session_completed`; cached admin aggregations: overview (DAU/WAU/MAU, accuracy, 30-day series), tabbed dashboard payload (KPIs vs prev period, daily series, referrers, geo, devices, web vitals p75, signups/logins, per-module drill-downs), weekly retention cohorts, raw event list | 817 lines       |
| `request-context.ts` + `geo-lite.ts`                        | Server-side enrichment: country/region/city (geoip-lite), device/browser/OS (ua-parser-js), referrer domain, truncated `ipAnon` (/24 v4, /48 v6 — raw IPs never stored); geo stays null for private ranges                                                                                                                                                                                          | —               |
| `entities/analytics-event.entity.ts`                        | `analytics_events`: envelope (eventName, module, userId, guestId, sessionId, page, properties jsonb, clientTs, serverTs) + enrichment columns (country/region/city/deviceType/browser/os/referrerDomain/ipAnon); indexes for dashboard group-bys                                                                                                                                                    | 78 lines        |
| `dto/analytics.dto.ts`                                      | Envelope + query DTOs; eventName convention `<object>_<action>` lowercase snake                                                                                                                                                                                                                                                                                                                     | 130 lines       |
| `../migrations/1788300000000-CreateAnalyticsEventsTable.ts` | Table + indexes                                                                                                                                                                                                                                                                                                                                                                                     | —               |
| `../migrations/1789500000000-AddAnalyticsGeoDevice.ts`      | Enrichment columns (geo/device pass)                                                                                                                                                                                                                                                                                                                                                                | —               |
| `auth/optional-jwt-auth.guard.ts`                           | Resolves a real userId for logged-in senders, anonymous otherwise                                                                                                                                                                                                                                                                                                                                   | —               |

Frontend (`apps/frontend/src/`):

| File                                        | Purpose                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/analytics.ts`                          | `track()`: in-memory queue, batched flush every 10s or at 20 events, bounded retry, exit flush via `sendBeacon` (beacon rows are guest-attributed); `registerExitHook(fn)` lets engines queue events into the exit batch (used for `session_abandoned`); `MODULE_LABELS` typed beside the module union                                                                                                        |
| `lib/error-tracking.ts`                     | NEW 2026-09-05 (§4b A6): global `error`/`unhandledrejection` capture → `client_error`; `onApiFailure` subscription → `api_failed`; per-session cap (20) + message dedup; analytics endpoints excluded so a failing flush can't feed itself                                                                                                                                                                    |
| `lib/api-client.ts`                         | Exposes `onApiFailure(listener)` — fired with endpoint+status on every failed request (incl. network/timeout), before the ApiError rethrow                                                                                                                                                                                                                                                                    |
| `components/AnalyticsProvider.tsx`          | Mounted in `app/providers.tsx`: init + `page_viewed` on route change + `web_vitals` (CLS ×1000 integer scale) + `initErrorTracking()`                                                                                                                                                                                                                                                                         |
| `app/admin/components/AnalyticsSection.tsx` | Tabbed dark dashboard — owner-ordered 2026-09-05: Overview / Users / Audience & Geo / Journey / Retention / Quiz MCQ / Riddle MCQ / Image Riddles / Dad Jokes / Raw Events (Overview is the default landing tab); range selector 24h/7d/30d/90d; per-tab CSV export (client-side); `?section=analytics&tab=` deep links; module tabs include a "Sessions abandoned" funnel row                                |
| `app/admin/components/analytics/`           | Tab implementations (`tabs.tsx`), `primitives.tsx` (stat cards, CSS bars), `types.ts`, `csv.ts`                                                                                                                                                                                                                                                                                                               |
| `app/admin/components/EventsBrowser.tsx`    | Raw events tab (dark, visual): color-coded event badges per family (completed=green, abandoned/errors=red, answers=violet, jokes=lime…), property **detail chips** replacing raw JSON (✓ correct / ✗ wrong highlighted), eventName free-text + datalist, module, date-range and actor filters; actor cells open the per-visitor journey timeline with the same chip rendering; paginated                      |
| Instrumentation                             | quiz engine (`useQuizMcq.ts`): 7 events (incl. `session_abandoned`); riddle engine (`useRiddlePlay.ts`): 8 events (incl. abandonment, `session_extended`, `hint_used` — RiddleCard's hint button now reports up via `onHintShown`); register page: `signup_completed`; image-riddles `lib/analytics.ts` shim forwards supported preset actions as `image_riddle_*`; jokes page: `joke_viewed` / `joke_shared` |
| Docs                                        | `docs/analytics/analytics-data-collection.md` (collection plan + ledger; §11 carries the implementation status — some earlier sections predate the demographics removal, see §4b D1)                                                                                                                                                                                                                          |

**Verified event inventory (2026-09-05, after the A1/A2/A3/A6/A7 pass).** Client:
`page_viewed`, `web_vitals`, `session_started/resumed/completed/abandoned`,
`session_extended` (riddle), `question_answered`, `question_skipped`, `hint_used` (riddle),
`achievement_unlocked` (quiz only), `signup_completed`, `client_error`, `api_failed`,
`image_riddle_*` (supported actions), `joke_viewed`, `joke_shared`. Server:
`user_registered`, `user_login`, `login_failed`, `login_locked`,
`password_reset_requested`, `password_reset_completed`, `joke_voted`, `comment_posted`,
`newsletter_subscribed`, `newsletter_unsubscribed`, `settings_updated`.

## 2. Endpoint map (verified against controllers 2026-09-05)

| Method & Path                                                           | Auth                  | Notes                                                                                                                                           |
| ----------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| POST `/analytics/events`                                                | public (optional JWT) | batch ≤50; invalid/oversized events rejected per-item with counts; throttled 30/min; geo/device/referrer enriched server-side                   |
| GET `/analytics/summary`                                                | public                | `{ totalSessionsCompleted, sessionsCompletedByModule, activeQuizzers30d }`, 5-min cache; consumed by homepage StatsSection                      |
| GET `/admin/analytics/overview`                                         | Jwt + admin           | lifetime overview, 60s cache                                                                                                                    |
| GET `/admin/analytics/dashboard?days`                                   | Jwt + admin           | full tabbed-dashboard payload for the range (1–365 clamp), 60s cache per range                                                                  |
| GET `/admin/analytics/retention?weeks`                                  | Jwt + admin           | weekly first-seen cohorts (2–12 weeks clamp)                                                                                                    |
| GET `/admin/analytics/events?eventName&module&from&to&actor&page&limit` | Jwt + admin           | paginated raw event list; `from`/`to` ISO timestamps (date-only `to` = end of that day), `actor` matches userId **or** guestId **or** sessionId |

## 3. Current status (verified 2026-09-05)

**Working end-to-end:** client batching → enriched public ingest → jsonb event table → cached
tabbed admin dashboard (9 tabs, ranges, CSV export, deep links) + retention cohorts + raw event
browser. Identity resolution: JWT user → userId, else client guestId. Ingest is fail-safe by
design (never throws into gameplay). Guest counters increment on `session_completed`. The
2026-09-04 pass added geo/device/referrer capture, signups/logins series, web-vitals p75,
per-module drill-downs, and server events for comments/newsletter/settings. All probed live
with an admin JWT (dashboard/overview/retention 200 with real aggregates); backend type-check +
build clean; tests green at the time.

**2026-09-05 collection pass (§4b A1/A2/A3/A6/A7/B4):** `session_abandoned` from both engines
(pagehide via `registerExitHook` + SPA-unmount cleanup, submit clears the snapshot so
completion never races abandonment), `session_extended` + `hint_used` (riddle — with a real
`hintsUsed` counter replacing the dead session field), `client_error`/`api_failed`
(capped+deduped, analytics endpoints excluded), `signup_completed` on password registration,
and date-range/actor filters on the events endpoint + browser UI. Module tabs now show a
"Sessions abandoned" funnel row. Frontend 193/193 + backend 60/60 tests, type-checks and
backend build green; no new lint warnings.

**Known limits:** geo is null for local/private IPs (populates with real traffic). Dashboard
cache is per-range, 60s TTL. In-app SPA exits emit abandonment via hook cleanup; a hard tab
kill without pagehide is only visible later as started-but-never-completed.

**2026-09-05 first data analysis — findings resolved (do not re-chase):**

- **`api_failed` clusters (29× `/quiz-mcq/subjects`, 19× jokes, 13× admin analytics)** are
  backend-restart windows from same-day deployments, NOT slow queries — failures bucket into
  the exact hours code was redeployed, and warm responses all measure ~210ms. No endpoint fix
  needed; re-measure only under real traffic.
- **`featureNames is not defined` (1× client_error)** was a transient intermediate build state,
  fixed in the shipped code (compiles clean).
- **Quiz "option B" suspicion cleared:** the twice-missed question
  (`46f1b4b9…`, "Elephants are afraid of mice", options FALSE/TRUE) is correctly keyed —
  `correctAnswer = FALSE`; the player picked the myth (TRUE). No data fix.
- **Web-vital averages (LCP avg 89s, FCP avg 71s) are dev-compile outliers** — trust the p75
  columns (TTFB p75 ≈ 4.1s, CLS p75 ≈ 0.05); re-measure on a production build.
- Funnel "Signed up" stage counts admin registrations (4); **real registered non-admin users
  currently = 0** — signup conversion is unmeasured until real visitors arrive.

## 4. Task breakdown (carried from earlier passes)

### P0 — critical / broken

- None. The pipeline works and is fail-safe; nothing user-facing depends on it.

### P1 — major gaps

- [x] **Existing work committed and shipped** — VERIFIED 2026-08-30.
- [x] **`GET /analytics/summary` consumed on the homepage** — DONE in the feature-10 pass (StatsSection site-wide cards, local fallback).
- [x] **Raw-events browser UI** — DONE 2026-08-30 (EventsBrowser tab).
- [x] **Tabbed dashboard + geo/device capture** — DONE 2026-09-04 (commit `e976b06`); this plan file now reflects it.

### P2 — integration / quality (carried)

- [ ] Funnel views — **deferred**: aggregation endpoints + UI need live-DB verification; data collection is in place, so this is additive when picked up (see §4b A7 for the identity-link prerequisite).
- [ ] Accuracy join to content — **deferred**; `question_answered` carries `questionId`/`subject`/`chapter`, so the drill-down is query-only once picked up (see §4b A9).
- [ ] Retention tests — **deferred with rationale**: cohort logic is raw SQL; fixture tests would only mock the query away. Needs a DB-backed harness (e.g. testcontainers) — folded into §4b C2.
- [x] **Privacy review** — DONE 2026-08-30, **SUPERSEDED by the 2026-09-04 geo pass**: the entity now persists country/region/city and a truncated `ipAnon` (/24, /48) — no raw IP or user-agent column exists, and the client is never trusted for enrichment. Retention window is still **indefinite** (§4b C1).

### P3 — polish / tech debt (carried)

- [x] **CSV export of dashboard tabs** — DONE 2026-09-04 (client-side per-tab export; supersedes the earlier "deferred" note).
- [x] **`sendBeacon` on unload** — VERIFIED ALREADY IMPLEMENTED.
- [x] **Module labels consolidated** — DONE 2026-08-30 (`MODULE_LABELS` in `lib/analytics.ts`).

---

## 4b. Gap analysis — 2026-09-05 (what's still missing)

Full audit of the shipped system against `docs/analytics/analytics-data-collection.md`.
Nothing here is broken; each item is a capability the collection plan promised or that the
dashboard implies. **A = data collection, B = aggregation/BI, C = infrastructure, D = docs.**

### A — Data collection (events the plan names but the code never emits)

- [x] **A1. `session_abandoned`** — DONE 2026-09-05. Both engines emit on true page exits (pagehide through `registerExitHook`, so the event joins the exit beacon batch) and on in-app SPA exits (hook cleanup on unmount — the dominant path, since Exit is a Next `<Link>`). Properties: mode/subject/chapter/level, questionCount, answeredCount, lastQuestionIndex, timeTaken, statusBefore. `submitQuiz`/`handleSubmit` clear the snapshot synchronously so a completed session can never be reported abandoned by a racing unmount; per-session-id guard prevents double emission.
- [x] **A2. `session_extended`** — DONE 2026-09-05. `handleExtendSession` emits addedCount + timeAddedSeconds (timer mode) with the session id.
- [x] **A3. Riddle `hint_used`** — DONE 2026-09-05. `RiddleCard` gained an optional `onHintShown` prop (hint UI state was local-only); the play page passes `play.handleHintShown`, which tracks `hint_used` (questionId, level, hintNumber) and maintains a real `hintsUsedRef` — the riddle `session_completed` `hintsUsed` property now reports actual counts instead of the previous always-0 dead field (audit addendum below).
- [x] **A4. Inert image-riddle actions** — RESOLVED 2026-09-05 (downgraded to a verified non-issue during the F04 pass): `default-actions.ts` ships only the 4 supported presets; the `UNSUPPORTED_ACTION_IDS` set in `game.ts` is a defensive filter for DB-configured `actionOptions`, and the DB contains zero riddles referencing those ids. Plan/04 P2 was already accurate.
- [ ] **A5. `content_viewed` / `search_performed`** — subject/chapter views exist only as opaque `page_viewed` paths; no dimension events, so content performance (views per published item, dead content) isn't computable (plan docs §5.2).
- [x] **A6. Client error + API-failure tracking** — DONE 2026-09-05. New `lib/error-tracking.ts` (wired from `AnalyticsProvider`): window `error` + `unhandledrejection` → `client_error`; `app/error.tsx` boundary reports with the server digest via `trackBoundaryError`; `api-client.ts` exposes `onApiFailure` → `api_failed` (endpoint + status, network failures as status 0). Capped at 20 events/session with message dedup; `/analytics/*` requests are excluded so a failing flush retry loop can't generate events.
- [ ] **A7. Guest→registered conversion anchor** — **partially done 2026-09-05**: password registration now emits `signup_completed` (module `site`) from the register page, carrying the device guestId — giving the visitor→register funnel its join key (guest-attributed pre-signup events → `signup_completed` → post-login JWT-attributed events). **Remaining:** Google OAuth registrations complete server-side via redirect, so they never hit the register page; those need either a server-side `record()` call on the OAuth path or an event from the OAuth callback page.
- [ ] **A8. Minor env dimensions** — no UTM/campaign params (referrerDomain only), no screen-size or theme usage (plan docs §6.2). Cheap to add to the envelope if segmentation is wanted.
- [ ] **A9. Favorites unwired** — `RIDDLE_FAVORITES` storage key defined but no favorite events/feature (plan docs §5.2); only worth doing if favorites ship as a feature.
- [ ] **A10. Resume-prompt decisions untracked** _(found 2026-09-05 audit)_ — the quiz resume prompt (`useQuizResume`) and riddle resume dialog render with no events. `session_resumed` covers "accepted", but "prompt shown / declined → start fresh" is invisible, so we can't tell how often returning players discard saved progress. Cheap client-only events (`resume_prompt_shown`, `resume_declined`) if wanted.

### B — Aggregation / dashboard gaps

- [x] **B1. Funnel + conversion views** — DONE 2026-09-05 (both surfaces, owner-approved): (a) **Journey tab** rendering the owner's reference layout — "Total activity" node over color-coded per-module funnel columns (Quiz violet / Riddle sky / Image Riddle orange / Jokes emerald / **Other** gray: Pages viewed → Sign ups → Logins → Client errors), each with progress bars, "-N dropped" annotations and a conversion %; below it a **Pages visitors see** BarList, a **Beyond the journeys** KPI grid for raw-event families with no column (achievements, security events, comments, newsletter, client errors, web-vital samples — backend payload gained `clientErrors`/`securityEvents`/`commentEvents`), and the site-wide visitor funnel from `GET /admin/analytics/funnel?days`; (b) **actor timeline** in Raw Events — click an Actor cell for a visitor's chronological events grouped per session (events endpoint gained `order=asc`). Note: guest→user identity is still approximate (a registering guest counts in two stages) until signup_completed anchoring accumulates — see A7.
- [x] **B2. Content drill-downs** — DONE 2026-09-05: per-subject accuracy and hardest questions aggregate from `question_answered` (`subject`, `questionId` in properties). `ModuleDashboard` gained `bySubject` + `hardestQuestions` (questions with ≥3 answers, lowest accuracy first); Quiz/Riddle tabs render an "Accuracy by subject" bar panel and a "Hardest questions" table.
- [x] **B3. Per-joke leaderboard** — DONE 2026-09-05: `joke_voted` events grouped by `properties->>'jokeId'`, LEFT JOINed to `dad_jokes.joke` for the text (deleted jokes render "(deleted joke)"); dashboard payload `jokes.top` (top 5 by votes with like %) is the Jokes-tab leaderboard table and its CSV export.
- [x] **B4. Events browser filters** — DONE 2026-09-05. `GET /admin/analytics/events` accepts `from`/`to` (ISO; date-only `to` widened to end-of-day) and `actor` (matches userId, guestId, or sessionId — userId cast to text to avoid uuid-cast errors). EventsBrowser: date pickers, actor input, eventName free-text with a datalist covering all known client+server events, and an Actor column (`u:`/`g:`/`s:` prefixes, full ids in the tooltip) for journey tracing.
- [x] **B5. Security events surfaced** — DONE 2026-09-05: Users tab gained a "Security" panel — failed-logins-per-day series (`users.failedLoginsByDay`) plus the in-window `securityEvents` KPI (failed logins + lockouts), closing the loop on the brute-force data already collected.
- [x] **B8. Per-feature click breakdowns** — DONE 2026-09-05 (owner ask: "click data analysis section for each feature"): `ModuleDashboard.eventMix` (per-eventName counts scoped to the module + window) renders as a "Click analysis" bar panel on the Quiz and Riddle tabs; Image Riddles already had its action mix, Jokes its vote mix.
- [x] **B9. Dedicated Click Analysis tab** — DONE 2026-09-05 (owner picked the sub-tab design over one long page): new top-level **Click Analysis** tab (between Journey and Retention, deep-linkable at `?tab=clicks`) with per-feature pill switcher (Quiz / Riddle / Image Riddles / Jokes), backed by `GET /admin/analytics/clicks?module&days` (cached 60s, module-validated 400 otherwise). Per feature: total-clicks + headline KPIs, **clicks-per-day rhythm** (MiniBars), full event-mix bars, and feature depth — quiz/riddle: correct-vs-wrong AccuracyBar + **which option letter players pick**; jokes: vote split + most-voted jokes table; image-riddles: give-up rate. Individual click rows remain in Raw Events (cross-linked). **Extended same day (owner ask):** an **Overview** sub-tab (default) aggregating all four features client-side — grand-total + per-feature KPI cards, combined clicks-per-day, share-of-clicks bars, combined quiz+riddle accuracy; and "Where clicks land" dimension panels per feature — **bySubject/byChapter** (quiz/riddle, with % correct), **byCategory** (jokes, joined jokeId → dad_jokes → joke_categories), **topRiddles** (image riddles). **Owner presentation structure (same day):** each feature sub-tab leads with a labeled "… overview" summary section (KPIs + rhythm + event mix), followed by a "Subject-wise details" (quiz/riddle) / "Category-wise details" (jokes) section with selector pills — pills re-query `GET /admin/analytics/clicks` with an optional `subject` (quiz/riddle) or `category` (jokes) param; subject-filtered views add "Hardest questions in X" (≥2 answers), category-filtered views show that category's most-clicked jokes. Pills-not-nested-tabs was a deliberate call: per-subject tabs would have exploded navigation with mostly-empty early data.
- [ ] **B6. Retention depth** — cohorts are weekly first-seen only; no D1/D7/D30 numbers and no segments (country, acquisition source). Fine for now; revisit once traffic justifies it (plan docs §7).
- [ ] **B7. Backend ops metrics** (plan docs §6.1) — endpoint latency percentiles, error rates by route, cache hit rate, throttler rejections: none exist (Winston logs them only as text). A small `GET /admin/analytics/ops` or a dashboard panel would cover it; larger scope than the rest of section B.

### C — Infrastructure / hygiene

- [ ] **C1. Data-retention purge job** — retention is indefinite; plan docs §9 suggests ~13 months raw events (aggregates forever). The entity comment already calls raw rows "the retention-capped tier" but nothing enforces it. **Needs owner decision** (also a GDPR data-minimization point now that geo fields exist).
- [ ] **C2. Zero test coverage on the module** — no spec touches ingest validation/sanitization, enrichment, dashboard SQL, or cohorts. Ingest+sanitization are unit-testable as-is; the SQL parts need the DB harness already flagged in §4 P2.
- [ ] **C3. Dashboard cache invalidation** — 60s TTL only; acceptable today, but worth noting before building anything real-time on top.
- [ ] **C4. Ingest retry can double-count events** _(found 2026-09-05 audit)_ — the client `flush()` re-queues the whole batch when the POST fails; if the server actually persisted the batch but the response was lost (client 15s timeout, network blip), the retry writes the rows again. Rare and bounded, but there is no client event UUID / server dedup. A per-event `eventId` (client UUID) with a unique index would close it; only worth it if exact counts start to matter.

### D — Docs

- [ ] **D1. `docs/analytics/analytics-data-collection.md` stale sections** — §1 summary table (guest endpoint "broken", image-riddle/joke events "never emitted/idle" — all fixed), §2.1/§3 (demographics columns/removed feature 2026-08-30; `DropDemographicsColumns` migration `1788400000000`), §7 (demographic popup funnel), §11 (admin overview "demographics funnel" bullet). §11 status list is accurate; sections 1–7 predate it. Refresh when this feature is picked up.

### Suggested pickup order (when the owner gives the go-ahead)

1. ~~**A1 + A6** (abandonment + client errors)~~ — **DONE 2026-09-05** (plus A2/A3, same-file wins).
2. ~~**B4** (events browser date/actor filters)~~ — **DONE 2026-09-05**.
3. ~~**A7 + B1** (conversion anchor → funnel views)~~ — **B1 DONE 2026-09-05** (Journey tab + actor timeline); A7 remainder (Google-OAuth signup anchor) still open.
4. ~~**B2 + B3 + B5 + B8** (content drill-downs, joke leaderboard, security panel, per-feature click breakdowns)~~ — **DONE 2026-09-05**.
5. **C1 + C2** (purge decision, tests) — hygiene before traffic grows; needs owner input on C1.
6. Remainder (A4–A5, A8–A10, B6–B7, C3–C4, D1) as needed.

## 5. Cross-feature touchpoints

- **Features 02–05** — instrumentation sources: quiz 7 events (incl. abandonment), riddle 8 (incl. abandonment/extend/hint), image-riddles shim (supported actions only — A4), jokes page `joke_viewed`/`joke_shared` + server `joke_voted`.
- **Achievements (06)** — `achievement_unlocked` from the quiz engine; image-riddles/jokes achievements don't exist yet (owner decision logged in BACKLOG.md).
- **Comments (07)** — server-side `comment_posted` event; `commentsTotal` KPI on the dashboard.
- **Admin Dashboard (12)** — AnalyticsSection is a dashboard section; all `/admin/analytics/*` endpoints are admin-only.
- **Guest Users (01)** — `session_completed` events drive guest `quizAttempts`/`totalScore` counter upserts; ingest resolves userId vs guestId via the optional JWT guard.
- **Newsletter (14)** — server-side `newsletter_subscribed`/`newsletter_unsubscribed`; `newsletterSubscribers`/`newsletterNew` KPIs.
- **Site settings (11)** — server-side `settings_updated` audit event.
- **Auth (01)** — `user_registered`/`user_login`/`login_failed`/`login_locked`/`password_reset_*` server events; `users.updateLastActive` wired to login.

## 7. F13 five-step pass (2026-09-05) — verification summary

- **Step 1 (seed):** analytics data seeds itself — the F02–F05 gameplay passes generated the
  event corpus (2,794+ events incl. abandonment, extend, hint, client_error, api_failed,
  signup_completed samples).
- **Step 2 (plan audit):** continuously updated this session — §4b pickup items 1–4 + B8/B9 all
  implemented; §1 inventory, §3 status and the event inventory reflect the current code.
- **Step 3:** open items tracked (C1 purge decision, C2 tests, B6/B7, A4-resolved, A5/A8–A10,
  D1) — nothing lost.
- **Step 4 (dead code):** all analytics exports referenced (pctDelta, exportRowsForTab,
  JourneyTab, ClickAnalysisTab consumed by AnalyticsSection; csv helpers by the export button).
- **Step 5 (E2E):** overview / dashboard / retention / funnel / clicks (quiz + jokes) / events
  all 200 live with the current build; events endpoint correctly 400s unknown params.
