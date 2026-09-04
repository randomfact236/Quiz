# Feature 13 — Analytics (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: **2026-09-05** (previous audit 2026-08-30).
> **Owner status:** the 2026-08-30 build pause ended — the tabbed dashboard + geo/device pass
> shipped 2026-09-04 (commit `e976b06`). New gap analysis recorded in §4b; do not start those
> tasks without the owner's go-ahead.

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

| File                                        | Purpose                                                                                                                                                                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/analytics.ts`                          | `track()`: in-memory queue, batched flush every 10s or at 20 events, bounded retry, `sendBeacon` exit flush (beacon rows are guest-attributed); `MODULE_LABELS` typed beside the module union                                                |
| `components/AnalyticsProvider.tsx`          | Mounted in `app/providers.tsx`: init + `page_viewed` on route change + `web_vitals` (CLS ×1000 integer scale)                                                                                                                                |
| `app/admin/components/AnalyticsSection.tsx` | Tabbed dark dashboard: Overview / Quiz MCQ / Riddle MCQ / Image Riddles / Dad Jokes / Users / Audience & Geo / Retention / Raw Events; range selector 24h/7d/30d/90d; per-tab CSV export (client-side); `?section=analytics&tab=` deep links |
| `app/admin/components/analytics/`           | Tab implementations (`tabs.tsx`), `primitives.tsx` (stat cards, CSS bars), `types.ts`, `csv.ts`                                                                                                                                              |
| `app/admin/components/EventsBrowser.tsx`    | Raw events tab: eventName/module filters, search, paginated table with per-row property details                                                                                                                                              |
| Instrumentation                             | quiz engine (`useQuizMcq.ts`): 6 events; riddle engine (`useRiddlePlay.ts`): 5 events; image-riddles `lib/analytics.ts` shim forwards supported preset actions as `image_riddle_*`; jokes page: `joke_viewed` / `joke_shared`                |
| Docs                                        | `docs/analytics/analytics-data-collection.md` (collection plan + ledger; §11 carries the implementation status — some earlier sections predate the demographics removal, see §4b D1)                                                         |

**Verified event inventory (2026-09-05).** Client: `page_viewed`, `web_vitals`,
`session_started/resumed/completed`, `question_answered`, `question_skipped`,
`achievement_unlocked` (quiz only), `image_riddle_*` (supported actions), `joke_viewed`,
`joke_shared`. Server: `user_registered`, `user_login`, `login_failed`, `login_locked`,
`password_reset_requested`, `password_reset_completed`, `joke_voted`, `comment_posted`,
`newsletter_subscribed`, `newsletter_unsubscribed`, `settings_updated`.

## 2. Endpoint map (verified against controllers 2026-09-05)

| Method & Path                                             | Auth                  | Notes                                                                                                                         |
| --------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| POST `/analytics/events`                                  | public (optional JWT) | batch ≤50; invalid/oversized events rejected per-item with counts; throttled 30/min; geo/device/referrer enriched server-side |
| GET `/analytics/summary`                                  | public                | `{ totalSessionsCompleted, sessionsCompletedByModule, activeQuizzers30d }`, 5-min cache; consumed by homepage StatsSection    |
| GET `/admin/analytics/overview`                           | Jwt + admin           | lifetime overview, 60s cache                                                                                                  |
| GET `/admin/analytics/dashboard?days`                     | Jwt + admin           | full tabbed-dashboard payload for the range (1–365 clamp), 60s cache per range                                                |
| GET `/admin/analytics/retention?weeks`                    | Jwt + admin           | weekly first-seen cohorts (2–12 weeks clamp)                                                                                  |
| GET `/admin/analytics/events?eventName&module&page&limit` | Jwt + admin           | paginated raw event list (no date-range / actor filters — see §4b)                                                            |

## 3. Current status (verified 2026-09-05)

**Working end-to-end:** client batching → enriched public ingest → jsonb event table → cached
tabbed admin dashboard (9 tabs, ranges, CSV export, deep links) + retention cohorts + raw event
browser. Identity resolution: JWT user → userId, else client guestId. Ingest is fail-safe by
design (never throws into gameplay). Guest counters increment on `session_completed`. The
2026-09-04 pass added geo/device/referrer capture, signups/logins series, web-vitals p75,
per-module drill-downs, and server events for comments/newsletter/settings. All probed live
with an admin JWT (dashboard/overview/retention 200 with real aggregates); backend type-check +
build clean; tests green at the time.

**Known limits:** geo is null for local/private IPs (populates with real traffic). Dashboard
cache is per-range, 60s TTL. `GET /admin/analytics/events` has no date-range or actor filter.

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

- [ ] **A1. `session_abandoned`** — no abandon handler in either engine (no beforeunload/pagehide capture in `useQuizMcq.ts` / `useRiddlePlay.ts`). Without it, drop-off points (which question index users quit at) and true completion rates are uncomputable; funnels overstate engagement (plan docs §4.1). Emit on pagehide mid-session with questions-answered + last index, via the existing beacon flush.
- [ ] **A2. `session_extended`** — ExtendSessionModal usage (riddles) untracked; can't see how often sessions hit limits or which modes get extended.
- [ ] **A3. Riddle `hint_used`** — the riddle engine has hint state but emits no hint event; quiz has no hint surface. Image-riddles already emit `image_riddle_hint_shown` — the riddle-mcq module is the hole.
- [ ] **A4. Inert image-riddle actions** — `UNSUPPORTED_ACTION_IDS` (`report`, `fullscreen`, `reset-timer`, `pause-timer`, `resume-timer` in `features/image-riddles/lib/game.ts`) render no handler, so those preset events never fire. Either build the handlers or prune the presets; today the plan overstates coverage.
- [ ] **A5. `content_viewed` / `search_performed`** — subject/chapter views exist only as opaque `page_viewed` paths; no dimension events, so content performance (views per published item, dead content) isn't computable (plan docs §5.2).
- [ ] **A6. Client error + API-failure tracking** — `app/error.tsx` and global boundaries have no reporting hook; no `window.onerror` / `unhandledrejection` capture; `api-client.ts` failures/retries are invisible. Zero frontend crash telemetry today (plan docs §6.2). Suggest `client_error` (message + digest + path) and `api_failed` (endpoint + status) events, rate-limited.
- [ ] **A7. Guest→registered conversion anchor** — `user_registered` is recorded server-side without the device's `guestId`, and signup can't emit a client event pre-redirect — so the visitor→register→first-quiz funnel (and guest conversion rate, plan docs §7) has no join key. Options: client-side `signup_completed` event (guestId attaches automatically), or pass guestId into the register flow.
- [ ] **A8. Minor env dimensions** — no UTM/campaign params (referrerDomain only), no screen-size or theme usage (plan docs §6.2). Cheap to add to the envelope if segmentation is wanted.
- [ ] **A9. Favorites unwired** — `RIDDLE_FAVORITES` storage key defined but no favorite events/feature (plan docs §5.2); only worth doing if favorites ship as a feature.

### B — Aggregation / dashboard gaps

- [ ] **B1. Funnel + conversion views** — endpoints + UI for visit→register→first-quiz→return; blocked on A7 for the guest→user join (P2 carry-over).
- [ ] **B2. Content drill-downs** — per-subject/chapter/question accuracy and hardest/easiest questions: data already lands (`questionId`, `subject`, `chapter` in properties), needs dashboard queries + a UI home (P2 carry-over).
- [ ] **B3. Per-joke leaderboard** — `joke_voted` stores `jokeId` but the Jokes tab aggregates only global like/dislike totals; a top-jokes table (and joke-level like ratio) is query-only.
- [ ] **B4. Events browser filters** — `GET /admin/analytics/events` supports eventName/module only; no date range, no userId/guestId/sessionId filter. Tracing one user's journey (support/debug use case) is currently impossible; add `from/to` + `actor` params and wire them into EventsBrowser.
- [ ] **B5. Security events surfaced nowhere** — `login_failed` / `login_locked` are recorded but the Users tab charts only signups/logins; a failed-logins/lockouts panel would close the loop on the brute-force data already collected.
- [ ] **B6. Retention depth** — cohorts are weekly first-seen only; no D1/D7/D30 numbers and no segments (country, acquisition source). Fine for now; revisit once traffic justifies it (plan docs §7).
- [ ] **B7. Backend ops metrics** (plan docs §6.1) — endpoint latency percentiles, error rates by route, cache hit rate, throttler rejections: none exist (Winston logs them only as text). A small `GET /admin/analytics/ops` or a dashboard panel would cover it; larger scope than the rest of section B.

### C — Infrastructure / hygiene

- [ ] **C1. Data-retention purge job** — retention is indefinite; plan docs §9 suggests ~13 months raw events (aggregates forever). The entity comment already calls raw rows "the retention-capped tier" but nothing enforces it. **Needs owner decision** (also a GDPR data-minimization point now that geo fields exist).
- [ ] **C2. Zero test coverage on the module** — no spec touches ingest validation/sanitization, enrichment, dashboard SQL, or cohorts. Ingest+sanitization are unit-testable as-is; the SQL parts need the DB harness already flagged in §4 P2.
- [ ] **C3. Dashboard cache invalidation** — 60s TTL only; acceptable today, but worth noting before building anything real-time on top.

### D — Docs

- [ ] **D1. `docs/analytics/analytics-data-collection.md` stale sections** — §1 summary table (guest endpoint "broken", image-riddle/joke events "never emitted/idle" — all fixed), §2.1/§3 (demographics columns/removed feature 2026-08-30; `DropDemographicsColumns` migration `1788400000000`), §7 (demographic popup funnel), §11 (admin overview "demographics funnel" bullet). §11 status list is accurate; sections 1–7 predate it. Refresh when this feature is picked up.

### Suggested pickup order (when the owner gives the go-ahead)

1. **A1 + A6** (abandonment + client errors) — highest analytical value per line of code; both client-only.
2. **B4** (events browser date/actor filters) — unblocks debugging and support.
3. **A7 + B1** (conversion anchor → funnel views) — the main business question the data can't answer today.
4. **B2 + B3** (content drill-downs, joke leaderboard) — query-only wins over already-collected data.
5. **C1 + C2** (purge decision, tests) — hygiene before traffic grows.
6. Remainder (A2–A5, A8–A9, B5–B7) as needed.

## 5. Cross-feature touchpoints

- **Features 02–05** — instrumentation sources: quiz 6 events, riddle 5, image-riddles shim (supported actions only — A4), jokes page `joke_viewed`/`joke_shared` + server `joke_voted`.
- **Achievements (06)** — `achievement_unlocked` from the quiz engine; image-riddles/jokes achievements don't exist yet (owner decision logged in BACKLOG.md).
- **Comments (07)** — server-side `comment_posted` event; `commentsTotal` KPI on the dashboard.
- **Admin Dashboard (12)** — AnalyticsSection is a dashboard section; all `/admin/analytics/*` endpoints are admin-only.
- **Guest Users (01)** — `session_completed` events drive guest `quizAttempts`/`totalScore` counter upserts; ingest resolves userId vs guestId via the optional JWT guard.
- **Newsletter (14)** — server-side `newsletter_subscribed`/`newsletter_unsubscribed`; `newsletterSubscribers`/`newsletterNew` KPIs.
- **Site settings (11)** — server-side `settings_updated` audit event.
- **Auth (01)** — `user_registered`/`user_login`/`login_failed`/`login_locked`/`password_reset_*` server events; `users.updateLastActive` wired to login.
