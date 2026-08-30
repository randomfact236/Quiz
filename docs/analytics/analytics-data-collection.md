# Analytics Data Collection Plan

> Inventory of everything this site CAN collect for analytics, mapped to where the
> data currently lives (or should live). Based on full codebase audit (frontend:
> Next.js `apps/frontend`, backend: NestJS `apps/backend`).

---

## 1. Current State Summary

| Area                                             | Status                                                    |
| ------------------------------------------------ | --------------------------------------------------------- |
| User accounts (`users` table)                    | ✅ Persisted server-side                                  |
| Guest users (`guest_users` table)                | ⚠️ Exists but endpoint broken; counters never incremented |
| Demographics (country / sex / ageGroup)          | ✅ Collected via popup                                    |
| Quiz/riddle sessions & answers                   | ❌ localStorage only (`aiquiz:*` keys)                    |
| Backend stats services                           | ⚠️ Content counts only — zero user-behavior analytics     |
| Image-riddle action events                       | ❌ `analyticsEvent` fields defined, never emitted         |
| Joke votes (like/dislike columns)                | ❌ Columns idle; votes device-local only                  |
| HTTP access logs (Winston + LoggingInterceptor)  | ✅ requestId, method, url, statusCode, durationMs         |
| Third-party analytics SDK (GA4, Plausible, etc.) | ❌ None                                                   |

---

## 2. User & Identity Data

### 2.1 Registered Users (`users` entity)

Already persisted — available for analytics directly:

| Field                        | Type                | Analytical use                                            |
| ---------------------------- | ------------------- | --------------------------------------------------------- |
| `id`                         | uuid                | Join key for all user events                              |
| `email`                      | string              | Funnel/contact analysis (PII — handle per GDPR)           |
| `name`                       | string              | Display only                                              |
| `role`                       | `'user' \| 'admin'` | Segment real users vs staff (exclude admins from metrics) |
| `googleId`                   | string nullable     | Auth-method segmentation                                  |
| `country`, `sex`, `ageGroup` | demographics        | Geo/demo segmentation                                     |
| `lastActive`                 | Date nullable       | DAU/WAU/MAU, churn detection                              |
| `createdAt`                  | Date                | Registration cohorting, growth curves                     |

### 2.2 Derived Auth Events (need event tracking)

- `user_registered` (method: `email` \| `google`)
- `user_login` / `login_failed` (brute-force service already sees failures)
- `password_reset_requested` / `completed`
- `session_refreshed`
- **Signup conversion funnel:** visit → register → first quiz → Nth quiz → retention D1/D7/D30

### 2.3 Guest Users (`guest_users` entity)

Fields available but currently unwired: `guestId` (localStorage `aiquiz:guest-id`),
`country`, `sex`, `ageGroup`, `quizAttempts`, `totalScore`, `lastActive`.
Analytics value: guest→registered conversion rate, guest engagement depth,
guest demographics coverage.

---

## 3. Demographics Data

Collected once via `DemographicsPopup` (skippable):

- **Country** (~195-country dropdown + "Other") → geo distribution maps
- **Sex** (`male` \| `female`) → demographic split
- **Age group** buckets: `10-15, 15-20, 20-25, 25-30, 30-35, 35-40, 40-45, 45-50, 50+`

Analytics uses: content difficulty tuning per age group, market segmentation,
popup skip rate itself is a metric worth tracking.

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
- `joke_voted` — like/dislike per joke (backend `likes`/`dislikes` columns exist but idle; frontend keeps `aiquiz:voted-jokes` locally)
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
- Demographic popup: shown → filled → skipped rates
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

- `session_abandoned` / `session_extended` events (no abandon handler exists in the
  engines yet; ExtendSessionModal exists on riddles only).
- Riddle `hint_used` events and joke-quiz module (surface doesn't exist — plan §4 notes).
- Timer pause/reset/resume + fullscreen + issue-report image-riddle actions
  (`UNSUPPORTED_ACTION_IDS` in `features/image-riddles/lib/game.ts` still inert).
- Event retention/purge job (plan §9 suggests 13 months raw).
- Consent banner before any third-party SDK (Phase 5).
