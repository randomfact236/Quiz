# Quiz-MCQ Feature — Analysis, Format Review & Cosmetic Upgrade Plan

> Date: 2026-08-28
> Scope: `apps/backend/src/quiz-mcq/` (API) + `apps/frontend/src/app/quiz-mcq/` (user flow) + `apps/frontend/src/components/quiz-mcq/`, `hooks/useQuizMcq.ts` (UI/state)

---

## 1. What the feature is (feature inventory)

Quiz-MCQ is a subject → chapter → mode → difficulty → play → results quiz engine.

**User-facing flow**

| Stage            | Route / file                                                     | What it does                                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subject picker   | `/quiz-mcq/page.tsx`                                             | Categories (academic/professional/entertainment, auto-grouped by name), subject cards with live question counts, "Coming Soon" state, quick links to Timer Challenge / Practice Mode                                   |
| Chapter picker   | same page, `?subject=`                                           | Chapter cards with progress ring (completed / attempted / new), best score + attempt count, per-chapter question count + level list                                                                                    |
| Mode picker      | same page, `?subject=&chapter=`                                  | Normal Mode vs Timer Mode accordions, 5 difficulty levels with per-level question counts                                                                                                                               |
| Pre-quiz summary | `play/components/PreQuizSummary.tsx`                             | Shows subject/chapter/level/mode, session size, "add extra questions" stepper before starting                                                                                                                          |
| Gameplay         | `/quiz-mcq/play` + `QuestionCard`, `AnswerOptions`, `GameHeader` | Instant right/wrong feedback, randomized praise messages, emoji bubble burst effect, share-current-question link, skip + jump-to-skipped, pause/resume timer, per-question countdown ring, progress bar, score display |
| Results          | `/quiz-mcq/results`                                              | Score card (grade, %, time), performance-by-difficulty grid, correct/incorrect summary, expandable question review, retry / navigate buttons, copy-results share                                                       |
| Special modes    | `/quiz-mcq/timer-challenge`, `/quiz-mcq/practice-mode`           | Shared `ChallengeHub`: subject-wise, level-wise, and "Complete Mix" (all subjects, all levels)                                                                                                                         |
| Cross-session    | `useQuizMcq` + `quiz-mcq-resume.ts`                              | Resume-prompt modal on return, localStorage session history, chapter progress, achievements toasts                                                                                                                     |

**Difficulty-driven answer format** (core "format" decision, `AnswerOptions.tsx`)

- **Easy** → forced True/False (2 options, stored options ignored)
- **Medium** → first 2 of the stored options
- **Hard** → first 3 options
- **Expert** → all 4 options
- **Extreme** → no options; free-text input, graded by exact (case/space-insensitive) string match

**Backend** (`quiz-mcq.controller.ts`, 445 lines): full CRUD for subjects/chapters/questions, bulk create + bulk action, CSV export, filter-counts/status-counts, random selection endpoints (`subjects/:slug/questions/random`, `mixed`, `random/:level`) with a `random_weight` column for cheap random draws. Draft/published content status lifecycle.

**State & data**: questions load via capped random-fetch (capacity-plan A2); sessions/results/progress live in **localStorage only** — the backend has no session/attempt tables.

---

## 2. Data flow structure (as currently built)

### 2.1 High-level diagram

```
┌────────────────────────── CONTENT (write path) ──────────────────────────┐
│ Admin UI (features/quiz-mcq/*)                                           │
│   QuestionManager → QuestionModal/ImportModal/CSVPreview                 │
│        │ adminApi (JWT-protected)                                        │
│        ▼                                                                 │
│ NestJS quiz-mcq.controller  ──►  quiz-mcq.service  ──►  TypeORM          │
│   POST /questions, /questions/bulk, /bulk-action                         │
│   PATCH /questions/:id   (draft → published → trash lifecycle)           │
│        ▼                                                                 │
│ PostgreSQL: subjects ─< chapters ─< questions                            │
│   (questions: options jsonb, correctAnswer, correctLetter,               │
│    level enum, status enum, random_weight float8 default random())       │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────────────── PLAY (read path) ──────────────────────────────┐
│ Frontend pages (app/quiz-mcq/*)                                          │
│        │  React Query (@tanstack)  — staleTime 60s                       │
│        ▼                                                                 │
│ lib/quiz-mcq-api.ts  ──►  api-client (public `api` / admin `adminApi`)   │
│        │  GET /quiz-mcq/subjects, /subjects/:slug,                       │
│        │      /subjects/:slug/questions/random?count&level&chapterId     │
│        │      /level-counts, /mixed, /random/:level                      │
│        ▼                                                                 │
│ NestJS controller ──► service (capped random SQL via random_weight)      │
│        ▼                                                                 │
│ Published questions only (status filter applied server-side)             │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────────── SESSION (client-side state) ───────────────────────┐
│ hooks/useQuizMcq.ts  (single source of truth for an active session)      │
│   ├─ quiz-engine.utils.ts   session size (10), UUID, question convert    │
│   ├─ useQuizTimers          per-question / global countdown, pause       │
│   └─ useQuizResume          mount-time decision: resume vs fresh         │
│        │                                                                 │
│        ├─► localStorage (lib/storage, prefix "aiquiz:"):                 │
│        │     CURRENT_SESSION · QUIZ_RESUME_SESSION · QUIZ_RESUME_QUESTIONS│
│        │     QUIZ_HISTORY · CHAPTER_PROGRESS · SUBJECT_PROGRESS          │
│        │     ACHIEVEMENTS · CHALLENGE_HIGH_SCORE                         │
│        ▼                                                                 │
│ On submit: lib/quiz-mcq-scoring.calculateResult()                        │
│   → saveToHistory() → progress.saveQuizResult() + achievements check     │
│        ▼                                                                 │
│ /quiz-mcq/results?session=<uuid>  reads QUIZ_HISTORY from localStorage   │
│   (calculateResult re-derived on the results page)                       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Flow by stage

**Authoring (admin → DB)**

1. Admin creates/edits subjects, chapters, questions via `features/quiz-mcq` modals; bulk import goes through `quiz-mcq-importer.ts` → `POST /questions/bulk`.
2. Backend validates and stores with a `status` lifecycle (draft/published/trash) and a `random_weight` (default `random()`) so random selection is a cheap indexed sort instead of `ORDER BY random()`.

**Play (DB → screen)**

1. Pickers fetch metadata through React Query (`staleTime` 60s): `getSubjects`, `getSubjectBySlug` (with embedded chapters), and — currently — full question lists used only for counts (the N+1 issue from §3).
2. On start, `useQuizMcq` resolves the chapter id, then fetches a **capped random draw** (`getSubjectRandomQuestions`, `count = QUIZ_SESSION_SIZE = 10`), or `getMixedQuestions` / `getRandomQuestions(level)` for Complete Mix. Questions are converted to the frontend `Question` shape (`convertQuizQuestion`).
3. Answer selection mutates in-hook state (`answers: Record<questionId, letter|text>`); correctness is derived client-side (`isAnswerCorrect`): MCQ compares `correctLetter`, extreme compares normalized text against `correctAnswer`.

**Persistence (client only)**

| localStorage key (`aiquiz:` prefix)             | Written by                                                                          | Read by                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------- |
| `CURRENT_SESSION`                               | in-progress session autosave                                                        | resume prompt                          |
| `QUIZ_RESUME_SESSION` / `QUIZ_RESUME_QUESTIONS` | `quiz-mcq-resume.ts` (identity + progress + full question payloads, expiry-checked) | `useQuizResume` on mount               |
| `QUIZ_HISTORY`                                  | append on submit                                                                    | results page, stats                    |
| `CHAPTER_PROGRESS` / `SUBJECT_PROGRESS`         | `progress.saveQuizResult` (best score, attempts, completed)                         | chapter picker badges, recommendations |
| `ACHIEVEMENTS`, `CHALLENGE_HIGH_SCORE`          | achievement/challenge modules                                                       | toasts, hub banners                    |

**Completion**

1. Last question → `SubmitConfirmModal` → `submitQuiz()` → builds `QuizSession` (questions, answers, score, timeTaken) → `saveToHistory()` → `saveQuizResult()` → achievement toast check → `router.push('/quiz-mcq/results?session=…')`.
2. Results page re-loads the session from `QUIZ_HISTORY`, recomputes grade/percentage/breakdown with `calculateResult`. **No data returns to the backend** — the server never learns an attempt happened.

### 2.3 Flow implications (ties into findings in §3)

- **Answers are graded on the client** — the API payload includes `correctAnswer`/`correctLetter` for every fetched question, so correct answers are visible in devtools/network. Server-side grading would need session endpoints (see P6).
- **Results are not shareable/portable** — `?session=` only resolves against the same browser's localStorage.
- **Randomness lives in SQL** (`random_weight`) but shuffling of _options_ and session composition is client-side; cached React Query data means the "same 10 questions" can repeat within the 60s stale window.
- **Timer settings** flow: `SettingsService.getSettings()` → `quiz.defaults.levelTimers` → `useQuizMcq` `timeLimit` → `useQuizTimers` → `QuestionTimerRing`/`GameHeader`.

---

## 3. Verdict — is the format good?

**Overall: yes, the format is good and above-average for a quiz app.** The difficulty-tiered option count (2→3→4→free-text) is a genuinely nice progression mechanic, the play screen has good game feel (instant feedback, bubbles, animations), and the flow (subject → chapter → mode → level) is clear with proper back-navigation at every step. Well worth keeping as the core format.

**But there are 5 format-level weaknesses to fix before adding cosmetics:**

1. **No explanations anywhere.** The `questions` table has no `explanation` column and the results review only shows correct vs chosen. For an educational quiz this is the single biggest content gap (the type already stubs `explanation?: string` as "future").
2. **Extreme free-text grading is brittle.** Exact trimmed lowercase match only — "The Sun" vs "Sun" vs "sun " fails, and the input calls `onSelect` on **every keystroke**, so a partially-typed answer can be locked in when the timer fires. Needs normalization + optional accepted-variants list + an explicit confirm.
3. **Easy level ignores stored content.** `getOptionsForLevel()` hardcodes True/False, so any easy question authored with real options silently shows True/False instead. The authoring UI and the player disagree — data-driven option count per question would remove this class of bug.
4. **Answers can't be changed and nothing confirms the lock.** Once you tap an option, `disabled || hasSelection` locks it. Fine for exam mode, but combined with mis-taps on mobile it's frustrating; a brief "locked" affordance or allow-change-until-Next toggle would help.
5. **Progress is client-side only.** History, best scores, streaks and achievements live in localStorage — invisible on other devices and lost on cache clear. Backend has no attempt/session endpoint. (Bigger architectural item; flag it, don't block cosmetics on it.)

**Smaller correctness/UX issues found during review**

- `page.tsx` subject counts do **N+1 full question fetches** (`getQuestionsBySubject` per subject just to read `.total`) — needs a dedicated counts endpoint (backend has `level-counts`/`filter-counts` patterns to copy). `ChapterSelection` similarly fetches **all questions per chapter** via `useQueries` just for counts/levels.
- Results page reads sessions from localStorage — a shared/other-device user hitting `/results?session=` gets silently redirected. Share currently copies the _question_ link mid-quiz, but there's no shareable result.
- `/quiz-mcq/practice` exists only as a redirect to `/quiz-mcq/practice-mode` — fine, but `LevelSelection` in `page.tsx` looks like dead/legacy UI (ModeSelection already embeds level tiles; nothing links to `?mode=` without `chapter`).
- Landing "Coming Soon" cards render as `<Link href="#">` with `cursor-not-allowed` — should be non-interactive elements (a11y).
- Timer mode header shows both the header clock **and** the in-card countdown ring — duplicated timers on small screens.
- Quiz history in localStorage grows unbounded (no cap/pruning).
- Accessibility: option buttons are `<button>`s but with no `role="radiogroup"`/`aria-pressed`; feedback is announced nowhere (`aria-live` missing); `BubbleEmojiEffect` (60 particles) runs unconditionally — should respect `prefers-reduced-motion`.

---

## 4. Cosmetic improvements (the "make it feel better" list)

Prioritized: 🔴 high-impact, 🟡 nice-to-have, 🟢 polish.

### Play screen (highest traffic — do first)

1. 🔴 **Layout hierarchy** — the card currently stacks: time-up banner → timer ring → question → 2 floating emojis → score+share → progress bar → feedback → options. That's 7 stacked bands before the answers; on phones the options can fall below the fold. Move **score + progress into the GameHeader row**, drop the floating emojis to a subtle watermark or remove, leaving: question → feedback → options. One screen, no scroll.
2. 🔴 **Answer option design** — flat gray boxes today. Add A/B/C/D letter chips on the left, left-align long text (center-aligned wrapping text with an absolutely-positioned ✓/✕ at `right-4` overlaps long options on narrow screens), min tap height 48px, and a subtle correct-answer shake animation on wrong pick.
3. 🔴 **Timer ring placement** — in timer mode put the ring _in the header next to the clock_ (replacing the duplicate), not as a full-width centered band above the question.
4. 🟡 **Feedback banner** — replace the plain text line with a slim rounded pill (green/red) that slides in under the question; include the correct answer text ("Correct answer: B — Photosynthesis"), not just ✓/✕.
5. 🟡 **Locked-answer affordance** — after answering, dim other options and show a "Next →" pulse on the primary button so the eye lands on the action.
6. 🟡 **Progress bar semantics** — animate on _answered_ count, not current index (it currently jumps when navigating back).
7. 🟢 Keyboard shortcuts (1–4/A–D to select, Enter = Next), `aria-live` on feedback, `prefers-reduced-motion` gate for bubbles/floats.

### Landing / pickers

8. 🔴 **Single counts endpoint + skeleton loaders** — replace N+1 fetches; swap "Loading..." text lines for card-shaped skeletons (pattern already exists from the media UI polish pass).
9. 🟡 **Category accordions** — colorClass is applied to text only (`text-blue-600` on a white/20 button, but the title inside is forced white); give each category a proper accent (left border / icon badge / tinted header) and persist open/closed state.
10. 🟡 **Chapter cards** — show a mini progress bar (best score %) instead of text-only "Best: 7"; add per-level count chips instead of the raw joined levels string.
11. 🟢 "Coming Soon" cards → `<div aria-disabled>` instead of dead links; add a sticky bottom nav or breadcrumbs on mobile.

### Results

12. 🟡 **Score card hero** — big circular score gauge with grade + confetti already exist; add time-taken and accuracy sparkline, and move Retry to a full-width primary button at the _bottom_ too (currently only 3-up small tiles at top).
13. 🟡 **Question review** — collapse each item to one line (✓/✕ + question, expand for options); add "filter: only wrong" toggle; use the future `explanation` field here.
14. 🟢 Native `navigator.share()` for results text on mobile (clipboard fallback stays).

### Consistency

15. 🟢 **Design tokens** — the purple gradient `from-[#A5A3E4] to-[#BF7076]` is hardcoded in 8+ files; extract to a shared class/constant. Same for level colors.
16. 🟢 Dark mode support, favicon/emoji-consistent page titles via per-route `metadata`.

---

## 5. Suggested implementation order

| Phase                                    | Items                                                                                                                                                      | Effort        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **P1 — Fix format bugs**                 | Extreme input: explicit submit + answer normalization; easy-level option bug (make option count data-driven); a11y (reduced motion, radiogroup, aria-live) | ~1 day        |
| **P2 — Data/perf**                       | Public `question-counts` endpoint; use it on landing + chapters; cap localStorage history                                                                  | ~0.5 day      |
| **P3 — Cosmetics: play screen**          | Items 1–6 above (layout, options, timer, feedback pill)                                                                                                    | ~1–2 days     |
| **P4 — Cosmetics: pickers & results**    | Items 8–14                                                                                                                                                 | ~1–2 days     |
| **P5 — Content depth (needs migration)** | `explanation` column + admin editor field + show in feedback & review; accepted-answer variants for extreme                                                | ~1–2 days     |
| **P6 — Optional architecture**           | Server-side session/attempt persistence, cross-device progress                                                                                             | separate plan |

## 6. Verification checklist

- [ ] All 5 levels playable end-to-end (easy true/false, extreme typing + confirm)
- [ ] Landing page makes 2 network requests total (subjects + counts)
- [ ] Play screen fits without scroll at 375×667 in normal and timer mode
- [ ] Wrong answer review shows correct answer text (and explanation after P5)
- [ ] `prefers-reduced-motion` disables bubbles/floating emojis
- [ ] Results page graceful state when session id is unknown
