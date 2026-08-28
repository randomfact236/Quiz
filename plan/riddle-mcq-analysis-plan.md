# Riddle MCQ — Feature Analysis, Format Review & Cosmetic Plan

Companion docs: [features/riddle-mcq.md](../docs/features/riddle-mcq.md), [code-quality-plan.md](code-quality-plan.md), [image-riddles-upgrade-plan.md](image-riddles-upgrade-plan.md).
Verified against source on 2026-08-28.

## 1. What the feature has (verified inventory)

### Backend (`apps/backend/src/riddle-mcq/`)

- **Taxonomy:** Category → Subject → Riddle, flat mode on `ContentServiceBase`; transactional cascade deletes.
- **Level system with adaptive option rules:** easy = 2 options, medium = 3, hard = 4, expert = open-ended
  text answer — enforced both client (zod) and server side (create + update).
- **Content workflow:** draft / published / trash + restore; public reads hard-filter PUBLISHED.
- **Random pools:** `/mixed?count<=100` and `/random/:level?count<=50` via `random_weight` index-seek.
- **Public counts:** `level-counts` (per-subject×level, one GROUP BY, 300s cache) and `stats/overview`.
- **Admin tooling:** chunked transactional CSV import (auto-creates categories/subjects), category-grouped
  CSV export, per-id bulk actions, filter-count facet endpoint, family-scoped cache invalidation.

### Frontend — gameplay (`app/riddle-mcq/`, `hooks/use-riddle-play/`)

- **Unified hub** (`page.tsx`): mode (Practice/Timer) × level picker fed by real counts, zero-count
  levels disabled, category browsing with computed per-category totals.
- **Pre-game screen** (`PreRiddleSummary`): mix info grid + add-extra-riddles slider (up to 20).
- **Play page:** session timer with pause/resume, skip + "Skipped (n)" jump chip, hints, instant
  feedback with randomized messages + bubble-emoji bursts, live score, progress bar, autosave
  indicator, share-link toast.
- **Resilience:** two-key resume store (`lib/riddle-resume.ts`) + resume prompt modal, extend-session
  modal, submit-confirm modal, guarded auto-submit effect.
- **Results:** grade, per-difficulty breakdown, correct/incorrect split, review accordion with
  explanation + hint, celebration, clipboard share, retry/hub/home actions.
- **Single scorer:** `lib/riddle-scoring.ts` used by play, live-score, and results.

### Frontend — admin (`features/riddle-mcq/`)

Container + React Query hooks (categories/subjects/questions/filter-counts/filters/mutations/bulk),
URL-synced filters, live facet counts, paginated table with expandable hint/explanation rows,
row selection + bulk toolbar, category/subject/riddle modals (level-driven option counts), import
modal with CSV preview, CSV export.

**Overall: the feature set is complete and mature — it went through two quality-gate passes and it
shows. The gaps below are polish-level, not structural.**

## 2. Data flow structure (as built)

### 2.1 Storage model (backend)

```
riddle_categories (1) ──< riddle_subjects (1) ──< riddle_mcqs
                                                   ├─ options: jsonb (2–4 items, or null for expert)
                                                   ├─ correctLetter (A–B/C/D) | answer (text, expert)
                                                   ├─ level enum: easy|medium|hard|expert
                                                   ├─ status enum: draft|published|trash
                                                   ├─ random_weight (index-seek random pools)
                                                   └─ composite index (subjectId, level, status)
```

### 2.2 Read path — public gameplay

```
Hub  /riddle-mcq                                    [app/riddle-mcq/page.tsx — useState/useEffect]
  ├─ GET /riddle-mcq/level-counts  → RiddleMcqStatsService (300s cache, one GROUP BY)
  │                                  → { allSubject: {easy..expert}, subjectWise: {slug: {level: n}} }
  ├─ GET /riddle-mcq/categories   → category tiles (riddleTotal summed client-side from subjectWise)
  └─ GET /riddle-mcq/subjects     → used to map categoryId → subjects for per-category counts

Play  /riddle-mcq/play?subjectId=&level=&mode=       [hooks/use-riddle-play/useRiddlePlay.ts]
  fetchRiddles() picks ONE endpoint:
    ├─ subjectId=all, level!=all → GET /riddle-mcq/random/:level?count   (random_weight pool)
    ├─ subjectId=all, level=all  → GET /riddle-mcq/mixed?count=40        (random_weight pool)
    └─ subjectId=X               → GET /riddle-mcq/subjects/:subjectId/riddles?level=  (PUBLISHED only)
  → adaptRiddleMcq()  [types/riddles.ts]  → Riddle[] → pool (base 10 + extra slider)
```

### 2.3 Session lifecycle (client-side persistence)

```
beginSession(extra)
  └─ createRiddleSession()  [lib/riddle-session.ts]
       ├─ in-memory (useRiddlePlay state): answers map {riddleId: 'A'..}, currentIndex, status, timeTaken
       ├─ localStorage STORAGE_KEYS.RIDDLE_SESSION        → full snapshot (start/extend, and on submit)
       └─ two-key resume store  [lib/riddle-resume.ts]
            ├─ RIDDLE_RESUME_QUESTIONS → riddle snapshot, written ONCE per session start/extend
            └─ RIDDLE_RESUME_PROGRESS  → answers/currentIndex/time, written per 10s autosave tick
                                             (AUTO_SAVE_INTERVAL = 10_000)

reload mid-session
  → loadRiddleResume(): valid only when BOTH keys exist, identity fields match, and age < 24h
  → ResumePromptModal → resumeSession() | beginSession(0)

answer select → pure setState updater → liveScore memo (isRiddleAnswerCorrect per riddle)
last riddle + Next/Skip → SubmitConfirmModal → handleSubmit()
  → session.status = 'completed', timeTaken recorded, resume keys cleared
  → navigate /riddle-mcq/results?session=<uuid>

Results page
  → getRiddleSessionById(uuid)  [reads localStorage; missing → redirect /riddle-mcq]
  → calculateResult() → isRiddleAnswerCorrect per riddle → grade + byDifficulty breakdown
  → ScoreCard / breakdown / RiddleReview (review currently re-compares inline — finding R3)
```

Scorer rule: **one scoring path** — `lib/riddle-scoring.ts#isRiddleAnswerCorrect` is the single
source of truth for play, live score, and results; RiddleReview is the one consumer still bypassing it.

### 2.4 Write path — admin

```
Admin  RiddleMcqContainer  [features/riddle-mcq/]
  React Query hooks ──► lib/riddle-mcq-api.ts ──► NestJS /riddle-mcq/* ──► services ──► TypeORM
    ├─ reads:  useRiddleMcqCategories/Subjects/Questions/FilterCounts
    │            (GET /all paginated + cached, /filter-counts facet counts)
    ├─ mutations: useRiddleMutations (POST/PATCH/DELETE riddles)
    │            → invalidates ['riddle-mcq-categories'] / ['riddle-mcq-subjects'] / questions caches
    ├─ bulk:    useBulkActions → POST /bulk-action → BulkActionsService (per-id publish/draft/trash/restore/delete)
    ├─ import:  ImportModal → chunked (100) POST /bulk → ImportService (transactional, auto-creates taxonomy)
    └─ export:  exportRiddlesToCSV → GET /export (category-grouped CSV download)

Validation is duplicated deliberately at both ends:
  FE zod (RiddleMcqModal)  ⟷  BE DTO rules (create + update):
    min options 2/3/4 by level · correctLetter within option range · expert requires text answer
Cache: family-scoped invalidation ('questions' / 'filter-counts' / 'stats' families) — no wildcard flush
```

## 3. Is the MCQ riddle format good?

**Verdict: yes — the format is well chosen for riddles, with a few caveats.**

What works:

1. **Adaptive option count is the right call.** Riddles rarely have 4 genuinely plausible
   distractors; forcing A–D everywhere would make wrong answers throwaway. Easy=2 / Medium=3 /
   Hard=4 keeps distractors honest, and expert=text preserves the "guess the answer" feel that
   defines riddles.
2. **Instant feedback + hints fits the genre.** Riddles are about the aha-moment; immediate
   right/wrong with emoji feedback and an opt-in hint respects that loop. A quiz-exam style
   "answer everything, score at the end" flow would be worse here.
3. **Difficulty ladder matches backend enforcement** (min options per level, letter ranges,
   expert answer required) so bad content can't be authored — the format is protected at both ends.
4. **Two modes (practice/timer) on one hub** gives casual and competitive players the same content
   without duplicating pages.

Caveats (format-level, not bugs):

- **Expert text answers are strict-match only.** `isRiddleAnswerCorrect` does exact comparison —
  riddle answers are notoriously multi-phrasable ("an echo" / "echo" / "your voice"). Until a
  normalized/alias answer field exists, expert riddles will generate false negatives. This is the
  weakest point of the format; worth a product decision (answer aliases or fuzzy-match threshold).
- **Hints are free.** Using a hint doesn't affect score or history (history tracking is owner-deferred),
  so there's no tension between hint and score. Fine for now; revisit with the history decision.
- **Expert riddles fall out of the review UI weakly:** `RiddleReview` renders an empty options list
  for them (no options) and shows the raw answer — see issue R3.

## 4. Findings — functional/consistency issues

| #   | Issue                                                                                                                                                                                                                                                 | Location                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| R1  | `challenge`/`practice` routes redirect to `/riddle-mcq?mode=…` claiming the mode card will be "pre-expanded", but the hub only reads the `category` param — `mode` is silently dropped                                                                | `app/riddle-mcq/challenge/page.tsx:13`, `practice/page.tsx:13`, `page.tsx:196` |
| R2  | Dead component: `RiddleStatsBanner` is imported nowhere (docs still list it as a hub element)                                                                                                                                                         | `app/riddle-mcq/components/RiddleStatsBanner.tsx`                              |
| R3  | `RiddleReview` bypasses the shared scorer (`userAnswer === riddle.correctOption` inline) and renders an empty option list for expert text riddles; results passes `'N/A'` as userAnswer for unanswered                                                | `app/riddle-mcq/components/RiddleReview.tsx:32-39`, `results/page.tsx:278`     |
| R4  | The per-riddle countdown ring is not a real per-riddle timer: the play page passes the **session** remaining seconds and fabricates a "per-riddle limit" by dividing remaining time across remaining riddles — the ring jumps back up after each Next | `play/page.tsx:304-315`, `RiddleCard.tsx:259-263`                              |
| R5  | `ImportModal` gets `onSuccess={() => {}}` — import success relies entirely on internal invalidation; the prop is dead weight and the container gives no success feedback                                                                              | `features/riddle-mcq/components/RiddleMcqContainer.tsx:325-329`                |
| R6  | Doc drift: docs reference `components/riddle-mcq/RiddleChallengeHub.tsx` and a stats banner on the hub — neither exists; challenge/practice are now redirects                                                                                         | `docs/features/riddle-mcq.md:69`                                               |
| R7  | Hub data fetching uses `useState`/`useEffect` + `Promise.all` while every other surface uses React Query — no caching, no retry, duplicated loading/error shells                                                                                      | `app/riddle-mcq/page.tsx:206-264`                                              |
| R8  | Container submit handlers typed `any` (`handleCategorySubmit(data: any)` etc.)                                                                                                                                                                        | `RiddleMcqContainer.tsx:141,150`                                               |

## 5. Cosmetic improvements (the ask)

Grouped by page, highest user-visible value first.

### Gameplay / play page

| C#  | Cosmetic                                   | Detail                                                                                                                                                                                                    |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Keyboard shortcuts**                     | `1–4`/`A–D` select an option, `→`/`Enter` next, `←` back, `S` skip. Biggest playability win; zero layout change. Show subtle key hints on option tiles (desktop only).                                    |
| C2  | **Fix the timer-ring semantics (with R4)** | Either remove the apportioned ring or make it honest: show a real per-riddle countdown (config value per level) alongside the session clock, clearly labeled.                                             |
| C3  | **Next button icon**                       | Uses `ArrowLeft rotate-180` (`play/page.tsx:370`) — swap for `ArrowRight`/`ChevronRight`.                                                                                                                 |
| C4  | **Question navigator dots**                | A small dot/number strip (answered green · skipped yellow · current ring · unseen gray) so players can jump around; the "Skipped (n)" chip becomes redundant-ish but can stay.                            |
| C5  | **`prefers-reduced-motion`**               | Floating difficulty emojis loop forever and 60-bubble bursts fire on every answer; wrap both in a reduced-motion media query / framer-motion `useReducedMotion`.                                          |
| C6  | **Toast reuse**                            | Hand-rolled share toast (`play/page.tsx:376-387`) — reuse the repo's existing toast primitive (added in the media UI pass) for consistency.                                                               |
| C7  | **Web Share API**                          | `handleShare` copies URL only; on mobile `navigator.share` with the mix name is friendlier, clipboard as fallback. Results page share already builds nice text — share that same way during play results. |

### Hub (`page.tsx`)

| C#  | Cosmetic                                 | Detail                                                                                                                                    |
| --- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| C8  | **Level tile grid on mobile**            | `grid-cols-4` at all breakpoints (`page.tsx:121`) — tiles with 10px count text are cramped on phones; use `grid-cols-2 sm:grid-cols-4`.   |
| C9  | **Honor `?mode=` (with R1)**             | Read `mode` param and open only that mode's picker (the other collapsed), so the old routes behave as advertised.                         |
| C10 | **Zero-count tiles**                     | Currently `opacity-50` + "0 riddles"; a "Coming soon" microcopy reads friendlier than a bare zero.                                        |
| C11 | **Category tiles enrichment**            | Show the subject emojis or a top-2 level breakdown on category cards instead of only a total; adds scan value for choosing where to play. |
| C12 | **Migrate hub to React Query (with R7)** | Also dedupes the two bespoke loading/error shells; standard skeleton cards for tiles.                                                     |

### Pre-game summary (`PreRiddleSummary`)

| C#  | Cosmetic                          | Detail                                                                                                                                                            |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C13 | **Drop the redundant "Mix" tile** | The info grid's 4th tile repeats `mixName`, which is already the card heading (`PreRiddleSummary.tsx:80-85`) — replace with time-per-riddle or pool total.        |
| C14 | **Range slider styling**          | The bare `input[type=range]` with `appearance-none` and no thumb styles renders browser-default/invisible thumb in some browsers — add accent-color/thumb styles. |

### Results page

| C#  | Cosmetic                              | Detail                                                                                                                                   |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| C15 | **Background gradient mismatch**      | Results uses `#E8E4F3 → #D4C5E8` while hub/play use `#A5A3E4 → #BF7076` — unify to the hub gradient so the flow feels continuous.        |
| C16 | **Share fallback**                    | `alert('Results copied...')` on clipboard failure (`results/page.tsx:114`) — use the toast primitive (C6) and offer Web Share API first. |
| C17 | **Expert review rendering (with R3)** | For expert riddles show the full text answer + explanation instead of an empty options list; mark "Text answer" explicitly.              |
| C18 | **Per-difficulty tiles when empty**   | Tiles with no questions show a grey `-`; collapse them (or hide the section) when only one difficulty was played to reduce noise.        |

### Admin (`features/riddle-mcq/`)

| C#  | Cosmetic                               | Detail                                                                                                                                                         |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C19 | **Import success feedback (with R5)**  | Wire `onSuccess` to invalidate riddle lists + show a success toast with imported count; today the modal just closes.                                           |
| C20 | **Expert rows in the table**           | Options column shows a bare "Expert" placeholder (`RiddleTableRow.tsx:157-158`) — show "✍️ Text answer" chip + the expected answer already in the next column. |
| C21 | **Type the submit handlers (with R8)** | `CreateRiddleMcqDto` / category & subject DTOs instead of `any`.                                                                                               |

## 6. Plan (prioritized)

Rule inherited from code-quality-plan §2: refactors leave behavior identical; split before enhancing.

### Phase P0 — Small correctness fixes (< 1 day each)

1. **R1+C9** — hub reads `?mode=` and pre-expands the matching picker.
2. **R2** — delete `RiddleStatsBanner` (or wire it into the hub if the stats row is wanted again; default: delete).
3. **R3+C17** — `RiddleReview` uses `isRiddleAnswerCorrect`, renders expert riddles as text-answer blocks.
4. **R5+C19** — wire `ImportModal.onSuccess`: invalidate lists + success toast with count.
5. **C3** — ArrowRight icon on Next.

### Phase P1 — Gameplay polish

6. **C1** — keyboard shortcuts + desktop key hints on option tiles.
7. **R4+C2** — honest per-riddle timer (config per level) or removal of the apportioned ring; session clock stays.
8. **C4** — question navigator dots with answered/skipped/current/unseen states.
9. **C5** — `useReducedMotion` guards for floating emojis + bubble bursts.
10. **C6+C16+C7** — shared toast + Web Share API in play and results.

### Phase P2 — Hub & visual consistency

11. **C8, C10, C11** — hub tile responsive grid, zero-count microcopy, category card enrichment.
12. **C15** — unify results gradient with hub gradient.
13. **C13, C14** — PreRiddleSummary tile swap + slider styling.
14. **R7+C12** — hub migration to React Query (behavior-identical; removes bespoke loading/error shells).
15. **C18** — collapse empty difficulty tiles on results.

### Phase P3 — Type hygiene & docs

16. **R8+C21** — typed submit handlers in the admin container.
17. **R6** — update `docs/features/riddle-mcq.md`: remove RiddleChallengeHub/stats-banner claims, note the redirect routes.
18. **Riddle format decision (owner)** — expert answer aliases / normalized matching; needs product input before implementation.

### Deferred (consistent with prior owner decisions)

- Hint/skip tracking + history writes (already deferred — hints affecting score depends on it).
- Public category riddles endpoint (`GET /riddle-mcq/categories/:id/riddles`) noted in `page.tsx` header; category play still resolves to the all-subjects mix.
- Dark-mode support for the public riddle pages (hardcoded light gradients across all public pages — repo-wide decision, not riddle-specific).

## 7. Exit Criteria

- No dead riddle-mcq components; docs match the actual file tree.
- Every route with documented behavior performs it (`?mode=` expansion included).
- One scoring path everywhere: `isRiddleAnswerCorrect` (play, live score, results, review).
- Timer display never contradicts itself (no apportioned "per-riddle" ring unless it's a real per-riddle limit).
- All new UI states (navigator dots, sliders, toasts) respect `prefers-reduced-motion` and are keyboard reachable.
- Test suite still green; add cases for any new pure logic (mode-param parsing, expert review rendering helper).
