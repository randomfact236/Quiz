# Feature 03 — Riddle MCQ (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30; **re-audited + E2E-tested 2026-09-05** (20 riddles seeded via the bulk-import flow — subject 'Brain Teasers'). Supersedes `docs/features/archive/riddle-mcq.md`
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

| File / dir                                                                                                                              | Purpose                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/riddle-mcq/page.tsx`                                                                                                               | **Unified hub** — mode (practice/timer) + difficulty picker inline, category browsing; consumes `?mode=` param                                                                                                                                                                        |
| `app/riddle-mcq/challenge/page.tsx`, `practice/page.tsx`                                                                                | Pure redirects to `/riddle-mcq?mode=timer` / `?mode=practice` (kept for back-links)                                                                                                                                                                                                   |
| `app/riddle-mcq/play/page.tsx` + `play/components/*`                                                                                    | Gameplay + PreRiddleSummary, ResumePromptModal, SubmitConfirmModal, ExtendSessionModal                                                                                                                                                                                                |
| `app/riddle-mcq/results/page.tsx`                                                                                                       | Results via `lib/riddle-session` lookup                                                                                                                                                                                                                                               |
| `app/riddle-mcq/components/`                                                                                                            | RiddleCard (reuses shared AnswerOptions/BubbleEmojiEffect), RiddleReview                                                                                                                                                                                                              |
| `app/riddle-mcq/error.tsx` / `loading.tsx`                                                                                              | Route-level boundaries                                                                                                                                                                                                                                                                |
| `hooks/use-riddle-play/useRiddlePlay.ts` + `useRiddleTimers.ts`                                                                         | Engine orchestration + clocks. **8 committed `track()` analytics calls** (session_started / session_resumed / question_answered / question_skipped / session_completed / **session_abandoned / session_extended / hint_used** — the last three added 2026-09-05, module `riddle-mcq`) |
| `lib/riddle-mcq-api.ts`                                                                                                                 | Typed client (incl. `getPublicLevelCounts`, `getRiddlesBySubject`, `getMixedRiddles`, `getRandomRiddles`)                                                                                                                                                                             |
| `lib/riddle-scoring.ts`                                                                                                                 | Single scorer `isRiddleAnswerCorrect` (MCQ letters + expert text)                                                                                                                                                                                                                     |
| `lib/riddle-resume.ts`                                                                                                                  | Two-key resume store (snapshot written once + lightweight progress per tick)                                                                                                                                                                                                          |
| `lib/riddle-session.ts`                                                                                                                 | 10s autosave session store; also read by results page (`getRiddleSessionById`)                                                                                                                                                                                                        |
| `lib/riddle-mode-param.ts`                                                                                                              | `parseModeParam` (lives outside the page module per Next.js export rules)                                                                                                                                                                                                             |
| `types/riddles.ts`                                                                                                                      | Types incl. `adaptRiddleMcq`                                                                                                                                                                                                                                                          |
| `features/riddle-mcq/**`                                                                                                                | Admin CRUD: container, filter rows, table rows, 7 React Query hooks, modals (create/edit with zod level-based option counts, category/subject, ImportModal + csv-parser)                                                                                                              |
| `__tests__/riddle-scoring.test.ts` (14), `riddle-csv-parser.test.ts` (11), `riddle-resume.test.ts` (6), `riddle-mode-param.test.ts` (1) | **41/41 passing across 6 suites (re-run 2026-09-05: scoring 14, csv-parser 11, resume 6, mode-param 1, useRiddlePlay 2, riddle-card 7)**                                                                                                                                              |

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
- ~~No achievements or progress integration~~ — RESOLVED 2026-08-30: `lib/riddle-progress.ts` records completions and combined quiz+riddle achievements evaluate on submit (P1 #1). Server-side session history remains deferred (owner-accepted).
- Persistence uses **two** localStorage stores side by side: `lib/riddle-resume.ts` (two-key resume) and `lib/riddle-session.ts` (10s autosave, read by results). Functional but redundant.
- `useRiddlePlay.ts` has 8 committed analytics `track()` calls mirroring (and now exceeding) the quiz-mcq instrumentation.

## 4. Task breakdown

### P0 — critical / broken

- None open. Tests 41/41 pass (re-run 2026-09-05); no known blocking bugs (all former P0s fixed 2026-08-25/26, re-verified via code review).

### P1 — major gaps

- [x] **Achievements/progress integration** — DONE 2026-08-30 (commit `ea2098e`): new `lib/riddle-progress.ts` (capped completion history + stats); `getTotalStats` and `checkAchievements` evaluate a combined quiz+riddle history (chapter-scoped conditions skip blank-chapter riddles); riddle submit records the completion and toasts unlocks. 5 tests.
- [ ] Server-side session/result persistence — **deferred (owner-accepted 2026-08-26, reaffirmed 2026-08-30)**. Note: quiz-mcq now has `quiz_sessions` (feature 02, commit `7525d9f`); extending the same design to riddles is ready to copy when the owner green-lights it.
- [ ] JSON import/export both sides — **deferred (owner-accepted 2026-08-26, reaffirmed 2026-08-30)**.

### P2 — integration / quality

- [x] Analytics parity — RESOLVED 2026-09-05 (supersedes the deferral): 8 committed `track()` calls incl. abandonment/extend/hint (F13 A1–A3).
- [x] **Consolidate riddle persistence** — DONE 2026-08-30 (commit `95fc0d1`): `lib/riddle-session.ts` + `lib/riddle-resume.ts` merged into `lib/riddle-persistence.ts` (one module, shared 24h expiry, storage layouts unchanged); results page + engine + tests updated; old files removed.
- [x] **Component/hook tests** — DONE 2026-08-30 (commits `eabbdab`, `8db4432`-range): `useRiddlePlay` (timer auto-submit → single results redirect; resume round-trip restoring saved answers) and `RiddleCard` (level-format slicing, expert→extreme input, selection routing, ref) + `adaptRiddleMcq` mapping. Frontend suite 172/172.
- [ ] Targeted cache-invalidation tuning for stats/filter counts — **deferred (owner-accepted 2026-08-26, reaffirmed 2026-08-30)**.
- [x] **Doc consistency** — this file updated in the same pass (persistence module references, inventory notes).

### P3 — polish / tech debt

- [x] Hint/skip tracking — DONE 2026-09-05: `hint_used` now emits with a real `hintsUsed` counter (RiddleCard → play page `onHintShown` wiring; the `hintsUsed` property on session_completed previously always reported 0), `question_skipped` existed.
- [x] **`riddle-mcq-question.service.ts` split evaluation** — EVALUATED 2026-08-30: still 362 lines and stable (no growth since the audit); the level-rule validation is cohesive with the create/update paths it guards. Split only if it grows or a second consumer needs the rules.
- [x] **Legacy `chapterId` fallback** — REVIEWED 2026-08-30, keeping it: all in-repo link generators use `subjectId` (hub, results retry, MobileFooter), but old external links (bookmarks/search index) can't be audited; the 2-line fallback maps them to the same play flow at zero cost. Revisit only if param handling gets rewritten.

## 5. Cross-feature touchpoints

- **Achievements** — integrated 2026-08-30: riddle completions feed the combined quiz+riddle achievement evaluator.
- **Analytics** — 8 committed engine events (module `riddle-mcq`); dashboard module breakdowns already label `riddle-mcq`.
- **Admin Dashboard** — content managed via `features/riddle-mcq` under the admin shell; ImportModal invalidates lists on success.
- **MCQ Quiz** — shares the content-kit base (`ContentServiceBase` flat mode), shared UI components (AnswerOptions, BubbleEmojiEffect), and the two-key resume pattern; deliberately no shared session persistence yet.

## 6. Extras (2026-09-05 audit — noted, not acted on)

- **Seeded test content:** 20 published riddles via the bulk-import endpoint (subject
  **"Brain Teasers"**, category "Classic Riddles"; 8 easy / 5 medium / 6 hard / 1 expert) — kept
  in the dev DB for manual testing.
- **Riddle session persistence still deferred (P1 #2):** quiz's `quiz_sessions` design is ready
  to copy when green-lit; until then riddle completions exist only in localStorage +
  achievements.
- **Import shape differs from quiz-mcq:** riddle bulk import takes a bare array of
  `BulkCreateRiddleDto` (question/options/correctLetter/level/subjectName/categoryName), while
  quiz wraps in `{ subjectName, questions: [...] }` — fine, but worth knowing when writing
  import tooling for both.
- **Browser E2E environment note:** the in-app automation browser intermittently resets SPA
  tabs to `about:blank` (seen on quiz + riddle flows, unrelated to app code — plain curl probes
  of the same endpoints always succeed). Long automated click-throughs are paced inside the
  page to cope.
- **Bulk import carries no `hint` field** — `BulkCreateRiddleDto` has question/options/
  correctLetter/level/subject/category only, so imported riddles have no hint and the
  RiddleCard hint button (and the new `hint_used` analytics) can't fire on imported content.
  Admin-created riddles via the QuestionModal can include hints. Add a `hint` field to the
  bulk DTO if imported-riddle hints are wanted.
