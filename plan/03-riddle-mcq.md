# Feature 03 — Riddle MCQ (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30. Supersedes `docs/features/archive/riddle-mcq.md`
> (archived 2026-08-30 via `git mv`, history preserved; every claim re-checked against code —
> stale claims from the old doc were dropped or corrected).

---

## 1. File inventory

Backend (`apps/backend/src/riddle-mcq/`):

| File                                                              | Purpose                                                                                                                                                                                      | Size (verified) |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `riddle-mcq.module.ts`                                            | 3 controllers + 6 services, TypeORM repos + cache                                                                                                                                            | —               |
| `controllers/riddle-mcq.controller.ts`                            | Main `/riddle-mcq` endpoints (Swagger-tagged)                                                                                                                                                | 246 lines       |
| `controllers/riddle-mcq-subject.controller.ts`                    | `/riddle-mcq/subjects` CRUD + `:slug` reads                                                                                                                                                  | 84 lines        |
| `controllers/riddle-mcq-category.controller.ts`                   | `/riddle-mcq/categories` CRUD                                                                                                                                                                | 83 lines        |
| `services/riddle-mcq-question.service.ts`                         | Extends shared ContentServiceBase in **flat taxonomy mode** (Subject→riddles, no chapter layer); level answer rules enforced server-side; published-only public reads                        | 362 lines       |
| `services/riddle-mcq-category.service.ts` / `-subject.service.ts` | CRUD + transactional cascade deletes + counts                                                                                                                                                | 193 / 244 lines |
| `services/riddle-mcq-import.service.ts`                           | Chunked (100) transactional import, auto-created categories/subjects; category-grouped CSV export                                                                                            | 238 lines       |
| `services/riddle-mcq-bulk-actions.service.ts`                     | Per-id delete/publish/draft/trash/restore                                                                                                                                                    | 112 lines       |
| `services/riddle-mcq-stats.service.ts`                            | `getStats()`, cached filterCounts, public per-subject×level counts, statusCountsBySubject                                                                                                    | 264 lines       |
| `entities/riddle-mcq.entity.ts`                                   | `riddle_mcqs`: simple-json options, correctLetter/answer, level enum **easy→expert** (no extreme), status draft/published/trash, composite index (subjectId, level, status), `random_weight` | —               |
| `entities/riddle-subject.entity.ts` / `riddle-category.entity.ts` | `riddle_subjects` (unique slug) and `riddle_categories` (unique slug, emoji) — Category 1–N Subjects 1–N Riddles                                                                             | —               |
| `dto/` (create/update split), `validators/`, `utils/`             | DTOs, pagination/difficulty validators, shared slug util, csv-export util                                                                                                                    | —               |

Frontend (`apps/frontend/src/`):

| File / dir                                                                                                                              | Purpose                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/riddle-mcq/page.tsx`                                                                                                               | **Unified hub** — mode (practice/timer) + difficulty picker inline, category browsing; consumes `?mode=` param                                                                                                   |
| `app/riddle-mcq/challenge/page.tsx`, `practice/page.tsx`                                                                                | Pure redirects to `/riddle-mcq?mode=timer` / `?mode=practice` (kept for back-links)                                                                                                                              |
| `app/riddle-mcq/play/page.tsx` + `play/components/*`                                                                                    | Gameplay + PreRiddleSummary, ResumePromptModal, SubmitConfirmModal, ExtendSessionModal                                                                                                                           |
| `app/riddle-mcq/results/page.tsx`                                                                                                       | Results via `lib/riddle-session` lookup                                                                                                                                                                          |
| `app/riddle-mcq/components/`                                                                                                            | RiddleCard (reuses shared AnswerOptions/BubbleEmojiEffect), RiddleReview                                                                                                                                         |
| `app/riddle-mcq/error.tsx` / `loading.tsx`                                                                                              | Route-level boundaries                                                                                                                                                                                           |
| `hooks/use-riddle-play/useRiddlePlay.ts` + `useRiddleTimers.ts`                                                                         | Engine orchestration + clocks. **Uncommitted work-in-progress: 5 `track()` analytics calls** (session_started / session_resumed / question_answered / question_skipped / session_completed, module `riddle-mcq`) |
| `lib/riddle-mcq-api.ts`                                                                                                                 | Typed client (incl. `getPublicLevelCounts`, `getRiddlesBySubject`, `getMixedRiddles`, `getRandomRiddles`)                                                                                                        |
| `lib/riddle-scoring.ts`                                                                                                                 | Single scorer `isRiddleAnswerCorrect` (MCQ letters + expert text)                                                                                                                                                |
| `lib/riddle-resume.ts`                                                                                                                  | Two-key resume store (snapshot written once + lightweight progress per tick)                                                                                                                                     |
| `lib/riddle-session.ts`                                                                                                                 | 10s autosave session store; also read by results page (`getRiddleSessionById`)                                                                                                                                   |
| `lib/riddle-mode-param.ts`                                                                                                              | `parseModeParam` (lives outside the page module per Next.js export rules)                                                                                                                                        |
| `types/riddles.ts`                                                                                                                      | Types incl. `adaptRiddleMcq`                                                                                                                                                                                     |
| `features/riddle-mcq/**`                                                                                                                | Admin CRUD: container, filter rows, table rows, 7 React Query hooks, modals (create/edit with zod level-based option counts, category/subject, ImportModal + csv-parser)                                         |
| `__tests__/riddle-scoring.test.ts` (14), `riddle-csv-parser.test.ts` (11), `riddle-resume.test.ts` (6), `riddle-mode-param.test.ts` (1) | **32/32 passing (verified 2026-08-30)**                                                                                                                                                                          |

## 2. Endpoint map (verified against controllers 2026-08-30)

| Method & Path                                                                           | Auth   | Notes                                                       |
| --------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| GET `/riddle-mcq/all`                                                                   | admin  | paginated cached list with filters                          |
| GET `/riddle-mcq/level-counts`                                                          | public | per-subject×level published counts, 300s cache              |
| GET `/riddle-mcq/subjects/:subjectId/riddles`                                           | public | PUBLISHED only                                              |
| GET `/riddle-mcq/mixed?count<=100`, `/random/:level?count<=50`                          | public | `random_weight` index-seek random pools                     |
| GET `/riddle-mcq/riddles/:id`                                                           | public | single PUBLISHED read                                       |
| POST/PATCH/DELETE `/riddle-mcq/riddles[/:id]`                                           | admin  | CRUD, draft→published→trash lifecycle                       |
| POST `/riddle-mcq/riddles/bulk`                                                         | admin  | chunked import                                              |
| POST `/riddle-mcq/riddles/bulk-action`                                                  | admin  | incl. restore→DRAFT                                         |
| GET `/riddle-mcq/export`                                                                | admin  | category-grouped CSV                                        |
| GET `/riddle-mcq/stats/overview`                                                        | public | FE contract `{totalRiddleMcqs, totalSubjects, mcqsByLevel}` |
| GET `/riddle-mcq/filter-counts`                                                         | admin  | facet counts for admin panel                                |
| GET `/riddle-mcq/stats/status-counts?subject`                                           | admin  | per-status counts                                           |
| GET/POST/PATCH/DELETE `/riddle-mcq/subjects[/:slug or :id]`, `/all`, `?hasContent=true` | mixed  | subject CRUD + reads                                        |
| GET/POST/PATCH/DELETE `/riddle-mcq/categories[/:id]`, `/all`                            | mixed  | category CRUD + reads                                       |

## 3. Current status (verified)

**Done:** full game loop (unified hub → play → results); server-side level answer rules mirrored from FE zod (min options 2/3/4 per level, letter ranges, expert text answer); capped `random_weight` random pools; two-key resume store + 10s autosave; shared scorer across play/results/review incl. expert text; chunked CSV import/export with auto-created taxonomy; bulk actions with restore; family-scoped cache invalidation; public reads hard-filter PUBLISHED; recent commits wired ImportModal success invalidation, typed submit handlers, and expert text answers in review.

**Corrected vs the archived doc:**

- The shared `RiddleChallengeHub` component **no longer exists** — the hubs were unified into the riddle home page itself (mode + level picker inline); `challenge`/`practice` routes are now pure redirects. The old doc's "ChallengeHub" inventory entry is stale.
- Riddle levels are **easy→expert only** (expert = free-text answer); there is no extreme level — answers differ from quiz-mcq, which has 5 levels.
- **No achievements or progress integration at all** — `useRiddlePlay`/results never call `saveQuizResult` or `checkAchievements`, so riddle completions don't count toward any achievement, history, or progress stats (quiz-mcq does both). Session history writes remain deferred (owner-accepted).
- Persistence uses **two** localStorage stores side by side: `lib/riddle-resume.ts` (two-key resume) and `lib/riddle-session.ts` (10s autosave, read by results). Functional but redundant.
- `useRiddlePlay.ts` has 5 uncommitted analytics `track()` calls mirroring the quiz-mcq instrumentation.

## 4. Task breakdown

### P0 — critical / broken

- None open. Tests 32/32 pass; no known blocking bugs (all former P0s fixed 2026-08-25/26, re-verified via code review).

### P1 — major gaps

- [ ] Achievements/progress integration: riddle completions currently feed nothing — wire `saveQuizResult`-equivalent + `checkAchievements` (or a riddle-aware stats source) so the Achievements feature sees riddle play.
- [ ] Server-side session/result persistence (localStorage-only, deferred owner-accepted) — same gap as quiz-mcq; ideally share one design/sessions table.
- [ ] JSON import/export both sides (CSV-only today; deferred owner-accepted).

### P2 — integration / quality

- [ ] Commit the 5 `track()` calls in `useRiddlePlay.ts` when the analytics feature is revisited (paused by decision 2026-08-30 — do not build out further for now).
- [ ] Consolidate `lib/riddle-session.ts` and `lib/riddle-resume.ts` into one persistence module (results page still reads the legacy single-key store).
- [ ] Component/hook tests: `useRiddlePlay` (resume round-trip, auto-submit) and `RiddleCard` level-format behavior — only scoring/csv/resume/mode-param suites exist.
- [ ] Targeted cache-invalidation tuning for stats/filter counts (deferred owner-accepted).
- [ ] Doc consistency: keep this file in sync when the pending riddle-mcq review fixes (C3/R5/R8 commits) land in a release.

### P3 — polish / tech debt

- [ ] Hint/skip tracking (needs product decision, deferred).
- [ ] `riddle-mcq-question.service.ts` (362 lines) — split level-rule validation out if it grows.
- [ ] Remove the legacy `chapterId` fallback param handling once certain no old links use it.

## 5. Cross-feature touchpoints

- **Achievements** — no integration (P1 gap); quiz-mcq writes unlocks, riddle does not.
- **Analytics** — 5 uncommitted engine events (module `riddle-mcq`); dashboard module breakdowns already label `riddle-mcq`.
- **Admin Dashboard** — content managed via `features/riddle-mcq` under the admin shell; ImportModal invalidates lists on success.
- **MCQ Quiz** — shares the content-kit base (`ContentServiceBase` flat mode), shared UI components (AnswerOptions, BubbleEmojiEffect), and the two-key resume pattern; deliberately no shared session persistence yet.
