# Features — Full-Stack Analysis Index

One file per product feature, each covering its **backend + frontend + admin surface + integration gaps + bugs + roadmap**. Cross-cutting concerns (app shell, platform core, testing, devops, docs) live in [`../platform/`](../platform/).

## Feature Matrix

| Feature | File | Backend | Frontend | Admin | Biggest gap |
|---|---|---|---|---|---|
| Quiz (classic MCQ) | [quiz.md](quiz.md) | ✅ complete (2 known logic bugs) | ✅ complete, localStorage-only sessions | ✅ full CRUD + CSV | Results scoring bugs; no server-side sessions |
| Riddle-MCQ | [riddle-mcq.md](riddle-mcq.md) | ✅ complete (stats contract bug) | ✅ complete but subject-mode broken | ✅ full CRUD + CSV import/export | stats payload mismatch → counts show 0; subjectId/chapterId param split |
| Image Riddles | [image-riddles.md](image-riddles.md) | ✅ public + admin modules | ✅ play surface | ✅ incl. bulk create | Duplicate CRUD paths with divergent delete semantics |
| Dad Jokes | [dad-jokes.md](dad-jokes.md) | ✅ classic + quiz formats | ⚠️ localStorage-only page; quiz format has **zero** frontend | ❌ localStorage-based, not wired to API | FE↔BE integration almost entirely missing |
| Auth & Users | [auth-users.md](auth-users.md) | ✅ JWT/Google/reset/lockout | ✅ auth context + api-client refresh | ✅ admin user management | `/users/profile` unguarded+dead; throttler inert; guest demographics endpoint mismatch |

## Status Legend

✅ implemented & working · ⚠️ partial / partially wired · ❌ missing

## Universal Themes

1. Every feature's persistence for *player progress* is localStorage-only — no session/result APIs exist.
2. All content backends share the same pattern (CRUD + bulk + filter-counts + CSV), so fixes/infra land 4× unless centralized (see `../platform/backend-core.md`).
3. Zero automated tests across all features (`../platform/testing-quality.md`).
4. Known P0 bugs per feature are listed at the top of each roadmap section.

## Suggested Work Order

1. P0 bug fixes in quiz.md + riddle-mcq.md roadmaps (user-visible breakage).
2. Auth hardening in auth-users.md §roadmap (guards, throttler, guest endpoint).
3. Wire dad-jokes frontend to its backend (biggest untapped value).
4. Server-side session persistence (unlocks all features at once).
