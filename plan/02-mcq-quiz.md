# Feature 02 — MCQ Quiz (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.

---

## 1. File inventory

Backend (`apps/backend/src/quiz-mcq/`):

| File                          | Purpose                                                                                                                                                                                                        | Size (verified) |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `quiz-mcq.module.ts`          | Controllers + service; repos for 3 entities; exports service                                                                                                                                                   | 19 lines        |
| `quiz-mcq.controller.ts`      | 27 endpoints under `/quiz-mcq` (public reads `@_Public`, admin CRUD guarded)                                                                                                                                   | 455 lines       |
| `quiz-mcq.service.ts`         | Extends shared ContentServiceBase; filter counts, CSV export, chapter taxonomy, capped random draws                                                                                                            | 854 lines       |
| `dto/export-query.dto.ts`     | Export query validation                                                                                                                                                                                        | —               |
| `entities/subject.entity.ts`  | `subjects`: unique slug, name, emoji, category, isActive, order                                                                                                                                                | —               |
| `entities/chapter.entity.ts`  | `chapters`: name, chapterNumber, unique(name+subjectId)                                                                                                                                                        | —               |
| `entities/question.entity.ts` | `questions`: jsonb options, correctAnswer/Letter, level enum easy→extreme, ContentStatus, order, `random_weight float8 default random()`, **`explanation` column (added 2026-08-30, migration 1788900000000)** | —               |

Frontend (`apps/frontend/src/`):

| File / dir                                                                               | Purpose                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/quiz-mcq/page.tsx`                                                                  | 4-stage wizard (Subject→Chapter→Mode→Level) via URL params; uses cached `/quiz-mcq/question-counts`                                                                                                                                                                                  |
| `app/quiz-mcq/play/page.tsx` + `play/components/*`                                       | Gameplay orchestration + 5 subcomponents (PreQuizSummary, GameHeader, SubmitConfirmModal, ExtendSessionModal, ResumePromptModal)                                                                                                                                                     |
| `app/quiz-mcq/timer-challenge/page.tsx`, `practice-mode/page.tsx`                        | Thin wrappers around shared `components/quiz-mcq/ChallengeHub.tsx` (the legacy `practice/` + `challenge/` redirect shims deleted)                                                                                                                                                    |
| `app/quiz-mcq/results/page.tsx`                                                          | Results from localStorage history + server-backed personal best; shared scorer                                                                                                                                                                                                       |
| `hooks/useQuizMcq.ts` + `hooks/use-quiz-mcq/*`                                           | Engine + extracted `quiz-engine.utils`, `useQuizTimers`, `useQuizResume`. **7 committed `track()` analytics calls** (session_started / session_resumed / question_answered / question_skipped / session_completed / achievement_unlocked / **session_abandoned**, module `quiz-mcq`) |
| `lib/quiz-mcq-api.ts`                                                                    | API client incl. `getSubjectRandomQuestions` (capped server-side random), `getQuestionCounts` → `/quiz-mcq/question-counts`                                                                                                                                                          |
| `lib/quiz-mcq-scoring.ts`                                                                | Single source of truth: isAnswerCorrect / calculateScore / calculateResult / calculateGrade; extreme = normalized text match                                                                                                                                                         |
| `lib/quiz-mcq-constants.ts`                                                              | Shared QUIZ_LEVELS / emojis / colors                                                                                                                                                                                                                                                 |
| `lib/quiz-mcq-resume.ts`                                                                 | Two-key resume store (`aiquiz:quiz-resume-questions` snapshot + `aiquiz:quiz-resume-session` progress)                                                                                                                                                                               |
| `components/quiz-mcq/*`                                                                  | ChallengeHub, QuestionCard, AnswerOptions (level-aware), BubbleEmojiEffect, FloatingBackground, ScoreCard, QuestionReview, ResultsCelebration, QuizCardSkeleton                                                                                                                      |
| `features/quiz-mcq-admin/**`                                                             | Admin CRUD (container, filters, table, 7 modals, TanStack Query hooks with optimistic updates) — renamed from `features/quiz-mcq`                                                                                                                                                    |
| `__tests__/quiz-mcq-scoring.test.ts` + `useQuizMcq.test.tsx` + `answer-options.test.tsx` | Regression tests — **26 quiz tests green**                                                                                                                                                                                                                                           |

## 2. Endpoint map

| Method & Path                                    | Auth         | Notes                                                                                                                                |
| ------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| GET `/quiz-mcq/subjects`                         | public       | `?hasContent=true`, `?includeInactive`                                                                                               |
| GET `/quiz-mcq/level-counts`                     | public       | cached per-level published counts (challenge hubs)                                                                                   |
| GET `/quiz-mcq/question-counts`                  | public       | cached per-subject/chapter counts with level breakdown (wizard)                                                                      |
| GET `/quiz-mcq/subjects/:slug/meta`              | public       | lightweight meta                                                                                                                     |
| GET `/quiz-mcq/subjects/:slug`                   | public       | with chapters                                                                                                                        |
| GET `/quiz-mcq/subjects/:slug/questions`         | public       | PUBLISHED only, throttled 60/min, unbounded if no `limit`                                                                            |
| GET `/quiz-mcq/filter-counts`                    | admin        | unified facet counts                                                                                                                 |
| POST/PUT/DELETE `/quiz-mcq/subjects[/:id]`       | admin        | CRUD with cascade deletes                                                                                                            |
| GET `/quiz-mcq/chapters`, `/chapters/:subjectId` | public       | list                                                                                                                                 |
| POST/PATCH/DELETE `/quiz-mcq/chapters[/:id]`     | admin        | CRUD                                                                                                                                 |
| GET `/quiz-mcq/questions`                        | admin        | paginated + filters                                                                                                                  |
| GET `/quiz-mcq/questions/export`                 | admin        | CSV                                                                                                                                  |
| GET `/quiz-mcq/questions/:chapterId`             | public       | PUBLISHED only                                                                                                                       |
| GET `/quiz-mcq/subjects/:slug/questions/random`  | public       | capped random (`count`, `level`, `chapterId`) — STANDARDS A2                                                                         |
| GET `/quiz-mcq/mixed`, `/quiz-mcq/random/:level` | public       | challenge pools via `random_weight` index-seek                                                                                       |
| POST `/quiz-mcq/questions`, `/questions/bulk`    | admin        | single + chunked import (auto subject/chapter creation)                                                                              |
| PATCH/DELETE `/quiz-mcq/questions/:id`           | admin        | draft→published→trash lifecycle                                                                                                      |
| POST `/quiz-mcq/bulk-action`                     | admin        | shared BulkActionService                                                                                                             |
| POST `/quiz-mcq/sessions`                        | optional JWT | save completed session (guestId attribution, DTO-validated)                                                                          |
| GET `/quiz-mcq/sessions/history`                 | optional JWT | latest 50 completed sessions for caller (token or guestId) — rendered on the results page as the cross-device "Session History" list |
| GET `/quiz-mcq/sessions/high-scores`             | optional JWT | server-backed personal bests                                                                                                         |

## 3. Current status

**Done:** full gameplay loop (wizard → play → results); level-aware answer formats (easy=True/False, medium=2, hard=3, expert=4, extreme=free-text); capped server-side random session fetch (`QUIZ_SESSION_SIZE = 20`); shared scorer with regression tests; two-key resume; chapter progress + achievements written on completion; complete admin CRUD with optimistic mutations and CSV import/export; **per-level timers read from the API-backed settings service (`GET /settings/public`, hardcoded fallback offline — feature 11)**; wizard + hubs run on cached public count endpoints (no N+1 loops); **server-side session persistence (`quiz_sessions`)** with `sessions/history` + `high-scores` reads, and the results page renders the cross-device **Session History** list beside the localStorage-backed review; explanations end-to-end (entity column + admin authoring + `QuestionReview` render); distinct unanswered state; challenge-streak and chapter-complete evaluators implemented (see feature 06).

**Not done / by design:** `ResultsCelebration.tryAgain` tier intentionally unused (candidate for a future encouragement animation, P3); unanswered questions score 0 (review marks them distinctly — no partial credit, by design).

## 4. Task breakdown

### P0 — critical / broken

- None open. Engine is stable, 22/22 tests pass, no known data-corruption or blocking bugs.

### P1 — major gaps

- [x] **Server-side session/result persistence**
- [x] **Challenge streak tracking**
- [x] **Distinct "unanswered" state**
- [x] **Explanations end-to-end**

### P2 — integration / quality

- [x] **Achievement condition audit**
- [x] **Analytics parity**
- [x] **Component-level tests for `AnswerOptions` and `QuestionReview`**
- [x] **Accessibility in `AnswerOptions`**
- [x] **Rename `features/quiz-mcq` → `features/quiz-mcq-admin`**

### P3 — polish / tech debt

- [x] **`ResultsCelebration` tiers**
- [x] **Delete legacy redirect shims**
- [x] **Day-streak vs challenge-streak consolidation**
- [x] **`quiz-mcq.service.ts` split evaluation**
- [ ] `ResultsCelebration.tryAgain` tier is intentionally unused — candidate for a future 'encouragement' animation.

## 5. Cross-feature touchpoints

- **Site Settings** — `play/page.tsx` reads `quiz.defaults.levelTimers` via the mock `SettingsService`; the mock never supplies `levelTimers`, so the hardcoded fallback always applies until feature 11's split-brain is fixed.
- **Achievements** — completion writes `saveQuizResult()` + `checkAchievements()`; unlock toasts + committed analytics events.
- **Analytics** — 7 instrumented events in the engine (module `quiz-mcq`); dashboard renders quiz-mcq rows in module breakdowns.
- **Admin Dashboard** — gameplay content managed via `features/quiz-mcq-admin` under the admin shell.

- **Sample import file:** `plan/imports/quiz-mcq-space-astronomy.csv` (+ `.json` for the bulk API) — 24 'Space & Astronomy' questions ready for the Import modal.

## 6 · QA-pass refinements (resolved 2026-09-19 — from QA-FINDINGS)

- **All inline mode+level pickers expanded by default (BUG-039)** — every chapter's picker renders
  open on load (`expandedChapters[index] ?? true`), in both Timer and Practice; verified 6/6 open.
- **Difficulty panel placement (BUG-044)** — the panel spans the full row (`col-span-full`) directly
  below its expanded subject row (was a child of the subjects grid, squeezed into one column).
- **Answer placement shuffle (BUG-041)** — audit found `correctLetter` was A-or-B for every MCQ
  level (never C/D) and easy mode pinned 'True' first; a serve-time shuffle was added at the shared
  random fetch (`ContentServiceBase.findRandom`) so correct answers distribute across slots at all levels.
- **Answer options grid (BUG-052, shared with riddle-mcq)** — `components/quiz-mcq/AnswerOptions.tsx`
  renders 2 options → 1×2 · 3 → row · 4 → 2×2 on sm+, stacked full-width on small screens.
  Adaptive refinement (owner 2026-09-21): mobile ALSO renders two columns; a question whose
  longest option exceeds ~18 chars (won't fit half a phone width) stacks single-column on mobile.
  Side gap: the answer grid stretches edge-to-edge inside the question card (-mx cancels the card
  padding), so there is no horizontal gap between the question container's sides and the options.
- **CSV leakage/ambiguity repair (TASK-03, fixed 2026-09-22, commit `c4faea6`)** — `scripts/repair-be09-csv.py` + `repair-be09-db.sql`, 10 rows fixed on both sides, re-audit clean. Residue (60 over-long riddles + the bakery-alibi contradiction) → NOW-07 in QA-FINDINGS.
- **Quiz share deep-link (TASK-27, fixed 2026-09-22, commit `c4faea6`)** — play URLs carry `qid=<uuid>`; shared links resolve by question identity with an opt-in "Unvisited" chip; Playwright PASS. Riddle-side deep-link → HARD-14 in QA-FINDINGS (deferred with reason).
- **Daily Challenge (NOW-08, built 2026-09-23 — verified locally, goes live on next push)** — `GET /quiz-mcq/daily` (deterministic per-date 10-question set via `md5(id || ':daily:<date>')`, identical for everyone, redis-cached, key-free), `POST /quiz-mcq/daily/result` (one attempt per identity per client-local date; `daily_challenge_results` table, migration `1793200000000`, partial unique indexes), `GET /quiz-mcq/daily/status` (streaks with yesterday-grace). Frontend `/quiz-mcq/daily` (noindex) reuses QuestionCard + shared scorer + server grading; Play Hub banner + home strip. v1 scope notes: share is text-based (no OG type yet); achievements not wired.
- **Answer explanations (NOW-09, quiz side 2026-09-23)** — `answers/check` + `answers/reveal` now carry `explanation`; in-play "💡 Why" panel + review fallback render it when present. DB fact: `questions.explanation` is populated for **0 / 11,541** published rows — the panel activates per-question as content is authored (content task, owner). Public list reads never shipped quiz explanations (nothing to leak), so no quiz-side strip was needed — the riddle side DID leak (see plan/03).
- **2026-09-24 hardening (public reads):** `toPublicQuestion` additionally strips
  `explanation` (future-proof against the riddle-class leak once content lands) and
  the internal `contentHash` / `random_weight` columns (no frontend consumer); the
  Daily Challenge set mirrors the identical strip. Live-site note: prod answer-strip
  on quiz lists IS live (phase-1 era); the remaining live exposures are riddle +
  image-riddle reads — resolved by the pending production push.
- **Daily Challenge play-fixes (2026-09-24, owner-reported "issue when playing"):**
  (a) **Correct answers rendered as ✕ in play** — AnswerOptions marked options via
  `correctKey`, which is ALWAYS empty on key-stripped payloads (HARD-02), so every
  selected answer showed ✕ + "your incorrect answer" even when correct (affected the
  main quiz + riddle play flows too, since the strip shipped). Fixed: the server
  verdict (`answerVerdict`) now drives the ✕/✔ icon, aria-label, and SR announcement;
  the correctKey compare remains as the legacy fallback. RiddleCard now passes its
  verdict through as well.
  (b) **Option-position bias in the daily set** — the daily built its set from stored
  rows without the BUG-041 serve-shuffle; stored distribution is A 3,986 / B 3,857 /
  C 1,320 / D 536, so correct answers sat on A/B ~79% of the time. Fixed: the daily
  now shuffles through a public `QuizMcqService.serveShuffledQuestions` seam (one
  shuffle implementation, no duplication).
  (c) **Open-ended questions removed from the daily pool** (`options IS NOT NULL`) —
  typing broke the quick-streak flow (and extremes have no options to shuffle).
  (d) **Play feel:** selection now locks instantly (optimistic) with the verdict
  landing a beat later (Next button is verdict-gated so nothing is skipped);
  QuestionCard remounts per question (key) so internal feedback/bubble state resets;
  played-today gate no longer offers a replay in the rare played-without-result edge.
  Verified with a full manual browser playthrough (marking ✓/✕ per verdict, 2-day
  streak carried, played-today lockout on reload).
- **Duel (NOW-09, shipped 2026-09-25):** the dormant duels backend
  (race mode: frozen question set per match, 6-char join codes, server-side
  grading via `POST /duels/:code/answer`, silence rule, reveal-on-finish) got
  its frontend: `/duel` page (noindex) — create (level + 10 questions → share
  code + `pigzap.com/duel?code=<code>` link), join by code, race play with
  instant verdict marking, revealed result comparison. Verified live:
  create → join → grade → finish on production. Duels API client:
  `lib/duels-api.ts`.
