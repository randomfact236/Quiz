# Standards — Quality, Capacity & Architecture Rules

> **Single cross-cutting reference** for all feature TODO files (`plan/01–13`). Consolidates the former
> `code-quality-plan.md`, `capacity-plan.md`, and `build-forward-plan.md` (removed 2026-08-30 — content
> recoverable from git history). Statuses re-verified against code on 2026-08-30.

## 1. Phase basis (used by every feature TODO file)

**P0** = critical/broken · **P1** = major gaps · **P2** = integration/quality · **P3** = polish/tech debt.

## 2. Quality metric targets

| Metric                          | Baseline              | Now (2026-08-30)                                                                       | Target                   |
| ------------------------------- | --------------------- | -------------------------------------------------------------------------------------- | ------------------------ |
| Backend service test coverage   | ~0%                   | minimal (comments spec only)                                                           | ≥40% on touched services |
| Frontend logic coverage         | ~0%                   | 139 tests passing (scoring/resume/csv/game/hooks)                                      | ≥30% hooks/libs          |
| Files >500 LOC                  | ~10                   | 3–4 (quiz-mcq.service 854, jokes/page 1253, image-riddles admin legacy paths)          | ≤5                       |
| Duplicated content-module logic | 4 copies              | ContentServiceBase shared by quiz-mcq + riddle-mcq; image-riddles/dad-jokes standalone | 1 copy                   |
| TS strictness                   | partial               | unchanged                                                                              | both apps `strict` clean |
| Open P0 bugs                    | 8                     | 0                                                                                      | 0                        |
| Lint warnings                   | `--max-warnings=1000` | present                                                                                | ≤50, then 0              |

## 3. Refactor targets (200-LOC rule: no file past 200 without explicit exception)

| File                        | Status                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `quiz-mcq.service.ts` (854) | **Open** — split into subject/chapter/question/import/stats services (mirror riddle-mcq's layout) |
| `app/jokes/page.tsx` (1253) | **Open** — extract to `features/jokes/` hooks/components                                          |
| `useQuizMcq.ts` (~580)      | Partially split (utils/timers/resume extracted)                                                   |
| quiz play page + wizard     | Split done (components/ per stage)                                                                |
| riddle play page            | Split done (modals extracted)                                                                     |

Rule: refactors must leave behavior identical — write tests before touching.

## 4. Capacity golden rules (govern all new endpoint/code design)

Target scale: 50k+ questions, 20k+ daily visitors, stateless backend.

1. **Direct-to-DB extraction** — every endpoint queries the DB at SQL level; no API-to-API chaining.
2. **Never return unbounded collections** — every list paginates or caps.
3. **Index-level randomness** — `random_weight` index-seek, never `ORDER BY random()`.
4. **Stateless backend** — files → object storage; jobs → Redis/BullMQ; any replica clonable.
5. **Server is source of truth** — localStorage is only an optimistic/offline cache (this rule drives BUILD-BACKLOG #2, sessions).

Capacity verdicts: admin browse comfortable to 100k+ questions; ILIKE search 10–30k today (trigram GIN indexes **shipped** in migration `1787653200000`); concurrency 150–400/replica, scales linearly.

## 5. Execution tracks — status

| Track | Item                                                      | Status                                                                                 |
| ----- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A1    | Trigram GIN search + `(status, updatedAt)` indexes        | ✅ Done (migration `1787653200000`)                                                    |
| A2    | `random_weight` index-seek random endpoints + wrap-around | ✅ Done (shared `content/random-selection.util.ts`)                                    |
| A5    | Denormalized question_count counters                      | Deferred (optional; only if dashboards demand)                                         |
| B     | Shared ContentServiceBase                                 | **Partial** — quiz-mcq + riddle-mcq use it; image-riddles + dad-jokes still standalone |
| B     | Targeted cache invalidation                               | ✅ Done (`invalidateCacheFamilies`, family-scoped)                                     |
| C1    | Global ThrottlerGuard rate limiting                       | ✅ Done (APP_GUARD)                                                                    |
| C2    | Deep health checks (Redis ping, PG write)                 | **Open** — current `/health` is shallow                                                |
| C3    | Global default-deny JwtAuthGuard + `@_Public()`           | ✅ Done (APP_GUARD)                                                                    |
| D     | Player session pipeline (server-authoritative)            | **Open** — BUILD-BACKLOG #2                                                            |

## 6. Security note (2026-08 history)

`apps/backend/.env` was once tracked and pushed, exposing DB/Redis credentials in git history. It was untracked and dev credentials regenerated — **before any production deploy, rotate all credentials for real and evaluate history scrubbing (git filter-repo/BFG).**

## 7. Working rules

- One branch per task off `main`; no backup branches — commits/tags instead.
- No commit without green lint/type-check (husky pre-commit + pre-push enforced).
- New bug found? Update the relevant `plan/0X-*.md` file in the same PR.
- Golden rules (§4) govern new endpoint/code design; violations need explicit justification in the PR.

## 8. Deferred add-ons (metrics-driven only — do not build early)

| Trigger            | Add-on                       | Effort      |
| ------------------ | ---------------------------- | ----------- |
| >~1,000 concurrent | Nginx LB + `replicas: 3`     | Config-only |
| DB CPU ceiling     | PgBouncer (one DATABASE_URL) | Trivial     |
| Read saturation    | PG read replica              | Small       |
