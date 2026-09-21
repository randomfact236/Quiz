# AI-Quiz (PigZap) — Full-Stack Audit Report

**Target:** `E:\webiste theme and plugin\Ai-Quiz\Quiz`
**Stack:** NestJS 10 (TypeORM/Postgres/Redis) API + Next.js 15 (App Router, React 18, Tailwind 3, TanStack Query v5) frontend, Docker/Dokploy + Cloudflare deployment, CSV content pipeline.
**Audit date:** 2026-09-20
**Method:** static source review of the whole monorepo (backend `src`, frontend `src`, migrations, DTOs, guards, Docker/compose, CI, deploy + ops scripts, plan/QA/TODO docs, CSV audit output). No live site or live DB access was used — anything that requires it is marked **"not verifiable here"**.

---

## 1. Executive summary

This is a **much better-built codebase than its age and scope suggest**. It is not a prototype: it has 20 wired NestJS feature modules, a real database layer with 30+ migrations, RBAC + a global default-deny auth guard, refresh-token rotation, Redis brute-force lockout, an idempotent content-push tool, an automated nightly DB backup with a restore test, and a Next.js frontend with a coherent SEO layer, a consent-gated analytics setup and 32 Jest test files.

The problems are **not** "the app is broken". They are the classic gap between _"a well-engineered product"_ and _"a production-hardened service"_:

| Area                                | Grade  | Headline                                                                                                                           |
| ----------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Architecture & feature completeness | **A−** | All planned backend modules exist; code is consistent and documented                                                               |
| Auth / identity core                | **A−** | Genuinely hardened (bcrypt 12, hashed rotating refresh tokens, Redis lockout)                                                      |
| Authorization model                 | **B+** | Global default-deny works; some anonymous write paths rely on a bearer "guestId" secret                                            |
| Input validation                    | **C+** | Global pipe is good, but several endpoints use inline TS types that bypass it                                                      |
| Data disclosure                     | **D**  | Public reads return **answer keys**; admin endpoints return password/token hashes                                                  |
| Error handling                      | **D**  | Non-HTTP exception `message` is returned to clients even in production                                                             |
| Content/data quality                | **C**  | ~620 chat, measured CSV defects (answer leakage / ambiguous options) still open                                                    |
| Ops / deploy / docs                 | **C**  | Solid compose + backups, but the operator scripts/docs are materially out of sync (broken backup path, wrong ports, origin bypass) |
| Frontend UX / a11y / SEO            | **B**  | Strong foundations; error states, canonicals, CSP, `aria-live` missing                                                             |
| Cosmetics / visual consistency      | **C+** | Design-token drift, dead font wiring, duplicated classes, overlapping cookie banner                                                |

**Verdict:** safe to keep developing; **not yet ready for a public launch** without closing the 8 high-severity items in §2. Realistically **2–4 focused days** of work closes everything that would embarrass you or expose data in production.

### Severity at a glance

| Severity        | Count | Examples                                                                                                                                                                         |
| --------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴 High         | 8     | Answer-key disclosure, JWT fallback secret, prod error leak, aborted content push, broken deploy backup, prod origin bypass, token storage + no CSP, pending credential rotation |
| 🟠 Medium       | ~22   | Validation-pipe bypasses, admin entity leakage, weak password policy, thin backend tests, CSV leakage, missing canonicals, no resource limits, CI gaps                           |
| 🟡 Low / polish | ~30   | Dead scripts, duplicated classes, emoji-as-icons, manifest icons, gradient drift                                                                                                 |

---

## 2. 🔴 High-severity findings (fix before launch)

### H1 — Public endpoints return the answer key (`SEC-03`)

`image-riddles`, `quiz-mcq` and `riddle-mcq` public reads return **full entities**, including `answer`, `correctAnswer`, `correctLetter` and `options`.

- Public image-riddle reads (`GET /image-riddles/random`, `/search`, `/:id`) return the literal `answer` column.
- `GET /quiz-mcq/subjects/:slug/questions` and `GET /quiz-mcq/questions/:chapterId` are `@_Public()` and select all columns via `common/content/content.service.ts`.
- Riddle reads (`subjects/:subjectId/riddles`, `riddles/:id`, `mixed`, `random/:level`) include `correctLetter`/`answer`.

**Impact:** the entire answer key is scrapeable with one unauthenticated loop; for image riddles it directly contradicts the deliberate masking the comments module implements ("isCorrect … NEVER leaves the service"). Where MCQ grading is client-side this is partly by design, but it is still a cheating/answer-key-harvesting surface.
**Fix:** add public DTO projections that omit answer columns; grade guesses server-side (the duels module already grades server-side — reuse that pattern).

### H2 — Hardcoded JWT secret fallback (`SEC-01`)

`auth/auth.module.ts:26` registers the JWT module with `configService.get('JWT_SECRET', 'your-secret-key')`. In any non-`production` environment (staging, a preview box, a typo like `prod`) tokens are signed with a **publicly known secret**.
**Fix:** `getOrThrow('JWT_SECRET')`, and fail fast for every non-dev environment (not just `production`).

### H3 — Internal error messages leaked in production (`SEC-02`)

`common/filters/http-exception.filter.ts:63` sets `message = exception.message` for non-`HttpException` errors and returns it unconditionally; only `stack`/`details` are dev-gated.
**Impact:** raw TypeORM/driver text — table/constraint names, SQL fragments, internal service messages — reaches clients in production.
**Fix:** in production, map non-`HttpException` errors to a generic `"Internal server error"`; log the real message server-side only.

### H4 — Content push aborted and its conflict gate is dead for most content types (`BE-08`)

- `scripts/.push-quiz-full-log.txt` stops at `questions: created 6450/11541`, then `EXIT:2` (401 token expiry + 502s) with **no "Done."** → ~5,000 quiz questions were not pushed in that run.
- `scripts/.content-push-state.json` contains only `subjects` (13), `riddle-categories` (10), `chapters` (79). There is **no** `questions` / `riddle-mcqs` / `dad-jokes` / `image-riddles` baseline.
- Without a baseline checksum the "live edit wins" conflict detection **can never fire** for those types — every re-run issues unconditional updates, so live-authored edits to questions/riddles/jokes/image-riddles are not protected.

**Fix:** re-run `npm run content:push -- --apply` to completion (idempotent, natural keys, no deletes), then confirm the state file gains the missing keys; persist state incrementally so an aborted run doesn't lose the baseline.

### H5 — Deploy scripts' DB backup is broken (`OPS-01`)

`deploy.ps1:230` and `deploy.sh:200` run `docker exec quiz-postgres-prod pg_dump …`, but the prod container is named **`quiz-postgres`** — no `quiz-postgres-prod` exists. On Windows PowerShell the `>` redirect also writes UTF-16, corrupting a stdout dump.
**Impact:** the very backup an operator reaches for before a risky `update` fails or produces a corrupt file.
**Fix:** use container `quiz-postgres`, write byte-safely, or delegate to the already-correct `scripts/setup-prod-db-backups.sh`.

### H6 — Prod publishes app ports on all interfaces (origin bypass) (`OPS-04`)

`docker-compose.prod.yml` maps `4004:3012` and `3001:3010` with no host IP → bound to `0.0.0.0`. Anyone can hit the origin directly and **bypass Cloudflare** (TLS, WAF, rate limiting, bot rules). The Cloudflare runbook lists "restrict origin to Cloudflare IPs" as still pending, so the bypass is live.
**Fix:** drop the mappings in production or bind `127.0.0.1:4004:3012`; restrict the VPS firewall to Cloudflare IPs on 80/443.

### H7 — Deploy scripts health-check the wrong host ports (`OPS-02`)

Scripts probe `localhost:3012` / `localhost:3010`, but prod publishes `4004` / `3001`, so `status`/`start`/`restart` always report **"Unhealthy"** against a healthy stack — masking real failures with alarm fatigue.

### H8 — Frontend: JWT in `localStorage` + no CSP (`FE` Sec #1/#2)

- User **and** admin JWT + refresh pairs live in `localStorage`/`sessionStorage` (XSS-readable).
- `next.config.mjs` ships `X-Frame-Options`/`nosniff`/`Referrer-Policy`/`Permissions-Policy` but **no `Content-Security-Policy`**, despite three inline-script surfaces (theme bootstrap, GA init, JSON-LD).

**Fix:** long-term move refresh tokens to `HttpOnly; Secure; SameSite` cookies; short-term add a strict CSP (`script-src 'self' 'nonce-…' https://www.googletagmanager.com`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`) and nonce the inline scripts.

> Also security-relevant: **H9 (hidden)** — `apps/backend/.env` holds a **live Google OAuth client secret**, the root `.env` and backend `.env` share one dev `JWT_SECRET`, and `plan/STANDARDS.md:56` / `TODO.md` record that credential rotation + possible git-history scrub are **still pending before any production deploy**. `.env` is correctly untracked today, but the exposed values have not been rotated (see §6.4).

---

## 3. 🟠 Medium-severity findings

### 3.1 Backend — security

| ID           | Issue                                                                                                                                                                                                                           | Evidence                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| SEC-04       | Prod env validation fires only when `NODE_ENV==='production'`; staging/preview silently falls back to dev CORS + weak secret                                                                                                    | `main.ts:158-183`                                                      |
| SEC-05       | **Literal DB passwords committed** in `docker-compose.yml:8,47` (verified: no `${…}` interpolation)                                                                                                                             | `.gitignore` doesn't list it                                           |
| SEC-06       | Weak password policy — `@MinLength(6)`, no complexity/breach check; `LoginDto.password` unbounded                                                                                                                               | `auth/dto/*.ts`                                                        |
| SEC-07       | Email verification never enforced — register returns full tokens; login ignores `emailVerified`                                                                                                                                 | `auth.service.ts:44-105`                                               |
| SEC-08       | **Inline `@Body()` types bypass the global ValidationPipe** (no runtime metatype): `POST /newsletter/unsubscribe` (unauthenticated, unvalidated email → can unsubscribe anyone), joke votes, chapter CRUD, `PUT /users/profile` | `main.ts:61-70` is skipped for these                                   |
| SEC-09       | Admin user endpoints return **raw `User` entities** (bcrypt hash + refresh/reset/verification token hashes)                                                                                                                     | `admin/users/admin-users.controller.ts:29-41`                          |
| SEC-10       | Unauthenticated state-changing endpoints: comment `flag`, `guest-users/activity` row creation, image-riddle `engage` counters, duel display-name/show-in-list                                                                   | various public controllers                                             |
| SEC-11       | Rate limiting uses **in-memory** storage and depends on `TRUST_PROXY` being set (only set in prod compose)                                                                                                                      | `app.module.ts:56-60`                                                  |
| SEC-12       | `guestId` is a **bearer secret** authorising destructive guest actions (comment delete, likes, duels, account merge)                                                                                                            | multiple services                                                      |
| SEC-16/17/18 | Public `subjects` exposes inactive/draft taxonomy; unescaped `name` interpolated into email HTML; Swagger open in every non-prod env                                                                                            | `quiz-mcq.controller.ts:130`, `email.service.ts:59,184`, `main.ts:114` |

### 3.2 Backend — correctness / quality

- **BE-09 — CSV content defects (Medium).** Measured: quiz 11,541 rows / riddle 3,000. `answer text appears in question`: **400 quiz + 175 riddle**; `option contained in correct answer (or vice versa)`: **44 quiz + 58 riddle**; **30** over-long riddle questions. These leakage/ambiguity classes are **not** covered by any repair script. (The A41%/B39% letter skew is _expected_ — easy/medium show 2 options — and runtime Fisher-Yates shuffle at serve time mitigates display bias.)
- **BE-11 — Thin backend tests (Medium).** 12 spec files for ~20 modules; **no specs** for analytics, duels, achievements, question-likes, riddle-mcq, admin. Jest threshold only 20%. (Frontend has 333 test files.)
- BE-02 `CacheModule` is `@Global` but never imported by `AppModule`; `CacheService` is re-provided ad-hoc → multiple ioredis clients.
- BE-03 `settings.updateSettings` comment claims an N+1 fix but still loops findOne+save per key.
- BE-06 admin image-riddles still uses the sledgehammer `delPattern('image-riddles:*')` that Track B replaced with family-scoped invalidation elsewhere.
- BE-10 `scripts/repair-quiz-subject.py` references the deleted `science-nature.csv` (BUG-042 split) → will crash.
- BE-14 Duplicate DTO definitions in `common/dto/base.dto.ts` vs `riddle-mcq/dto/*` (divergence risk).
- BE-15 `/guest-users/activity` has no frontend caller; no `PUT /auth/change-password` endpoint exists.
- BE-12 `analytics.service.ts` is 1,319 LOC with 44 raw `.query()` calls and zero tests (caching keys are correct).

### 3.3 Frontend — UX / a11y / SEO

- **FE-01 (S2)** `/quiz-mcq` subject/level/chapter queries have **no error branch** → an API failure renders a silent, near-empty screen. The homepage `TopicSection` already does this right — copy it.
- **FE-02/FE-03 (S2)** "Coming Soon" subject cards are `<Link href="#">` (focusable, jumps to top) and zero-question level chips are `aria-disabled` but keep a working `href` (keyboard users can enter empty sessions).
- **SEO (S2)** Only `MODULE_META` routes + `/games` set `alternates.canonical`. Missing on `/`, `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/jokes`, `/image-riddles`. Drive from `INDEXABLE_ROUTES`.
- **a11y (S2)** no `aria-live` region for quiz question/timer/score changes; incorrect `role="menubar"` on the header nav; mobile drawer `role="dialog"` has no focus trap/scroll lock (the `Modal` component does it correctly); form errors not linked via `aria-invalid`/`role="alert"`; white `<100%`-opacity text on light-purple/pink gradients likely fails 4.5:1; decorative status SVGs lack `aria-hidden`.
- Manifest declares only `/icon.svg` (no 192/512 PNG, no maskable, no apple-touch-icon).
- `images.unoptimized: true` is global (comment says dev-only) — disables the image optimizer in production too.

### 3.4 Ops / deploy / CI

- **OPS-03** Stale `/api/health` (missing the `v1` segment) in `check-status.ps1`, `launch-servers.ps1`, `auto-connect-server.ps1`, `start-servers-auto.ps1`, `start-servers-robust.ps1` and `DEPLOYMENT.md`. Real route is `/api/v1/health`.
- **OPS-05** No container resource limits anywhere — an OOM can take down an unrelated site sharing the VPS (`profitbenefit.com`).
- **OPS-06** Prod images ship the full dev `node_modules` (and backend `src`); the frontend ignores its own `output: 'standalone'` build.
- **OPS-07** `.env.production.example` omits `REDIS_PASSWORD`, which prod compose **requires** → first `up` errors out.
- **OPS-09** `docker-compose.staging.yml` commits weak static secrets and public ports, while `DEPLOYMENT.md` says "staging not needed" — contradictory.
- **OPS-10** Dev compose publishes DB (5432) and password-less Redis (6379) to all interfaces; dev frontend binds `0.0.0.0`.
- **OPS-13** `scripts/docker-startup.ps1/.sh` invoke compose profiles/services (`nginx`, `migrate`, `minio`), container `ai-quiz-postgres` and an `infrastructure/` dir that **do not exist**.
- **OPS-14** CI has **no secret scanning and no SAST**; `npm audit --audit-level=high` is `continue-on-error` (non-blocking). CI does run lint + theme + type-check + tests + build on PRs to `main`.
- **OPS-19** Backup strategy is good (nightly, gzip, retention 7, restore test) but **same-host only** — no off-box replication, no encryption at rest.
- **OPS-20** Docs partly stale/contradictory: `DEPLOYMENT.md` documents a retired Dokploy stack and a `docker rm -f` flow it elsewhere forbids, and includes a sample password `admin123`; `PORT-REFERENCE.md` (dated 2026-03-17) omits prod ports 4004/3001 and staging 3013/3011.
- **OPS-21** No uptime/error alerting, log retention, or incident-response runbook.
- **OPS-22** Cloudflare posture solid (strict SSL, min TLS 1.2, HSTS, HTTP/2+3) but the runbook's pending items — auth rate-limit, Dokploy-panel restriction, **origin firewall** — are still unapplied.

---

## 4. 🟡 What's missing (vs. plan / product intent)

Genuinely absent or unwired — **not** defects, but gaps to decide on:

| Item                                              | Source                        | Status                                               |
| ------------------------------------------------- | ----------------------------- | ---------------------------------------------------- |
| Riddle **server-side sessions**                   | `plan/BUILD-BACKLOG.md` #2    | Not built (quiz-mcq sessions exist)                  |
| Achievements for **image-riddles / jokes**        | `plan/06-achievements.md`     | Definitions absent (owner-deferred)                  |
| **Newsletter campaigns / double opt-in**          | `plan/14-newsletter.md`       | Deferred (subscribe/unsubscribe/export exist)        |
| Settings **restore-defaults / delete**            | `plan/11-site-settings.md`    | Absent                                               |
| **Change-password** endpoint                      | `plan/future-features.md` A5  | Absent                                               |
| Feature 16 "liked-categories"                     | `plan/16-liked-categories.md` | Documented "Proposal / not built"                    |
| **Web UI for Duels**                              | `plan/future-features.md` A1  | Backend complete + live, **zero web UI**, zero tests |
| Analytics funnel UI, retention purge, ops metrics | `plan/13-analytics.md`        | Deferred                                             |
| Admin **user-editing UI**                         | `plan/01-user-accounts.md` P2 | Endpoints exist, UI is read-only lists               |
| S3 media storage                                  | `plan/08-media.md`            | Owner-deferred                                       |
| SEO P2/P3 (RSC, per-subject routes, GSC)          | `plan/15-seo.md`              | Owner-gated                                          |

Also **open QA bugs** (`QA-FINDINGS.md`): BUG-042 (split "Science & Nature" — CSV done, **DB import/removal + Nature landing card still pending**), BUG-045/BUG-046 (question like/comment not retained after refresh — P1), BUG-047 (share menu not wired on the surface tested), BUG-048 (public like/comment/share counts), BUG-005 (legal pages not finalized — deferred).

> Note: `plan/STANDARDS.md` and `TODO.md` both still carry the "prod credential rotation pending" line — treat it as an open task, not history.

---

## 5. 🎨 Cosmetics / visual polish (the "what can be applied" list)

These are cheap, high-visibility wins:

1. **Wire the `--font-inter` variable into Tailwind.** `layout.tsx` loads Inter with `variable: '--font-inter'` but `tailwind.config.ts` `fontFamily.sans` hardcodes `['Inter','system-ui','sans-serif']` — so the optimized self-hosted font is **never actually applied** (dead optimization). Fix: `sans: ['var(--font-inter)', …]`.
2. **Unify page background gradients.** Home/quiz use `#A5A3E4 → #BF7076`; `/play` and `/games` use `#E8E4F3 → #D4C5E8`. Extract `--grad-page` / a `PageShell` so a design tweak is one edit.
3. **Purge duplicated/contradictory `dark:` classes** (e.g. `dark:bg-secondary-800/50` twice; two `dark:hover:bg-*` on one element; badge classes duplicated). `npm run check:theme` already flags these.
4. **Migrate auth pages off `slate-*`** onto the app's semantic tokens (`bg-card`, `text-foreground`, `secondary-*`) for consistent dark mode.
5. **Centralize the mode/picker card grids** (home `ModeCards`, `/play` `MODES`, quiz "Special Quiz Modes" — three hand-rolled near-identical grids). Extract one `<ChoiceCard>`.
6. **Standardize radius & shadow scales** (currently mixes `rounded-xl/2xl/[3rem]` and `shadow-lg/md/soft` + arbitrary values). Pick 2 radii + 3 shadows.
7. **Skeleton parity** — `LevelSelection` shows a plain "Loading…" while siblings show shimmer skeletons.
8. **Replace emoji-as-UI-icons** on primary picker glyphs with `lucide-react` (already a dependency); keep emoji only for decorative accents. (Emoji also trip the anti-slop rules for shipped UI.)
9. **Fix the cookie-banner / mobile bottom-nav overlap** (both `fixed bottom-0 z-50`) — offset the banner above the nav.
10. **Introduce content-width tokens** (`wide`/`default`/`narrow`) — pages currently mix `max-w-2xl/4xl/5xl` arbitrarily.
11. **Expand `manifest.ts`** icons (192/512 PNG + maskable + apple-touch-icon).
12. **Design-token audit:** the `designs/*.html` files define exact tokens — reconcile them with `tailwind.config.ts` so the shipped theme matches the design exploration.

---

## 6. Production launch checklist

### 6.1 Must-fix before opening to the public (blockers)

- [ ] H1 public reads: strip answer keys (`answer`, `correctAnswer`, `correctLetter`, `options`) from public DTOs
- [x] H2 `getOrThrow('JWT_SECRET')` in the JWT module; fail fast for all non-dev envs - FIXED 2026-09-21: getOrThrow + SEC-04 non-dev fail-fast in main.ts.
- [x] H3 stop leaking non-`HttpException` messages in production - FIXED 2026-09-21: production returns a generic message; the real stack stays in server logs.
- [x] H5/H7 fix `deploy.ps1`/`deploy.sh` DB container name + health ports - FIXED 2026-09-21: correct container name, UTF-16-safe dump (in-container + docker cp), health/URL ports 4004/3001.
- [ ] H6 unbind prod app ports (or loopback-bind) + restrict origin firewall to Cloudflare IPs - PARTIAL 2026-09-21: compose ports loopback-bound (127.0.0.1); the live Dokploy exposure + origin firewall need owner/VPS action.
- [ ] H8 add a CSP and (at minimum) plan token-storage hardening - PARTIAL 2026-09-21: baseline CSP shipped (self + GTM; unsafe-inline while inline scripts are un-nonced); token storage hardening remains.
- [ ] H9 rotate dev/prod credentials (admin, DB, Redis, JWT, Google OAuth) and move the OAuth secret off disk
- [ ] H4 finish `content:push` and verify the state file covers all content families
- [x] SEC-05 replace literal DB passwords in `docker-compose.yml` with `${…}` from an untracked `.env` - FIXED 2026-09-21: compose interpolates POSTGRES_PASSWORD from the untracked root .env (value preserved for existing dev volumes).
- [x] SEC-08/09: convert inline `@Body()` types to DTOs (esp. `newsletter/unsubscribe`); return `toProfile()` from admin user endpoints - FIXED 2026-09-21: newsletter/unsubscribe, dad-joke votes, chapter CRUD and PUT /users/profile all use validated DTOs; admin user endpoints return toProfile().

##### Remediation log - 2026-09-21 (security + ops wave, all verified: backend tsc + 87/87 tests, frontend tsc + 553/553 tests, theme guard, production build)

Wave 5 (2026-09-21): mobile drawer focus trap + scroll lock; quiz play aria-live announcements.
Wave 4 (2026-09-21): BE-02 single global CacheModule (boot-verified); cosmetics #9 consent banner no longer overlaps the mobile bottom nav.
Wave 3 (2026-09-21): FE-02/03 fake-link + focus fixes, canonicals on 5 static pages, menubar role removed, OPS-14 gitleaks job in CI.
Wave 2 (2026-09-21, same commit chain): SEC-08 completed for the remaining inline payloads (dad-joke votes, chapter create/update, PUT /users/profile); SEC-06 password policy; OPS-05 container memory limits; OPS-13 broken docker-startup scripts deleted; OPS-20 docs corrected (PORT-REFERENCE prod/staging ports, sample admin password removed); FE-01 error+retry states on the quiz hub; 6.4 production runbook created.

- **Fixed:** H2, H3, H5, H7, SEC-05, SEC-09 (admin users), SEC-08 (newsletter/unsubscribe DTO), OPS-03 (stale `/api/health` in 5 scripts + DEPLOYMENT.md), OPS-07 (`REDIS_PASSWORD` documented in `.env.production.example`), BE-10 (obsolete `repair-quiz-subject.py` deleted), cosmetic #1 (`--font-inter` wired into Tailwind).
- **Partially fixed:** H6 (compose loopback; live exposure + firewall = owner/VPS), H8 (CSP shipped; nonces + token storage = follow-up), SEC-08 (3 more inline-`@Body()` endpoints).
- **Open - owner decisions:** H1 (needs the server-side-grading decision before stripping answer columns - naive removal breaks client-side scoring), H4 (run `content:push` to completion; owner says no content changed - a dry run would verify), H9 (credential rotation + git-history scrub).

### 6.2 Should-fix immediately after

- [x] SEC-06 password policy ≥ 8 + breach check; SEC-07 decide email-verification gate - PARTIAL 2026-09-21: policy now >=8 + letter+digit on register/reset (login capped); breach-list check remains.
- [ ] SEC-11 shared throttler storage + mandate `TRUST_PROXY` in every deploy path
- [ ] SEC-10/SEC-12 bind anonymous writes to a server-signed guest token
- [x] OPS-05 container resource limits; OPS-07 add `REDIS_PASSWORD` to the prod template; OPS-06 prune prod images - PARTIAL 2026-09-21: per-service memory limits added to docker-compose.prod.yml; OPS-06 (prune prod images) remains.
- [x] OPS-14 add gitleaks + CodeQL + (optional) blocking critical `npm audit` - PARTIAL 2026-09-21: gitleaks secret-scan job added to CI (green); CodeQL and a blocking critical-audit gate remain.
- [x] FE-01 error states; FE-02/03 kill fake links; add per-page canonicals; `aria-live` + drawer focus trap; fix `role="menubar"` - PARTIAL 2026-09-21 (wave 3): hub error+retry states, FE-02/03 fake-link removal, canonicals on /about /faq /contact /privacy /terms, and the menubar fix are DONE; aria-live + drawer focus-trap are DONE in wave 5; the gradient-contrast review remains.
- [ ] BE-09 run the CSV leakage/ambiguity repairs and re-audit

### 6.3 Backlog / quality

- [ ] BE-11 backend specs for analytics, duels, question-likes, riddle-mcq; raise the coverage threshold
- [x] BE-02 single `CacheModule` import; BE-03/05 batch writes; BE-06 family-scoped invalidation - PARTIAL 2026-09-21 (wave 4): CacheModule registered once in AppModule, per-module CacheService providers removed (verified by a full app boot in prod); BE-03/05/06 remain.
- [x] OPS-13/18 rewrite or delete the broken docker-startup / port-security scripts; OPS-12/24 delete orphaned entrypoint + root Dockerfile - PARTIAL 2026-09-21: broken docker-startup.ps1/.sh deleted; port-security scripts untouched.
- [ ] OPS-19 off-box backup replication + documented restore drills
- [ ] OPS-21 uptime/error alerting + incident/rollback runbook
- [ ] Cosmetics §5

### 6.4 Single authoritative Production Runbook (created 2026-09-21 - docs/production-runbook.md)

Create one doc covering: **secret rotation** (prod admin/DB/Redis/JWT/OAuth + git-history decision), **rollback** (pin a known-good image/commit), **incident response**, **origin-firewall / Cloudflare-IP** steps, **monitoring/log-retention**, and the **CI/CD topology** (`main → production → auto-deploy`, Dependabot policy). Consolidate `DEPLOYMENT.md` + `docs/cloudflare-config-runbook.md` + `CONTENT-PUSH-RUNBOOK.md` + `PORT-REFERENCE.md`, and correct the stale/contradictory content (retired Dokploy stack, `admin123` sample, wrong health paths, missing prod ports).

---

## 7. What's already good (keep doing this)

- **Auth core:** bcrypt cost 12; refresh tokens are random 32-byte values stored **only as SHA-256 hashes** with 7-day expiry + rotation-on-use + server-side revoke on logout; access tokens 15 min; Redis brute-force lockout (5/15 min); hashed one-time reset/verification tokens; enumeration-safe flows.
- **Authorization:** global default-deny `JwtAuthGuard` as `APP_GUARD` with explicit `@_Public()` opt-outs; every `/admin/*` controller carries `JwtAuthGuard + RolesGuard/AdminGuard + @Roles('admin')`; IDOR checked on `users/:id`.
- **Transport & input:** helmet, CORS allow-list with credentials, 1 MB/50 MB body-size split, global `ValidationPipe` with `whitelist + forbidNonWhitelisted + transform`, `javascript:`/`data:` image-URL validator, parameterized SQL everywhere (no interpolation found), 5 MB upload cap + MIME allow-list + sharp re-decode.
- **DB:** `synchronize` off by default and forbidden in production; migrations auto-run on prod boot; optional SSL with `rejectUnauthorized` default true.
- **Content pipeline:** env-file credentials (never argv), no secret logging, dry-run default, typed `PUSH` confirmation, natural-key idempotency, conflict detection, **no deletes ever**, 10-table allowlist.
- **Frontend:** skip link + single `<main>`; global `:focus-visible` ring + `prefers-reduced-motion`; a genuinely correct focus-trapped `Modal`; consent-gated + anonymized GA; `dangerouslySetInnerHTML` used safely in all three sites; `normalizeExternalUrl()` blocks `javascript:`/`data:` links.
- **Deployment:** multi-stage non-root images; prod DB/Redis not published; Redis password + healthchecks + `restart: unless-stopped`; nightly gzipped DB backup with a **restore test**; Cloudflare strict TLS + HSTS + HTTP/2-3; `TRUST_PROXY=true` behind the proxy.

---

## 8. Appendix — evidence & sources

**Read in this audit (non-exhaustive):** `apps/backend/src/**` (main.ts, app.module.ts, auth/_, common/guards/_, common/filters/_, media/_, settings/_, users/_, guest-users/_, all migrations), `apps/frontend/src/**` (lib/_, components/_, app/\*\*), `next.config.mjs`, `tailwind.config.ts`, all `docker-compose_.yml`, all `Dockerfile`s, `deploy.ps1`/`deploy.sh`, `.github/workflows/_`, `.husky/_`, `scripts/push-content.mjs`, `scripts/csv-quality-report.txt`, `scripts/audit-csv-quality.py`, `scripts/repair-_.py`, `plan/_.md`, `QA-FINDINGS.md`, `TODO.md`, `DEPLOYMENT.md`, `CONTENT-PUSH-RUNBOOK.md`, `docs/cloudflare-config-runbook.md`, `PORT-REFERENCE.md`.

**Not verifiable in this environment (no live access):** actual live content counts and whether the aborted quiz push was later completed; whether the reported CSV defect counts still match the current CSVs (the report predates several repairs — re-run `python scripts/audit-csv-quality.py`); rendered Lighthouse/axe scores; runtime env values for the live deployment (`DB_SYNCHRONIZE`, `TRUST_PROXY`, `DISABLE_AUTH`).

**Open QA bugs referenced:** BUG-005, BUG-042, BUG-045, BUG-046, BUG-047, BUG-048 (`QA-FINDINGS.md`).

> Severity IDs (`SEC-*`, `BE-*`, `FE-*`, `OPS-*`) map to the detailed per-area audit appendices retained alongside this report.
