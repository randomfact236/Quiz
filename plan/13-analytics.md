# Feature 13 — Analytics (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.

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
| `lib/error-tracking.ts`                     | Global `error`/`unhandledrejection` capture → `client_error`; `onApiFailure` subscription → `api_failed`; per-session cap (20) + message dedup; analytics endpoints excluded so a failing flush can't feed itself                                                                                                                                                                                             |
| `lib/api-client.ts`                         | Exposes `onApiFailure(listener)` — fired with endpoint+status on every failed request (incl. network/timeout), before the ApiError rethrow                                                                                                                                                                                                                                                                    |
| `components/AnalyticsProvider.tsx`          | Mounted in `app/providers.tsx`: init + `page_viewed` on route change + `web_vitals` (CLS ×1000 integer scale) + `initErrorTracking()`                                                                                                                                                                                                                                                                         |
| `app/admin/components/AnalyticsSection.tsx` | Tabbed dark dashboard: Overview / Users / Audience & Geo / Journey / Retention / Quiz MCQ / Riddle MCQ / Image Riddles / Dad Jokes / Raw Events (Overview is the default landing tab); range selector 24h/7d/30d/90d; per-tab CSV export (client-side); `?section=analytics&tab=` deep links; module tabs include a "Sessions abandoned" funnel row                                                           |
| `app/admin/components/analytics/`           | Tab implementations (`tabs.tsx`), `primitives.tsx` (stat cards, CSS bars), `types.ts`, `csv.ts`                                                                                                                                                                                                                                                                                                               |
| `app/admin/components/EventsBrowser.tsx`    | Raw events tab (dark, visual): color-coded event badges per family (completed=green, abandoned/errors=red, answers=violet, jokes=lime…), property **detail chips** replacing raw JSON (✓ correct / ✗ wrong highlighted), eventName free-text + datalist, module, date-range and actor filters; actor cells open the per-visitor journey timeline with the same chip rendering; paginated                      |
| Instrumentation                             | quiz engine (`useQuizMcq.ts`): 7 events (incl. `session_abandoned`); riddle engine (`useRiddlePlay.ts`): 8 events (incl. abandonment, `session_extended`, `hint_used` — RiddleCard's hint button now reports up via `onHintShown`); register page: `signup_completed`; image-riddles `lib/analytics.ts` shim forwards supported preset actions as `image_riddle_*`; jokes page: `joke_viewed` / `joke_shared` |
| Docs                                        | `docs/analytics/analytics-data-collection.md` (collection plan + ledger; §11 carries the implementation status — some earlier sections predate the demographics removal, see §4b D1)                                                                                                                                                                                                                          |

**Verified event inventory.** Client:
`page_viewed`, `web_vitals`, `session_started/resumed/completed/abandoned`,
`session_extended` (riddle), `question_answered`, `question_skipped`, `hint_used` (riddle),
`achievement_unlocked` (quiz only), `signup_completed`, `client_error`, `api_failed`,
`image_riddle_*` (supported actions), `joke_viewed`, `joke_shared`. Server:
`user_registered`, `user_login`, `login_failed`, `login_locked`,
`password_reset_requested`, `password_reset_completed`, `joke_voted`, `comment_posted`,
`newsletter_subscribed`, `newsletter_unsubscribed`, `settings_updated`.

## 2. Endpoint map

| Method & Path                                                           | Auth                  | Notes                                                                                                                                           |
| ----------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| POST `/analytics/events`                                                | public (optional JWT) | batch ≤50; invalid/oversized events rejected per-item with counts; throttled 30/min; geo/device/referrer enriched server-side                   |
| GET `/analytics/summary`                                                | public                | `{ totalSessionsCompleted, sessionsCompletedByModule, activeQuizzers30d }`, 5-min cache; consumed by homepage StatsSection                      |
| GET `/admin/analytics/overview`                                         | Jwt + admin           | lifetime overview, 60s cache                                                                                                                    |
| GET `/admin/analytics/dashboard?days`                                   | Jwt + admin           | full tabbed-dashboard payload for the range (1–365 clamp), 60s cache per range                                                                  |
| GET `/admin/analytics/retention?weeks`                                  | Jwt + admin           | weekly first-seen cohorts (2–12 weeks clamp)                                                                                                    |
| GET `/admin/analytics/events?eventName&module&from&to&actor&page&limit` | Jwt + admin           | paginated raw event list; `from`/`to` ISO timestamps (date-only `to` = end of that day), `actor` matches userId **or** guestId **or** sessionId |

## 3. Current status

**Working end-to-end:** client batching → enriched public ingest → jsonb event table → cached
tabbed admin dashboard (9 tabs, ranges, CSV export, deep links) + retention cohorts + raw event
browser. Identity resolution: JWT user → userId, else client guestId. Ingest is fail-safe by
design (never throws into gameplay). Guest counters increment on `session_completed`.

**Known limits:** geo is null for local/private IPs (populates with real traffic). Dashboard
cache is per-range, 60s TTL. In-app SPA exits emit abandonment via hook cleanup; a hard tab
kill without pagehide is only visible later as started-but-never-completed.

## 4. Task breakdown

### P0 — critical / broken

- None. The pipeline works and is fail-safe; nothing user-facing depends on it.

### P1 — major gaps

- [x] **Existing work committed and shipped**
- [x] **`GET /analytics/summary` consumed on the homepage**
- [x] **Raw-events browser UI**
- [x] **Tabbed dashboard + geo/device capture**

### P2 — integration / quality

- [ ] Funnel views — **deferred**: aggregation endpoints + UI need live-DB verification; data collection is in place, so this is additive when picked up (see §4b A7 for the identity-link prerequisite).
- [ ] Accuracy join to content — **deferred**; `question_answered` carries `questionId`/`subject`/`chapter`, so the drill-down is query-only once picked up (see §4b A9).
- [ ] Retention tests — **deferred with rationale**: cohort logic is raw SQL; fixture tests would only mock the query away. Needs a DB-backed harness (e.g. testcontainers) — folded into §4b C2.
- [x] **Privacy review**

### P3 — polish / tech debt

- [x] **CSV export of dashboard tabs**
- [x] **`sendBeacon` on unload**
- [x] **Module labels consolidated**

---

## 4b. Gap analysis

Full audit of the shipped system against `docs/analytics/analytics-data-collection.md`.
Nothing here is broken; each item is a capability the collection plan promised or that the
dashboard implies. **A = data collection, B = aggregation/BI, C = infrastructure, D = docs.**

### A — Data collection (events the plan names but the code never emits)

- [x] **A1. `session_abandoned`**
- [x] **A2. `session_extended`**
- [x] **A3. Riddle `hint_used`**
- [x] **A4. Inert image-riddle actions**
- [x] **A5. `content_viewed` / `search_performed`** — DONE 2026-09-22: hub surfaces emit
      `content_viewed` (`{contentType, slug}`: quiz subject view, riddle category, image-riddle
      category, joke category) and `search_performed` (`{query}` on settled searches — dad-jokes
      server search + image-riddles client-side search). Content performance is computable.
- [x] **A6. Client error + API-failure tracking**
- [x] **A7. Guest→registered conversion anchor** — DONE 2026-09-22. Register page emits
      `signup_completed` with the device guestId; the Google-only path (server redirect, never
      touches the register page) is closed by returning `isNewUser` from `googleLogin` through
      the one-time-code exchange, with the client emitting `signup_completed` (method `google`)
      BEFORE `mergeGuestIntoAccount()` rotates the guest id — same join key as pre-signup events.
- [ ] **A8. Minor env dimensions** — no UTM/campaign params (referrerDomain only), no screen-size or theme usage (plan docs §6.2). Cheap to add to the envelope if segmentation is wanted.
- [ ] **A9. Favorites unwired** — `RIDDLE_FAVORITES` storage key defined but no favorite events/feature (plan docs §5.2); only worth doing if favorites ship as a feature.
- [x] **A10. Resume-prompt decisions untracked** — DONE 2026-09-22: `resume_prompt_shown`
      (quiz: `useQuizMcq` effect with per-mount ref guard; riddle: fetch-effect in
      `useRiddlePlay`) and `resume_declined` (quiz `handleStartFresh`; riddle play page's
      Start-New handler). Accept-path stays `session_resumed`.

### B — Aggregation / dashboard gaps

- [x] **B1. Funnel + conversion views**
- [x] **B2. Content drill-downs**
- [x] **B3. Per-joke leaderboard**
- [x] **B4. Events browser filters**
- [x] **B5. Security events surfaced**
- [x] **B8. Per-feature click breakdowns**
- [x] **B9. Dedicated Click Analysis tab**
- [ ] **B6. Retention depth** — cohorts are weekly first-seen only; no D1/D7/D30 numbers and no segments (country, acquisition source). Fine for now; revisit once traffic justifies it (plan docs §7).
- [ ] **B7. Backend ops metrics** (plan docs §6.1) — endpoint latency percentiles, error rates by route, cache hit rate, throttler rejections: none exist (Winston logs them only as text). A small `GET /admin/analytics/ops` or a dashboard panel would cover it; larger scope than the rest of section B.

### C — Infrastructure / hygiene

- [x] **C1. Data-retention purge job** — DONE 2026-09-22 (owner go via "implement group 1"):
      `analytics-retention.service.ts` runs in-process (boot+45s, then every 24h), deletes raw
      rows older than `ANALYTICS_RETENTION_MONTHS` (default 13, plan §9) in
      `ANALYTICS_RETENTION_BATCH`-sized (5000) `DELETE … RETURNING` batches, invalidates
      `analytics:*` caches when rows were removed, never throws. 6 unit tests.
- [x] **C2. Zero test coverage on the module** — PARTIAL 2026-09-22: ingest idempotency
      suite (TASK-02, 8 tests) + retention-purge suite (6 tests) cover the unit-testable
      surface; dashboard SQL/cohorts still need the DB-backed harness (testcontainers) —
      deferred with rationale in §4 P2.
- [x] **C3. Dashboard cache invalidation** — reviewed 2026-09-22: 60s TTL is fine for
      admin dashboards (public summary runs 300s); `resetAllAnalytics()` invalidates
      `analytics:*`; the retention purge also invalidates after mass deletes. Documented —
      nothing real-time will be built on top without revisiting.
- [ ] **C4. Ingest retry can double-count events** — the client `flush()` re-queues the whole batch when the POST fails; if the server actually persisted the batch but the response was lost (client 15s timeout, network blip), the retry writes the rows again. Rare and bounded, but there is no client event UUID / server dedup. A per-event `eventId` (client UUID) with a unique index would close it; only worth it if exact counts start to matter.

### D — Docs

- [x] **D1. `docs/analytics/analytics-data-collection.md` stale sections** — refreshed
      2026-09-22: §1 summary table reflects reality (guest counters, GA4 behind consent, demo
      removal), §2.1/§2.3/§3 marked with the 2026-08-30 demographics removal, §7 popup line
      struck, §11 ledger extended with the A5/A7/A10/C1 additions.

### Suggested pickup order (when the owner gives the go-ahead)

1. **C1 + C2** (purge decision, tests) — hygiene before traffic grows; needs owner input on C1.
2. Remainder (A4–A5, A7 remainder, A8–A10, B6–B7, C3–C4, D1) as needed.

## 5. Cross-feature touchpoints

- **Features 02–05** — instrumentation sources: quiz 7 events (incl. abandonment), riddle 8 (incl. abandonment/extend/hint), image-riddles shim (supported actions only — A4), jokes page `joke_viewed`/`joke_shared` + server `joke_voted`.
- **Achievements (06)** — `achievement_unlocked` from the quiz engine; image-riddles/jokes achievements don't exist yet (owner decision — future-features §2).
- **Comments (07)** — server-side `comment_posted` event; `commentsTotal` KPI on the dashboard.
- **Admin Dashboard (12)** — AnalyticsSection is a dashboard section; all `/admin/analytics/*` endpoints are admin-only.
- **Guest Users (01)** — `session_completed` events drive guest `quizAttempts`/`totalScore` counter upserts; ingest resolves userId vs guestId via the optional JWT guard.
- **Newsletter (14)** — server-side `newsletter_subscribed`/`newsletter_unsubscribed`; `newsletterSubscribers`/`newsletterNew` KPIs.
- **Site settings (11)** — server-side `settings_updated` audit event.
- **Auth (01)** — `user_registered`/`user_login`/`login_failed`/`login_locked`/`password_reset_*` server events; `users.updateLastActive` wired to login.

## 8. Analytics-driven homepage ordering

- New public cached endpoint `GET /quiz-mcq/subject-clicks` exposes per-subject
  `session_started` counts (analytics_events) so the homepage Quiz Topics section can auto-order
  worlds and cards by clicks — highest first (owner request). Analytics now directly drive UI
  ordering, closing the loop between collection (§1) and presentation.

## 9. Design provenance

The tabbed dashboard was built natively (2026-09-04). The ecommerce repo's `admin/analytics/page.tsx`
was used as a _style_ reference only (dark full-dashboard, KPI cards, sticky tab strip, range
selector, export menu); its revenue/affiliate tabs do not apply here. (Folded from the retired
root `BACKLOG.md`, 2026-09-16.)
