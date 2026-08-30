# Features — Full-Stack Analysis Index

One file per product feature, each covering its **backend + frontend + admin surface + integration gaps + bugs + roadmap**. Cross-cutting concerns (app shell, platform core, testing, devops, docs) live in [`../platform/`](../platform/).

## Feature Matrix

| Feature                | File                                 | Backend                          | Frontend                                                      | Admin                               | Biggest gap                                                                            |
| ---------------------- | ------------------------------------ | -------------------------------- | ------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| Quiz MCQ (classic MCQ) | [quiz-mcq.md](quiz-mcq.md)           | ✅ complete (2 known logic bugs) | ✅ complete, localStorage-only sessions                       | ✅ full CRUD + CSV                  | Results scoring bugs; no server-side sessions                                          |
| Riddle-MCQ             | [riddle-mcq.md](riddle-mcq.md)       | ✅ complete (stats contract bug) | ✅ complete but subject-mode broken                           | ✅ full CRUD + CSV import/export    | stats payload mismatch → counts show 0; subjectId/chapterId param split                |
| Image Riddles          | [image-riddles.md](image-riddles.md) | ✅ public + admin modules        | ✅ API-backed play surface + media library                    | ✅ incl. bulk create + media picker | All planned items complete                                                             |
| Dad Jokes              | [dad-jokes.md](dad-jokes.md)         | ✅ classic + quiz formats        | ✅ API-backed classic page; quiz format has **zero** frontend | ✅ API-backed admin section         | Classic format fully wired; quiz-format frontend not planned (user declined)           |
| Auth & Users           | [auth-users.md](auth-users.md)       | ✅ JWT/Google/reset/lockout      | ✅ auth context + api-client refresh                          | ✅ admin user management            | `/users/profile` unguarded+dead; throttler inert; guest demographics endpoint mismatch |

## Status Legend

✅ implemented & working · ⚠️ partial / partially wired · ❌ missing

## Universal Themes

1. Every feature's persistence for _player progress_ is localStorage-only — no session/result APIs exist.
2. All content backends share the same pattern (CRUD + bulk + filter-counts + CSV), so fixes/infra land 4× unless centralized (see `../platform/backend-core.md`).
3. Zero automated tests across all features (`../platform/testing-quality.md`); quality standards and upgrade targets live in [`../../plan/code-quality-plan.md`](../../plan/code-quality-plan.md) (each feature file notes its specific debt in "Code Quality Notes").
4. Known P0 bugs per feature are listed at the top of each roadmap section.

## Suggested Work Order

1. P0 bug fixes in quiz-mcq.md + riddle-mcq.md roadmaps (user-visible breakage).
2. Auth hardening in auth-users.md §roadmap (guards, throttler, guest endpoint).
3. ~~Wire dad-jokes frontend to its backend (biggest untapped value)~~ ✅ Done — classic page + admin wired to API.
4. Server-side session persistence (unlocks all features at once).
