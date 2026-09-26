# Standards — Quality, Capacity & Architecture Rules

> **Single cross-cutting reference** for all feature TODO files (`plan/01–16`, `plan/games/`).

## 1. Phase basis (used by every feature TODO file)

**P0** = critical/broken · **P1** = major gaps · **P2** = integration/quality · **P3** = polish/tech debt.

## 2. Quality metric targets

| Metric                          | Baseline              | Now                                                                                    | Target                   |
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

## 5. Execution tracks (open)

| Track | Item                                           | Status                                                                                 |
| ----- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| A5    | Denormalized question_count counters           | Deferred (optional; only if dashboards demand)                                         |
| B     | Shared ContentServiceBase                      | **Partial** — quiz-mcq + riddle-mcq use it; image-riddles + dad-jokes still standalone |
| C2    | Deep health checks (Redis ping, PG write)      | **Open** — current `/health` is shallow                                                |
| D     | Player session pipeline (server-authoritative) | **Open** — BUILD-BACKLOG #2                                                            |

## 6. Security note

`apps/backend/.env` was once tracked and pushed — **before any production deploy, rotate all credentials for real and evaluate history scrubbing (git filter-repo/BFG).**

### 6.1 Cross-cutting security invariants (2026-09-26)

Three invariants are now enforced in ONE place each. Adding a field to a content
entity means checking the relevant list — that is the whole point.

| Invariant              | Single source of truth              | Rule                                                                                                                                                                 |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Answer-key strip**   | `common/content/answer-key.util.ts` | Every public content read goes through `toPublicContent`. `answers/reveal` is the only path that may return the key, and it goes through a service, not this helper. |
| **Guest identity**     | `guest-users/guest-token.guard.ts`  | Any route where a `guestId` scopes access — reads AND writes — must carry `GuestTokenGuard`. The token travels in the `X-Guest-Token` header, never a query string.  |
| **Role authorization** | `common/guards/roles.guard.ts`      | Fails CLOSED. `RolesGuard` without `@Roles()` is a misconfiguration and 403s rather than authorizing silently.                                                       |

- **Answer-key consolidation:** the stripped-field list was copy-pasted into
  `toPublicQuestion`, `toPublicRiddle`, and an inline destructure in
  image-riddles. NOW-03/09 was the resulting bug — `explanation` joined the
  riddle strip and the other two copies never learned about it, so pre-answer
  public reads shipped the explanation (which spells out the answer). All three
  now call `toPublicContent`; `answer-key.util.spec.ts` is the regression net.
- **Guest reads were unguarded:** HARD-03 signed the guest _writes_ only, so a
  `?guestId=` on `GET /quiz-mcq/sessions/history`, `/riddle-mcq/sessions/history`,
  `/achievements/unlocks`, `/comments/my`, `/question-likes/my` and every duel
  route could read or mutate another visitor's data. Unguarded guest writes also
  existed on `POST /achievements/sync` and both `POST */sessions`. All are
  guarded now; the client warms the pair on mount and self-heals on a 403.
- **Known gap (deliberate, unfixed):** `POST /guest-users/token` still signs a
  caller-supplied legacy `guest_…` id with no proof of prior ownership, at
  10/min/IP. Per-guest dedup (one like, one vote) therefore stays defeatable by
  minting fresh ids. Closing it needs a one-time migration claim or a legacy
  cutoff date.

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
