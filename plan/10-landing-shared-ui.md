# Feature 10 — Landing Page & Shared UI (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30. No archived ledger doc existed — built from current code.
> Added after the initial 9-file pass (user request): the homepage, the `/play` picker, health endpoints,
> and the shared UI kit previously had no owner.

---

## 1. File inventory

Frontend (`apps/frontend/src/`):

| File                                                                          | Purpose                                                                                                                         | Size (verified)          |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `app/page.tsx`                                                                | Landing page shell                                                                                                              | 28 lines                 |
| `app/components/home/TopicsSection.tsx` + `TopicCard.tsx`, `TopicSection.tsx` | Subject/topic browsing cards on the homepage                                                                                    | 271 lines (TopicSection) |
| `app/components/home/ModeCards.tsx`                                           | Game-mode entry cards                                                                                                           | —                        |
| `app/components/home/StatsSection.tsx`                                        | Site stats display — **renders without any API call** (no fetch/API import found)                                               | —                        |
| `app/components/home/BubbleBackground.tsx`                                    | Decorative background                                                                                                           | —                        |
| `app/play/page.tsx`                                                           | **Unified Game Picker** — single entry across content types (Timer/Practice → Quiz or Riddle); direct feature URLs keep working | —                        |
| `components/ui/*`                                                             | Shared kit: StatusDashboard, BulkActionToolbar, QuizCardSkeleton, ToastContainer (unmounted — feature 09 P0)                    | —                        |
| `lib/constants.ts`                                                            | Shared constants (`RIDDLE_TIMERS`, `DEFAULT_QUIZ_TIME_LIMIT`, `MOCK_API_DELAY_MS`, …)                                           | —                        |

Backend (`apps/backend/src/health/`):

| File                   | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `health.controller.ts` | `GET /health` (aggregated) + `GET /health/liveness` — deployment probes |
| `health.module.ts`     | Wiring                                                                  |

## 2. Current status (verified)

**Done:** homepage composes topics/modes/stats sections; `/play` provides a cross-feature picker while preserving deep links; shared UI kit reused by admin sections; health endpoints exist for probes.

**Gaps:**

- **StatsSection is static** — the homepage "stats" display no real numbers, while the public `GET /analytics/summary` endpoint (`{ totalSessionsCompleted, sessionsCompletedByModule, activeQuizzers30d }`) sits unused (flagged in feature 13). These are two halves of the same task.
- The landing "topics" data path vs the per-feature subject APIs is separate — verify they can't drift (hardcoded topic lists vs live subjects).
- No feature file owned `/play` before this one — it is not linked from every surface; check nav coverage (feature 09 owns the shell links).

## 3. Task breakdown

### P0 — critical / broken

- None open.

### P1 — major gaps

- [x] **StatsSection wired to `GET /analytics/summary`** — DONE 2026-08-30: site-wide cards (sessions completed, active quizzers 30d, quiz/riddle session counts by module) with graceful fallback to the visitor's local stats when the API fails.
- [x] **Topic/mode cards live-data check** — VERIFIED 2026-08-30: `TopicSection` fetches subjects + per-subject question counts from the public APIs at runtime; nothing hardcoded (mode cards are the game's fixed modes by design).

### P2 — integration / quality

- [x] **`/play` linked from nav** — DONE 2026-08-30: added to `lib/nav-config.ts` ("Play Hub"), so Header (both variants) and Footer menus all carry it.
- [x] **Landing SEO** — VERIFIED 2026-08-30: the home route inherits the root layout's OG/Twitter metadata and is included in `app/sitemap.ts` (priority 1). Server-rendered headline content pairs with the JotD SSR owner decision (feature 09).
- [x] **Health endpoints documented** — the DB-depth variant already exists (`GET /health/readiness` = DB-only ping; `GET /health/liveness` = process-only `{status:'ok',timestamp}`; `GET /health` = full check with `{status, info:{database,memory_heap,memory_rss,disk}, error, details}` — 503 when any indicator is down, e.g. the disk-threshold trip seen on this dev machine).

### P3 — polish / tech debt

- [x] **`components/ui` kit tests** — ACCEPTED as-is 2026-08-30 (small, stable; revisit on growth — per plan's own bar).
- [x] **Reduced motion** — DONE 2026-08-30: BubbleBackground bubbles carry `motion-reduce:animate-none`; framer-motion sections respect the OS setting via the library's built-in reduced-motion handling.

## 4. Cross-feature touchpoints

- **Features 02–05** — homepage topics/modes and `/play` deep-link into each game.
- **Site Shell & SEO (09)** — the landing renders inside the shell; SEO metadata strategy is shared.
- **Analytics (13)** — `GET /analytics/summary` is this page's natural data source (P1 wiring).
- **Admin Dashboard (12)** — health endpoints are ops-facing; probes used by deployment tooling.

## 6. Extras (2026-09-05 F10 five-step pass — verification only, no defects)

- **E2E re-verified live:** homepage renders the seeded "Test Science" topic card (live subject
  fetch), mode cards, and the StatsSection consuming `GET /analytics/summary`; `/play` picker
  lists all four game modes; `/play` remains in the nav config for header/footer.
- **Step 1 (seed) note:** the landing has no own content unit — its data is the subjects seeded
  during the F02–F05 passes (Test Science / Brain Teasers / E2E Test category), which is exactly
  what the live TopicSection now displays.
- **Dead-code audit clean:** all home components, BubbleBackground, and `RIDDLE_TIMERS` are
  referenced; no orphan exports found in the shared kit.
- The remaining "gaps" bullets in §2 were rewritten by earlier passes and are now historical;
  the two §2 bullets that remain (topics drift check, /play nav coverage) are closed by P2 items.

## 7. Quiz Topics categorized redesign (2026-09-06 — implemented, owner design)

- Homepage Topics section rebuilt as **"🗂️ Quiz Topics"** (owner design 07 blend): three purple
  gradient banner headers — **Academic / Professional & Life / Entertainment & Culture** — with
  decorative lines, subject-count pill and collapsible chevron; subjects render as colorful
  gradient cards (emoji + question count), zero-question subjects show **Coming Soon**; empty
  worlds show an "assignable in admin" ghost card.
- **Auto-ordering by clicks (owner request):** new public `GET /quiz-mcq/subject-clicks`
  (per-subject `session_started` counts, cached 60s) — worlds sort by total clicks and cards by
  clicks within each world, highest first; graceful fallback to order-field when the feed fails.
- **Admin assignment:** new `SubjectCategoryManager` panel in Admin → Quiz MCQ — the three world
  headings with per-subject selects; persists via subject `category` (UpdateSubjectDto now
  accepts it). `UpdateSubjectDto` category field added (backend, 1-line DTO change).
- Dummy subject **"Movies & TV"** (Entertainment & Culture, 3 published questions) seeded via
  bulk import to demo the design.
