# Feature 10 — Landing Page & Shared UI (TODO & Status)

> **Phase basis (applies to all feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> Same convention as `plan/quiz-mcq-analysis-plan.md` and `plan/riddle-mcq-analysis-plan.md`.
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

- [ ] **Wire StatsSection to `GET /analytics/summary`** (public, cached) so homepage stats are real; falls back gracefully if the endpoint fails.
- [ ] Verify homepage topic/mode cards are generated from live subject/category APIs (or explicitly document the hardcoded set) so new subjects appear without a code change.

### P2 — integration / quality

- [ ] Ensure `/play` is linked from the main nav and footer (currently a direct-URL entry; feature 09 owns the nav audit).
- [ ] Landing page SEO: it is the most crawled page — metadata/OG + server-rendered headline content (pairs with feature 09's SEO items).
- [ ] Health endpoints: document expected response shape and add a DB-check depth variant for deploys.

### P3 — polish / tech debt

- [ ] `components/ui` kit has no tests/storybook; fine while small — revisit if it grows.
- [ ] Landing animations (BubbleBackground) — verify reduced-motion preference is respected.

## 4. Cross-feature touchpoints

- **Features 02–05** — homepage topics/modes and `/play` deep-link into each game.
- **Site Shell & SEO (09)** — the landing renders inside the shell; SEO metadata strategy is shared.
- **Analytics (13)** — `GET /analytics/summary` is this page's natural data source (P1 wiring).
- **Admin Dashboard (12)** — health endpoints are ops-facing; probes used by deployment tooling.
