# Feature 02 — MCQ Quiz (TODO & Status)

> **Phase basis (applies to all 9 feature TODO files):** tasks are divided by priority phase —
> **P0** = critical / broken (blocks users or corrupts data) · **P1** = major gaps (missing core capability) ·
> **P2** = integration / quality (cross-feature wiring, tests, consistency) · **P3** = polish / tech debt.
> See `plan/STANDARDS.md` §1.
>
> Verified against the live codebase: 2026-08-30. Supersedes `docs/features/archive/quiz-mcq.md`
> (archived 2026-08-30 via `git mv`, history preserved; every claim below re-checked against code —
> stale claims from the old doc were dropped or corrected).

---

## 1. File inventory

Backend (`apps/backend/src/quiz-mcq/`):

| File                          | Purpose                                                                                                                                                                | Size (verified) |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `quiz-mcq.module.ts`          | Controllers + service; repos for 3 entities; exports service                                                                                                           | 19 lines        |
| `quiz-mcq.controller.ts`      | 27 endpoints under `/quiz-mcq` (public reads `@_Public`, admin CRUD guarded)                                                                                           | 455 lines       |
| `quiz-mcq.service.ts`         | Extends shared ContentServiceBase; filter counts, CSV export, chapter taxonomy, capped random draws                                                                    | 854 lines       |
| `dto/export-query.dto.ts`     | Export query validation                                                                                                                                                | —               |
| `entities/subject.entity.ts`  | `subjects`: unique slug, name, emoji, category, isActive, order                                                                                                        | —               |
| `entities/chapter.entity.ts`  | `chapters`: name, chapterNumber, unique(name+subjectId)                                                                                                                | —               |
| `entities/question.entity.ts` | `questions`: jsonb options, correctAnswer/Letter, level enum easy→extreme, ContentStatus, order, `random_weight float8 default random()`. **No `explanation` column.** | —               |

Frontend (`apps/frontend/src/`):

| File / dir                                                                      | Purpose                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/quiz-mcq/page.tsx`                                                         | 4-stage wizard (Subject→Chapter→Mode→Level) via URL params; uses cached `/quiz-mcq/question-counts`                                                                                                                                                                              |
| `app/quiz-mcq/play/page.tsx` + `play/components/*`                              | Gameplay orchestration + 5 subcomponents (PreQuizSummary, GameHeader, SubmitConfirmModal, ExtendSessionModal, ResumePromptModal)                                                                                                                                                 |
| `app/quiz-mcq/timer-challenge/page.tsx`, `practice-mode/page.tsx`               | Thin wrappers around shared `components/quiz-mcq/ChallengeHub.tsx`                                                                                                                                                                                                               |
| `app/quiz-mcq/practice/page.tsx`, `challenge/page.tsx`                          | Redirect shims (legacy routes)                                                                                                                                                                                                                                                   |
| `app/quiz-mcq/results/page.tsx`                                                 | Results from localStorage history; shared scorer                                                                                                                                                                                                                                 |
| `hooks/useQuizMcq.ts` + `hooks/use-quiz-mcq/*`                                  | Engine + extracted `quiz-engine.utils`, `useQuizTimers`, `useQuizResume`. **Uncommitted work-in-progress: 6 `track()` analytics calls** (session_started / session_resumed / question_answered / question_skipped / session_completed / achievement_unlocked, module `quiz-mcq`) |
| `lib/quiz-mcq-api.ts`                                                           | API client incl. `getSubjectRandomQuestions` (capped server-side random), `getQuestionCounts` → `/quiz-mcq/question-counts`                                                                                                                                                      |
| `lib/quiz-mcq-scoring.ts`                                                       | Single source of truth: isAnswerCorrect / calculateScore / calculateResult / calculateGrade; extreme = normalized text match                                                                                                                                                     |
| `lib/quiz-mcq-constants.ts`                                                     | Shared QUIZ_LEVELS / emojis / colors                                                                                                                                                                                                                                             |
| `lib/quiz-mcq-resume.ts`                                                        | Two-key resume store (`aiquiz:quiz-resume-questions` snapshot + `aiquiz:quiz-resume-session` progress)                                                                                                                                                                           |
| `components/quiz-mcq/*`                                                         | ChallengeHub, QuestionCard, AnswerOptions (level-aware), BubbleEmojiEffect, FloatingBackground, ScoreCard, QuestionReview, ResultsCelebration, QuizCardSkeleton                                                                                                                  |
| `features/quiz-mcq/**`                                                          | Admin CRUD (container, filters, table, 7 modals, TanStack Query hooks with optimistic updates)                                                                                                                                                                                   |
| `__tests__/quiz-mcq-scoring.test.ts` (16) + `__tests__/useQuizMcq.test.tsx` (6) | Regression tests — **22/22 passing (verified 2026-08-30)**                                                                                                                                                                                                                       |

## 2. Endpoint map (verified against controller 2026-08-30)

| Method & Path                                    | Auth   | Notes                                                           |
| ------------------------------------------------ | ------ | --------------------------------------------------------------- |
| GET `/quiz-mcq/subjects`                         | public | `?hasContent=true`, `?includeInactive`                          |
| GET `/quiz-mcq/level-counts`                     | public | cached per-level published counts (challenge hubs)              |
| GET `/quiz-mcq/question-counts`                  | public | cached per-subject/chapter counts with level breakdown (wizard) |
| GET `/quiz-mcq/subjects/:slug/meta`              | public | lightweight meta                                                |
| GET `/quiz-mcq/subjects/:slug`                   | public | with chapters                                                   |
| GET `/quiz-mcq/subjects/:slug/questions`         | public | PUBLISHED only, throttled 60/min, unbounded if no `limit`       |
| GET `/quiz-mcq/filter-counts`                    | admin  | unified facet counts                                            |
| POST/PUT/DELETE `/quiz-mcq/subjects[/:id]`       | admin  | CRUD with cascade deletes                                       |
| GET `/quiz-mcq/chapters`, `/chapters/:subjectId` | public | list                                                            |
| POST/PATCH/DELETE `/quiz-mcq/chapters[/:id]`     | admin  | CRUD                                                            |
| GET `/quiz-mcq/questions`                        | admin  | paginated + filters                                             |
| GET `/quiz-mcq/questions/export`                 | admin  | CSV                                                             |
| GET `/quiz-mcq/questions/:chapterId`             | public | PUBLISHED only                                                  |
| GET `/quiz-mcq/subjects/:slug/questions/random`  | public | capped random (`count`, `level`, `chapterId`) — STANDARDS A2    |
| GET `/quiz-mcq/mixed`, `/quiz-mcq/random/:level` | public | challenge pools via `random_weight` index-seek                  |
| POST `/quiz-mcq/questions`, `/questions/bulk`    | admin  | single + chunked import (auto subject/chapter creation)         |
| PATCH/DELETE `/quiz-mcq/questions/:id`           | admin  | draft→published→trash lifecycle                                 |
| POST `/quiz-mcq/bulk-action`                     | admin  | shared BulkActionService                                        |
| GET `/quiz-mcq/subjects/:slug/status-counts`     | admin  | per-status counts                                               |

## 3. Current status (verified)

**Done:** full gameplay loop (wizard → play → results); level-aware answer formats (easy=True/False, medium=2, hard=3, expert=4, extreme=free-text); capped server-side random session fetch (`QUIZ_SESSION_SIZE = 20`); shared scorer with regression tests; two-key resume; chapter progress + achievements written on completion; complete admin CRUD with optimistic mutations and CSV import/export; **per-level timers: `play/page.tsx` attempts to read `quiz.defaults.levelTimers` from settings, but the frontend settings service is a localStorage mock that never defines `levelTimers`, so the hardcoded `DEFAULT_TIME_LIMITS` fallback is the effective behavior** (correction of the earlier 'reads from Site Settings' claim — see feature 11 for the settings split-brain); wizard + hubs run on cached public count endpoints (no N+1 loops).

**Not done / corrected claims:** no server-side session persistence (all history/resume/high-scores in localStorage only); no explanation content (frontend type + `QuestionReview` render it, but the backend entity has **no** `explanation` column and no admin authoring field); `ResultsCelebration` defines tiers but only the `perfect` emoji set is ever used; achievement `streak` condition exists but its evaluator is a no-op; `chapter_complete` condition actually checks _perfect quizzes_, not chapter completion (verified in `lib/achievements.ts:139-145`); unanswered questions grade as incorrect everywhere (no distinct review state).

## 4. Task breakdown

### P0 — critical / broken

- None open. Engine is stable, 22/22 tests pass, no known data-corruption or blocking bugs.

### P1 — major gaps

- [x] **Server-side session/result persistence** — DONE 2026-08-30 (commit `7525d9f`): `quiz_sessions` table (migration 1788800000000), `POST /quiz-mcq/sessions` (optional JWT + guestId attribution, DTO-validated), `GET /quiz-mcq/sessions/history` + `/sessions/high-scores`; frontend saves completed sessions fire-and-forget and the results page shows a server-backed personal best. Verified live.
- [x] **Challenge streak tracking** — DONE 2026-08-30 (commit `7b57f2f`): `lib/challenge-streak.ts` tracker (consecutive correct, per-session window, persistent best); wired into `selectAnswer` (challenge mode only) and the previously-dead `streak` achievement case. 4 tracker tests.
- [x] **Distinct "unanswered" state** — DONE 2026-08-30 (commit `c8b2d4b`): `calculateResult` classifies missing/empty answers as `unansweredCount` (excluded from incorrect); results summary + QuestionReview render an amber "Not Answered" state.
- [x] **Explanations end-to-end** — DONE 2026-08-30 (commit `6492377`): `questions.explanation` column (migration 1788900000000), Create/Update DTO fields, admin `QuestionModal` textarea, play-time conversion passes it to `QuestionReview`. Round-trip verified live.

### P2 — integration / quality

- [x] **Achievement condition audit** — DONE 2026-08-30 (commit `88f1964`): `chapter_complete` now counts DISTINCT chapters with a perfect session (was counting perfect quizzes, duplicating `perfect_score`); `subject_explore` semantics documented (any positive-score session explores the subject, matching its description). 3 condition tests.
- [ ] Analytics parity: commit the 6 `track()` calls in `useQuizMcq.ts` once the analytics feature is revisited (**deferred by owner decision 2026-08-30 — the calls already exist in code and are functional; do not build out further for now**).
- [x] **Component-level tests for `AnswerOptions` and `QuestionReview`** — DONE 2026-08-30 (commit `281e8ed`): 10 tests — level-format forcing (True/False fallback, 2/3/4 slicing, extreme input+submit) and review states (correct/incorrect/unanswered/explanation).
- [x] **Accessibility in `AnswerOptions`** — DONE 2026-08-30 (commit `281e8ed`): sr-only aria-live region announces the graded outcome; per-option aria-labels include the letter, text, and feedback role.
- [x] **Rename `features/quiz-mcq` → `features/quiz-mcq-admin`** — DONE 2026-08-30 (commit `38d1745`): `git mv` (history preserved); sole import site updated.

### P3 — polish / tech debt

- [x] **`ResultsCelebration` tiers** — DONE 2026-08-30: tiered sets now wired — 71–99% uses the `good` set (12 emojis), 100% uses `perfect` (20). The `tryAgain` set remains intentionally unused (≤70% launches no emojis).
- [x] **Delete legacy redirect shims** — DONE 2026-08-30: `app/quiz-mcq/practice` + `app/quiz-mcq/challenge` removed; repo-wide grep shows no remaining references (verified before deletion).
- [x] **Day-streak vs challenge-streak consolidation** — REVIEWED 2026-08-30, keeping both: `lib/progress.ts` `bestStreak` measures consecutive _days_ with any quiz; `lib/challenge-streak.ts` measures consecutive _correct answers_ within challenge sessions. Different metrics with different consumers — merging them would corrupt both. Documented here per the "consolidate" intent.
- [x] **`quiz-mcq.service.ts` split evaluation** — EVALUATED 2026-08-30 (service touched for sessions work): the file is cohesive — a ContentServiceBase subclass where the extra lines are quiz-specific counts/export/import logic mirroring the riddle-mcq service. A split now would touch the shared base contract for symmetry reasons alone; revisit only if quiz-specific logic diverges further or a second consumer needs the pieces.

## 5. Cross-feature touchpoints

- **Site Settings** — `play/page.tsx` reads `quiz.defaults.levelTimers` via the mock `SettingsService`; the mock never supplies `levelTimers`, so the hardcoded fallback always applies until feature 11's split-brain is fixed.
- **Achievements** — completion writes `saveQuizResult()` + `checkAchievements()`; unlock toasts + (uncommitted) analytics events.
- **Analytics** — 6 instrumented events in the engine (module `quiz-mcq`); dashboard renders quiz-mcq rows in module breakdowns.
- **Admin Dashboard** — gameplay content managed via `features/quiz-mcq` under the admin shell.
