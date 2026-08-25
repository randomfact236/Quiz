# Architecture & Capacity Plan: 50k Questions & 20k Daily Visitors

Definitive scale/design reference. Execution order lives in [../PLAN.md](../PLAN.md); quality standards in [code-quality-plan.md](code-quality-plan.md).

## 1. Target Scale & System Conditions

- **Total Questions:** 50,000+ (growing)
- **Data Shape:** ~20–30 Subjects → 30–50 Chapters/Subject → 500+ Questions/Chapter (~1,500 chapters total; density is per chapter/subject, not chapter count)
- **Traffic:** 20,000+ daily visitors (peak concurrency est. 150–400; design goal: no user-visible limit as load grows)
- **Storage:** No local file storage — all media/assets in external buckets (S3 / Cloudflare R2)
- **Philosophy:** Stateless backend, direct-to-DB queries, denormalized counters where they pay for themselves, config-only "add-on" scaling, no API-to-API chaining

## 2. Core Architectural Rules ("Golden Rules")

1. **Direct-to-DB extraction** — every endpoint queries the DB via ORM at the SQL level (`WHERE`, `LIMIT`). No API-to-API chaining, no master-API-then-filter patterns.
2. **Never return unbounded collections** — every list endpoint paginates (`?page&limit`) or caps (`?count=N`). No endpoint returns all questions of a subject or chapter. _(Today's violator: `quiz.service.ts` public subject endpoint.)_
3. **Index-level randomness** — use the `random_weight` column technique (§4 A2), never `ORDER BY random()` on large tables and never shipping full tables to the client to shuffle in JS.
4. **Stateless backend** — no local file uploads, no in-memory background jobs. Files → S3/R2; jobs → Redis (BullMQ when needed). Any container can be cloned instantly.
5. **Server is source of truth** — `localStorage` is strictly an optimistic/offline cache. Scores, history, votes must live in the database.

## 3. Capacity Verdicts (verified against current code)

| Concern                             | Comfortable     | Degrades        | Lever                                       |
| ----------------------------------- | --------------- | --------------- | ------------------------------------------- |
| Admin browse (paginated, cached)    | 100k+ questions | 500k+           | keyset pagination if deep pages matter      |
| Search (ILIKE) today                | 10–30k          | 100k+           | trigram index (A1) → seamless at 500k       |
| Playing one subject today           | <300–500 q      | payload blowout | random/capped endpoints (A2/A3)             |
| Concurrent users, 1 backend replica | 150–400         | —               | replicas (B2) scale linearly                |
| Daily visitors                      | 20k+            | —               | CDN static frontend = effectively unlimited |

## 4. Execution Tracks

> ⚠️ **Prerequisite — Phase 0.5 Migration Baseline.** Migrations are currently orphaned/broken (no timestamp prefixes, stale table references, registered nowhere). Every DB change below depends on fixing this first: rename/rebuild migrations against current entities, register them in data-source/AppModule, verify with `DB_SYNCHRONIZE=false`.

### Track A — Database & Query Foundation (critical priority)

- **A1. Search & sort indexes:** `pg_trgm` GIN indexes on question/riddle text columns (admin search instant over 50k+); `(status, updatedAt DESC)` composites for deep-page pagination.
- **A2. Index-level random endpoints:** add indexed `random_weight` float column (default `RANDOM()` on insert); Node picks a random float, Postgres runs `WHERE random_weight > :float LIMIT n` → O(1) index seek.
  - _Amendment (mandatory):_ wrap-around logic — if results < n, run a second query from 0, else players near the top of the deck get short quizzes.
  - _Maintenance:_ periodic BullMQ reshuffle job (`UPDATE … SET random_weight = RANDOM()`) only if statistical gaps appear after mass deletions.
  - _FE rewiring required:_ play flow consumes `random?count=N` instead of fetching whole subjects/chapters (Rule 2).
- **A5. Denormalized counters (optional optimization):** `question_count` on subjects/chapters via triggers; bulk imports bypass row-level triggers then single recount UPDATE. _Caveat:_ covers subject/chapter tiles only — level/status dashboard facets still need indexed GROUP BY queries. At 50k rows those are already milliseconds; adopt counters only if dashboard hot paths demand it.
- **Pool sizing:** already explicit (`DB_POOL_SIZE`, `app.constants.ts`) — verify value suits replica count (pool × replicas ≤ Postgres max_connections).

### Track B — Unified Content Pipeline & Caching (= quality-plan §3)

- One shared ContentService (`list/random/create/update/delete/import`) consumed by quiz, riddle-mcq, image-riddles, dad-jokes instead of 4 private copies.
- **Targeted cache invalidation** replacing `delPattern('<module>:*')` sledgehammers — prevents DB stampedes on single-question admin edits.

### Track C — Security & Concurrency Hardening

- **C1. ThrottlerModule activation** (decorators exist but inert): global APP_GUARD; strict limits on auth + public play endpoints.
- **C2. Deep health checks:** Redis ping + lightweight PG write check (not just `SELECT 1`); cache outage degrades gracefully (reads already fall through).
- **C3. Global JwtAuthGuard default-deny** with `_Public()` opt-outs (auth-users doc §roadmap).

### Track D — Player Session Pipeline (post-launch V2)

- `POST /sessions` (start) · `PATCH /sessions/:id/answer` (background sync) · `POST /sessions/:id/complete` (finish, server-authoritative score).
- **Idempotency:** unique constraint on session_id in results — rejects double-submits.
- **Optimistic UI + reconciliation:** localStorage writes instantly, syncs every few answers, queues on network loss. Until D ships, gameplay remains client-scored/localStorage-persisted (accepted launch tradeoff).

## 5. Future Scaling — Deferred Add-Ons (zero rewrites)

Do not build until server metrics demand it:

| Trigger               | Add-on                                           | Effort                         |
| --------------------- | ------------------------------------------------ | ------------------------------ |
| >~1,000 concurrent    | Nginx LB + `replicas: 3` in compose.prod         | config-only (stateless Rule 4) |
| DB CPU ceiling        | PgBouncer (change one DATABASE_URL)              | trivial                        |
| Read-heavy saturation | PG read replica; route GET traffic in ORM config | small                          |

Frontend is already fully static-prerendered → serve via CDN at any traffic level.
