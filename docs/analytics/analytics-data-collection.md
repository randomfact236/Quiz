# Analytics Data Collection Plan

> Inventory of everything this site CAN collect for analytics, mapped to where the
> data currently lives (or should live). Based on full codebase audit (frontend:
> Next.js `apps/frontend`, backend: NestJS `apps/backend`).
>
> **⚠️ Staleness note (2026-09-05):** §11 is the accurate implementation ledger. Sections
> 1–7 partly predate it: the demographics feature was removed 2026-08-30 (§2.1
> country/sex/ageGroup columns and §3 no longer exist — migration `1788400000000`),
> and §1's "broken endpoint / never-emitted events / idle votes" rows are all fixed.
> Current gaps are tracked in `plan/13-analytics.md` §4b.
>
> **Refresh (2026-09-22, plan/13 D1):** sections 1–7 above are now marked where they were
> stale. §11 carries the 2026-09-22 additions (A5/A7/A10 events, C1 retention purge).

---

## 1. Current State Summary

| Area                                             | Status                                                    |
| ------------------------------------------------ | --------------------------------------------------------- |
| User accounts (`users` table)                    | ✅ Persisted server-side                                  |
| Guest users (`guest_users` table)                | ✅ Wired — counters upsert on `session_completed` (§11)   |
| Demographics (country / sex / ageGroup)          | ❌ Feature removed 2026-08-30; country now from geo-lite  |
| Quiz/riddle sessions & answers                   | ⚠️ localStorage for resume + `analytics_events` for facts |
| Backend stats services                           | ✅ analytics_events pipeline + cached dashboard           |
| Image-riddle action events                       | ✅ `image_riddle_*` shim forwards supported actions       |
| Joke votes (like/dislike columns)                | ✅ Server `joke_voted` + device-local dedupe              |
| HTTP access logs (Winston + LoggingInterceptor)  | ✅ requestId, method, url, statusCode, durationMs         |
| Third-party analytics SDK (GA4, Plausible, etc.) | ✅ GA4 (G-D4VPRXEYCX) behind the cookie-consent gate      |

---

## 2. User & Identity Data

### 2.1 Registered Users (`users` entity)

Already persisted — available for analytics directly:

| Field                            | Type                | Analytical use                                            |
| -------------------------------- | ------------------- | --------------------------------------------------------- |
| `id`                             | uuid                | Join key for all user events                              |
| `email`                          | string              | Funnel/contact analysis (PII — handle per GDPR)           |
| `name`                           | string              | Display only                                              |
| `role`                           | `'user' \| 'admin'` | Segment real users vs staff (exclude admins from metrics) |
| `googleId`                       | string nullable     | Auth-method segmentation                                  |
| ~~`country`, `sex`, `ageGroup`~~ | removed 2026-08-30  | Demo columns dropped; geo comes from server geo-lite      |
| `lastActive`                     | Date nullable       | DAU/WAU/MAU, churn detection                              |
| `createdAt`                      | Date                | Registration cohorting, growth curves                     |

### 2.2 Derived Auth Events (need event tracking)

- `user_registered` (method: `email` \| `google`)
- `user_login` / `login_failed` (brute-force service already sees failures)
- `password_reset_requested` / `completed`
- `session_refreshed`
- **Signup conversion funnel:** visit → register → first quiz → Nth quiz → retention D1/D7/D30

### 2.3 Guest Users (`guest_users` entity)

Wired: `guestId` (localStorage `aiquiz:guest-id`), `quizAttempts`, `totalScore`,
`lastActive` (upserted from `session_completed` events). The demo columns
(`country`/`sex`/`ageGroup`) were removed with the demographics feature.
Analytics value: guest→registered conversion rate (A7 anchor), guest engagement depth.

---

## 3. Demographics Data

> **Removed 2026-08-30.** The `DemographicsPopup` and the user/guest demo columns
> (`country`/`sex`/`ageGroup`) were dropped (migration `1788400000000`). Country-level
> geo now comes from server-side geo-lite enrichment on ingest (§1), which needs no
> user input and never stores raw IPs.

---

## 4. Gameplay & Engagement Data (highest value — currently NOT persisted)

All of these exist today only in browser localStorage and are lost on device change:

### 4.1 Session-level events

Source types: `QuizSession` (quiz-mcq), `RiddleSession` (riddle-mcq).

| Event               | Properties to collect                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session_started`   | session id, module (`quiz-mcq`/`riddle-mcq`/`joke-quiz`/`image-riddles`), mode (`normal`/`timer_challenge`/`practice_challenge`/`timer`/`practice`), subject, chapter/category, difficulty level, question count |
| `session_completed` | score, maxScore, % grade (A+/A/B/C/D/F), timeTaken (s), correct/wrong/skipped counts, completedAt                                                                                                                |
| `session_abandoned` | questions answered before exit, time elapsed, last question index                                                                                                                                                |
| `session_resumed`   | resume lag (savedAt → resumedAt), progress at save                                                                                                                                                               |
| `session_extended`  | ExtendSessionModal usage (which mode, how often)                                                                                                                                                                 |

### 4.2 Question-level events

| Event                  | Properties                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `question_answered`    | questionId, subject, chapter, level, selected option, correctness, time-on-question, answer changes count |
| `question_skipped`     | manual skip vs timeout (manuallySkipped[] exists in resume state)                                         |
| `hint_used`            | riddle hint field exists; hintsUsed counter exists in RiddleSession                                       |
| `answer_revealed`      | image-riddle revealAnswer action                                                                          |
| `open_ended_submitted` | extreme-level riddles text answer match                                                                   |

### 4.3 Aggregates computable from the above

- Accuracy per subject / chapter / difficulty level
- Average completion time per quiz size; fastest-solved questions
- Drop-off points (which question index users quit at)
- Hardest/easiest questions (wrong-answer rate per questionId)
- Day streaks (`bestStreak` computed client-side today), weekly active quizzers
- Practice vs challenge mode preference split

### 4.4 Achievements (`lib/achievements.ts`)

10 defined achievements with unlock timestamps in localStorage — sync unlocks as events:
`first-steps`, `quiz-enthusiast`, `quiz-master`, `perfect-score`, `speed-demon`,
`chapter-champion`, `subject-explorer`, `streak-master`, `persistence`,
`accuracy-expert`.
Metrics: unlock rate per achievement, time-to-unlock, achievement-driven retention.
(Note: `streak-master` condition not yet implemented; riddle achievements key unused.)

---

## 5. Content Engagement Data

### 5.1 Content inventory (dimensions for all analytics)

| Module        | Hierarchy                                                   | Levels                                |
| ------------- | ----------------------------------------------------------- | ------------------------------------- |
| Quiz MCQ      | Subject → Chapter → Question                                | easy…extreme                          |
| Riddle MCQ    | Category → Subject → Riddle                                 | easy…extreme (extreme = open-ended)   |
| Image Riddles | Category → ImageRiddle                                      | easy…expert (+ per-item timerSeconds) |
| Dad Jokes     | Classic jokes (categories) + Quiz: Subject → Chapter → Joke | easy…extreme                          |

Content status workflow: `draft / published / trash`.

### 5.2 Content events to collect

- `content_viewed` — page/card views per module, subject page views
- `search_performed` — admin/content search terms, filters applied (subject/chapter/level filter usage)
- `joke_voted` — like/dislike per joke (server-emitted from `dad-jokes.service.voteForJoke`; frontend keeps `aiquiz:voted-jokes` locally for dedupe)
- `image_riddle_action` — event names already declared in `actionOptions`: `answer_submitted`, `hint_revealed`, `riddle_skipped`, `answer_revealed`, `timer_reset/paused/resumed`, `fullscreen_toggled`, `share_opened`, `issue_reported`
- `favorites` — `RIDDLE_FAVORITES` storage key defined but unwired
- Content performance: views-per-published-item, dead content (0 views), most popular subjects/categories/difficulties

### 5.3 Public stats shown on home page (`StatsSection`)

Whatever is displayed publicly (totals per module) should be sourced from the same
counters used by analytics so numbers stay consistent.

---

## 6. Technical / Performance Data

Already partially captured by Winston `LoggingInterceptor` (requestId, method, url,
statusCode, durationMs). Extend with:

### 6.1 Backend

- Endpoint latency percentiles (p50/p95/p99) per route
- Error rates by route/status code (4xx vs 5xx)
- DB query slow-log, cache hit rate (CacheService)
- Throttler hits (rate-limit rejections per endpoint)
- Brute-force lockout events

### 6.2 Frontend

- Web Vitals (LCP, CLS, INP, FCP, TTFB) — Next.js has built-in support
- JS error rate (error.tsx boundaries — add reporting hook)
- API failure rate from client (`api-client.ts`), retry counts
- Page/route popularity across: `/`, `/play`, `/quiz-mcq/*`, `/riddle-mcq/*`,
  `/jokes`, `/image-riddles`, `/achievements`, `/about`, `/admin/*`
- Device/browser/OS breakdown, screen size, dark/light theme usage (ThemeContext)
- Referrer / traffic source, UTM params

---

## 7. Conversion & Business Metrics

- Visitor → registration conversion
- Guest → registered conversion
- ~~Demographic popup: shown → filled → skipped rates~~ (popup removed 2026-08-30)
- Return visitor rate (localStorage guest-id persistence)
- Feature adoption: which module do new users try first?
- Retention cohorts (D1/D7/D30) by acquisition month, country, age group
- Admin activity audit (who created/edited/bulk-deleted content — bulk-action service has no audit trail)

---

## 8. Recommended Event Schema (naming convention)

```
<object>_<action>          e.g. session_started, question_answered, joke_voted
```

Common properties on every event:

```jsonc
{
  "eventName": "question_answered",
  "timestamp": "ISO-8601",
  "userId": "uuid | null", // null for guests
  "guestId": "aiquiz:guest-id | null",
  "sessionId": "current quiz session id",
  "module": "quiz-mcq | riddle-mcq | jokes | image-riddles",
  "page": "/quiz-mcq/play",
  "clientTs": "...", // device clock
  "serverTs": "...", // set on ingest
}
```

---

## 9. Privacy & Compliance Considerations

- **PII:** email and name must not go into third-party analytics; use `userId` hash/uuid only
- **Consent:** add a cookie/consent banner before enabling any third-party tracker (GDPR/ePrivacy); demographics are sensitive-adjacent — aggregate only
- **Children:** age buckets include 10–15 → COPPA/GDPR-K caution; avoid behavioral profiling of minors
- **Data minimization:** don't persist open-ended answer text verbatim (users type free text)
- **Retention policy:** define purge windows (e.g., raw events 13 months, aggregates forever)
- Password hashes, tokens (`refreshToken`, reset tokens) must never enter analytics

---

## 10. Suggested Implementation Phases

1. **Phase 1 — Server-side foundation:** `analytics_events` table (or clickhouse/segment),
   emit events from existing backend hooks; fix broken guest-users endpoint; wire
   `quizAttempts`/`totalScore` increments.
2. **Phase 2 — Gameplay persistence:** persist session summaries + per-answer rows
   from localStorage-backed engines on submit/abandon.
3. **Phase 3 — Frontend events:** emit the pre-named image-riddle `analyticsEvent`s,
   joke votes to backend, achievement unlocks, Web Vitals.
4. **Phase 4 — Dashboards:** admin analytics page (reuse existing stats-service +
   CacheService pattern): DAU, accuracy heatmaps, retention cohorts, content leaderboard.
5. **Phase 5 — Optional third-party:** self-hosted Plausible/PostHog or GA4 behind consent banner.

---

## 11. Implementation Status (2026-08-30)

Phases 1–4 are implemented; Phase 5 (third-party) intentionally not started.

**Backend (`apps/backend/src/analytics/`)**

- `analytics_events` wide event table — entity + idempotent migration
  `1788300000000-CreateAnalyticsEventsTable.ts` (indexed on eventName / module /
  userId / guestId / serverTs).
- `POST /analytics/events` — public, throttled (30/min), batch ingest (≤50/batch).
  `OptionalJwtAuthGuard` resolves the Bearer token softly so logged-in users'
  events carry the real `userId` while guests stay anonymous.
- `GET /analytics/summary` — public per-module completion counts (StatsSection source, §5.3).
- Admin (JwtAuthGuard + AdminGuard): `GET /admin/analytics/overview` (DAU/WAU/MAU,
  completions per module, per-module answer accuracy, 30-day daily series, top
  events/pages, joke vote tallies, demographics funnel — 60s cache),
  `GET /admin/analytics/retention` (weekly first-seen cohorts), `GET /admin/analytics/events`
  (raw event browser).
- Server-side hooks (§2.2): `user_registered` / `user_login` / `login_failed` /
  `login_locked` / `password_reset_requested` / `password_reset_completed` from
  `auth.service`; `joke_voted` from `dad-jokes.service.voteForJoke`;
  `users.updateLastActive` finally wired to login.
- Guest counters (§2.3): `session_completed` events with a guestId atomically
  upsert `quizAttempts` / `totalScore` / `lastActive` (`GuestUsersService.recordSessionCompletion`).
- **Broken guest endpoint fixed:** new public `POST /guest-users/demographics` and
  `POST /guest-users/activity` (was admin-only → every guest submission failed).

**Frontend (`apps/frontend`)**

- `lib/analytics.ts` — batched tracker (10s flush / 20-event threshold, bounded
  queue, sendBeacon exit flush) with the §8 common envelope.
- `components/AnalyticsProvider.tsx` (mounted in `app/providers.tsx`) — init,
  `page_viewed` per route, Web Vitals via `useReportWebVitals`.
- Quiz MCQ (`hooks/useQuizMcq.ts`): `session_started` / `session_resumed` /
  `session_completed` (score, grade, counts, timeTaken) + effect-based
  `question_answered` / `question_skipped` (StrictMode-safe) + achievement unlocks (§4.4).
- Riddle MCQ (`hooks/use-riddle-play/useRiddlePlay.ts`): same session lifecycle +
  per-answer/skip events; time-up auto-submit funnels through the same completion path.
- Image riddles: `features/image-riddles/lib/analytics.ts` shim now forwards the
  preset action events (`answer_submitted`, `hint_revealed`, `answer_revealed`,
  `riddle_skipped`, `share_opened`, …) as `image_riddle_*` events.
- Admin dashboard: new "Analytics" section in `app/admin` (`components/AnalyticsSection.tsx`)
  rendering overview stats, 30-day event bars, per-module completions/accuracy,
  top events/pages, and retention cohorts (CSS bars, no chart dep).

**Not yet covered (follow-ups)**

- ~~`session_abandoned` / `session_extended` events~~ — done (engines emit both).
- ~~Riddle `hint_used`~~ — done (`RiddleCard` hint button reports via `onHintShown`).
- ~~Event retention/purge job (plan §9 suggests 13 months raw)~~ — done 2026-09-22 (below).
- Joke-quiz module (surface doesn't exist — plan §4 notes).
- Timer pause/reset/resume + fullscreen + issue-report image-riddle actions
  (`UNSUPPORTED_ACTION_IDS` in `features/image-riddles/lib/game.ts` still inert).
- Consent banner before any third-party SDK (Phase 5) — GA4 now sits behind the
  `CookieConsent` gate (`pigzap-cookie-consent`), so this is satisfied for GA4.

**Added 2026-09-22 (plan/13 §4b gaps A5/A7/A10/C1)**

- `content_viewed` (A5) — dimension events with `{contentType, slug}` from the hub
  surfaces: quiz subject view (`QuizHubView` ChapterSelection), riddle category view
  (`RiddlesHubView`), image-riddle category selection, joke category selection.
  Views-per-published-item and dead content are now computable.
- `search_performed` (A5) — `{query}` on settled searches: dad-jokes server search and
  image-riddles client-side catalog search (both debounce-guarded, repeat-suppressed).
- `resume_prompt_shown` / `resume_declined` (A10) — quiz: `useQuizMcq` effect +
  `handleStartFresh`; riddle: fetch-effect emission in `useRiddlePlay` + the play page's
  Start-New handler. Accept-path remains `session_resumed`, so accept/discard rates are
  computable.
- Guest→registered anchor completed (A7): Google-only registrations used to bypass the
  register page's `signup_completed`. `googleLogin` now returns `isNewUser`, survives the
  one-time-code exchange, and the client emits `signup_completed` (method `google`)
  BEFORE `mergeGuestIntoAccount()` rotates the guest id — the event carries the same
  device guestId as the visitor's pre-signup events.
- Retention purge (C1) — `analytics-retention.service.ts`: in-process job, first pass
  ~45s after boot then every 24h, deletes raw rows older than
  `ANALYTICS_RETENTION_MONTHS` (default 13) in batches of
  `ANALYTICS_RETENTION_BATCH` (default 5000) via `DELETE … RETURNING`, invalidates
  `analytics:*` caches when rows were removed, never throws. Covered by
  `analytics-retention.service.spec.ts` (6 tests).
