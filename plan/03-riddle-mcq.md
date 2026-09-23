# Feature 03 — Riddle MCQ (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.

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

| File / dir                                                                                                                              | Purpose                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/riddle-mcq/page.tsx`                                                                                                               | **Unified hub** — mode (practice/timer) + difficulty picker inline, category browsing; consumes `?mode=` param                                                                                                                                      |
| `app/riddle-mcq/challenge/page.tsx`, `practice/page.tsx`                                                                                | Pure redirects to `/riddle-mcq?mode=timer` / `?mode=practice` (kept for back-links)                                                                                                                                                                 |
| `app/riddle-mcq/play/page.tsx` + `play/components/*`                                                                                    | Gameplay + PreRiddleSummary, ResumePromptModal, SubmitConfirmModal, ExtendSessionModal                                                                                                                                                              |
| `app/riddle-mcq/results/page.tsx`                                                                                                       | Results via `lib/riddle-session` lookup                                                                                                                                                                                                             |
| `app/riddle-mcq/components/`                                                                                                            | RiddleCard (reuses shared AnswerOptions/BubbleEmojiEffect), RiddleReview                                                                                                                                                                            |
| `app/riddle-mcq/error.tsx` / `loading.tsx`                                                                                              | Route-level boundaries                                                                                                                                                                                                                              |
| `hooks/use-riddle-play/useRiddlePlay.ts` + `useRiddleTimers.ts`                                                                         | Engine orchestration + clocks. **8 committed `track()` analytics calls** (session_started / session_resumed / question_answered / question_skipped / session_completed / **session_abandoned / session_extended / hint_used**, module `riddle-mcq`) |
| `lib/riddle-mcq-api.ts`                                                                                                                 | Typed client (incl. `getPublicLevelCounts`, `getRiddlesBySubject`, `getMixedRiddles`, `getRandomRiddles`)                                                                                                                                           |
| `lib/riddle-scoring.ts`                                                                                                                 | Single scorer `isRiddleAnswerCorrect` (MCQ letters + expert text)                                                                                                                                                                                   |
| `lib/riddle-persistence.ts`                                                                                                             | Consolidated persistence (plan P2): 10s autosave session store (also read once by the results page via `getRiddleSessionById`) + two-key resume store (snapshot written once + lightweight progress per tick)                                       |
| `lib/riddle-mode-param.ts`                                                                                                              | `parseModeParam` (lives outside the page module per Next.js export rules)                                                                                                                                                                           |
| `types/riddles.ts`                                                                                                                      | Types incl. `adaptRiddleMcq`                                                                                                                                                                                                                        |
| `features/riddle-mcq/**`                                                                                                                | Admin CRUD: container, filter rows, table rows, 7 React Query hooks, modals (create/edit with zod level-based option counts, category/subject, ImportModal + csv-parser)                                                                            |
| `__tests__/riddle-scoring.test.ts` (14), `riddle-csv-parser.test.ts` (11), `riddle-resume.test.ts` (6), `riddle-mode-param.test.ts` (1) | **41/41 passing across 6 suites**                                                                                                                                                                                                                   |

## 2. Endpoint map

| Method & Path                                                                           | Auth   | Notes                                                                              |
| --------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| GET `/riddle-mcq/all`                                                                   | admin  | paginated cached list with filters                                                 |
| GET `/riddle-mcq/level-counts`                                                          | public | per-subject×level published counts, 300s cache                                     |
| GET `/riddle-mcq/subjects/:subjectId/riddles`                                           | public | PUBLISHED only                                                                     |
| GET `/riddle-mcq/mixed?count<=100`, `/random/:level?count<=50`                          | public | `random_weight` index-seek random pools                                            |
| GET `/riddle-mcq/riddles/:id`                                                           | public | single PUBLISHED read                                                              |
| POST/PATCH/DELETE `/riddle-mcq/riddles[/:id]`                                           | admin  | CRUD, draft→published→trash lifecycle                                              |
| POST `/riddle-mcq/riddles/bulk`                                                         | admin  | chunked import                                                                     |
| POST `/riddle-mcq/riddles/bulk-action`                                                  | admin  | incl. restore→DRAFT                                                                |
| GET `/riddle-mcq/export`                                                                | admin  | category-grouped CSV                                                               |
| GET `/riddle-mcq/stats/overview`                                                        | public | hub header strip: `{totalRiddleMcqs, totalSubjects, totalCategories, mcqsByLevel}` |
| GET `/riddle-mcq/filter-counts`                                                         | admin  | facet counts for admin panel (incl. statusCounts)                                  |
| GET/POST/PATCH/DELETE `/riddle-mcq/subjects[/:slug or :id]`, `/all`, `?hasContent=true` | mixed  | subject CRUD + reads (admin panel lists via `/all` — inactive included)            |
| GET/POST/PATCH/DELETE `/riddle-mcq/categories[/:id]`, `/all`                            | mixed  | category CRUD + reads (admin panel lists via `/all`)                               |

## 3. Current status

**Done:** full game loop (unified hub → play → results); server-side level answer rules mirrored from FE zod (min options 2/3/4 per level, letter ranges, expert text answer); capped `random_weight` random pools; two-key resume store + 10s autosave; shared scorer across play/results/review incl. expert text; chunked CSV import/export with auto-created taxonomy; bulk actions with restore; family-scoped cache invalidation; public reads hard-filter PUBLISHED; recent commits wired ImportModal success invalidation, typed submit handlers, and expert text answers in review; the hub header renders catalog stats from `/riddle-mcq/stats/overview`; the admin panel lists subjects/categories through the `/all` admin endpoints (inactive included).

**Corrected vs the archived doc:**

- The shared `RiddleChallengeHub` component **no longer exists** — the hubs were unified into the riddle home page itself (mode + level picker inline); `challenge`/`practice` routes are now pure redirects. The old doc's "ChallengeHub" inventory entry is stale.
- Riddle levels are **easy→expert only** (expert = free-text answer); there is no extreme level — answers differ from quiz-mcq, which has 5 levels.
- In-flight persistence lives in the consolidated `lib/riddle-persistence.ts`: the 10s autosave session store (read once by the results page via `getRiddleSessionById`) and the two-key resume store.
- `useRiddlePlay.ts` has 8 committed analytics `track()` calls mirroring (and now exceeding) the quiz-mcq instrumentation.

## 4. Task breakdown

### P0 — critical / broken

- None open.

### P1 — major gaps

- [x] **Achievements/progress integration**
- [ ] Server-side session/result persistence — **deferred (owner-accepted)**. Note: quiz-mcq now has `quiz_sessions` (feature 02, commit `7525d9f`); extending the same design to riddles is ready to copy when the owner green-lights it.
- [ ] JSON import/export both sides — **deferred (owner-accepted)**.

### P2 — integration / quality

- [x] Analytics parity
- [x] **Consolidate riddle persistence**
- [x] **Component/hook tests**
- [ ] Targeted cache-invalidation tuning for stats/filter counts — **deferred (owner-accepted)**.
- [x] **Doc consistency** — this file updated in the same pass (persistence module references, inventory notes).

### P3 — polish / tech debt

- [x] Hint/skip tracking
- [x] **`riddle-mcq-question.service.ts` split evaluation**
- [x] **Legacy `chapterId` fallback**
- [x] Bulk import carries no `hint` field — CLOSED 2026-09-22 (was QA HARD-04): audit found the finding stale — the riddle import path already carries hint AND status end-to-end (import service honours `dto.hint`/`dto.status`; admin ImportModal maps both columns), so imported riddles fire the hint button and `hint_used` analytics.

## 5. Cross-feature touchpoints

- **Achievements** — riddle completions feed the combined quiz+riddle achievement evaluator.
- **Analytics** — 8 committed engine events (module `riddle-mcq`); dashboard module breakdowns already label `riddle-mcq`.
- **Admin Dashboard** — content managed via `features/riddle-mcq` under the admin shell; ImportModal invalidates lists on success.
- **MCQ Quiz** — shares the content-kit base (`ContentServiceBase` flat mode), shared UI components (AnswerOptions, BubbleEmojiEffect), and the two-key resume pattern; deliberately no shared session persistence yet.

- **Sample import file:** `plan/imports/riddle-mcq-lateral-thinking.csv` (+ `.json` for the bulk API) — 20 'Lateral Thinking' riddles ready for the Import modal.

## 6 · QA-pass refinements (resolved 2026-09-19/20 — from QA-FINDINGS)

- **Focused mode view (BUG-043)** — `/riddle-mcq?mode=practice|timer` renders only the matching
  mode's difficulty grid plus a Mix card (all subjects, all levels); the Browse-by-Category grid is
  hidden in that context. Verified in the browser.
- **Unified question action row (BUG-054)** — the riddle question card carries the quiz-style action
  row: `LikeButton` + comment toggle with public count chip + share → ShareMenu (riddle payload:
  riddle text + compact options, durable `/riddle-mcq` URL, answer never included); comments panel
  below, available pre-answer; open blocks advancing. GUI-verified; riddle-card suite 10/10.
- **Answer options grid (BUG-052, shared with quiz-mcq)** — the same `AnswerOptions.tsx` adaptive
  grid (2 → 1×2 · 3 → row · 4 → 2×2 on sm+, full-width stacked on small screens).
  Adaptive refinement (owner 2026-09-21): mobile ALSO renders two columns; a question whose
  longest option exceeds ~18 chars (won't fit half a phone width) stacks single-column on mobile.
  Side gap: the answer grid stretches edge-to-edge inside the question card (-mx cancels the card
  padding), so there is no horizontal gap between the question container's sides and the options.

## 7 · Explanations: leak fix + surfacing (NOW-09, 2026-09-23)

- **Leak fix (security):** `toPublicRiddle` stripped `correctAnswer`/`correctLetter`/`answer`
  but NOT `explanation` — and all 3,000 published riddles carry one, each explaining the
  answer ("it's a coffin because…"). Every pre-answer public read (subject riddles, mixed,
  random, by-id) was therefore shipping an answer key. Fixed: explanation deleted from
  public payloads; it now returns ONLY with the verdict (`answers/check` — post-answer,
  safe) and from `answers/reveal` (post-session review; the reveal response gained the
  field, and RiddleReview falls back to it since snapshots no longer carry it).
- **Surfacing:** in-play "💡 Why" panel under the options after the verdict (RiddleCard);
  review keeps hint + explanation (explanation from snapshot-or-reveal). `Riddle.explanation`
  is populated 3,000/3,000, so this renders on every riddle answer.
- Verified live local: public payload has no explanation/hint stays public; check returns
  `{correct, explanation}`; frontend/backend tsc + suites green.

- **2026-09-24 hardening:** `toPublicRiddle` also strips the internal-only
  `contentHash` / `random_weight` columns (no frontend consumer — grep-verified).
  LIVE NOTE: prod runs pre-`2b17264` code, so the live riddle reads still ship the
  full key until the next production push.
