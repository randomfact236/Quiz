# Project Status Rollup — 2026-09-10

> Status-only pass. **No new scanning or fixing** — this consolidates what is already recorded in `plan/` trackers,
> scan reports, run logs, commit history, and code comments, plus read-only checks (git state, live-URL liveness).
>
> **Sources:** git log/status/branches (local + origin), DEPLOYMENT.md, root TODO.md, BACKLOG.md, plan/TODO.md
> (refreshed in `61e1396`), plan/future-features.md, plan/stale-code-scan-2026-09-08.md + -2026-09-10.md,
> plan/cosmetics-and-gaps-scan-2026-09-08.md, and audit item IDs cited in code (A3/A4/A5/A8).
> **Live checks performed (read-only GETs):** `https://api.profitbenefit.com` and `https://quiz.profitbenefit.com`.

---

## 1. Uncommitted work

Single repository (`apps/backend` and `apps/frontend` are directories, not nested repos). **No separate mobile repo
exists in this workspace** — the mobile client is external (the duels API serves it), so its git state cannot be
checked from here.

Local `main` == `origin/main` (0 ahead / 0 behind) — **everything committed is pushed**. The only uncommitted paths:

| Files                                                                                                                                                           | Belongs to                                                                                                              | Age (mtime)            | Risk                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2d games plan.md` (M), `plan/games/` (??), `apps/frontend/src/app/games/` (??), `apps/frontend/src/__tests__/games-{tap-or-dont-tap,tic-tac-toe}.test.ts` (??) | 2D games — deliberately isolated from the product per AGENTS.md / commit `61e1396` ("games-public gitignore isolation") | 2026-09-09/10 (~1 day) | Low by design — owner-intentional local isolation — but note these specific files are **not** covered by the .gitignore lines added in `61e1396` (they still appear in `git status`), so they remain uncommitted = unbacked-up. If the games work matters, commit it under the games isolation plan or extend .gitignore. |

Everything else that was in flight at the last status check (site branding, duels publicId/OAuth-nonce security fix,
guest entity, plan refresh, AGENTS.md) was committed and pushed by the owner on 2026-09-10 02:09–02:11
(`9ee0ed3`, `91bc129`, `61e1396`). No other uncommitted risk exists.

---

## 2. Committed but not deployed

**Deploy model (DEPLOYMENT.md):** Dokploy VPS, **auto-deploy on `git push origin main`**; backend boots run TypeORM
migrations (`migrationsRun`); **no staging environment exists** (policy: "local test sufficient").

**Deployed commit hash: not verifiable from here — owner must confirm.** Live probing (2026-09-10 ~02:35 +0545) found
(**superseded by `plan/deployment-diagnosis-2026-09-10.md`: the probes below used wrong paths — the real prefix is
`/api/v1` — and the corrected diagnosis concludes the running backend matches _no commit of this repo_ and the
frontend subdomain has no DNS record**):

- `https://api.profitbenefit.com` — **alive** (NestJS JSON responses), **but** `/health`, `/api/health`,
  `/settings/public`, `/v1/settings/public`, `/quiz-mcq/subjects` all return 404 "Cannot GET …". The current
  codebase serves most of these routes, so the live build is either **an older commit**, behind a route rewrite
  not documented in DEPLOYMENT.md, or partially failed.
- `https://quiz.profitbenefit.com` — **DNS does not resolve** ("Could not resolve host"). The API subdomain
  resolves fine, so the zone exists; the `quiz.` host specifically has no public DNS record. Production frontend
  is either served at a different domain, DNS was removed, or DEPLOYMENT.md is stale.

**Commits on origin/main whose deploy status is therefore unknown (newest first):**

| Commit                                 | Content                                                                                                                                                                             | Deploy relevance                                                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `61e1396` (02:11)                      | Plan refresh, AGENTS.md, games gitignore isolation                                                                                                                                  | Docs only                                                                                                                        |
| `91bc129` (02:10)                      | Site branding settings group (name, logo, favicon, tagline, socials) + admin UI                                                                                                     | Feature; unit specs updated                                                                                                      |
| `9ee0ed3` (02:09)                      | **Security:** OAuth nonce binding (A4) + duels publicId targeting (A3), 15m access token (A5)                                                                                       | **Security-critical — requires migration `1789800000000-AddGuestPublicId` (auto-runs on backend boot) to be applied on prod DB** |
| `be8a7cc` (01:58)                      | Guest publicId migration DB default (prod insert-failure fix), bulk riddle import expert-row fix (broken prod path), email link `FRONTEND_URL` fix, quiz 4-stage wizard, route docs | Bug fixes to currently-broken prod paths                                                                                         |
| older (09-06 era, `dd3acb8`/`97dce70`) | Riddle dedupe + `content_hash` unique migration `1789700000000` — **fails loudly by design if the DB still has duplicate riddles**                                                  | If prod DB predates it, run `scripts/dedupe-riddle-mcqs.sql` before it auto-runs on boot                                         |

**Deploy-blocking env prerequisites (VPS `.env` at `/etc/dokploy/compose/quiz-stack-gz5jv5/code/.env`):**
`FRONTEND_URL` is a hard boot requirement (prod validation) — since prod has booted before, it is probably already
set, but confirm; `RESEND_API_KEY`/`FROM_EMAIL` (EmailService is Resend — note the env _examples_ still document an
SMTP block that matches nothing in code); `DB_SYNCHRONIZE=false`; `JWT_SECRET` ≥32 chars.

**Owner questions for this section:** What commit is actually deployed? Why do known routes 404 on the API host?
Where is the frontend really served (quiz. subdomain doesn't resolve)? Did the auto-deploy of the 4 commits above
succeed, and did migrations `1789700000000` / `1789800000000` apply cleanly on the prod DB?

---

## 3. Staging / exploit verification still owed

**Meta-finding first:** the audit document itself — `security-audit-2026-09-09.md`, cited by **5 code comments**
(A3 ×3, A4, A5) and by commit `9ee0ed3`'s message — **is not in the repository** (searched all tracked and local
`.md`). Its ✅ FIXED ledger therefore cannot be rolled up from the repo; the table below is reconstructed from code,
commits, and scan records. Recommendation stands (stale-code scan, cross-cutting): commit the audit doc (redacted)
or drop the citations. Note also: **no staging env exists** — "re-verification" here means a local prod-like run or
a careful direct check on production.

| Item                                                                                            | Fixed in                                      | Verified so far                                                                                                                                                         | Re-attempt owed?                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A3 — guestId exposure in duels (presence/challenge targeting)                                   | `9ee0ed3` (+ `be8a7cc` migration DEFAULT fix) | Typecheck only. **The duels module has zero tests.**                                                                                                                    | **YES** — re-attempt: enumerate presence players (expect `publicId`, no guestId); join a challenge with a guessed/known guestId (expect rejection); confirm migration `1789800000000` applied and guest inserts succeed in prod-like DB |
| A4 — OAuth one-time-code binding (nonce)                                                        | `9ee0ed3`                                     | Typecheck only; `auth.service.spec.ts` does **not** exercise the nonce-bound path (gap recorded in the 09-10 scan, F01)                                                 | **YES** — re-attempt: exchange an intercepted code without/with-reused nonce; confirm binding rejects                                                                                                                                   |
| A5 — 15-minute access token + refresh rotation                                                  | `9ee0ed3`                                     | Config read; concurrency gap logged (single-flight refresh missing — concurrent 401s can log a tab out, future-features §5)                                             | Partial — exercise refresh under concurrent 401s                                                                                                                                                                                        |
| A8 — token-bearing URLs never logged in production                                              | `be8a7cc` (guards on both email methods)      | Code read only                                                                                                                                                          | Cheap: trigger verification email on prod, inspect logs                                                                                                                                                                                 |
| be8a7cc bug fixes (publicId insert, bulk expert-row import, FRONTEND_URL links, 4-stage wizard) | `be8a7cc`                                     | **Typecheck + lint only** — none of the original failing scenarios were re-run (no migration executed, no CSV import re-tested, no email sent, no wizard click-through) | YES — each is a 5-minute scenario test on a prod-like DB/browser                                                                                                                                                                        |
| 91bc129 branding group                                                                          | `91bc129`                                     | Unit-level (`settings.service.spec` updated); end-to-end admin→public render not exercised                                                                              | Light E2E pass                                                                                                                                                                                                                          |
| Older: riddle dedupe + content_hash (`dd3acb8`)                                                 | 2026-09-06                                    | **Verified against a live DB at the time** (14/14 backend tests incl. 7 integration tests; hash parity TS↔SQL) — the one genuinely end-to-end-verified fix in the log   | Only prod-DB-state confirmation remains (see §2)                                                                                                                                                                                        |

**Rule of thumb that held across every tracker:** anything marked "fixed" on 2026-09-08/10 was verified by
typecheck/lint/unit-spec; nothing in the two fix batches was verified by re-running the original failing scenario.

---

## 4. Open items across all trackers

Consolidated from: plan/TODO.md (all 14 features ✅ P0–P3 worked, residuals below), root TODO.md (Open run-log
sections + §0–§4), BACKLOG.md (Remaining Open Work), plan/future-features.md (§1–§6 — the consolidated backlog,
which absorbed the cosmetics scan's "deliberately not applied" list and the 09-08 scan's owner items), and
stale-code-scan-2026-09-10.md (queue). **Tracker hygiene notes:** root TODO.md §4 "ToastContainer mounted nowhere"
is stale (it is mounted in providers — verified in the 09-10 scan); BACKLOG.md still names `lib/riddle-resume.ts`
(consolidated into `riddle-persistence.ts`); BACKLOG "Admin user-editing UI ✅ done" contradicts refreshed
plan/TODO.md F01 "admin user-edit UI P2 open — owner decision" — reconcile.

### A. Blocks production launch (in priority order)

1. **Deployed-state verification (§2)** — confirm deployed commit; resolve the `quiz.` DNS gap; explain the API 404 surface; confirm the 2026-09-10 auto-deploy + both migrations applied.
2. **Security re-verification (§3)** — A3/A4 exploit re-attempts (A3 also gates on migration `1789800000000` being live).
3. **Re-run the three bug-fix scenarios** on a prod-like DB (§3 rows) — they fix currently-broken production paths (expert-row CSV imports; email links) but were never executed post-fix.

### B. Should do soon

1. Commit the security audit doc (redacted) — the codebase cites a file that doesn't exist (5 references).
2. Fix `.env` examples: replace the SMTP block with the Resend keys the code actually uses (`RESEND_API_KEY`, `FROM_EMAIL`); drop `SENTRY_DSN`/`ANALYTICS_ID`/`BACKEND_PORT` inert keys (stale-code scan F14).
3. Backend tests for the duels service + the OAuth nonce path (prerequisite before the web leans on duels; also closes the A3/A4 verification gap structurally).
4. Review the **6 open Dependabot PRs** on GitHub (checkout-7, setup-node-7, dotenv 17.4.2, eslint-config-next 16.3.4, @nestjs/schematics 12, next 16.3.4) — Next.js major-bump PRs especially.
5. Tracker hygiene (stale §4 item, BACKLOG filename + F01 contradiction above); commit-or-gitignore the isolated games files (§1).
6. Prod email deliverability check end-to-end (FRONTEND_URL link fix + Resend key) — the reset-password path is otherwise still effectively broken in prod.

### C. Backlog (tracked, not launch-blocking)

- **future-features.md is the single consolidated backlog** — highlights: duels web UI (L, owner go-ahead; includes keep/kill decision for the module), riddle server-side sessions/results (largest P1), achievements for image-riddles/jokes (needs definition sign-off), analytics robustness batch, media upload/alt-text UX, admin shell mobile + header dedupe, auth UX batch (rememberMe, change-password, OAuth-cancel redirect, single-flight refresh), newsletter server filters + unsubscribe landing, SEO P2 family (RSC conversion → per-subject routes → JSON-LD → dynamic OG; all gated on the RSC decision), reference-prototype parity leftovers.
- **stale-code-scan-2026-09-10.md queue:** ~186 confirmed-safe deletions/merges still open (base.dto pre-F03 DTOs, image-riddle preset block, 8 dead constants, ContentManagementSection chain, dead wrappers/storage keys, `run-migration.ts`, `@backend/*` alias, `source-map-support` dep, …) + small FIX leftovers (GuessFeed `delete_comment` analytics key, isMine/remove 403 gap, migration header comment, plan-doc staleness in plan/02, /03-era notes, plan/10 ui-tests checkbox).
- **BACKLOG.md P2/P3:** admin section-pattern unification, CSV import/export parity, retention test harness, sidebar grouping, per-question accuracy drill-down. Root TODO.md §1 BullMQ reshuffle (deferred, trigger-based), §2/§3 quiz/riddle correctness backlogs (owner-directed logging).

### D. Needs external credential / account

- Google Search Console property (SEO P3 integration). • Resend API key confirmed present in the VPS env. • S3 bucket + credentials if the media swap is chosen. • Domain/registrar access for the `quiz.` DNS fix. • PNG icon design asset (PWA install).

### E. Needs owner decision (content / branding / business)

- Legal copy (privacy/terms/contact) + the two placeholder contact emails; duels keep-vs-kill; required-alt-text policy for media; extreme-level "Show Answer" peek; image-riddle/joke achievement definitions; SEO RSC-conversion go-ahead; quiz timer-expiry rule; PWA install experience; ~34 stale-scan OWN items (consumerless API surfaces across quiz/riddles/image-riddles/jokes/comments/media/newsletter/users, inert settings keys, AdminGuard wrap, k8s probes, header variant dedup, root `.ps1`/`.bat` tooling family).

---

## 5. External / infra checklist status

The audit's **Part B is not available** (audit doc not committed — see §3), so its items cannot be re-listed
verbatim. Status of what the repo can and cannot verify:

**Verified from code/config now:** production compose + Dockerfiles exist and are mutually wired; prod boot
validation enforces `JWT_SECRET` ≥32 chars, `CORS_ORIGIN`, `FRONTEND_URL`, `DB_SYNCHRONIZE=false`; email provider
is Resend (no SMTP code); health endpoints exist (`/health` consumed by docker-startup script — though see §2: the
live API 404s it); Dependabot is active (6 open PRs).

**Owner questions (code cannot verify these — please answer):**

1. Is 2FA enabled on GitHub, the VPS host, Dokploy, and the domain registrar?
2. Are backups configured **and restore-tested** — VPS snapshots, Postgres dumps (a `backups/` dir exists on the VPS: scheduled or ad-hoc?), and is anything off-VPS?
3. Is the domain registrar locked (transfer-lock) with auto-renew on `profitbenefit.com`?
4. Are SPF, DKIM, and DMARC published for the mailing domain (Resend requires DKIM; without DMARC the reset/verification emails are spoofable and spam-prone)?
5. What is actually deployed right now (commit hash), why does `quiz.profitbenefit.com` not resolve, and why do current API routes 404?
6. Is GitHub main protected (no direct force-push), and who reviews the Dependabot PRs?

---

## Bottom line — what blocks production readiness right now

**Priority 1 — you are flying blind on what's deployed.** Everything is committed and pushed, but the live evidence
doesn't match the codebase: the API answers with 404s for routes the current code serves, and the documented
frontend domain has no DNS record. Until you confirm the deployed commit and the frontend's real URL, none of the
security or bug fixes below can be considered live. This is a 10-minute check on the VPS/Dokploy panel.

**Priority 2 — the security fixes (A3 guestId exposure, A4 OAuth code binding) are committed but never
re-verified by re-attempting the exploits, and the duels/OAuth code has zero test coverage.** They also depend on
migration `1789800000000` actually having run on the prod DB.

**Priority 3 — the three bug fixes from this week (guest inserts on migrated DBs, expert-row CSV imports, email
link base) fix currently-broken production paths but were only verified by typecheck/lint.** Each needs a one-scenario
re-run.

**Priority 4 — the security audit document itself is uncommitted**, so the FIXED/B-Part ledger lives outside the
repo and can't be tracked to closure; commit it (redacted) and answer the five infra questions above (2FA, backups,
domain lock, SPF/DKIM/DMARC, branch protection).

Everything else — the consolidated backlog, the ~186 confirmed-safe cleanups, the content/branding decisions — is
queued work, not blockers. No new code defects were found in this pass (by design: no scanning was done).
