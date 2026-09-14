# Stale/Dead Code Scan — 2026-09-14

> Scan-and-record pass only. **No code was modified.** Every finding needs review before any deletion.
> This scan was performed **from scratch**: the feature plan docs (`plan/01…15-*.md`, `plan/TODO.md`,
> `plan/BUILD-BACKLOG.md`, `plan/STANDARDS.md`, `plan/future-features.md`) were the sole map of what
> each feature is supposed to do. No prior scan/status reports were read or referenced.
>
> **Scope:** all 15 product features in `plan/TODO.md` (plus `plan/15-seo.md`, which exists on disk but
> is missing from the TODO.md master table — see F09/S6) + one cross-cutting pass (backend `common/`,
> config, health, duels, database scripts, migrations, npm deps, env files, `scripts/`, root tooling).
> Per `AGENTS.md`, the isolated 2D-games paths were **excluded entirely**; the Play Hub page was only
> checked for games references (none found — isolation intact).
>
> **Method:** one audit per feature, in tracker order. For every file in the feature's plan inventory:
> every export's consumers were counted by repo-wide grep (`apps/ scripts/`, node_modules/dist/.next/games
> excluded); every backend endpoint was checked for a frontend caller (typed client wrapper OR direct path
> call); every backend service method was checked against its controller; entity fields and storage keys
> were checked for write-without-read or read-without-write; navigation/sitemap/manifest routes were
> checked against the `app/` directory. A symbol referenced only by its own file counts as unused;
> test-only references are marked. Deferred work explicitly marked in the plan docs or
> `plan/future-features.md` is **not** reported as stale — it is listed per feature as
> "documented deferrals" so the record is complete.
>
> **Confidence legend:** ✅ = confirmed (verified zero consumers/references anywhere) ·
> ⚠️ = likely (needs a second look before deleting)
> **Rec legend:** DEL = delete · MERGE = merge/deduplicate · FIX = fix · OWN = needs owner decision
> **Note:** several "consumerless endpoint" findings describe backend routes that no frontend code calls.
> The backend is also the mobile app's API, so consumerless ≠ useless — they are recorded with **OWN**
> and a per-route verdict is an owner call, not automatic deletions.

---

## Executive summary

| Scope                  | Dead   | Unused / over-export | Stale  | Half-used | Half-removed | Duplicate | Total    |
| ---------------------- | ------ | -------------------- | ------ | --------- | ------------ | --------- | -------- |
| 01 User Accounts       | 1      | 1                    | 0      | 2         | 0            | 1         | 5        |
| 02 MCQ Quiz            | 3      | 7                    | 0      | 2         | 0            | 0         | 12       |
| 03 Riddle MCQ          | 1      | 7                    | 1      | 0         | 0            | 0         | 9        |
| 04 Image Riddles       | 2      | 9                    | 2      | 11 (eps)  | 0            | 1         | 25       |
| 05 Dad Jokes           | 1      | 5                    | 1      | 5 (eps)   | 0            | 0         | 12       |
| 06 Achievements        | 0      | 0                    | 2      | 1 (ep)    | 0            | 0         | 3        |
| 07 Comments            | 0      | 5                    | 0      | 1 (ep)    | 0            | 0         | 6        |
| 08 Media Library       | 0      | 1                    | 0      | 1 (ep)    | 0            | 1         | 3        |
| 09 Site Shell & SEO    | 0      | 1                    | 1      | 0         | 0            | 2         | 4        |
| 10 Landing & Shared UI | 4      | 1                    | 0      | 0         | 0            | 0         | 5        |
| 11 Site Settings       | 6      | 19                   | 0      | 0         | 0            | 1         | 26       |
| 12 Admin Dashboard     | 1      | 2                    | 0      | 0         | 0            | 0         | 3        |
| 13 Analytics           | 1      | 3                    | 1      | 0         | 0            | 1         | 6        |
| 14 Newsletter          | 0      | 0                    | 0      | 0         | 0            | 0         | 0        |
| 15 Full SEO            | 0      | 0                    | 0      | 0         | 0            | 2         | 2        |
| Cross-cutting          | 14     | 5                    | 2      | 6         | 1            | 2         | 30       |
| **Total**              | **34** | **66**               | **11** | **~30**   | **1**        | **10**    | **~152** |

- **Fully clean:** **14 Newsletter** (zero findings — backend, SubscribeForm, admin section all wired).
- **Confirmed-safe deletions (✅, grep-verified zero callers):** 7 dead functions in `lib/progress.ts`,
  `getQuestionsBySubject`, `StatusCountResponse`, `PaginatedResponse` (riddle), `deleteImageRiddle`,
  `getRecentImageRiddles`, `updateJokeStatus` (backend), `MODULE_LABELS`, `StatusCounts`,
  `clearAll`/`clearQuizData`, `initialJokes`/`initialRiddles`, the settings-types sextet, 8 constants in
  `app.constants.ts`, 2 DTO classes in `base.dto.ts`, `run-migration.ts`, `@backend/*` alias,
  `CHALLENGE_HIGH_SCORE` key, broken `clean` script.
- **Owner-decision cluster:** ~28 consumerless backend endpoints across 7 features (the FE migrated to
  search/bulk/random surfaces and left the per-item reads orphaned; the same routes may serve the mobile app).
- **Duplicate-code cluster:** `resolveMediaUrl` ×2 (byte-identical), APP_URL fallback ×4, indexable-route
  list ×2, image-riddle timer defaults ×2 (FE/BE), analytics module lists ×3, resend-verification path ×2.

---

## 01 User Accounts (`plan/01-user-accounts.md`)

| ID  | Location                                                        | Cat                     | What                                                                                                                                                                                                          | Evidence                                                                                       | Conf | Rec                                                                             |
| --- | --------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------- |
| A1  | `apps/backend/src/users/users.controller.ts:49-57`              | duplicate / half-used   | `GET /users` (admin-only list) has no frontend caller; the admin UI uses `GET /admin/users` (`AdminUsersSection.tsx:43`)                                                                                      | grep `'/users'` in FE → only `/users/profile`; `adminApi.get('/admin/users')` is the live list | ✅   | OWN (API surface) or DEL                                                        |
| A2  | `apps/backend/src/users/users.controller.ts:68-78`              | half-used               | `GET /users/:id` (self-or-admin) — zero FE consumers, no wrapper                                                                                                                                              | repo grep `users/${` GET → 0                                                                   | ✅   | OWN                                                                             |
| A3  | `apps/frontend/src/contexts/AuthContext.tsx:11-12,37-46`        | dead                    | Context's `login`/`logout` methods and the `user` object are never consumed — the only `useAuth()` consumer (profile page) reads `isAuthenticated`/`isLoading`; login page calls `authService.login` directly | grep `useAuth()` → 1 file; grep `authService.login(` → login page + context itself             | ✅   | DEL the two methods (or wire the login page through the context — one decision) |
| A4  | `apps/frontend/src/app/profile/page.tsx:72` vs `lib/auth.ts:97` | duplicate               | Profile page re-posts `/auth/resend-verification` via raw `api.post` instead of `authService.resendVerification`                                                                                              | side-by-side                                                                                   | ✅   | MERGE                                                                           |
| A5  | `apps/frontend/src/lib/auth.ts:11`                              | unused (export surface) | `AuthResponse` referenced only inside `lib/auth.ts`                                                                                                                                                           | grep → 0 external                                                                              | ✅   | unexport                                                                        |

**Behavioral note (via A3):** because the login page bypasses the context, `AuthContext.user` stays stale
until the next full reload — the context value is effectively "did we authenticate at mount".

**Documented deferrals (informational, not stale):** `/guest-users/activity` heartbeat has no FE caller
(plan 01 P3 open box — wire-or-accept); admin user-edit UI open decision (plan 01 P2).
**Clean:** all `users.service` methods (21/21) and `auth.service` methods (12/12) have callers; every auth
DTO class consumed; `BruteForceService`/`OptionalJwtAuthGuard`/`OAuthPlatformMiddleware`/strategies consumed;
guest counters (`quizAttempts`/`totalScore`) written by `recordSessionCompletion` (analytics service) and
read by the admin guest list; token stores (`AUTH/REFRESH/ADMIN_*`) all read and written.

---

## 02 MCQ Quiz (`plan/02-mcq-quiz.md`)

| ID  | Location                                                                                                                                                                                                                                                                                | Cat                     | What                                                                                                                                                                                               | Evidence                                                  | Conf | Rec                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---- | ------------------------------------ |
| Q1  | `apps/frontend/src/lib/progress.ts:101,115,193,199,212,221,232`                                                                                                                                                                                                                         | dead                    | 7 exported functions with zero callers anywhere: `getSubjectProgress`, `getRecentSessions`, `isChapterCompleted`, `getRecommendedChapters`, `clearAllProgress`, `exportProgress`, `importProgress` | per-name repo grep (incl. in-file) → definition line only | ✅   | DEL (~100 lines)                     |
| Q2  | `apps/frontend/src/lib/quiz-mcq-api.ts:271` + `apps/backend/src/quiz-mcq/quiz-mcq.controller.ts:190-207`                                                                                                                                                                                | dead + half-used        | `getQuestionsBySubject` has zero importers, leaving backend `GET /quiz-mcq/subjects/:slug/questions` consumerless                                                                                  | grep fn → definition only; grep path → 0 FE calls         | ✅   | DEL fn; endpoint OWN                 |
| Q3  | `apps/frontend/src/lib/quiz-mcq-api.ts` (`StatusCountResponse`)                                                                                                                                                                                                                         | dead                    | Type referenced nowhere (definition only)                                                                                                                                                          | grep                                                      | ✅   | DEL                                  |
| Q4  | `apps/backend/src/quiz-mcq/quiz-mcq.controller.ts:107-119`                                                                                                                                                                                                                              | half-used               | `GET /quiz-mcq/sessions/history` — zero consumers repo-wide (results page uses localStorage history + `high-scores`)                                                                               | grep `sessions/history` → backend only                    | ✅   | OWN (surface a history UI or remove) |
| Q5  | `apps/backend/src/quiz-mcq/quiz-mcq.controller.ts:498`                                                                                                                                                                                                                                  | half-used               | `GET /quiz-mcq/subjects/:slug/status-counts` — zero FE consumers (admin filters use `filter-counts`)                                                                                               | grep `status-counts` → 0 FE                               | ✅   | OWN                                  |
| Q6  | `apps/frontend/src/lib/quiz-mcq-api.ts` (`PublicLevelCounts`, `PublicQuestionCounts`, `QuestionFilters`, `QuizSessionPayload`, `BulkCreateResponse`, `BulkQuestionItemDto`), `lib/quiz-mcq-resume.ts` (`QuizResumeIdentity`, `QuizResumeProgress`), `types/quiz-mcq.ts` (`QuizActions`) | unused (export surface) | Types used only in-file; export keyword dead                                                                                                                                                       | grep → 0 external each                                    | ✅   | unexport (cosmetic)                  |
| Q7  | `apps/frontend/src/lib/storage.ts:41`                                                                                                                                                                                                                                                   | half-removed            | `CHALLENGE_HIGH_SCORE` storage key defined, never read or written anywhere (challenge streak uses `CHALLENGE_STREAK`)                                                                              | grep → definition only                                    | ✅   | DEL                                  |

**Documented deferrals (informational):** `ResultsCelebration.tryAgain` intentionally unused (plan 02 P3
open box — future encouragement animation).
**Clean:** all ~30 `quiz-mcq.service` methods consumed by the controller; `useQuizMcqSubjects` consumed
(admin page); `quiz-engine.utils`/`quiz-mcq-constants`/`quiz-mcq-scoring`/`quiz-mcq-resume`/
`challenge-streak` exports all consumed; `useQuizTimers`/`useQuizResume` wired into the engine;
`ChallengeHub` serves both timer-challenge and practice-mode; all `features/quiz-mcq-admin` hooks consumed;
`subject-clicks` consumed by homepage `TopicSection` (direct fetch).

---

## 03 Riddle MCQ (`plan/03-riddle-mcq.md`)

| ID  | Location                                                                                                                                                                                                                                                                                                        | Cat                     | What                                                                                                                                                                                              | Evidence                                                                             | Conf | Rec                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---- | ------------------------------------------ |
| R1  | `riddle-mcq.controller.ts:129` (`GET /riddle-mcq/riddles/:id`), `:198` (`stats/overview`), `:233` (`stats/status-counts`); `riddle-mcq-subject.controller.ts:37` (`GET subjects/all`, admin), `:47` (`GET subjects/:slug`); `riddle-mcq-category.controller.ts:36` (`categories/all`), `:46` (`categories/:id`) | half-used               | 7 backend endpoints with no frontend wrapper and no direct path call                                                                                                                              | `lib/riddle-mcq-api.ts` wraps none of these paths; repo grep → 0 callers             | ✅   | OWN (API surface) or DEL                   |
| R2  | `features/riddle-mcq/hooks/useRiddleMcqSubjects.ts:22`                                                                                                                                                                                                                                                          | stale (design)          | Riddle **admin** lists subjects through the _public_ active-only endpoint while the admin `/subjects/all` exists unused — inactive subjects silently vanish from admin filters                    | hook calls `getSubjects()` (public `?hasContent=`), never `/all` or an inactive flag | ✅   | OWN (point admin at the admin list)        |
| R3  | `apps/frontend/src/lib/riddle-mcq-api.ts` (`PaginatedResponse`)                                                                                                                                                                                                                                                 | dead                    | Type referenced nowhere (definition only) — sibling types (`GetFilterCountsParams`, `RiddleLevelCounts`) are in-file used only                                                                    | grep                                                                                 | ✅   | DEL `PaginatedResponse`; unexport the rest |
| R4  | `lib/riddle-persistence.ts:53,103,153` (`loadRiddleSession`, `hasActiveSession`, `hasUnsavedProgress`)                                                                                                                                                                                                          | unused (export surface) | Internal helpers of the persistence module (callers only in-file); no external consumer                                                                                                           | grep → 0 external                                                                    | ✅   | unexport                                   |
| R5  | `types/riddles.ts`/`riddle-progress.ts`/`persistence.ts`/`useRiddlePlay.ts` (`RiddleResumeState/Identity/Progress`, `RiddleHistoryEntry`, `UseRiddlePlayParams`)                                                                                                                                                | unused (export surface) | In-file-composed types, 0 external consumers                                                                                                                                                      | grep                                                                                 | ✅   | unexport (cosmetic)                        |
| R6  | `plan/03-riddle-mcq.md` §1 inventory                                                                                                                                                                                                                                                                            | stale doc               | Inventory names `lib/riddle-resume.ts` + `lib/riddle-session.ts` as separate files; the code consolidated both into `lib/riddle-persistence.ts` (the same doc's P2 box records the consolidation) | `ls lib/riddle-*` → no such files; header comment in `riddle-persistence.ts`         | ✅   | FIX doc                                    |

**Documented deferrals (informational):** server-side riddle sessions, JSON import/export, cache-invalidation
tuning (all owner-accepted); bulk import carries no `hint` field (plan P3 open box).
**Clean:** all 6 riddle services' public methods consumed by controllers; `riddle-scoring`/`riddle-mode-param`/
`types/riddles.ts`/`useRiddlePlay`/`useRiddleTimers` fully consumed; admin feature folder (components, hooks,
modals, csv-parser) consumed; controllers/services barrels imported by the module file.

---

## 04 Image Riddles (`plan/04-image-riddles.md`)

| ID  | Location                                                                                                                                                                                                        | Cat                     | What                                                                                                                                                                                                                                                                                                                                                                                                                                    | Evidence                                                                                        | Conf | Rec                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------- |
| I1  | `apps/frontend/src/lib/image-riddles-api.ts:218` (`deleteImageRiddle`), `:320` (`getRecentImageRiddles`)                                                                                                        | dead                    | Two client functions with zero callers (admin deletes go through `bulkActionImageRiddles`; nothing renders "recent")                                                                                                                                                                                                                                                                                                                    | grep → definition only; delete hook uses bulk path                                              | ✅   | DEL                                                  |
| I2  | public controller `:52,61,89,98,110,157,185`; admin controller `:86,125,152,206`                                                                                                                                | half-used               | 11 consumerless endpoints: `GET /image-riddles` (root list), `/random`, `/categories/:id`, `/category/:id`, `/difficulty/:level`, `/status-counts`, `/:id`; `GET /admin/image-riddles/:id`, `DELETE /admin/image-riddles/:id`, `GET /admin/image-riddles/categories/:id`, `GET /admin/image-riddles/dashboard/recent`. The catalog is fully served by `/search` + `/categories` + `/stats/overview`; admin by list/bulk/dashboard-stats | every FE call path enumerated → none hits these                                                 | ✅   | OWN (batch decision)                                 |
| I3  | `features/image-riddles/lib/game.ts:56` (`defaultTimers`) vs `apps/backend/src/config/settings.ts:45-50` (`imageRiddles.timers`); plus `apps/frontend/src/lib/constants.ts:72` (`RIDDLE_TIMERS` = 30/60/90/120) | duplicate + stale       | Image-riddle timer defaults are maintained twice (FE 60/90/120/180 mirrors backend `imageRiddles.timers` 60/90/120/180 — comment admits manual sync). Separately, the FE constant named `RIDDLE_TIMERS` actually mirrors the **riddle-MCQ** `riddles.defaults.levelTimers` (30/60/90/120) — its name collides with plan 04's "unified via RIDDLE_TIMERS" claim and invites exactly the wrong reuse                                      | values side-by-side; `settings.service.ts:59-61` maps FE `RIDDLE_TIMERS.*` into `riddles` group | ✅   | MERGE (single source per group) + rename FE constant |
| I4  | `plan/04-image-riddles.md` §1/§2                                                                                                                                                                                | stale doc               | Plan says the public page "fetches `GET /image-riddles?limit=200`" (superseded by the `/search`-driven catalog, `useImageRiddleCatalog.ts:5-8`) and lists `GET /admin/image-riddles/status-counts`, which no admin controller route serves                                                                                                                                                                                              | route list vs plan table                                                                        | ✅   | FIX doc                                              |
| I5  | `lib/image-riddles-api.ts` (10 types), `lib/game.ts` (`defaultTimers`), `default-actions.ts:104` (`getDefaultActions`), 8 `Use*Args` hook-param types                                                           | unused (export surface) | All used in-file only (e.g. `getDefaultActions` is called by `selectModalActions` in the same file)                                                                                                                                                                                                                                                                                                                                     | grep → 0 external each                                                                          | ✅   | unexport (cosmetic)                                  |

**Documented deferrals (informational):** likes counter (open decision), server-side progress (owner-accepted
family deferral), bulk import `status` field (plan P3 open box).
**Clean:** engagement pipeline fully wired end-to-end (`recordImageRiddleEngagement` → `POST :id/engage` on
view/attempt/solve; admin reads engagement from `dashboard/stats`); answer matcher consumed; admin hooks
(8/8) consumed; CSV **and** JSON import/export consumed; `ActionOptions` consumed; `media-api` integration live.

---

## 05 Dad Jokes (`plan/05-dad-jokes.md`)

| ID  | Location                                                                                                                                                 | Cat                     | What                                                                                                                                                               | Evidence                                                    | Conf | Rec                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---- | --------------------------------------------------------------------------- |
| J1  | `apps/backend/src/dad-jokes/dad-jokes.service.ts:241`                                                                                                    | dead                    | `updateJokeStatus(id, status)` — zero callers; single-status changes go through the shared bulk-action path (`/classic/bulk-action`)                               | grep `.updateJokeStatus(` → 0; controller calls bulk-action | ✅   | DEL                                                                         |
| J2  | `dad-jokes.controller.ts` — `GET /jokes/classic/random`, `/classic/search`, `/classic/categories/:id`, `/classic/category/:id`, `/classic/status-counts` | half-used               | 5 consumerless endpoints — `lib/jokes-api.ts` wraps none of them; the public page does client-side search/sort/pagination                                          | repo grep → 0 callers                                       | ✅   | OWN (adjacent to the owner-deferred "server-side search + pagination" item) |
| J3  | `plan/05-dad-jokes.md` §3                                                                                                                                | stale doc               | Plan states `/jokes/stats/overview` "has no frontend consumer" — false today: `jokes-api.ts:301` wraps it and `JokesSection.tsx:68` renders the header stat badges | grep                                                        | ✅   | FIX doc                                                                     |
| J4  | `lib/jokes-api.ts` (`adaptJoke`, `RawJoke`, `AdminJoke`, `CreateJokeAdminDto`, `UpdateJokeAdminDto`)                                                     | unused (export surface) | All referenced in-file only                                                                                                                                        | grep → 0 external                                           | ✅   | unexport                                                                    |

**Documented deferrals (informational):** saved/seen-jokes product surface (open decision — note the shared
`saved-items` lib itself is alive and consumed by the jokes and image-riddle pages), JotD SSR, trending/share,
page extraction, server-side search (all plan 05 open boxes).
**Clean:** voting wired both directions incl. toggle-off + `joke_voted` analytics; comments modal + count
chips; `MobileFooter` consumes `getJokeCategories(true)`; admin CRUD/bulk/CSV+JSON import;
`computeDadJokeStats` consumed by the service; category cascade live.

---

## 06 Achievements (`plan/06-achievements.md`)

| ID  | Location                                                                                 | Cat       | What                                                                                                                                                                                                                                                                                                                           | Evidence                                            | Conf | Rec                                                      |
| --- | ---------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ---- | -------------------------------------------------------- |
| V1  | `apps/backend/src/achievements/achievements.controller.ts` — `GET /achievements/unlocks` | half-used | No frontend caller anywhere (`POST /achievements/sync` is called fire-and-forget from `lib/achievements.ts:113`; the readback/re-hydration path was never built)                                                                                                                                                               | grep `achievements/unlocks` → backend only          | ✅   | OWN (documented gap — build readback or accept API-only) |
| V2  | `plan/06-achievements.md` §2 table                                                       | stale doc | The evaluator table claims Streak Master is "dead (empty case)" and Chapter Champion is "mis-evaluated" — current code implements both (`case 'streak'` → `getChallengeStreak().best`, `achievements.ts:207-211`; `case 'chapter_complete'` → distinct perfect chapters, `:177-185`), and §3's own checkboxes record the fixes | code read vs table                                  | ✅   | FIX doc (§2 predates §3)                                 |
| V3  | `plan/06-achievements.md` §1 inventory                                                   | stale doc | Inventory says the `RIDDLE_ACHIEVEMENTS` storage key "exists but is used nowhere" — the key was removed (P3 box checked; grep → 0 hits)                                                                                                                                                                                        | grep `RIDDLE_ACHIEVEMENTS\|riddle-achievements` → 0 | ✅   | FIX doc                                                  |

**Documented deferrals (informational):** image-riddle completions → achievements semantics (open decision);
server→client re-hydration (pairs with V1).
**Clean:** all 10 achievements evaluate with real logic; progress math present for streak/retry too;
`/achievements` page + toasts consumed; sync upsert guards unknown ids.

---

## 07 Comments (`plan/07-comments.md`)

| ID  | Location                                                                                                                                   | Cat                     | What                                                                                                           | Evidence                          | Conf | Rec        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---- | ---------- |
| C1  | `apps/backend/src/comments/comments.controller.ts` — `GET /comments/my`                                                                    | half-used               | No frontend wrapper and no direct call — `lib/comments-api.ts` implements list/create/delete/counts/admin only | grep `comments/my` → backend only | ✅   | OWN or DEL |
| C2  | `apps/frontend/src/lib/comments-api.ts` (`AdminCommentListParams`, `ChipOption`, `CommentFeedResponse`, `CommentKind`, `PostCommentInput`) | unused (export surface) | In-file-composed types, 0 external consumers                                                                   | grep                              | ✅   | unexport   |

**Clean:** full stack live on both content types (jokes modal + chips, image-riddle GUESS/CHIP feed);
guest-scoped delete; public flag path sets `flagged` and admin filtering reads it; admin list + bulk-action
consumed by `CommentsSection`; backend service fully consumed (no dead methods); recent guestId-DTO fix is
consistent across DTO/entity/controller.

---

## 08 Media Library (`plan/08-media.md`)

| ID  | Location                                                                          | Cat       | What                                                                                                                                                                                                                                                          | Evidence                                     | Conf | Rec                                         |
| --- | --------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---- | ------------------------------------------- |
| M1  | `apps/backend/src/media/media.controller.ts` — `GET /media/:id`                   | half-used | No frontend caller (list/delete/stats/upload all consumed)                                                                                                                                                                                                    | grep `/media/${id}` GET → 0 (DELETE is used) | ✅   | OWN or DEL                                  |
| M2  | `apps/frontend/src/lib/media-api.ts` + `apps/frontend/src/lib/public-settings.ts` | duplicate | `resolveMediaUrl` is byte-identical in both files (same regex, same `SERVER_ORIGIN` join), and consumers are split across the two copies (`MediaLibrarySection`/`SettingsSection`/`SeoSection` import from media-api; root `layout.tsx` from public-settings) | diff of the two function bodies              | ✅   | MERGE (one authoritative copy, re-exported) |

**Documented deferrals (informational):** S3/object-storage swap (pre-deploy decision; `StorageService` seam
in place), required-alt policy (open decision).
**Clean:** upload pipeline (MIME allow-list → sharp → WebP q80) live; `MediaPicker` wired into the
image-riddle form; `formatFileSize`/error helper consumed; no dead service methods.

---

## 09 Site Shell & SEO (`plan/09-site-shell-seo.md`)

| ID  | Location                                                                                                                                    | Cat       | What                                                                                                                                                                                                                           | Evidence                            | Conf | Rec                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ---- | -------------------------------- |
| S1  | `apps/frontend/src/lib/seo.ts:14` (exported `APP_URL`), `app/layout.tsx:23`, `app/robots.ts:3`, `app/sitemap.ts:3`                          | duplicate | The same `NEXT_PUBLIC_APP_URL \|\| 'http://localhost:3010'` fallback is defined four times; the exported copy in `lib/seo.ts` has zero external importers (robots/sitemap/layout each redefine locally under a different name) | grep `NEXT_PUBLIC_APP_URL` → 4 defs | ✅   | MERGE (import from `lib/seo.ts`) |
| S2  | `components/*` (Header, Footer, MobileFooter, BrandMark, JsonLd, LegalPage, SocialLinks, SiteBrandContext, NavigationProgress, HideOnAdmin) | —         | All shell components have live consumers                                                                                                                                                                                       | per-name file grep → ≥1 each        | ✅   | clean                            |

**Route integrity (clean):** every `nav-config.ts` entry (8), every `sitemap.ts` static route (11), and
`manifest.ts`'s `/icon.svg` (served by the `src/app/icon.svg` file convention) resolve to real app routes;
`robots.ts` rules consistent with the noindex layouts; legal pages (`/about`, `/contact`, `/privacy`,
`/terms`) exist on the shared `LegalPage` shell.
**AGENTS.md compliance (clean):** `app/play/page.tsx` links only product routes (`/`, `/quiz-mcq`,
`/riddle-mcq`) — no games references.

**Documented deferrals (informational):** SSR strategy for JotD/subject pages, mobile-drawer focus trap,
web manifest (see S6 below — the manifest already exists).

---

## 10 Landing Page & Shared UI (`plan/10-landing-shared-ui.md`)

| ID  | Location                                            | Cat                     | What                                                                                                                                                                                                        | Evidence               | Conf | Rec      |
| --- | --------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---- | -------- |
| L1  | `apps/frontend/src/lib/storage.ts:116,127`          | dead                    | `clearQuizData()` and `clearAll()` — zero callers anywhere                                                                                                                                                  | grep → definition only | ✅   | DEL      |
| L2  | `apps/frontend/src/lib/initial-data.ts:1,25`        | dead                    | `initialJokes` and `initialRiddles` — mock-era offline fallback arrays with zero consumers (the image-riddle fallbacks `initialImageRiddles`/`initialImageRiddleCategories` _are_ used by the catalog hook) | grep → definition only | ✅   | DEL      |
| L3  | `components/share/ShareMenu.tsx` (`ShareMenuProps`) | unused (export surface) | In-file type, 0 external consumers                                                                                                                                                                          | grep                   | ✅   | unexport |

**Clean:** every `components/ui` component consumed (`Modal` ×11, `ConfirmDialog` ×5, `FileUploader` ×3,
`CollapsibleRows` ×6, `BulkActionToolbar` ×6, `StatusDashboard` ×7, `ThemeToggle` ×3) and
`<ToastContainer />` is mounted in `providers.tsx`; home components (`BubbleBackground`, `ModeCards`,
`StatsSection`, `TopicSection`) all consumed; `ThemeContext`, `useClickOutside`, `lib/toast`, `lib/utils`,
`lib/api-client`, `lib/query-client` — zero dead exports.

---

## 11 Site Settings (`plan/11-site-settings.md`)

| ID  | Location                                                                                                                                                                         | Cat                     | What                                                                                                                                                                  | Evidence                    | Conf | Rec                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---- | -------------------------------------------------- |
| T1  | `apps/frontend/src/types/settings.types.ts` — `SettingsFormData`, `SettingsResponse`, `SettingsUpdatePayload`, `SettingsUpdateResponse`, `isSettingsTab()`, `isSystemSettings()` | dead                    | Six exports referenced nowhere (definition only) — mock-era leftovers of the old settings service                                                                     | grep → definition only each | ✅   | DEL                                                |
| T2  | same file — remaining 19 composed types (`QuizSettings`, `RiddlesSettings`, `ImageRiddlesSettings`, `DadJokesSettings`, `*Cache`, `*Defaults`, …)                                | unused (export surface) | Used only to compose `SystemSettings` in-file; no external consumer imports them                                                                                      | grep → 0 external each      | ✅   | unexport (cosmetic)                                |
| T3  | FE `RIDDLE_TIMERS` + `FALLBACK_PUBLIC_SETTINGS` (`services/settings.service.ts:53-63`) vs backend `config/settings.ts`                                                           | duplicate (by design)   | The FE offline fallback hand-mirrors the backend defaults; values match today, but there is no mechanism keeping them in sync (and the constant naming trap — see I3) | side-by-side                | ✅   | OWN (accept + document, or derive from one source) |

**Split-brain check (resolved — informational):** the admin UI writes through `SettingsService.updateSettings`
→ `PATCH /settings`, and gameplay reads `SettingsService.getSettings()` → `GET /settings/public`
(quiz play page + `useRiddlePlay`). The one gameplay surface **not** reading settings is image-riddles
(it uses `game.ts defaultTimers` — see I3). Backend `config/settings.ts` remains the defaults source per
plan 11's P1 decision.

**Clean:** backend `settings.service` has zero dead methods; public/admin controllers consumed; the settings
group keys (quiz/riddles/imageRiddles/dadJokes/site/seo) all read by the FE or admin.

---

## 12 Admin Dashboard (`plan/12-admin-dashboard.md`)

| ID  | Location                                                                                       | Cat                     | What                                                                                       | Evidence          | Conf | Rec      |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------ | ----------------- | ---- | -------- |
| D1  | `app/admin/utils/index.ts` (`parseCSVLine`), `app/admin/components/analytics/csv.ts` (`toCsv`) | unused (export surface) | Both used only in-file                                                                     | grep → 0 external | ✅   | unexport |
| D2  | `apps/frontend/src/types/status.types.ts:22` (`StatusCounts`)                                  | dead                    | Type referenced nowhere (definition only) — `StatusDashboard` types its data independently | grep              | ✅   | DEL      |

**Clean (mount map):** all 11 admin section components are mounted from `admin/page.tsx`
(`SummarySection`, `AdminUsersSection`, `AnalyticsSection`, `CommentsSection`, `EventsBrowser` via
`AnalyticsSection`, `ImageRiddlesAdminSection`, `JokesSection`, `MediaLibrarySection`, `NewsletterSection`,
`SeoSection`, `SettingsSection`) plus the three content-management feature containers; the admin
`components/index`, `utils/index`, `types/index` barrels all have importers.

**Documented deferrals (informational):** jokes-section data-pattern unification and import/export
unification (both deferred with rationale in the plan).

---

## 13 Analytics (`plan/13-analytics.md`)

| ID  | Location                                                                                           | Cat                     | What                                                                                                                                                                                                                     | Evidence                                                                                      | Conf | Rec                                                                       |
| --- | -------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------- |
| N1  | `apps/frontend/src/lib/analytics.ts:23`                                                            | dead                    | `MODULE_LABELS` — definition only, zero consumers (the live label maps are `KNOWN_MODULES` in `EventsBrowser.tsx` and `FEATURE_NAMES` in `tabs.tsx`)                                                                     | grep → definition only                                                                        | ✅   | DEL                                                                       |
| N2  | `apps/frontend/src/app/admin/components/EventsBrowser.tsx:62`                                      | stale                   | `KNOWN_MODULES` includes `'achievements'`, but no writer ever emits `module: 'achievements'` — every `track()` call site emits one of the backend's five modules (events that unlock achievements ship under `quiz-mcq`) | grep `module: '` across FE → quiz-mcq ×8, riddle-mcq ×10, site ×4, jokes ×2, image-riddles ×1 | ✅   | OWN (legacy rows) or drop the entry                                       |
| N3  | backend `analytics.dto.ts:33` vs FE `KNOWN_MODULES` vs `tabs.tsx` `CLICK_FEATURES`/`FEATURE_NAMES` | duplicate               | Three hand-maintained module/feature lists that have already drifted (`achievements` exists only in the FE browser list)                                                                                                 | side-by-side                                                                                  | ✅   | MERGE (derive FE lists from one source; ingest `@IsIn` optional per plan) |
| N4  | `lib/analytics.ts` (`AnalyticsModuleName`, `TrackOptions`)                                         | unused (export surface) | In-file use only                                                                                                                                                                                                         | grep                                                                                          | ✅   | unexport                                                                  |

**Clean:** all 6 admin analytics endpoints consumed (`overview`, `dashboard`, `retention`, `funnel`, `clicks`,
`events`); zero dead methods in `analytics.service`; `AnalyticsProvider` mounted in `providers.tsx`; the
image-riddles analytics shim forwards to the shared tracker; `geo-lite`/`request-context` consumed.

**Documented deferrals (informational):** funnel accuracy join, retention depth, ops metrics, data-retention
purge, A5/A7-partial/A8/A9/A10 events (all recorded in plan 13 §4/§4b with rationale).

---

## 14 Newsletter (`plan/14-newsletter.md`)

**No issues found.** Backend module (controller/service/DTO/entity) fully consumed with zero dead methods;
`POST /newsletter/subscribe` consumed by `SubscribeForm` (mounted in `Footer`); `PATCH /newsletter/unsubscribe`
and the admin list endpoint consumed by `NewsletterSection`; `EmailService` methods (`sendVerificationEmail`,
`sendPasswordResetEmail`) both consumed by `auth.service`.
**Documented deferrals (informational):** unsubscribe landing page, campaigns, server-side admin filters
(plan 14 §6 + future-features §4).

---

## 15 Full SEO (`plan/15-seo.md`)

| ID  | Location                                                                              | Cat       | What                                                                                                                                         | Evidence     | Conf | Rec                                                                        |
| --- | ------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---- | -------------------------------------------------------------------------- |
| Z1  | `apps/frontend/src/app/opengraph-image.tsx:12-23`                                     | duplicate | Local `getSeo()` re-implements the fetch+fallback that `lib/public-settings.ts` owns (the in-code comment acknowledges the duplication)      | side-by-side | ✅   | MERGE (or accept: RSC cache context differs — `next: { revalidate: 300 }`) |
| Z2  | `lib/seo-audit.ts:23-35` (`AUDIT_ROUTES`) vs `app/sitemap.ts:11-23` (`STATIC_ROUTES`) | duplicate | The same 11 indexable routes maintained in two independent lists (in sync today; the audit's `inSitemap` check silently depends on the sync) | side-by-side | ✅   | OWN (shared route registry) or MERGE                                       |

**Also (tracker, not code):** `plan/TODO.md`'s master table lists 14 features but `plan/15-seo.md` exists and
is a live feature (its P1 items are built) — the tracker row is missing.
**Clean:** `lib/seo.ts` fully consumed (metadata builders, `NOINDEX`, JSON-LD); per-route layouts carry
metadata; `seo-audit` logic consumed by `SeoSection` + tests; `SeoHealth`/`NavItem`/`PublicSettingsPayload`
types are in-file used (unexport candidates only).

**Documented deferrals (informational):** all of plan 15 P2/P3 (RSC content, per-content routes, content
JSON-LD, per-page OG, GSC integration, organic segmentation, robots control — owner-gated per
future-features §5).

---

## Cross-cutting (backend common/, config, scripts, deps, env, root)

| ID  | Location                                                                                                                                                                                                                                                                                          | Cat            | What                                                                                                                                                                                                                                                       | Evidence                                              | Conf | Rec                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------- |
| X1  | `apps/backend/src/common/constants/app.constants.ts:49,55,61,67,76,82,88,139`                                                                                                                                                                                                                     | dead           | 8 zero-consumer constants: `ONE_SECOND_MS`, `ONE_MINUTE_MS`, `ONE_HOUR_MS`, `ONE_HOUR_S`, `ONE_DAY_MS`, `ONE_DAY_S`, `ONE_WEEK_S`, `HTTP_STATUS`                                                                                                           | per-name repo grep → definition only                  | ✅   | DEL                                                                                                                     |
| X2  | `apps/backend/src/common/dto/base.dto.ts` — `UpdateQuestionDto`, `UpdateSubjectDto`                                                                                                                                                                                                               | dead           | Two DTO classes with zero consumers (the quiz/riddle modules define their own update DTOs locally)                                                                                                                                                         | grep → definition only                                | ✅   | DEL                                                                                                                     |
| X3  | `apps/backend/run-migration.ts`                                                                                                                                                                                                                                                                   | dead           | One-off migration runner whose target import is **commented out** (line 12); superseded by `npm run migration:run`; duplicates `data-source.ts` config inline                                                                                              | read + repo grep → 0 references                       | ✅   | DEL                                                                                                                     |
| X4  | `apps/backend/query-count.ts`; `scripts/docker-startup.ps1` + `.sh`; `apps/backend/scripts/dev/fix-database.js`                                                                                                                                                                                   | likely-unused  | Dev utilities referenced by no script/doc/compose/Dockerfile (`fix-database.js` is an "emergency" raw-SQL patch superseded by migrations)                                                                                                                  | grep → only `dist/` build artifacts                   | ⚠️   | OWN (delete if truly dormant)                                                                                           |
| X5  | `apps/backend/src/database/reset-and-seed-questions.ts`, `seed-math-questions.ts`, `seed-test-data.ts`, `seed-test-questions.ts`                                                                                                                                                                  | half-used      | One-off dev seed scripts wired into nothing — backend `package.json` wires only `seed.ts` and `create-admin.ts`                                                                                                                                            | package.json scripts vs file list                     | ✅   | OWN (delete or wire)                                                                                                    |
| X6  | `apps/frontend/next.config.docker.js`                                                                                                                                                                                                                                                             | dead           | Referenced by no Dockerfile/compose/script/config (the FE Dockerfiles use `next.config.mjs`)                                                                                                                                                               | grep → 0                                              | ✅   | OWN: delete                                                                                                             |
| X7  | root `tsconfig.json:36` (`@backend/*`)                                                                                                                                                                                                                                                            | unused         | Path alias with zero imports anywhere (sibling `@/*` is used by the frontend only)                                                                                                                                                                         | grep `@backend/` → 0                                  | ✅   | DEL                                                                                                                     |
| X8  | root `package.json` `clean` script                                                                                                                                                                                                                                                                | half-removed   | `npm run clean --workspaces` but **neither workspace defines a `clean` script** → the command errors                                                                                                                                                       | FE/BE package.json scripts have no `clean`            | ✅   | FIX (remove, add `--if-present`, or add the workspace scripts)                                                          |
| X9  | `apps/frontend/package.json` (`@testing-library/user-event`); `apps/backend/package.json` (`jsonwebtoken`, `source-map-support`, `@nestjs/testing`, `@nestjs/schematics`)                                                                                                                         | unused         | Declared but zero imports (auth uses `@nestjs/jwt`; the backend specs construct services manually, no `Test.createTestingModule`)                                                                                                                          | per-dep grep → 0                                      | ✅   | DEL deps. ⚠️ `ts-loader`/`tsconfig-paths` also zero-import but kept as build-scaffold defaults — verify before deleting |
| X10 | `.env.example:66-70`, `.env.production.example:41-44`                                                                                                                                                                                                                                             | stale          | Both examples document an `SMTP_*` block the code never reads, while the email provider the code actually uses (`RESEND_API_KEY`, `email.service.ts:12`) is absent from **both** examples                                                                  | grep SMTP → 0 code hits; grep RESEND → 0 example hits | ✅   | FIX (swap the block)                                                                                                    |
| X11 | `scripts/quiz-csv/_patch.py`, `_patch2.py`, `_patch3.py`                                                                                                                                                                                                                                          | likely-unused  | One-off assert-based string-replacement scripts that already mutated their target `subjects/*.js` files; referenced by nothing (committed dev-scratch)                                                                                                     | grep `_patch` → 0 refs; read                          | ⚠️   | OWN (delete)                                                                                                            |
| X12 | `apps/backend/src/duels/**`                                                                                                                                                                                                                                                                       | — (state note) | Registered module with zero frontend consumers — mobile-app API by design; keep/kill decision already logged in `plan/future-features.md` §1                                                                                                               | grep → 0 FE refs                                      | ✅   | keep (documented) — informational                                                                                       |
| X13 | `apps/backend/src/common/interceptors/`                                                                                                                                                                                                                                                           | half-removed   | Empty directory (no files) — remnant of removed interceptors                                                                                                                                                                                               | `ls`                                                  | ✅   | DEL directory                                                                                                           |
| X14 | root launcher family: `auto-connect-server.ps1`, `auto-start-servers.ps1`, `deploy.ps1`, `launch-servers.ps1`, `monitor-servers.ps1`, `server-manager.ps1`, `start-ai-quiz.sh`, `start-servers-auto.ps1`, `start-servers-robust.ps1`, `stop-servers.ps1`, `STOP.bat`, `port-security-monitor.ps1` | likely-unused  | Referenced by no README/DEPLOYMENT/assistant-rules/PORT-REFERENCE/.github/package.json (the documented family is `start-ai-quiz.bat`, `check-status.ps1`, `deploy.sh`, `dokploy-deploy.sh`, `port-security-enforcer.ps1`, `validate:ports`)                | grep each name across docs → 0                        | ⚠️   | OWN (active manual dev tooling vs deletable)                                                                            |
| X15 | over-export pattern                                                                                                                                                                                                                                                                               | unused         | In-file-used exports across the codebase: 6 strategy classes/interfaces in `bulk-action-strategies.ts`, `ContentImportResult`/`ContentServiceDeps`, `RandomWeightOptions`, `BulkQuestionItemDto`, plus the per-feature type lists in §02/§03/§04/§11 above | grep                                                  | ✅   | batch unexport (cosmetic polish)                                                                                        |
| X16 | `gui-test-screenshots/` (untracked), root `backend.err`/`*.log`/`dist/` (ignored)                                                                                                                                                                                                                 | —              | Local strays; nothing product-side references them                                                                                                                                                                                                         | git status / check-ignore                             | ✅   | OWN (local cleanup)                                                                                                     |

**Clean (cross-cutting):** every other `common/` export consumed (cache, content utils incl. hash/dedup/random,
decorators, enums, filters, guards, validators, bulk-action service); `ports.ts` consumed via `app.constants`;
Redis genuinely used (`CacheService` → `ioredis`, matching the compose redis service); migration chain has no
orphan tables (`quiz_jokes`/`joke_chapters`/`joke_subjects` dropped by `1787821304000`; demographics dropped by
`1788400000000`); migration run auto-wired in production boot; `scripts/validate-ports.js`,
`fix-deps.js` (postinstall), `dedupe-riddle-mcqs.sql`, `check-theme-classes.mjs`, and the CSV generator suites
(`scripts/quiz-csv`, `scripts/joke-csv`, `scripts/riddle-csv`) all wired or documented; `.env` keys all read;
no console.log/TODO/FIXME debris in product code (dev scripts only); no `console.log`/`TODO`/`FIXME` in
`apps/frontend/src` or `apps/backend/src` product paths.

---

## Consolidated recommendation queue (for the follow-up cleanup pass — nothing done in this scan)

1. **Zero-risk deletions (✅-confirmed, no caller anywhere):**
   `lib/progress.ts` 7 functions; `getQuestionsBySubject`; `StatusCountResponse`; `PaginatedResponse` (riddle);
   `deleteImageRiddle`; `getRecentImageRiddles`; `updateJokeStatus` (backend); `MODULE_LABELS`; `StatusCounts`;
   `clearAll`/`clearQuizData`; `initialJokes`/`initialRiddles`; settings-types sextet; 8 constants in
   `app.constants.ts`; 2 DTOs in `base.dto.ts`; `run-migration.ts`; `@backend/*` alias;
   `CHALLENGE_HIGH_SCORE` key; broken `clean` script; empty `common/interceptors/` dir.
2. **Dependency trims (grep-verified):** FE `@testing-library/user-event`; BE `jsonwebtoken`,
   `source-map-support`, `@nestjs/testing`, `@nestjs/schematics` (verify `ts-loader`/`tsconfig-paths` first).
3. **Doc/config fixes:** env examples (SMTP → Resend keys); plan 03/04/05/06 stale passages; plan/TODO.md
   missing feature-15 row; root `clean` script.
4. **Merges:** `resolveMediaUrl` (one copy); `APP_URL` (import from `lib/seo.ts`); resend-verification via
   `authService`; analytics module lists (single source); social-platform lists; indexable-route registry (OWN);
   timer defaults (one source per group + rename FE `RIDDLE_TIMERS`).
5. **Owner decisions (one batch):** the ~28 consumerless backend endpoints (quiz ×2, riddles ×7,
   image-riddles ×11, jokes ×5, comments ×1, media ×1, achievements ×1) — keep as mobile/API surface or prune;
   duels keep/kill (already logged); image-riddles gameplay reading settings or not; admin riddle subject list
   using the public endpoint; dead `AuthContext.login/logout` — wire or remove; unwired seed/dev scripts and
   the undocumented launcher family.

_End of scan — no code, plan doc, or config was modified in this pass._

---

## Resolution log (2026-09-14 — follow-up pass, owner approved "resolve all")

Every actionable finding above was resolved the same day. Verification after all changes:
**backend `tsc --noEmit` clean · frontend `tsc --noEmit` clean · backend jest 83/83 across 11 suites ·
frontend jest 541/541 across 31 suites** (lockfile synced via `npm install`). No commits made —
changes are in the working tree for owner review.

### Deleted (dead code, grep-verified zero callers)

- `lib/progress.ts`: `getSubjectProgress`, `getRecentSessions`, `isChapterCompleted`,
  `getRecommendedChapters`, `clearAllProgress`, `exportProgress`, `importProgress`, plus the now
  write-only `updateSubjectProgress` writer (its only reader was `getSubjectProgress`).
- `lib/quiz-mcq-api.ts`: `getQuestionsBySubject` + `StatusCountResponse` + `QuestionFilters`.
- `lib/image-riddles-api.ts`: `deleteImageRiddle`, `getRecentImageRiddles`.
- `lib/storage.ts`: `clearAll`, `clearQuizData`, and 6 dead keys (`SETTINGS`, `SUBJECTS`, `QUESTIONS`,
  `RIDDLES`, `SUBJECT_PROGRESS`, `CHALLENGE_HIGH_SCORE`); stale "self-contained data" header updated.
- `lib/initial-data.ts`: `initialJokes`, `initialRiddles` (mock-era arrays).
- `lib/analytics.ts`: `MODULE_LABELS`; `EventsBrowser` module filter now derives from the new shared
  `ANALYTICS_MODULES` list (the unused `achievements` filter option dropped — no writer emits it).
- `types/quiz-mcq.ts`: `SubjectProgress` (+ `StatusCounts` from `types/status.types.ts`).
- `lib/riddle-mcq-api.ts`: `PaginatedResponse`.
- Backend: `updateJokeStatus` (dad-jokes.service), 8 constants in `app.constants.ts`
  (`ONE_*_MS/S`, `HTTP_STATUS`), `UpdateQuestionDto` + `UpdateSubjectDto` (base.dto),
  `run-migration.ts` (broken one-off, superseded by `migration:run`),
  `scripts/dev/fix-database.js` (emergency SQL superseded by migrations),
  `next.config.docker.js`, `scripts/quiz-csv/_patch*.py` (applied one-offs), empty
  `common/interceptors/` directory, `@backend/*` tsconfig alias.

### Merged / fixed

- `resolveMediaUrl`: single implementation now lives in `lib/public-settings.ts`; `lib/media-api.ts`
  re-exports it (no consumer import changes needed).
- `APP_URL`: robots/sitemap/layout import it from `lib/seo.ts` instead of redefining the fallback.
- OAuth resend: profile page uses `authService.resendVerification` instead of a raw `api.post`.
- `AuthContext`: dead `login`/`logout` methods removed (mount-time session hydration only).
- Indexable routes: new `INDEXABLE_ROUTES` registry in `lib/seo.ts`; `sitemap.ts` and
  `seo-audit.ts` `AUDIT_ROUTES` both derive from it (home path '' vs '/' normalized in the audit).
- Analytics modules: `ANALYTICS_MODULES` in `lib/analytics.ts` mirrors the backend list;
  `EventsBrowser.KNOWN_MODULES` consumes it.
- Social platforms: canonical `SOCIAL_PLATFORMS` exported from `SocialLinks.tsx`;
  `SettingsSection` derives its fields from it (label drift 'Twitter/X' vs 'X (Twitter)' eliminated).
- Timer constants: FE `RIDDLE_TIMERS` renamed to `RIDDLE_MCQ_TIMERS` (it mirrors the riddle-MCQ
  `riddles.defaults.levelTimers`); `game.ts defaultTimers` unexported (image-riddle timers, mirrors
  backend `imageRiddles.timers`).
- `seo-audit.ts`: no-op type-guard filter after `matchAll` replaced with a type-safe `flatMap`;
  stale comment fixed; `SeoHealth` unexported.
- Env examples: dead `SMTP_*` blocks replaced with the keys the code actually reads
  (`RESEND_API_KEY`, `FROM_EMAIL`); unused `SENTRY_DSN`/`ANALYTICS_ID` placeholders dropped.
- Root `clean` script: `--if-present` added (no workspace defines `clean`).

### Unexported (in-file-only symbols; ~40 across the files above plus)

`AuthResponse`, quiz/riddle/image-riddle API payload+param types, `RiddleResumeState/Identity/Progress`,
`RiddleHistoryEntry`, `Use*Args` hook-param types (10), `NavItem`, `PublicSettingsPayload`,
`ShareMenuProps`, `parseCSVLine`, `toCsv`, `TrackOptions`, `AnalyticsModuleName`,
`getDefaultActions`, `RiddleFilterParams`.

### Dependencies removed (lockfile synced)

Frontend: `@testing-library/user-event`. Backend: `jsonwebtoken`, `@types/jsonwebtoken`,
`source-map-support`, `@nestjs/testing`, `ts-loader`.
Kept deliberately: `@nestjs/schematics` (referenced by `nest-cli.json` collection),
`tsconfig-paths` (ts-node/typeorm path-mapping loader; backend tsconfig has a paths entry).

### Endpoint decisions (the "consumerless" cluster — kept, not deleted)

Every one of the ~28 consumerless endpoints is a **documented route in its feature plan's endpoint
map**, and the backend also serves the mobile client outside this repo. They are kept as the
deliberate API surface; only the dead _frontend wrappers_ around them were deleted
(`getQuestionsBySubject`, `deleteImageRiddle`, `getRecentImageRiddles`). Public reads
(image-riddle list/random/by-category/by-difficulty/by-id, jokes random/search/category reads,
riddle single reads, quiz session history + status-counts, `GET /comments/my`, `GET /media/:id`,
`GET /achievements/unlocks`) stay available to the mobile app. `DELETE /admin/image-riddles/:id`
and `/admin/image-riddles/dashboard/recent` remain per the plan 04 admin map (revisit with the
mobile-app decision if the admin surface should be minimized).

### Documented deferrals deliberately NOT touched

Guest heartbeat endpoint (plan 01 P3 open), admin user-edit UI (plan 01 P2), image-riddle
likes/server-progress/bulk-status (plan 04), jokes saved-state/SSR/trending (plan 05),
comments-on-quiz coverage (plan 07), object-storage swap (plan 08), web-manifest decision note
(manifest already shipped — plan 09 note now overtaken by events), analytics A5–A10/B6–B7/C1
(plan 13 §4b), newsletter campaigns (plan 14 §6), SEO P2/P3 (plan 15), duels module (mobile API,
keep/kill logged in future-features §1), root launcher family + `query-count.ts` +
`docker-startup.*` + unwired seed scripts (active/available dev tooling, no repo-internal callers).

### Docs updated

plan/03 (persistence inventory + bullet now describe `lib/riddle-persistence.ts`), plan/04
(public page fetch description now `/search`-driven; non-existent admin `/status-counts` removed
from the endpoint map), plan/05 (`/jokes/stats/overview` consumer claim corrected), plan/06
(evaluator table updated — Chapter Champion/Streak Master implemented; `RIDDLE_ACHIEVEMENTS`
removal recorded), plan/TODO.md (feature 15 row added).

**Result: no confirmed-dead code remains in the scanned product surface; every kept item is either
a documented API route, a sanctioned export seam, an explicitly deferred plan item, or active
dev tooling — each recorded above.**

---

## Resolution log — addendum (2026-09-14, second pass: owner decisions on the endpoint clusters)

Owner verdicts on the four buckets: **A delete · B build the missing UI · C keep (mobile app confirmed
in the works) · D wire**. Executed the same day. Verification after all changes: **backend `tsc
--noEmit` clean · frontend `tsc --noEmit` clean · backend jest 83/83 (11 suites) · frontend jest
541/541 (31 suites)**. No commits made — working tree holds everything for review.

### Bucket A — superseded endpoints deleted (backend routes + orphaned service methods + dead DTOs)

- image-riddles public: `GET /image-riddles` (root paginated), `GET /category/:id`,
  `GET /difficulty/:level`, `GET /status-counts` — the `/search` catalog is the replacement for all
  three list shapes; service methods `findAllRiddles` / `findRiddlesByCategory` /
  `findRiddlesByDifficulty` / `getStatusCounts` removed with their now-unused imports.
- image-riddles admin: `DELETE /admin/image-riddles/:id` (bulk-action is the plan-designated single
  status-change surface; the FE already deleted only via bulk) and
  `GET /admin/image-riddles/dashboard/recent` (`dashboard/stats` already embeds `recentRiddles` —
  the internal `getRecentRiddles(limit)` helper stays, it feeds the stats payload).
- quiz: `GET /quiz-mcq/subjects/:slug/status-counts` (admin `filter-counts` returns `statusCounts`).
- riddle-mcq: `GET /riddle-mcq/stats/status-counts` (same — riddle `filter-counts` includes
  `statusCounts`).
- jokes: `GET /jokes/classic/status-counts` (`JokesSection` computes status counts client-side via
  `useJokeFilters`).
- Dead support code that only served these routes: `BulkActionService.getStatusCounts`,
  `StatusCountResponse` (bulk-action-result interface), `StatusCountResponseDto` (bulk-action.dto).

### Bucket B — built the missing frontend halves

1. **Quiz session history** (`GET /quiz-mcq/sessions/history`): new `getQuizSessionHistory()` +
   `QuizSessionHistoryEntry` in `lib/quiz-mcq-api.ts`; the results page gained a collapsible
   "Session History (N synced)" panel — latest 20 server-backed sessions with subject/chapter,
   level, mode, date and color-coded score. GuestId-attributed like the existing high-scores call.
2. **Achievements re-hydration** (`GET /achievements/unlocks`): new `hydrateUnlocksFromServer()` in
   `lib/achievements.ts` — merges server unlocks into the local store (earlier timestamp wins,
   unknown ids dropped); called on the achievements page mount before first render, so the page
   shows the merged cross-device state. plan/06 P3 checked off.
3. **Jokes server-side search** (`GET /jokes/classic/search`): new `searchJokes(query, categoryId)`
   in `lib/jokes-api.ts`; the public page's search box now hits the server (300 ms debounce, sends
   the active category too), with the client-side filter kept as the offline fallback.
4. **Jokes server-side category view** (`GET /jokes/classic/category/:id`): new
   `getJokesByCategory(categoryId)`; when a category is active (sidebar or `?category=` deep link)
   and the API is reachable, the page displays the server-filtered set instead of client-filtering
   the full list. Vote optimistic updates + cross-tab sync patch the server-filtered view too.
5. **Riddle stats display** (`GET /riddle-mcq/stats/overview`): new `getRiddleStats()` +
   `RiddleStats` type; the riddle hub header shows "X riddles · Y subjects · Z categories" from the
   documented stats contract (fetched after render; hidden on failure so the hub never depends on it).

### Bucket C — kept (mobile app confirmed)

All 13 generic REST reads stay as the mobile/deep-link surface: single-item reads
(`/image-riddles/:id`, `/riddle-mcq/riddles/:id`, `/jokes/classic/categories/:id`,
`/image-riddles/categories/:id`, `/admin/image-riddles/:id`, `/admin/image-riddles/categories/:id`,
`GET /media/:id`), `/riddle-mcq/subjects/:slug`, the random endpoints
(`/image-riddles/random`, `/jokes/classic/random`), `GET /quiz-mcq/subjects/:slug/questions`,
`GET /riddle-mcq/stats/overview` (now also web-consumed), `GET /comments/my`.

### Bucket D — wired, not deleted

The riddle admin panel now lists subjects and categories through the admin endpoints
(`GET /riddle-mcq/subjects/all`, `GET /riddle-mcq/categories/all`) via new
`getAllSubjectsAdmin()` / `getAllCategoriesAdmin()` API wrappers — `useRiddleMcqSubjects` /
`useRiddleMcqCategories` no longer call the public active-only lists, so **inactive subjects no
longer vanish from the admin filters** (the R2 gap).

### Docs synced with the new reality

plan/02 (status section rewritten — the old "localStorage mock / no explanations / no-op streak"
passage predated the settings fix, `quiz_sessions`, and the evaluator fixes; endpoint map drops the
deleted status-counts route and marks history as UI-rendered), plan/03 (endpoint map: stats
contract + admin `/all` wiring; status section updated), plan/04 (inventory + endpoint map rewritten
to the search-catalog surface; deleted routes removed), plan/05 (server-search checkbox flipped to
built; status-counts row removed), plan/06 (re-hydration checkbox flipped to built; status +
touchpoints updated).

**Net effect: every backend endpoint now has a consumer (web UI or the documented mobile surface),
every documented planned feature in buckets A–D is either built or explicitly deferred by the plan,
and the plan endpoint maps match the code exactly.**
