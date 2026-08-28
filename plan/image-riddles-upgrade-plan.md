# Image Riddles — Analysis, Comparison & Upgrade Plan

Companion docs: [features/image-riddles.md](../docs/features/image-riddles.md), [code-quality-plan.md](code-quality-plan.md).
Verified against source on 2026-08-27.

## 1. Current State (verified)

Backend is in good shape after the 2026-08 rewire: public reads hard-filter PUBLISHED,
`/admin/image-riddles/*` is the canonical CRUD surface (duplicate CRUD deleted along
with `image-riddles-update.helper.ts`), admin FE consumes the admin API with JWT,
media library + WebP upload pipeline exist, seed SQL matches the schema, deep links
work. What remains is quality debt, not integration work.

### Confirmed remaining issues

| #   | Issue                                                                                                                                                                   | Location                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A1  | Public page fetches `?limit=200` once and filters/paginates client-side; search/difficulty/category endpoints unused (`/search`, `/difficulty/:level`, `/category/:id`) | `app/image-riddles/page.tsx:167`, `lib/image-riddles-api.ts` |
| A2  | Only 3 action ids handled (`check-answer`, `show-hint`, `give-up`); share/report/fullscreen/skip presets render but do nothing                                          | `page.tsx:349-362`                                           |
| A3  | Analytics plumbing dead: `onAnalytics` prop exists but page never supplies it                                                                                           | `page.tsx:88-134`, `ActionOptions.tsx:532`                   |
| A4  | Raw `<img>` used twice — no `next/image`, no alt enforcement on render path                                                                                             | `page.tsx:538,719`                                           |
| A5  | Entity throws bare `Error` on invalid action options → 500 instead of 400                                                                                               | `image-riddle.entity.ts:266,345`                             |
| A6  | `deleteCategory` saves riddles one-by-one in a loop inside no transaction; entity FK is already `SET NULL` so the manual loop is redundant                              | `admin-image-riddles.service.ts:358-361`                     |
| A7  | `getDashboardStats`: 7 separate counts + loads all categories with full riddle relations; `averageTimer` hardcoded 90                                                   | `admin-image-riddles.service.ts:387-409`                     |
| A8  | Monoliths: public page **820 LOC**, admin section **2090 LOC** — both far over the project's ≤200 LOC rule and absent from the code-quality refactor table              | `page.tsx`, `ImageRiddlesAdminSection.tsx`                   |
| A9  | No feature folder (`src/features/image-riddles/`) unlike quiz-mcq/riddle-mcq; all game logic inline in the page component                                               | `apps/frontend/src/features/`                                |
| A10 | Zero tests for image-riddles (riddle-mcq has 52 passing FE tests)                                                                                                       | `src/__tests__/`                                             |

## 2. Comparison vs Riddle-MCQ / Quiz-MCQ Standard

Riddle-mcq went through two quality-gate passes (2026-08-25/26); quiz-mcq got P0/P1
fixes. Image-riddles received the _integration_ fixes but not the _quality-gate_ pass:

| Dimension              | riddle-mcq (target)                                                        | image-riddles (current)                                                      | Gap      |
| ---------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| Gameplay orchestration | `hooks/use-riddle-play/*` extracted hooks (useRiddlePlay, useRiddleTimers) | All state/effect logic inline in 820-LOC page                                | P1-A9    |
| Monolith split         | Play page decomposed into `play/components/` modals                        | Page monolith + 2090-LOC admin monolith                                      | P1-A8    |
| Shared scorer          | Single `lib/riddle-scoring.ts` used by play/results/live-score             | Answer check inlined in switch case (`toLowerCase()` compare)                | P2       |
| Data fetching          | Server-side filtering via typed API per subject/level/mixed                | One 200-row dump + client-side filter (A1)                                   | P1       |
| Session/resume         | Two-key resume store (`riddle-resume.ts`) + tests                          | None (single-riddle modal; acceptable, but attempts/reveals reset on reload) | Deferred |
| Tests                  | scoring/csv-parser/resume suites                                           | None                                                                         | P0-A10   |
| Dead actions           | All preset actions wired or removed                                        | 4+ presets render but are inert (A2)                                         | P1       |
| Dashboard queries      | Aggregation queries / single GROUP BY patterns                             | 7 counts + N+1 relations load (A7)                                           | P2       |
| Error semantics        | BadRequestException from validators                                        | Bare Error → 500 (A5)                                                        | P1       |
| Strictness/lint        | Same repo-wide ladder applies                                              | Nothing image-specific blocking                                              | P3       |

## 3. Plan (prioritized)

Rule inherited from code-quality-plan §2: refactors leave behavior identical;
split before enhancing when a change touches an existing monolith.

### Phase P0 — Correctness & safety net (small, immediate)

1. **A5** — map entity validation errors to `BadRequestException` (throw site keeps pure validation; service/controller catches and wraps), matching the deleted helper's old contract.
2. **A2** — decide per unhandled preset: wire up (share → Web Share API w/ clipboard fallback; fullscreen → Fullscreen API; skip → next-riddle navigation) or remove preset buttons until implemented. Default: implement share+skip, drop report/fullscreen.
3. **A6** — replace the per-row save loop with either nothing (FK `SET NULL` handles it) or one `UPDATE ... SET isActive=false WHERE categoryId=:id`; wrap category delete in a transaction to match riddle-mcq's cascade pattern.
4. **A10 (start)** — add FE unit tests for extractable pure logic before Phase P1 refactors it: answer checker, timer-default resolver, filter/sort reducer. Target ≥ the riddle-mcq scorer suite's coverage of equivalents.

### Phase P1 — Decompose the monoliths (mirrors riddle-mcq gate)

5. **A9/A8** — create `src/features/image-riddles/`:
   - `hooks/useImageRiddleGame.ts` — modal state machine (timer, attempts, shake, reveal)
   - `hooks/useImageRiddleTimers.ts` — mirrors `useRiddleTimers`
   - `hooks/useImageRiddleFilters.ts` — filter/sort/pagination/deep-link sync
   - `components/RiddleModal.tsx`, `RiddleCard.tsx` — extraction, page becomes thin composition (~150 LOC)
6. **A8** — split `ImageRiddlesAdminSection.tsx` (2090 LOC) into `features/image-riddles/admin/`: container + React Query hooks (list/categories/mutations/bulk) + modals (create/edit/import/category) + table/toolbar, mirroring `features/riddle-mcq/` container layout.
7. **A1** — move filtering server-side: use `/image-riddles/search` (already supports `categoryId`+`difficulty`) as the single list endpoint for the grid; keep client-side pagination only if server pagination stays. Removes the arbitrary 200-row cap.

### Phase P2 — Polish & parity

8. **A3** — supply `onAnalytics` from a small `useAnalytics` shim posting events (answer_checked/hint_shown/gave_up) to any sink that exists repo-wide; if none exists, log via console.debug behind a flag and document — remove the dead string constants instead.
9. **A4** — swap `<img>` for `next/image` (remote patterns config for media host) with mandatory `altText`.
10. **A7** — `getDashboardStats` into ≤3 grouped queries (one GROUP BY difficulty, one per-category count join); derive `averageTimer` via `AVG(timerSeconds)` instead of hardcoded 90.
11. **A10 (finish)** — component/hook smoke tests for extracted hooks; add csv-parser tests only if the admin import path shares shape with riddle-mcq's parser.

### Deferred (owner decision)

- Views/likes/attempts persistence tables (needs product decision, same class as riddle-mcq history deferral)
- Session resume store across modal reloads
- Image upload UX parity beyond current MediaPicker

## 4. Exit Criteria

- No file in `app/image-riddles/**`, `components/image-riddles/**`, `features/image-riddles/**` > 200 LOC (repo rule); exceptions documented in PR.
- Public page never loads unbounded datasets; grid works with >200 published riddles.
- Every rendered action button performs its documented behavior.
- All mutations/validation paths return 4xx for invalid input, 500 only for genuine faults.
- Test suite passes with new image-riddles suites included in the FE count.
