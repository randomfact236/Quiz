# Build-Forward Plan

Starting point: clean `main` (single branch, no baggage), ~78% code-complete, quality C+/B−.
Full details per area live in [features/](features/README.md) and [platform/](platform/README as needed); this file is the execution order.

> **Parallel quality track:** each phase below has exit criteria in [platform/code-quality-plan.md](platform/code-quality-plan.md) §1 (coverage ratchet, file-size budget, dedup milestones). Feature work and quality work advance together — see Working Rules at the end.

## Phase 0 — Stabilize the baseline (before any new features)

1. **Commit or deliberately discard the uncommitted source changes** currently in the working tree (backend quiz/riddle-mcq services, admin page, QuizContainer rename) — do not build on an ambiguous base.
2. Fix the recorded type errors (former tsc log): missing exports in `lib/riddle-mcq-api.ts` (`getAllRiddleMcqsAdmin`, `getAllChapters`, `getRiddlesByChapter`, `getChaptersBySubject`), `RiddlesStats.totalChapters` mismatch, implicit anys. Then remove `--no-lint` from the frontend build script.
3. Tooling repairs (platform/testing-quality.md §4): frontend jest config, husky install, delete-or-implement scanner scripts.

## Phase 1 — P0 correctness bugs (user-visible breakage)

| Bug                                             | Where                             | Fix reference                  |
| ----------------------------------------------- | --------------------------------- | ------------------------------ |
| MCQ review marks correct answers wrong          | QuestionReview.tsx:32             | features/quiz.md §D1           |
| Extreme answers always scored incorrect         | results/page.tsx:59               | features/quiz.md §D2           |
| Riddle stats swapped/mismatched → counts show 0 | riddle-mcq-stats.service.ts:36-40 | features/riddle-mcq.md §A1     |
| Subject-wise riddle play broken                 | play/page.tsx:81 param split      | features/riddle-mcq.md §B1     |
| Drafts leak via by-subject endpoint             | question.service.ts:63-81         | features/riddle-mcq.md §A2     |
| Dead `/users/profile` endpoints                 | users.controller.ts               | features/auth-users.md §3.1    |
| Guest demographics 404                          | missing public endpoint           | features/auth-users.md §3.5    |
| `updateQuestion` extreme logic dead             | quiz.service.ts:776               | features/quiz.md §Backend bugs |

Each fix ships with a regression test (starts the test suite with real content).

## Phase 2 — Auth & security hardening

1. Register global `APP_GUARD`s: JwtAuthGuard (default-deny + `_Public()`) and ThrottlerGuard (activates existing decorators).
2. Refresh tokens: hash at rest, add expiry, rotate on use.
3. Move OAuth tokens out of redirect URL (one-time code exchange).
4. Public `POST /guest-users/demographics`; enum-constrained roles; DTO validation on admin payloads.
   Reference: features/auth-users.md roadmap; platform/backend-core.md §3.

## Phase 3 — Integration debt (connect what exists but isn't wired)

1. Dad jokes: rewire page to real API, wire admin section, build quiz-format frontend (biggest untapped value — backend is done).
2. Riddle-mcq: unify subjectId params, fix mutation cache keys, consolidate duplicate hooks/filters.
3. Wire chapter progress writes + achievements on quiz completion.

## Phase 4 — Structural quality

1. CI pipeline (GitHub Actions): type-check + lint + tests per PR.
2. Merge duplicated challenge/practice hubs; extract shared level maps; delete dead components/hooks.
3. Migration baseline: timestamp-prefix existing migrations, register them, set `DB_SYNCHRONIZE=false`.
4. Server-side sessions (`POST /quiz/sessions` + riddle equivalent) — unlocks cross-device progress for every feature at once.

## Phase 5 — New capabilities (only after Phases 0–3)

Leaderboards/high-scores · JSON import/export · hint tracking · email verification · AI question generation (the product's namesake — currently zero AI code exists).

## Working Rules Going Forward

- One branch per task off `main`; no more backup branches — use commits/tags instead.
- No commit without green lint/type-check (enforced by Phase 4 CI + husky).
- New bug found? Add it to the relevant features/\*.md doc in the same PR.
- Quality gates per phase are defined in [platform/code-quality-plan.md](platform/code-quality-plan.md); a phase isn't done until its §1 metrics row passes.
