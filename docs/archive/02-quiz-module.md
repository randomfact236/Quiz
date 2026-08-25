# Quiz Module (Frontend)

Analysis of the quiz gameplay surface: `src/app/quiz/**` (landing, play, practice, practice-mode, challenge, timer-challenge, results) and its supporting layers `src/features/quiz/**` (admin CRUD feature: components, hooks, modals) and `src/components/quiz/**` (presentational game components). All paths relative to `apps/frontend/`.

## 1. Scope & File Inventory

| File | Purpose | Status |
|---|---|---|
| `src/app/quiz/page.tsx` | 767-line wizard landing page: SubjectSelection → ChapterSelection → ModeSelection → LevelSelection driven by URL search params | Done; monolithic |
| `src/app/quiz/play/page.tsx` | Main gameplay screen (849 lines): pre-quiz summary, timer, skip/share, resume prompt, submit + extend modals | Done; very large |
| `src/app/quiz/timer-challenge/page.tsx` | Challenge hub: subject-wise / all-subject-level / complete-mix with per-level counts → `/quiz/play?...&mode=timer&type=challenge` | Done |
| `src/app/quiz/practice-mode/page.tsx` | Identical hub without timer (`mode=practice&type=challenge`) | Done — ~95% copy of timer-challenge |
| `src/app/quiz/practice/page.tsx` | Redirect shim → `/quiz/practice-mode` | Done |
| `src/app/quiz/challenge/page.tsx` | Redirect shim → `/quiz/timer-challenge` | Done |
| `src/app/quiz/results/page.tsx` | Results: loads session from localStorage history, grade calc, difficulty breakdown, review list, share | Done; scoring inconsistencies (§5) |
| `src/app/quiz/error.tsx`, `loading.tsx` | Route-level error/reset and spinner fallbacks | Done |
| `src/hooks/useQuiz.ts` | Core engine hook (641 lines): question loading, scoring, navigation, visited/skipped tracking, timers (total & per-question), resume persistence, shared-link start | Done; complexity hotspot |
| `src/components/quiz/QuestionCard.tsx` | Question display + instant feedback text + bubble trigger + progress bar + countdown ring; forwardRef for bubble clearing | Done |
| `src/components/quiz/AnswerOptions.tsx` | Options by level: easy=T/F, medium=2, hard=3, expert=4, extreme=text input | Done |
| `src/components/quiz/BubbleEmojiEffect.tsx` | Popping emoji burst on correct/wrong; imperative `clear()` handle | Done |
| `src/components/quiz/FloatingBackground.tsx` | Floating ❓/🔢 background emojis (mount-once randomization) | Done |
| `src/components/quiz/ScoreCard.tsx` | Grade circle + animated score count-up + accuracy/time stats | Done |
| `src/components/quiz/QuestionReview.tsx` | Expandable per-question review with correct/incorrect highlighting + extreme text answer block | Done but has a correctness bug (§5 #1) |
| `src/components/quiz/ResultsCelebration.tsx` | Emoji fireworks when percentage > 70 | Done (note: comment says 15–20, code always uses perfect set & count=15, lines 60–62) |
| `src/components/quiz/QuizTimer.tsx` | Bar/circle/minimal countdown timer component | **Dead code — imported nowhere** |
| `src/components/quiz/QuizNavigation.tsx` | Prev/Next/Submit button row | **Dead code — imported nowhere** |
| `src/features/quiz/components/QuizContainer.tsx` | Admin quiz management root: filters + table + subject/chapter/question/import modals + confirm dialog | Done (admin-only consumer: `app/admin/page.tsx:33`) |
| `src/features/quiz/components/FilterPanel.tsx`, `SubjectFilterRow.tsx`, `ChapterFilterRow.tsx` | Admin filter UI with live counts | Done |
| `src/features/quiz/components/QuestionManager.tsx`, `QuestionTable.tsx` | Paginated question table + bulk actions | Done |
| `src/features/quiz/components/QuizHeader.tsx` | Toolbar: add question / import / export CSV | Done |
| `src/features/quiz/components/modals/*` | SubjectModal, ChapterModal, QuestionModal (+OptionsEditor, SubjectChapterFields), ImportModal (+CSVPreview) — full CRUD incl. CSV bulk import parser | Done |
| `src/features/quiz/hooks/useQuizFilters.ts` | URL-search-param-backed filter/page state | Done |
| `src/features/quiz/hooks/useSubjects.ts`, `useChapters.ts`, `useQuestions.ts`, `useFilterCounts.ts` | TanStack Query wrappers over quiz-api (isAdmin=true) | Done |
| `src/features/quiz/hooks/useSubjectMutation.ts`, `useChapterMutation.ts`, `useQuestionMutation.ts` | Mutations with optimistic updates + cache invalidation | Done |

## 2. What Is Done (implemented & working)

- **Full selection flow**: `/quiz` renders a 4-stage wizard purely from search params (`?subject=` → `&chapter=` → `&mode=normal|timer`) with back-links at every stage, category grouping, "Coming Soon" disabling when a subject has 0 published questions (page.tsx:84–98), and chapter cards showing local best score/attempts from progress storage (page.tsx:374–382).
- **Gameplay engine** (`useQuiz`):
  - Loads questions via the right endpoint mix: mixed/random for `subject=all`, subject+chapter filtering otherwise, client-side level filter (useQuiz.ts:79–121); converts API `QuizQuestion` to internal `Question` shape (40–55).
  - Session lifecycle: UUID sessions saved to `aiquiz:quiz-history` on completion and cleared from current-session storage (124–140, 384–425).
  - Scoring handles both MCQ (`correctLetter`) and open-ended `extreme` questions via trimmed case-insensitive comparison (58–76).
  - Timer supports total-time and per-question modes with auto-advance on expiry (293–322); pause/resume.
  - Visited/manually-skipped sets drive the Skipped quick-jump button in play page (play/page.tsx:194–213, 498–511).
  - Resume system: debounced-ish effect persists full resume state after first interaction (427–459); mount-time decision ref avoids re-running resume matching on re-render (164–199); modal offers Resume Q# / Start Fresh (play/page.tsx:216–251).
- **Shared-link deep start**: `?question=N&total=M&shared=true` starts mid-session, hides earlier "unvisited" questions behind a dismissible pill, and the Share button copies a canonical link with toast feedback (play/page.tsx:172–191, 513–525).
- **Pre-quiz summary**: shows counts/level/mode/chapter plus an "Add More Questions" slider/+/- selector up to 20 extra before starting (play/page.tsx:300–457); extend-quiz modal does the same mid-game using `availableCount` (733–829).
- **Results**: grade thresholds (A+…F, results/page.tsx:36–43), animated ScoreCard count-up, difficulty breakdown grid, collapsible QuestionReview list, clipboard share with toast, retry/difficulty/chapters/home action grid. Sessions are looked up from history and missing IDs redirect to `/quiz` (93–105).
- **Timer visuals**: header timer chip turns orange ≤20s / red pulsing ≤10s with pause/resume control (play/page.tsx:528–566), plus SVG countdown ring inside QuestionCard (QuestionCard.tsx:104–144).
- **Admin CRUD feature** (features/quiz): complete subject/chapter/question management against backend with TanStack Query — optimistic update/delete with rollback (useQuestionMutation.ts:38–100), filter-count-driven UI, bulk publish/draft/trash/delete, CSV import with quoted-field parsing and `# Subject:` header support (ImportModal.tsx:33–70), CSV export download.

## 3. What Is Partially Done / In Progress

- **Progress integration**: chapter cards read `getChapterProgress` (app/quiz/page.tsx:374) but nothing in the module ever *writes* it (`saveQuizResult` has no callers) — badges/best scores stay frozen at initial values unless legacy data exists.
- **Achievements in results**: results page computes grades and celebration but never calls `checkAchievements()`; the achievements system is effectively dormant for quiz play.
- **Level-specific timers**: play page attempts to read `settings.quiz.defaults.levelTimers` (play/page.tsx:76) which doesn't exist in the mock settings type — hardcoded `DEFAULT_TIME_LIMITS` (easy 30s … extreme 120s, play/page.tsx:25–31) is what actually runs.
- **Explanation support**: `Question.explanation` is typed as optional "future" field (types/quiz.ts:24–26) and rendered in QuestionReview (QuestionReview.tsx:159–164), but no data source supplies explanations yet.
- **Extreme (open-ended) flow**: input works during play, but results-side accounting is inconsistent (see §5 #2/#3) — partially implemented end-to-end.
- **ResultsCelebration tiers**: three emoji tiers defined (perfect/good/tryAgain) but only `perfect` is used, gated at >70% (ResultsCelebration.tsx:53–61) — tier logic unfinished.

## 4. What Is Missing / Needs To Be Done

- **Server-side session/result persistence**: everything (history, resume, high scores, challenge streaks) lives in localStorage; there is no POST of completed sessions to the backend, so cross-device progress, leaderboards, and the challenge high-score key (`STORAGE_KEYS.CHALLENGE_HIGH_SCORE`, defined but unused in this module) can't work.
- **Challenge-mode specific features referenced elsewhere**: a `streak` achievement condition exists but "is tracked during challenge mode" per the TODO-style comment (lib/achievements.ts:164–167) — no streak tracking exists in useQuiz/play page.
- **Quiz review of skipped/unanswered in results**: review list renders every session question, but unanswered MCQs show "N/A" as a letter answer which never matches options (results/page.tsx:330 passes `'N/A'`).
- **Pagination/large-subject safety**: `getQuestionsBySubject` fetches *all* questions of a subject in one request (quiz-api.ts:234–254) and timer-challenge/practice-mode pages iterate every question client-side to build counts — will degrade with large banks.
- **Accessibility of the game screen**: option buttons rely on color + ✓/✕ glyph; no aria-live for feedback text or timer warnings; extreme text input lacks label association (`<label>` has no htmlFor, AnswerOptions.tsx:117–131).
- **Tests**: none exist for useQuiz (the most logic-heavy artifact in the app) despite jest being configured.

## 5. Known Issues, Bugs & Tech Debt

1. **QuestionReview correctness check is wrong for MCQ** — `isCorrect = userAnswer === question.correctAnswer` compares the stored letter (A/B/C/D) against the answer *text* (QuestionReview.tsx:32), so virtually every reviewed MCQ is marked red; it should compare against `correctLetter`. Inconsistent with results page which correctly uses `correctLetter` (results/page.tsx:59).
2. **Extreme questions mis-scored in results** — `calculateResult` marks correctness via `answers[q.id] === q.correctLetter` only (results/page.tsx:59); extreme answers are free text, so they're always counted incorrect even when `calculateScore` in useQuiz counted them correct — score vs breakdown disagree.
3. **Potential runtime crash in calculateResult** — `byDifficulty[q.level].total++` assumes level ∈ {easy..extreme}; any other level string throws (results/page.tsx:61).
4. **Massive duplication between hubs** — timer-challenge/page.tsx and practice-mode/page.tsx are near-identical (same chunkArray, same level tables, same JSX; only mode param differs). Also `levels`/`levelEmojis`/`levelColors` maps are re-declared in app/quiz/page.tsx:513–527 *and* 678–693 *and* both hub pages.
5. **Dead components** — QuizTimer.tsx and QuizNavigation.tsx are imported nowhere (verified by grep); superseded by inline timer chip and nav buttons in play/page.tsx.
6. **Resume-state bloat** — `saveQuizResume` serializes the entire `availableQuestions` array into one localStorage entry on every answer/navigation change (useQuiz.ts:439–452); large subjects can blow past the 5MB quota silently (storage swallows errors, storage.ts:101).
7. **Per-question timer drift** — per-question countdown resets via `goToNext/goToPrevious/skip/jump` returning `timeLimit` (useQuiz.ts:363, 379, 556, 573), meaning going *back* also grants a fresh timer — likely unintended free time.
8. **Double-completion race** — `submitQuiz` saves history inside a setState updater (side effect in reducer, useQuiz.ts:384–405) while a separate effect also saves when status flips to completed (407–425); guarded only by `status !== 'completed'` mutation ordering — fragile pattern that can double-append history under StrictMode double-invocation.
9. **URL sync churn** — play page calls `router.replace` on every question change (play/page.tsx:159–169), creating a history-entry-less navigation per answer; combined with Suspense-wrapped `useSearchParams`, this triggers re-render cascades.
10. **`type` shadowing bug risk** — outer scope reads `const type = searchParams?.get('type')` (play/page.tsx:58) then an IIFE redeclares inner `const type` (324) — currently harmless but confusingly duplicated.
11. **Feature/admin coupling** — `features/quiz` hooks hardcode `isAdmin: true` (e.g., useQuestions.ts:35) and the whole folder is only consumed by `app/admin/page.tsx:33`; naming ("QuizContainer") obscures that this is admin CRUD, not gameplay. Also these files fall outside tailwind content globs (see doc 01 §5).
12. **Empty-state handling gap in ModeSelection** — `isLoading = Object.keys(questionCounts).length === 0` (app/quiz/page.tsx:566) stays true forever if the chapter legitimately has zero questions across all levels; buttons show perpetual "Loading...".
13. **Stale tsc log references** — `tsc-errors.log` flags riddle-module errors (not quiz), but the log's presence plus `--no-lint` on build script (package.json:9) suggests type errors are being worked around rather than fixed.

## 6. How It Works (architecture/data flow)

```
/quiz (wizard) ──?subject&chapter&mode&level──▶ /quiz/play
                                                  │
                     useQuiz(subject, chapter, level, timeLimit, timerMode,
                             question#, total#, mode, type, shared)
                       │ 1. lib/quiz-api → GET subjects/questions/mixed (NestJS)
                       │ 2. converts QuizQuestion[] → Question[]
                       │ 3. state machine: loading→playing⇄paused→completed
                       │    answers{}, score, visited Set, manuallySkipped Set
                       │ 4. persistence:
                       │    • every interaction → aiquiz:quiz-resume-session
                       │    • completion      → aiquiz:quiz-history + clear resume
                       ▼
        QuestionCard ─ AnswerOptions (level-aware)
             │ feedback + BubbleEmojiEffect (imperative ref clear)
             ▼
 status==='completed' ─▶ router.push('/quiz/results?session=<uuid>')
                                   │ reads aiquiz:quiz-history
                                   ▼
                    calculateResult → grade/byDifficulty → ScoreCard +
                    QuestionReview[] + ResultsCelebration
```

- **State approach**: gameplay is one big `useState` reducer-style object mutated through `setState(prev => …)` callbacks in `useQuiz`; a parallel mutable `sessionRef` mirrors the persisted session. No context/zustand — each page owns its hook instance.
- **Admin path** (features/quiz) instead uses idiomatic TanStack Query: URL params as filter source of truth (useQuizFilters), cached queries keyed `[domain, filters, page]`, optimistic mutations with rollback and targeted invalidations of `questions`/`filter-counts`.
- **Styling**: Tailwind utility classes with framer-motion animations; visual language (gradient `from-[#A5A3E4] to-[#BF7076]` backdrop, white/95 rounded cards) is a hand-ported subset of `quiz-reference/quiz-css` (home-page.css, quiz-header.css etc.), not imported CSS.
- **Persistence keys** involved: `aiquiz:current-session`, `aiquiz:quiz-resume-session`, `aiquiz:quiz-history`, `aiquiz:chapter-progress` (read-only today).

## 7. Recommended Process To Proceed (prioritized)

1. **P0 – Correctness fixes** (small, user-visible bugs):
   - Fix `QuestionReview.tsx:32` to compare `userAnswer === question.correctLetter` (and handle extreme separately).
   - Make `calculateResult` extreme-aware and guard unknown levels (results/page.tsx:46–80).
   - Guard unanswered-review rendering ('N/A' letter) in results/page.tsx:330.
2. **P0 – Wire progress & achievements on completion**: in useQuiz's completion effect (useQuiz.ts:407–425) call `saveQuizResult(session)` and `checkAchievements()`; toast newly unlocked achievements on the results page.
3. **P1 – Extract the shared hub component**: merge timer-challenge/practice-mode into one parameterized `<ChallengeHub mode="timer"|"practice">`; hoist level maps to a single `lib/quiz-levels.ts`; delete redirect shims if no external links remain.
4. **P1 – Refactor useQuiz completion side effects out of setState updaters** (single save path, StrictMode-safe); add unit tests around scoring, resume match/expiry, and per-question timer behavior.
5. **P1 – Trim resume payload**: store only question IDs/answers rather than full `availableQuestions` (rehydrate from API on resume), or debounce + cap size; surface quota errors from storage instead of swallowing.
6. **P2 – Server-side sessions**: define `POST /quiz/sessions` in NestJS and post completed sessions (keeps localStorage as offline cache); unlocks cross-device history and future leaderboards; also enables the unused `CHALLENGE_HIGH_SCORE` key properly.
7. **P2 – Replace per-subject count loops** on /quiz and both hubs with the existing `GET /quiz/filter-counts` aggregate endpoint.
8. **P3 – Cleanup**: delete dead `QuizTimer.tsx` / `QuizNavigation.tsx` (or adopt them in play page to shrink it below ~400 lines); split play page into `PreQuizSummary`, `GameHeader`, `SubmitModals` subcomponents; rename `features/quiz` → `features/quiz-admin` (or move under `app/admin`) and remove the misleading public-facing name; finish ResultsCelebration tiers (good/tryAgain) or delete unused sets.
