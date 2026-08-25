# Riddle-MCQ Frontend

## 1. Scope & File Inventory

Public gameplay pages (`apps/frontend/src/app/riddle-mcq/`):

| File | Purpose |
|---|---|
| `app/riddle-mcq/page.tsx` | Riddles home: fetches `/riddle-mcq/stats/overview` via `getStats()`, shows `RiddleStatsBanner`, links to Challenge / Practice modes (141 LOC) |
| `app/riddle-mcq/challenge/page.tsx` | Timer-challenge mode picker: Subject Wise Mix / All-Subject Level Wise / Complete Mix; navigates to `/riddle-mcq/play?...&mode=timer` (388 LOC) |
| `app/riddle-mcq/practice/page.tsx` | Practice mode picker — near-identical clone of challenge page with `mode=practice` (390 LOC) |
| `app/riddle-mcq/play/page.tsx` | Main gameplay: fetches riddles, session lifecycle, timer, auto-save, resume dialog, confirm-submit, extend-session modal (763 LOC) |
| `app/riddle-mcq/results/page.tsx` | Results from localStorage session: score card, grade, per-difficulty breakdown, review toggle, share-to-clipboard (351 LOC) |
| `app/riddle-mcq/error.tsx` / `loading.tsx` | Route-level error boundary / suspense fallback |

Shared page components (`app/riddle-mcq/components/`):

| File | Purpose |
|---|---|
| `RiddleCard.tsx` (354 LOC) | Single-riddle card reusing shared quiz components `AnswerOptions` + `BubbleEmojiEffect`; animated feedback messages, SVG countdown ring, forward-ref `clearBubbles()` |
| `RiddleReview.tsx` | Per-riddle answer review row on results page |
| `RiddleStatsBanner.tsx` | Totals banner on the home page |

Feature module (`apps/frontend/src/features/riddle-mcq/`) — powers the **admin panel** section mounted at `app/admin/page.tsx:464` via `<RiddleMcqContainer />`:

| File | Purpose |
|---|---|
| `components/RiddleMcqContainer.tsx` (334 LOC) | Admin orchestrator: queries, filter state, URL sync, selection set, modal state, confirm dialogs |
| `components/RiddleMcqHeader.tsx` | Add / Import / Export toolbar |
| `components/RiddleMcqFilterPanel.tsx` | Status dashboard + composes FilterControls/SearchInput/ActiveFiltersBadge |
| `components/FilterControls.tsx`, `CategoryFilterRow.tsx`, `RiddleMcqSubjectFilterRow.tsx`, `SearchInput.tsx`, `ActiveFiltersBadge.tsx` | Filter sub-components |
| `components/RiddleTable.tsx`, `RiddleTableRow.tsx` | Paginated admin table with checkboxes |
| `components/useRiddleMcqModals.ts` | Modal/confirm state hook — **defined but never imported (dead code)** |
| `hooks/useRiddleMcqCategories.ts`, `useRiddleMcqSubjects.ts`, `useRiddleMcqQuestions.ts` | React Query wrappers + inline mutations |
| `hooks/useRiddleMcqFilterCounts.ts` | Unified filter-counts query |
| `hooks/useRiddleMcqFilters.ts` | Local-state filters synced to URL (`router.replace`) |
| `hooks/useRiddleMutations.ts` | Second set of category/subject/riddle/bulk mutations |
| `hooks/useBulkActions.ts` | Wraps `useRiddleMutations().bulkAction` for selected rows |
| `hooks/useDebounce.ts` | 300 ms search debounce |
| `modals/RiddleMcqModal.tsx` | Create/edit riddle; react-hook-form + zod; level-based option counts (easy=2, medium=3, hard=4, expert=open-ended) |
| `modals/RiddleQuestionForm.tsx`, `RiddleAnswerFields.tsx`, `RiddleMetaFields.tsx`, `useRiddleFormReset.ts` | Split form sections (per refactor plan Priority 3) |
| `modals/RiddleMcqCategoryModal.tsx`, `RiddleMcqSubjectModal.tsx` | Category/subject CRUD modals |
| `modals/ImportModal.tsx` (344 LOC) | CSV import: drag-drop, template download, preview, chunked upload of 100 rows/call |
| `modals/csv-parser.ts` | Extracted CSV parser/types (refactor plan Priority 2, done) |

Support libs:

| File | Purpose |
|---|---|
| `lib/riddle-mcq-api.ts` (474 LOC) | Typed API client for all `/riddle-mcq/*` endpoints (public + `isAdmin: true` calls) |
| `lib/riddle-session.ts` (221 LOC) | localStorage session persistence: save/load/clear/expiry (24 h), resume check, beforeunload warning, history getter |
| `types/riddles.ts` (320 LOC) | Backend entity types, frontend `Riddle`/`RiddleSession`/`RiddleResult`, `adaptRiddleMcq()` adapter, difficulty constants |
| `lib/useRiddleMcqFilters.ts` (113 LOC) | **Second** filter hook (URL-driven, used by `app/admin/components/RiddleMcqSection.tsx:7`) — duplicate of features hook |
| `lib/storage.ts` | Storage keys incl. `RIDDLE_SESSION`, `RIDDLE_HISTORY`, `RIDDLE_FAVORITES`, `RIDDLE_STREAK`, `RIDDLE_ACHIEVEMENTS` (lines 44–49) |

Planning docs compared: `docs/archive/riddle-mcq-admin-plan.md`, `docs/archive/riddle-mcq-implementation-plan.md`, `RIDDLE-MCQ-REFACTOR-PLAN.md`, `RIDDLE-MCQ-DOCUMENTATION.md`.

## 2. What Is Done (implemented & working)

- **Full public game loop**: home → mode pick (challenge/practice) → play → results, all backed by real backend endpoints (`riddle-mcq-api.ts`: `getSubjects(true)`, `getStats()`, `getMixedRiddles`, `getRandomRiddles`, `getRiddlesBySubject`).
- **Session persistence (Phase 0)**: 10 s auto-save to localStorage (`play/page.tsx:251–266`), resume dialog on return (`play/page.tsx:459–493`), 24-hour expiry + completed/abandoned cleanup (`riddle-session.ts:39–63`), `beforeunload` guard (`riddle-session.ts:207–220`).
- **Timer & practice modes**: aggregate timer built from settings `riddles.defaults.levelTimers` with 30 s default (`play/page.tsx:184–211`), pause/resume, color-coded urgency, extend-session modal adding N unique riddles and extra time (`play/page.tsx:358–413`). Practice mode has a visual per-riddle countdown ring in `RiddleCard`.
- **Expert open-ended answers**: text input path via `adaptRiddleMcq` mapping expert→`level:'extreme'` (`types/riddles.ts:263–282`) and case-insensitive answer normalization duplicated in play (`play/page.tsx:321–332`) and results (`results/page.tsx:47–58`).
- **Results experience**: grade calc, per-difficulty breakdown, celebration animation, share-to-clipboard, review list, retry/change-level/home actions.
- **Admin CRUD panel**: categories, subjects and riddles create/edit/delete/trash; status dashboard; category/subject/level/status/search filters with live filter-counts; pagination with adjustable page size; row selection + bulk-action toolbar; CSV export download (`RiddleMcqContainer.tsx`); CSV import with preview and chunked POSTs (`ImportModal.tsx`).
- **URL-state sync** for admin filters (`RiddleMcqContainer.tsx:86–102`) and initial filter hydration from query params (`features/.../useRiddleMcqFilters.ts:17–36`).
- **Refactor-plan progress**: Priority 1 (backend bulk service split) done; Priority 2 done — `csv-parser.ts` extracted and consumed by `ImportModal.tsx`; form split into `RiddleQuestionForm` / `RiddleAnswerFields` / `RiddleMetaFields` per plan.

## 3. What Is Partially Done / In Progress

| Planned (doc) | Actual state |
|---|---|
| `RIDDLE-MCQ-REFACTOR-PLAN.md` Priority 3: split `RiddleMcqContainer.tsx` (354 → ~250 LOC) using new hooks | Form was extracted but Container is still 334 LOC; the planned hook `components/useRiddleMcqModals.ts` **was created but is unused** — its logic was re-inlined into `RiddleMcqContainer.tsx:64–166`. Refactor incomplete/half-abandoned. |
| `riddle-mcq-admin-plan.md` §7.3: JSON import/export alongside CSV | Only CSV exists. `ImportModal.tsx` accepts `.csv` only; no JSON template, parser or export. |
| `riddle-mcq-admin-plan.md` §6: level-based option logic enforced in modal | Done client-side (`RiddleMcqModal.tsx:17–22` zod LEVEL_OPTIONS) but backend does not enforce the same rules (see backend doc §5). |
| Stats-driven level counts on challenge/practice pages | Counts are **faked**: total level counts are divided evenly across subjects with an admitted placeholder comment ("For now, distribute total across subjects evenly", `challenge/page.tsx:116–125`, identical in `practice/page.tsx:113–125`). Per-subject real counts are not used even though `SubjectWithStats.riddleCount` is declared. |
| History/streak/favorites (storage keys exist, `types/riddles.ts:172–184` defines `RiddleHistoryEntry`; `riddle-session.ts:133–135` provides `getRiddleHistory`) | Nothing ever writes history, favorites, streak or achievements. Keys are write-never dead weight. |
| `hintsUsed` / `skippedRiddles` session fields (`riddle-session.ts:168–169`) | Initialized to 0/[] and never updated by gameplay. |
| Documentation accuracy (`RIDDLE-MCQ-DOCUMENTATION.md`) describes `page.tsx` structure matching reality, but claims "State: Zustand" — actual code uses React Query + useState only. | Docs drift. |

## 4. What Is Missing / Needs To Be Done

1. **Subject-wise gameplay is effectively broken end-to-end** (see bug #1 below) — needs param unification (`chapterId` → `subjectId` or vice versa) across challenge/practice/play/results.
2. `/riddles` legacy route referenced by results redirect does not exist (`results/page.tsx:107`; `apps/frontend/src/app/` has no `riddles/` dir) → user lands on 404 after deleting a session.
3. JSON import/export (planned, not built).
4. Real per-subject & per-subject×level stats endpoint consumption (backend `stats/overview` doesn't provide it either).
5. History recording on session completion (`saveRiddleHistoryEntry` equivalent) so results survive localStorage overwrite of the single-session slot (`riddle-session.ts:74–84` only keeps latest session).
6. Hint interaction tracking (UI shows hints via `AnswerOptions` presumably, but `hintsUsed` never increments).
7. Delete of dead code: `components/useRiddleMcqModals.ts`, one of the two `useRiddleMcqFilters` implementations, unused storage keys.
8. No tests at all for the feature folder (no `*.test.*` / `*.spec.*` files).

## 5. Known Issues, Bugs & Tech Debt

1. **BUG – query-param mismatch breaks subject-wise play**: challenge/practice navigate with `?subjectId=...` (`challenge/page.tsx:147`, `practice/page.tsx:148`) but play reads only `chapterId` (`play/page.tsx:81`). Any subject-specific start silently becomes "all subjects". The subject name also never resolves because `chapterNameParam` reads a `chapterName` key that is never sent.
2. **BUG – cross-stack stats contract mismatch**: frontend expects `{ totalRiddleMcqs, totalSubjects, mcqsByLevel }` (`riddle-mcq-api.ts:142–146`) but backend returns `{ totalRiddles, totalSubjects, totalCategories, riddlesByLevel }` (`riddle-mcq-stats.service.ts:54–59`). Consequently `stats?.totalRiddleMcqs || 0` is always 0 → home banner, Complete-Mix counts, and All-Subject level buttons show 0 and are disabled whenever data exists.
3. **BUG – stale cache keys in `useRiddleMutations.ts`**: invalidates `['riddle-categories']` and `['riddle-subjects']` (`useRiddleMutations.ts:24–25,32–34,...`) while the actual query hooks use `['riddle-mcq-categories']` / `['riddle-mcq-subjects']` (`useRiddleMcqCategories.ts:13`, same pattern in subjects hook). Mutations routed through this hook leave lists stale.
4. **Duplicate implementations**:
   - Two `useRiddleMcqFilters` hooks: `lib/useRiddleMcqFilters.ts` (URL-source-of-truth, used by admin `RiddleMcqSection.tsx`) vs `features/riddle-mcq/hooks/useRiddleMcqFilters.ts` (local state + separate URL-sync effect in Container) — divergent defaults (`status:'published'` vs `'all'`), double-routing risk when both run under `/admin`.
   - `components/useRiddleMcqModals.ts` duplicates modal logic already inlined in `RiddleMcqContainer.tsx` (dead file).
   - `isAnswerCorrect` duplicated between `play/page.tsx:321` and `results/page.tsx:47`; additionally the live score passed to `RiddleCard` uses a *different* comparison that ignores expert text answers (`play/page.tsx:588–591`), so displayed score ≠ submitted score for expert riddles.
5. **Side effect inside state updater**: `handleSubmit()` invoked inside `setTimeRemaining(prev => ...)` (`play/page.tsx:232–240`) — can double-fire submit under StrictMode/timer races.
6. **Client-side shuffle** `sort(() => Math.random() - 0.5)` (`play/page.tsx:162`) is biased and re-shuffles on every effect re-run dependency change.
7. **Legacy "chapter" naming everywhere** despite docs stating "Category → Subject → MCQ (NO Chapter)" (`riddle-mcq-api.ts:7`): `Riddle.chapter`, `chapterId`, `chapterName`, `createRiddleSession(mode, chapterId, ...)`, `DEFAULT_CHAPTER_ICONS` (`types/riddles.ts:101–102,233`), plus a whole unused `RiddleChapter`/`adaptChapter` layer (`types/riddles.ts:42–53,287–302`) referencing a table the backend no longer has.
8. `adaptRiddleMcq` hardcodes `status: 'published'` (`types/riddles.ts:278`) regardless of real status.
9. `RiddleMcqCategory.order` declared in the API type (`riddle-mcq-api.ts:35`) but the backend entity/category service never returns it — phantom field (also `order` appears only in the stale migration; see backend doc).
10. `ImportModal`'s `onSuccess` prop receives a no-op from Container (`RiddleMcqContainer.tsx:328`); cache refresh relies solely on the modal's internal `queryClient` usage.
11. Practice-mode countdown is purely cosmetic — reaching 0 neither flags nor advances (`play/page.tsx:283–294`).
12. Empty catch blocks swallow settings-load failures silently (`play/page.tsx:133–135`).

## 6. How It Works (architecture/data flow/API endpoint list)

```
Public flow
  /riddle-mcq (home)
      ├─ GET /riddle-mcq/stats/overview .............. getStats()          → RiddleStatsBanner
      ├─ /riddle-mcq/challenge (timer)  ─┐
      └─ /riddle-mcq/practice            ├─ GET /riddle-mcq/subjects?hasContent=true
                                         ├─ GET /riddle-mcq/stats/overview
                                         └─ router.push → /riddle-mcq/play?{subjectId|chapterId}&level&mode
  /riddle-mcq/play
      ├─ chapterId==='all' ? GET /riddle-mcq/random/:level?count=N  (or /mixed?count=20)
      │                     : GET /riddle-mcq/subjects/:id/riddles?page&limit&level
      ├─ adaptRiddleMcq() per item → Riddle[]
      ├─ localStorage resume check (loadRiddleSession) else createRiddleSession()
      ├─ RiddleCard (shared AnswerOptions/BubbleEmojiEffect) ← answers map {riddleId: 'A'..'D'|text}
      ├─ auto-save every 10 s; beforeunload guard
      └─ submit → score computed client-side → saveRiddleSession(completed) → /riddle-mcq/results?session=<id>
  /riddle-mcq/results
      └─ getRiddleSessionById(id) from localStorage → calculateResult() (grade/byDifficulty) → ScoreCard + RiddleReview
```

Admin flow: `/admin?section=riddle-mcq` mounts `RiddleMcqContainer` → React Query hooks call:

| Endpoint | Client fn | Auth |
|---|---|---|
| `GET/POST /riddle-mcq/categories`, `GET/PATCH/DELETE /categories/{id}`, `GET /categories/all` | `riddle-mcq-api.ts:162–205` | public read / admin write |
| `GET /riddle-mcq/subjects[?hasContent=true]`, `GET /subjects/all`, `GET/PATCH/DELETE /subjects/{id}` | `:214–260` | public read / admin write |
| `GET /riddle-mcq/all?category&subject&level&status&search&page&limit` | `getAllRiddles :302` | admin |
| `POST /riddle-mcq/riddles`, `PATCH/DELETE /riddles/{id}` | `:363–420` | admin |
| `POST /riddle-mcq/riddles/bulk` | `bulkCreateRiddles :371` (chunked ×100 from ImportModal) | admin |
| `POST /riddle-mcq/riddles/bulk-action` | `bulkActionRiddles :336` | admin |
| `GET /riddle-mcq/export?category=` | `exportRiddlesToCSV :385` (Blob download) | admin |
| `GET /riddle-mqc/filter-counts` (sic: `/filter-counts`) | `getRiddleFilterCounts :429` | public |
| `GET /riddle-mcq/stats/status-counts?subject=` | `getStatusCountsBySubject :464` | admin |

State libraries: `@tanstack/react-query` (queries + mutations with key-based invalidation), plain `useState` for session/UI; no Zustand contrary to documentation.

## 7. Recommended Process To Proceed (prioritized step-by-step action plan)

1. **P0 – Fix the stats contract** (unblocks home/challenge/practice): align backend `stats/overview` payload with `RiddlesStats` (`totalRiddleMcqs`, `mcqsByLevel`) or update `riddle-mcq-api.ts` mapping; fix the swapped subjects/categories count in the same pass (see backend doc §5.1).
2. **P0 – Unify the play-page query params**: rename `chapterId`→`subjectId` (and `chapterName`→`subjectName`) across `challenge`, `practice`, `play`, `results` and `RiddleSession` type; keep a temporary alias for old saved sessions.
3. **P0 – Fix results redirect** `results/page.tsx:107` `/riddles` → `/riddle-mcq`.
4. **P1 – Consolidate duplicated hooks/logic**: delete `components/useRiddleMcqModals.ts` or finish refactor Priority 3 by actually consuming it; merge `lib/useRiddleMcqFilters.ts` and the features hook into one implementation; fix wrong invalidation keys in `useRiddleMutations.ts`.
5. **P1 – Extract shared `isAnswerCorrect`** into `lib/riddle-session.ts` or a utils file; make the live `RiddleCard` score use it (fixes expert-score mismatch).
6. **P1 – Move `handleSubmit` out of the timer's state updater**; trigger via effect watching `timeRemaining === 0`.
7. **P2 – Implement JSON import/export** per admin-plan §7.3 (extend `csv-parser.ts` pattern with `json-parser.ts`; backend already accepts bulk DTO arrays).
8. **P2 – Replace fake level counts**: add per-subject/per-level counts to backend stats (or reuse `filter-counts` subjectCounts+levelCounts) and render real numbers on challenge/practice.
9. **P3 – Session history**: append a `RiddleHistoryEntry` on completion (key already exists in storage.ts) so results survive starting a new session.
10. **P3 – Cleanup sweep**: remove dead `RiddleChapter`/`adaptChapter` layer or wire it; drop never-written storage keys; correct `RIDDLE-MCQ-DOCUMENTATION.md` (Zustand claim, flat-file architecture diagram).
11. **P3 – Add minimal tests**: unit-test `csv-parser`, `adaptRiddleMcq`, result calculation; e2e the play→results happy path.
