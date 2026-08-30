# Feature 12 — Analytics (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> This is the same convention used in `plan/quiz-mcq-analysis-plan.md` and `plan/riddle-mcq-analysis-plan.md`.
>
> Verified against the live codebase: 2026-08-30. **No archived ledger doc existed for this feature** —
> built from current code plus `docs/analytics/analytics-data-collection.md`.
> **Owner status: feature build-out is PAUSED (decision 2026-08-30).** The system below exists and works;
> tasks in §4 record the roadmap for when the pause ends — do not start them without the owner's go-ahead.

---

## 1. File inventory

Backend (`apps/backend/src/analytics/`) — **entire module is uncommitted (untracked)**:

| File                                                        | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                   | Size (verified) |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `analytics.controller.ts`                                   | `POST /analytics/events` (public via OptionalJwtAuthGuard, throttled 30/min) + `GET /analytics/summary` (public, cached)                                                                                                                                                                                                                                                                                                  | 44 lines        |
| `admin-analytics.controller.ts`                             | `GET /admin/analytics/overview`, `/retention?weeks`, `/events` (Jwt + AdminGuard)                                                                                                                                                                                                                                                                                                                                         | —               |
| `analytics.service.ts`                                      | Batch ingest with per-event validation/sanitization (strips free-text keys, 8KB properties cap, invalid names rejected per-batch — ingest never breaks gameplay); server-side guest counter wiring on `session_completed`; cached admin aggregations (DAU/WAU/MAU, per-module completions, question accuracy, 30-day daily series, top events/pages, joke votes); weekly retention cohorts (SQL window over week buckets) | 391 lines       |
| `entities/analytics-event.entity.ts`                        | `analytics_events`: camelCase columns (eventName, module, userId, guestId, sessionId, page, properties jsonb, clientTs, serverTs), indexes for the dashboard group-bys                                                                                                                                                                                                                                                    | 47 lines        |
| `dto/analytics.dto.ts`                                      | Envelope DTO; eventName convention `<object>_<action>` lowercase snake                                                                                                                                                                                                                                                                                                                                                    | 119 lines       |
| `../migrations/1788300000000-CreateAnalyticsEventsTable.ts` | Table + indexes (uncommitted)                                                                                                                                                                                                                                                                                                                                                                                             | —               |
| `auth/optional-jwt-auth.guard.ts`                           | Resolves a real userId for logged-in senders, anonymous otherwise                                                                                                                                                                                                                                                                                                                                                         | —               |

Frontend (`apps/frontend/src/`) — **client + provider uncommitted**:

| File                                        | Purpose                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/analytics.ts`                          | `track()`: in-memory queue, batched flush every 10s or at 20 queued events, failed batches re-queued (bounded) for retry; common envelope (eventName, module, guestId, sessionId, page, properties, clientTs)                                                                                                                                                |
| `components/AnalyticsProvider.tsx`          | Mounted in `app/providers.tsx`: flush listeners + `page_viewed` on route change + `web_vitals` via `useReportWebVitals`                                                                                                                                                                                                                                      |
| `app/admin/components/AnalyticsSection.tsx` | Admin dashboard section: overview stat cards, 30-day event bars, completions/accuracy by module, top events/pages, joke votes, retention cohort table (hand-rolled CSS bars, no chart dep)                                                                                                                                                                   |
| Instrumentation (all uncommitted)           | quiz-mcq engine: 6 events (session_started/resumed, question_answered/skipped, session_completed, achievement_unlocked); riddle engine: 5 events; image-riddles: `lib/analytics.ts` shim forwards preset action events (`answer_submitted`, `hint_revealed`, `riddle_skipped`, `answer_revealed`, `share_opened`, …); backend dad-jokes records `joke_voted` |
| Docs                                        | `docs/analytics/analytics-data-collection.md` (plan + ledger; demographics funnel removed 2026-08-30)                                                                                                                                                                                                                                                        |

## 2. Endpoint map (verified against controllers 2026-08-30)

| Method & Path                                             | Auth                  | Notes                                                                                   |
| --------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| POST `/analytics/events`                                  | public (optional JWT) | batch array; invalid/oversized events rejected per-item with counts; throttled 30/min   |
| GET `/analytics/summary`                                  | public                | `{ totalSessionsCompleted, sessionsCompletedByModule, activeQuizzers30d }`, 5-min cache |
| GET `/admin/analytics/overview`                           | Jwt + admin           | full admin overview, 60s cache                                                          |
| GET `/admin/analytics/retention?weeks`                    | Jwt + admin           | weekly cohorts (2–12 weeks clamp)                                                       |
| GET `/admin/analytics/events?eventName&module&page&limit` | Jwt + admin           | paginated raw event list                                                                |

## 3. Current status (verified)

**Working (in the working tree):** end-to-end pipeline — client batching → public ingest → jsonb event table → cached admin dashboard → retention cohorts. Identity resolution is graceful (JWT user → userId, else client guestId). Ingest is fail-safe by design (never throws into gameplay). Demographics coverage (previously part of the overview) was removed with the demographics feature on 2026-08-30.

**Gaps:** the **entire feature is uncommitted** — backend module, migration, client, provider, dashboard section, and all feature instrumentation exist only in the working tree. `page_viewed` and `web_vitals` are the only events a committed build would emit. `GET /analytics/summary` has **no frontend consumer** (intended for the public homepage stats). `GET /admin/analytics/events` has **no UI** (the dashboard renders only overview + retention).

## 4. Task breakdown

### P0 — critical / broken

- None. The pipeline works and is fail-safe; nothing user-facing depends on it.

### P1 — major gaps (when the pause ends)

- [ ] **Commit and ship the existing work** (backend module + migration, client/provider, admin section, and the per-feature instrumentation already written in features 02–05) — until then the dashboard shows only client-emitted `page_viewed`/`web_vitals`.
- [ ] Consume `GET /analytics/summary` on the public homepage ("X sessions completed") — the endpoint exists and is public.
- [ ] Raw-events browser UI over `GET /admin/analytics/events` (filter by eventName/module, paginated table) for debugging content/accuracy questions.

### P2 — integration / quality

- [ ] Funnel views: session_started → question_answered → session_completed per module (data is already collected; needs aggregation + UI).
- [ ] Accuracy join to content: `question_answered` properties carry per-question outcomes — surface per-question/per-chapter accuracy in the content admin sections.
- [ ] Retention tests: the cohort SQL is the most complex query in the codebase — add fixture-based tests before extending.
- [ ] Privacy review: confirm no IP/UA persistence, document the retention window for `analytics_events` (purge job or document indefinite).

### P3 — polish / tech debt

- [ ] CSV export of overview/cohorts for stakeholders.
- [ ] Consider `sendBeacon` on page unload to reduce tail-loss of the last batch.
- [ ] Module labels (`MODULE_LABELS` in AnalyticsSection) and the `AnalyticsModuleName` union drift-prone — derive one from the other.

## 5. Cross-feature touchpoints

- **Features 02–05** — instrumentation sources (quiz 6 events, riddle 5, image-riddles presets, joke_voted); all uncommitted.
- **Achievements (06)** — `achievement_unlocked` events from the quiz engine (uncommitted).
- **Admin Dashboard (11)** — AnalyticsSection is a dashboard section; the events endpoint is admin-only.
- **Guest Users (01)** — `session_completed` events drive guest `quizAttempts`/`totalScore` counter upserts; ingest resolves userId vs guestId via the optional JWT guard.
