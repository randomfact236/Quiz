# Code Quality Plan

Cross-cutting standards and measurable targets for upgrading code quality across all features. Companion docs: [testing-quality](../platform/testing-quality.md) (verification infrastructure), [build-forward-plan](build-forward-plan.md) (execution order), `features/*.md` (where specific debt lives).

## 1. Metric Targets by Phase

| Metric                               | Baseline                             | Phase 1 exit                    | Phase 3 exit                 | Phase 5 exit           |
| ------------------------------------ | ------------------------------------ | ------------------------------- | ---------------------------- | ---------------------- |
| Backend service test coverage        | ~0%                                  | ≥20% on touched services        | ≥40%                         | ≥60%                   |
| Frontend logic coverage (hooks/libs) | ~0%                                  | scoring + session utils covered | ≥30%                         | ≥50%                   |
| Files >500 LOC                       | ~10                                  | no new ones; P0 files listed    | ≤5                           | 0                      |
| Duplicated content-module logic      | 4 copies                             | —                               | shared kit extracted         | 1 copy                 |
| TS strictness                        | partial (`strict` off in root usage) | frontend `strict` audit done    | backend `strict` clean build | both apps fully strict |
| Open P0 bugs                         | 8                                    | 0                               | 0                            | 0                      |
| Lint warnings                        | unbounded (`--max-warnings=1000`)    | ≤50                             | ≤10                          | 0 (drop flag)          |

## 2. Refactor Targets (monoliths → split)

Priority order, respecting the project's own ≤200-LOC rule (`true-ideal-approach-plan`, archived):

| File                                             | LOC | Split into                                                                                                                             |
| ------------------------------------------------ | --- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/backend/src/quiz/quiz.service.ts`          | 959 | SubjectService / ChapterService / QuestionService / QuizImportService / QuizStatsService (mirror riddle-mcq's proven 7-service layout) |
| `apps/frontend/src/app/quiz/play/page.tsx`       | 849 | PreQuizSummary / GameHeader / SubmitModals / ExtendQuizModal components                                                                |
| `apps/frontend/src/hooks/useQuiz.ts`             | 641 | useQuizScoring / useQuizTimers / useQuizResume / useQuizNavigation                                                                     |
| `apps/frontend/src/app/quiz/page.tsx`            | 767 | one component per wizard stage (already exists conceptually)                                                                           |
| `apps/frontend/src/app/riddle-mcq/play/page.tsx` | 763 | same decomposition as quiz play                                                                                                        |

Rule: **no file may grow past 200 LOC; refactors must leave behavior identical** (covered by tests from Phase 1 before touching).

## 3. Deduplication: Shared Content-Module Kit

quiz, riddle-mcq, image-riddles and dad-jokes backends each re-implement: pagination+filters, cached list reads, bulk import (chunked transactions), bulk actions, filter-counts aggregation, CSV export, status counts. Extract once into `apps/backend/src/common/content/`:

1. `content-crud.factory.ts` — standard subject/chapter/item repos + cascade delete
2. `content-import.service.ts` — chunked transactional import with row-error collection
3. `content-filter-counts.service.ts` — parent-cascading facet counts
4. `content-export.util.ts` — CSV builder with escaping
5. Slug generation: single helper (currently 3 divergent copies — see features/riddle-mcq.md)

Frontend equivalents: one `<ContentAdmin>` pattern already half-exists via shared UI kit; consolidate the two riddle filter hooks and the challenge/practice hubs first.

Sequence: extract only after Phase 1 bugs are fixed and tests exist — never refactor and fix simultaneously in the same PR.

## 4. TypeScript Strictness Ladder

1. Enable `strict: true` in `apps/frontend/tsconfig.json`; fix fallout (mostly implicit anys already flagged).
2. Then `noUncheckedIndexedAccess` (catches results-page crash-class bugs like `byDifficulty[q.level]`).
3. Backend: keep existing decorator-compatible config; add `strictPropertyInitialization: false` explicitly documented (TypeORM entities), everything else strict.
4. Remove `skipLibCheck` only if build times allow.

## 5. Per-Feature Quality Debt Index

| Feature                                       | Top debt items                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [quiz](../features/quiz.md)                   | play page + useQuiz monoliths; hub duplication; dead QuizTimer/QuizNavigation; setState side effects |
| [riddle-mcq](../features/riddle-mcq.md)       | duplicate hooks/filters; dead modal hook; legacy chapter naming layer; biased shuffle                |
| [image-riddles](../features/image-riddles.md) | two divergent CRUD paths to unify                                                                    |
| [dad-jokes](../features/dad-jokes.md)         | full FE rewrite against API (removes ~400 lines of localStorage logic)                               |
| [auth-users](../features/auth-users.md)       | plaintext refresh tokens; free-text role; untyped admin payloads                                     |

## 6. Enforcement

- Pre-commit: lint-staged (active) — tighten `--max-warnings` as counts drop.
- Pre-push: type-check (active).
- CI (Phase 4): adds test run + coverage report; coverage ratchets up via `jest --coverage --coverageThreshold`.
- Any PR that adds a file >200 LOC must either split it or justify an exception in the PR description.
