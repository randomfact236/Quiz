# Build-Forward Plan

Starting point: clean `main`, ~78% code-complete, quality C+/B−.
Feature detail: [../docs/features/](../docs/features/README.md) · Cross-cutting docs: [../docs/platform/](../docs/platform/) · Scale architecture: [capacity-plan.md](capacity-plan.md) · Quality gates: [code-quality-plan](code-quality-plan.md).

> **Parallel quality track:** every phase has exit criteria in code-quality-plan §1. A phase isn't done until its metrics row passes.

## ✅ Phase 0 — Baseline (DONE)

Tooling verified and gated: type-checks clean per workspace, `--no-lint` removed (production build passes), jest + first tests green, husky pre-commit/pre-push active, dead scanner scripts removed.

## Phase 0.5 — Migration Baseline (prerequisite for all DB work)

Migrations are currently orphaned/broken. Before any index/column changes:

1. Rename hand-written migrations to TypeORM's `<timestamp>-<Name>.ts` pattern; rewrite contents against current entities.
2. Register `migrations` + `migrationsRun` in data-source/AppModule; verify a run with `DB_SYNCHRONIZE=false`.
3. Generate baseline migration from the current schema.

## Phase 1 — P0 Bug Fixes + DB Query Foundation

**Bug fixes** (each = small branch + regression test; details in feature docs):
| # | Bug | Reference |
|---|---|---|
| 1 | MCQ review marks correct answers wrong | features/quiz.md |
| 2 | Extreme answers always scored incorrect | features/quiz.md |
| 3 | Crash on unknown difficulty | features/quiz.md |
| 4 | Riddle stats swapped → public counts show 0 | features/riddle-mcq.md |
| 5 | Subject-wise riddle play broken (param split) | features/riddle-mcq.md |
| 6 | Drafts leak via by-subject endpoint | features/riddle-mcq.md |
| 7 | Dead `/users/profile` endpoints | features/auth-users.md |
| 8 | Guest demographics 404 | features/auth-users.md |
| 9 | `updateQuestion` extreme logic dead | features/quiz.md |

**DB foundation** (capacity.md Track A): trigram GIN search indexes (A1), `(status, updatedAt DESC)` composites.

## Phase 2 — Unified Content Pipeline

Shared ContentService for all 4 content modules (list/random/create/update/delete/import) + targeted cache invalidation replacing sledgehammer pattern clears — capacity.md Track B / code-quality-plan §3. Includes the `random_weight` random-endpoint technique (A2) with mandatory wrap-around logic, and FE play-flow rewiring to capped endpoints.

## Phase 3 — Security & Concurrency Hardening

capacity.md Track C: ThrottlerModule activation (C1), global JwtAuthGuard default-deny + `_Public()` audit (C3), deep health checks incl. Redis ping (C2), refresh-token hardening, guest demographics endpoint, enum roles + DTO validation.

## Phase 4 — CI/CD & Structural Quality

GitHub Actions (type-check + lint + tests per PR), merge challenge/practice hubs, split monolith files per code-quality-plan §2, coverage ratchets.

## Phase 5 — Player Session Pipeline (V2)

Server-side sessions with idempotent completion + optimistic sync (capacity.md Track D). Unlocks cross-device progress, leaderboards, durable history for every feature at once.

## Deferred Add-Ons (metrics-driven only)

Nginx LB + replicas when >~1k concurrent · PgBouncer on DB CPU ceiling · read replica when read-saturated. All config-only — see capacity.md §5.

## New Capabilities (after Phase 5)

Leaderboards/high-scores · JSON import/export · hint tracking · email verification · AI question generation (the product's namesake — zero AI code exists today).

## Working Rules Going Forward

- One branch per task off `main`; no backup branches — use commits/tags instead.
- No commit without green lint/type-check (husky-enforced now).
- New bug found? Update the relevant features/\*.md doc in the same PR.
- Golden Rules in capacity.md §2 govern all new endpoint/code design; PRs violating them need explicit justification.
