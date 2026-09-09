# Future Features — Consolidated Backlog

> Created 2026-09-08. The single checklist of known-but-not-built work, consolidated from
> `plan/cosmetics-and-gaps-scan-2026-09-08.md` (post-execution "deliberately not applied" list),
> `plan/stale-code-scan-2026-09-08.md` (owner-decision items), `BACKLOG.md`, and `plan/15-seo.md` P2/P3.
> Nothing here is a bug — these are new capabilities or deferred polish. Owner sign-off is the gate for
> every item marked ⚠️; sizes are rough (S = hours, M = 1–2 days, L = multi-day).

---

## 1. Multiplayer — Duels on the web (⚠️ needs owner go-ahead, L)

The backend is complete and live (`apps/backend/src/duels`, commit `b081423`, built as "mobile-app gap #7");
the web has zero UI. A web duel mode is frontend-only work:

- Lobby screen: create duel (level + 3–20 questions → join code) / join by code. `POST /duels` DTO is ready.
- Live match screen: shared frozen question set, opponent progress via polling (API is polling-based —
  30s heartbeats, presence windows; no websockets), server-side grading. Reusable: `QuestionCard`,
  `AnswerOptions`, bubble/celebration effects, `lib/guest-id.ts`.
- Results screen.
- Open decisions: copy the mobile repo's `plan/17-online-duel.md` spec into `plan/` as feature 16+;
  whether logged-in users can duel under their identity (only potential backend change); add backend
  service tests (the module currently has none) before the web leans on it.
- Related: keep-or-kill decision for the duels module itself if the mobile app is dead (stale-code scan).

## 2. Gameplay

- **Quiz sessions-history UI** (M) — `GET /quiz-mcq/sessions/history` is live with no consumer; results
  survive only in localStorage (cap 50, device-local). A minimal "recent sessions" surface (or fetching a
  session by id on the results page + a backend GET-by-id endpoint) closes the device-loss gap.
- **Category-scoped riddle play** (M) — category tiles currently play the all-subjects mix
  (`app/riddle-mcq/page.tsx:136`); needs `GET /riddle-mcq/categories/:id/riddles` + pass-through, or
  relabel the picker as discovery-only.
- **Quiz timer-expiry enforcement** (S–M) — expired per-question timers auto-advance without recording a
  skip; Back restores full time. Decide the rule (lock late answers vs mark timed-out) before building.
- **Achievements for image-riddles / dad-jokes** (M, ⚠️ definitions need owner sign-off) — the sync
  pipeline (`lib/achievements.ts` → `POST /achievements/sync`) is reusable; only the definitions are
  missing (e.g. "10 riddles solved", "vote on 5 jokes").
- **Live streak counter in the challenge HUD** (S) — the Streak Master achievement builds invisibly
  (`challenge-streak.ts` has no UI reader).
- **Extreme-level "Show Answer" peek** (S, ⚠️) — the reference prototype had it; confirm deliberate
  removal or add back (counts as skip).
- **Reference-prototype parity leftovers** (S) — per-subject floating background emojis; TIME-UP grace
  beat before auto-advance.

## 3. Social & moderation

- **Comment flag/report UI** (S backend-ready, M with admin queue) — `POST /comments/:id/flag` is fully
  built with zero UI at either end: add a report affordance on feed rows + a "Flagged" filter chip and
  badge in the admin CommentsSection.
- **Jokes comment pagination** (S) — GuessFeed got "Load more" (2026-09-08); JokeCommentsModal still caps
  at 20 with no pagination (`feed.total` is returned and ignored).
- **Feed error state on the jokes modal** (S) — GuessFeed distinguishes load-failure from empty; the
  jokes modal still renders "No replies yet" on API failure.
- **Failed-post ghost entries** (S) — `postComment` returning null leaves the optimistic entry silently;
  mark it failed with a retry.

## 4. Admin

- **JokesSection table loading/empty/retry states** (S) — wire the StatusDashboard skeleton/error/empty
  the section already has access to; add a Reload affordance.
- **One-liner joke create/edit** (S) — punchline is currently required by the form; editing an existing
  one-liner forces inventing a punchline.
- **Jokes import fixes** (S) — help text documents the wrong header order; the repo's sample CSV lacks a
  header row (first joke silently dropped); per-row import failures are never displayed.
- **Media library alt-text inline editing** (S–M) — wire `PATCH /media/:id` (endpoint exists, unused) to
  a small inline edit on library cards; pairs with the deferred required-alt policy.
- **Media library copy-URL + click-to-preview** (S) — the riddle form's primary input is a pasted URL.
- **Media upload UX** (S) — 5 MB client pre-check + helper text; picker delete confirmation; oversize
  500→413 mapping in the exception filter; broken-image `onError` placeholders; "No results for X" empty
  variant; "Storage used" stat tile (replaces the always-0 Pending tile).
- **Admin overview trim** (S, ⚠️) — `/admin/analytics/overview` computes 8 field groups, SummarySection
  renders 3; trim the server payload or wire the rest (saves 5 queries per cache cycle).
- **Analytics dashboard robustness batch** (M) — independent endpoint fetches (one funnel/retention
  failure currently blanks every tab), EventsBrowser debounce + stale-response guard, clicks-tab CSV
  exporting the tab's own payload, per-tab loading skeletons, tab semantics, data-freshness timestamp.
- **Analytics extras** (S each, ⚠️) — top client-errors BarList, web-vitals `rating` surfaced, geo/device
  chips in Raw Events rows, deep-linkable Click-Analysis sub-pills.
- **Admin shell** (M) — mobile layout (off-canvas sidebar, table x-scroll); header admin/user variant
  dedupe (~110 duplicated lines); KPI period labels; admin login already-auth redirect + return-to page;
  UsersSection server-side pagination + role filter (grows with guest rows).
- **Admin section unification** (M, deferred with rationale) — JokesSection lifted-state pattern →
  self-contained; CSV import/export unification across modules.
- **Newsletter server-side filters/pagination** (S–M) — the admin fetches `?limit=200` and does the rest
  client-side; wire the server search/filter/page endpoints before the list exceeds 200 (the total card
  now warns). Also: `/unsubscribe` landing page (pairs with the deferred email epic), CSV UTF-8 BOM,
  subscribe success keeping the form visible.
- **Settings restore-to-defaults** (S) — no DELETE endpoint exists; once a key is overridden only manual
  re-typing restores it.
- **SettingsSection tab keyboard navigation** (S) — roving tabindex/arrow keys.

## 5. SEO (plan/15 P2/P3 — all gated on the owner decisions already logged)

- **P2 RSC conversion** (L) — module landing pages server-rendered; the owner-decision blocker for
  everything below.
- **P2 per-content route segments** (`/quiz-mcq/[subject]`, L) — per-subject titles/canonicals; today the
  sitemap's query-param URLs all serve identical titles.
- **P2 content-level JSON-LD** (M) — Quiz/FAQPage schemas; needs SSR.
- **P2 per-page dynamic OG images** (M) — reusable `OgCard` builder; natural companion to the 2026-09-08
  OG merge fixes.
- **P3 Search Console integration** (M) — needs an owner-provided GSC property; the dashboard panel is an
  honest placeholder today.
- **P3 organic segmentation** (S) — referrer classification in the Audience tab; `referrerDomain` already
  collected.
- **P3 robots dashboard control** (S, ⚠️) — only worthwhile once there are rules worth toggling.
- **Auth pages: OAuth-cancel redirect handling** (S) — `failureRedirect` to `/login?oauth_error=1` so a
  cancelled Google consent doesn't dead-end on backend JSON.
- **rememberMe wiring** (S, ⚠️) — the login checkbox affects nothing; wire `persistent` through or delete.
- **Single-flight refresh** (S) — share one in-flight refresh promise in api-client (concurrent 401s
  currently log the tab out via rotation).
- **Registration → verify-email guidance** (S) — post-signup "check your email" banner; the verify page's
  pending state is unreachable from the UI.
- **Change-password flow** (M, ⚠️ new endpoint) — `PUT /auth/change-password` + profile section.
- **Dual-store logout cleanup** (S) — Header logout clears exactly one token store when both exist.

## 6. Platform / already-decided deferrals (recorded, not planned)

- BullMQ reshuffle job for `random_weight` (trigger: mass deletions accumulating — TODO.md §1).
- S3 object-storage swap (F08 owner decision, pre-deploy) — also moots the `UPLOADS_DIR` partial wiring.
- Newsletter double opt-in / campaigns / welcome mail / subscriber↔user linkage (plan/14 §6).
- Quiz MCQ service split + JokesSection 1253-LOC page extraction (STANDARDS §3, behavior-neutral only
  with tests in place first).
- Server-authoritative riddle sessions (BACKLOG #2 family — riddles remain localStorage-only by design).
- Retention-test harness (needs a DB-backed test rig).
- PWA decision: `manifest.ts` + SVG icon now shipped; real PNG icon set + install experience needs a
  design asset (owner).
- Legal copy: approved privacy/terms/contact text + the About-page contact email (owner content).

---

_Sources: cosmetics scan F01–F15 rows, stale-code scan owner-decision items, BACKLOG.md, plan/15 §3.
Update this file (and the owning feature file, where one exists) when an item ships._
