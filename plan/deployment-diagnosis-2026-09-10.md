# Deployment Diagnosis — production mismatch — 2026-09-10

> Code/config-side diagnosis only. **No fixes attempted.** Read-only probes of the two production URLs
> (GET requests only), repo/config inspection, and git archaeology. Supersedes the live-check interpretation
> in §2 of `plan/project-status-2026-09-10.md` (that pass used wrong probe paths — corrected below).

---

## Verdict up front

**Both original hypotheses were each half right, on different services — and on the backend the truth is more
extreme than either:**

- **Frontend (`quiz.profitbenefit.com`): explanation (b) confirmed.** The subdomain was **never created in DNS**.
  The `profitbenefit.com` zone exists on Cloudflare (root and `api.` both resolve, proxied), but `quiz.` is
  NXDOMAIN. The domain is fully configured in code (compose `CORS_ORIGIN`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`
  build args) — it was simply never provisioned at the DNS level.
- **Backend (`api.profitbenefit.com`): explanation (a) confirmed, in the strong form.** The running backend was
  **not built from any commit in this repository's history** — not an old commit of this repo, not a dependabot
  branch: **no commit produces the observed feature combination** (proof below). It behaves like an older-generation
  build of the project, and "auto-deploy on push" has therefore never delivered this repo's code — or builds but
  the documented container-name-conflict failure mode keeps the old container serving.

**Correction to the previous status check:** the real API prefix is `/api/v1` (`main.ts`: `setGlobalPrefix('api')`

- URI versioning `defaultVersion: '1'`). My first-round probes hit `/health`, `/settings/public`, etc. — wrong
  paths. The corrected probes below still show a deep mismatch, so the conclusion survives, but the specific claim
  "current routes 404" needed the corrected path set (and one wrong probe, `/quiz-mcw/…`, was a typo).

---

## 1. Deploy config as it actually exists in code

**`docker-compose.prod.yml`** — one stack, four services, all on an internal `quiz-network`:

| Fact                   | Value / evidence                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Services               | `postgres:15-alpine`, `redis:7`, `backend` (build `apps/backend/Dockerfile`, port 3012), `frontend` (build `apps/frontend/Dockerfile`, port 3010)                                                                                                                                                                            |
| **No published ports** | Neither app service has a `ports:` mapping → **nothing in this repo exposes anything to the internet.** External reachability depends entirely on Dokploy's reverse proxy, whose domain→container routing lives only in the Dokploy dashboard (no Traefik/nginx/Caddy labels or config anywhere in the repo — grep confirms) |
| Fixed container names  | `quiz-postgres`, `quiz-redis`, `quiz-backend`, `quiz-frontend` → the documented "container name already in use" redeploy failure mode                                                                                                                                                                                        |
| Backend env            | `CORS_ORIGIN: https://quiz.profitbenefit.com`, `FRONTEND_URL: https://quiz.profitbenefit.com`, `DB_SYNCHRONIZE: 'false'`, `TRUST_PROXY: 'true'`                                                                                                                                                                              |
| Backend healthcheck    | `wget http://127.0.0.1:3012/api/v1/health/liveness` — confirms the intended route prefix **/api/v1**                                                                                                                                                                                                                         |
| Frontend build args    | `NEXT_PUBLIC_API_URL: https://api.profitbenefit.com/api/v1`, `NEXT_PUBLIC_IMAGE_HOSTS: api.profitbenefit.com` (frontend and backend are **one compose stack**, not separate Dokploy apps)                                                                                                                                    |
| Frontend healthcheck   | `wget http://127.0.0.1:3010/`                                                                                                                                                                                                                                                                                                |

**Deploy trigger:** there is **no webhook/workflow/deploy config in the repo** (`.github/workflows/ci.yml` is CI
only). DEPLOYMENT.md _claims_ "Auto-deploy on git push" but also documents a **manual** workflow ("Click **Stop**,
then **Deploy**") invented to work around recurring `container name already in use` conflicts, plus a
VPS-side manual script (`dokploy-deploy.sh`: `docker rm -f … && docker compose up -d --build`) run inside the
VPS checkout at `/etc/dokploy/compose/quiz-stack-gz5jv5/code`. So even per its own docs, successful deploys have
historically required manual intervention on the VPS.

**Real route paths in current code** (for exact comparison):

| Route                                            | Defined at                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `GET /api/v1/health/liveness`, `/readiness`, `/` | `health.controller.ts` — `@Controller('health')` + `@Get('liveness'\|'readiness'\|'')`           |
| `GET /api/v1/settings/public`                    | `settings-public.controller.ts` — `@Controller('settings')` + `@_Public()` + `@Get('public')`    |
| `GET /api/v1/quiz-mcq/subjects`                  | `quiz-mcq.controller.ts:135` — `@_Public()` + `@Get('subjects')` under `@Controller('quiz-mcq')` |
| static uploads                                   | `/uploads/*` (prefix-exempt static mount)                                                        |

---

## 2. Live probe results (corrected paths, 2026-09-10 ~02:57 +0545)

| Probed path                                       | Live result                                                                   | Expected from current code | Reading                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/api/v1/health/liveness`                         | **404**                                                                       | 200                        | route absent from the running build                                                                  |
| `/api/v1/health/readiness`                        | **404**                                                                       | 200                        | same                                                                                                 |
| `/api/v1/settings/public`                         | **401 "No auth token"**                                                       | 200 + public JSON          | route **exists but is guarded** — contradicts every commit (below)                                   |
| `/api/v1/quiz-mcq/subjects`                       | **404**                                                                       | 200                        | absent                                                                                               |
| `/api/v1/image-riddles/categories`                | **404**                                                                       | 200                        | absent                                                                                               |
| `/api/v1/duels/presence/players`                  | **404**                                                                       | 200/401                    | absent                                                                                               |
| `/api/v1/auth/google`                             | **302 redirect**                                                              | 302                        | OAuth login **present**                                                                              |
| `/api/v1/settings/public` (etc.) with `requestId` | `/api/*` paths return a populated `requestId`; non-`/api` paths return `null` | —                          | suggests a path-scoped middleware or two answering surfaces behind the proxy (owner-side check §5.4) |
| `https://quiz.profitbenefit.com`                  | **NXDOMAIN**                                                                  | 200                        | DNS record never created                                                                             |

---

## 3. The build-fingerprint argument (why "stale commit" is too weak)

dating constraints for the running backend, from git history (678 commits, root `7cd9710` 2026-02-13):

| Feature                            | Entered the repo                                                                     | Live server                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `/api/v1` prefix + URI versioning  | `e539123` 2026-03-06                                                                 | **present** (routes answer under `/api/v1/...`)                                               |
| Google OAuth (`/auth/google` 302)  | `412a99b` 2026-03-28                                                                 | **present**                                                                                   |
| Image Riddles (`/image-riddles/*`) | `a0d62e2` **2026-02-14** — _predates the login system_                               | **absent**                                                                                    |
| Health liveness/readiness          | root commit `7cd9710` 2026-02-13 (wired in `app.module`)                             | **absent**                                                                                    |
| Duels (`/duels`, `/presence`)      | September 2026                                                                       | **absent**                                                                                    |
| `settings-public` controller       | `6136667` 2026-09-05, created **with `@_Public()`** (verified in that commit's tree) | present-but-**guarded** (401) — a guarded variant of this route exists in **no commit, ever** |

The first three rows are mutually exclusive: any build containing the login system (03-28) necessarily contains
image riddles (02-14) and health liveness (02-13). The live server has the former and lacks both of the latter.
**No commit — and no dependabot branch (they're all descendants of main) — can produce the observed combination.**

Consequently the running container was built from something that is not this repository's git history. The two
candidate realities (owner can distinguish them in minutes — §5):

- **(A) Pre-rewrite generation:** the VPS runs the _original_ project the Feb-2026 "Initial commit: Enterprise-grade
  quality implementation" was rewritten from (same NestJS skeleton, same response-filter shape — which is why the
  404/401 envelopes look like this app's). This repo has plausibly **never been deployed anywhere**.
- **(B) Divergent VPS checkout:** `/etc/dokploy/compose/quiz-stack-gz5jv5/code` is a stale checkout of some ancestor
  state with local hand-edits accumulated through the documented manual VPS-side deploy workflow.

Either way, the practical conclusion is identical: **pushing to main does not update production.** Whether an
auto-deploy webhook exists and silently fails, or builds succeed but the documented container-conflict mode leaves
the old container bound to the proxy, or no webhook was ever configured — that is exactly what the §5 checklist
resolves.

---

## 4. Weighing the two competing explanations

**(a) Deploy pipeline isn't triggering/succeeding on push — stale build serving old routes.**
Evidence FOR: every build-fingerprint row above; the repo documents the exact failure mode (name-conflict deploys,
manual "Stop → Deploy" as the standing workaround); `dokploy-deploy.sh` + the VPS checkout path prove a manual,
VPS-local deploy tradition; no webhook config exists anywhere in the repo; no ports are published, so an old
container that never dies keeps serving whatever proxy binding points at it.
Evidence AGAINST: none found — DEPLOYMENT.md's "Auto-deploy on git push" line is the only pro-(a)-is-fine artifact,
and it is uncorroborated by any config in the repo.

**(b) Deploy is fine but DNS was never pointed at the VPS, and the probed prefix didn't match.**
Evidence FOR: `quiz.` NXDOMAIN is fact — the frontend domain was never created in Cloudflare DNS (root and `api.`
exist, so the zone works; someone added `api` and never `quiz`). The prefix half of (b) was _my_ error: the correct
`/api/v1` prefix was derived from `main.ts` + the compose healthcheck, and with correct paths the mismatch persists
and deepens.
Evidence AGAINST (as a full explanation): (b) cannot explain the backend — `api.profitbenefit.com` resolves and
terminates TLS into a NestJS app whose route surface predates this repo.

**Verdict:** (b) fully explains the frontend; (a) fully explains the backend — and on the backend the staleness is
"never deployed this repo at all," not merely "a few commits behind." The two services fail for two independent
reasons, which is also why one-stack compose never surfaced the problem: each service's failure mode masks the other.

---

## 5. What ONLY you can check (ordered) — closes the remaining unknowns

1. **Dokploy dashboard → the quiz-stack app:** Does a Git-source integration for `randomfact236/Quiz` exist at all
   (vs. a plain compose stack fed by the VPS checkout)? What is the **last build timestamp + status**, and are there
   build logs around **2026-09-10 ~02:11** (the `9ee0ed3`/`91bc129`/`61e1396` push)? A failed/absent build there is
   the definitive confirmation of (a).
2. **On the VPS:** `git -C /etc/dokploy/compose/quiz-stack-gz5jv5/code log -1 --format='%h %ad %s'` and
   `git -C … status --short | head`. This answers variant A vs B: is the checkout even this repo, and how stale/divergent is it?
3. **On the VPS:** `docker ps --format '{{.Names}} {{.CreatedAt}} {{.Status}}'` — creation date/uptime of
   `quiz-backend` (how old is the running app?); `docker inspect quiz-backend --format '{{.Image}}'`; and
   `docker compose -f docker-compose.prod.yml logs backend | head -40` — which app booted and when. Also check
   whether the backend container's own healthcheck is passing (`docker inspect quiz-backend --format '{{json .State.Health}}'`).
4. **Dokploy Domains/proxy panel:** list every registered domain and its target container:port. Expected per code:
   `api.profitbenefit.com` → `quiz-backend:3012`, `quiz.profitbenefit.com` → `quiz-frontend:3010`. Confirm whether
   `quiz.` was ever registered, and whether `api.` targets the backend directly or a path-routed proxy (this also
   explains the `requestId` null-vs-populated split if two surfaces answer).
5. **Cloudflare DNS:** create `quiz.profitbenefit.com` (proxied A/AAAA or CNAME to the same edge target Dokploy's
   proxy exposes for the stack) — but **only after step 4 confirms a frontend container actually serves** on the VPS;
   otherwise you'd publish DNS to nothing.
6. **Before any redeploy of current main (critical):** snapshot/backup the Postgres volume
   (`postgres_prod_data`). The prod DB has been written by the ancient app for months; the current backend runs all
   pending migrations on boot — including `1789700000000` (deliberately **fails** if riddle duplicates exist) and
   `1789800000000` (guest publicId). Schema drift between the ancient app's tables and the migration chain is likely;
   the first boot after a real deploy may need manual migration triage. Also verify the VPS `.env` has
   `POSTGRES_PASSWORD`, `JWT_SECRET`, `REDIS_PASSWORD`, `RESEND_API_KEY`, `FROM_EMAIL` (compose hardcodes
   `CORS_ORIGIN`/`FRONTEND_URL` itself).
7. **After redeploy, verify in this order:** `GET https://api.profitbenefit.com/api/v1/health/liveness` → 200;
   `GET /api/v1/settings/public` → 200 JSON with the branding group; `https://quiz.profitbenefit.com` → 200;
   one OAuth login round-trip. Then the A3/A4 staging re-verifications from the status doc apply.
8. **If step 2 reveals the old-generation app (variant A):** the migration path — deploy this repo as a _new_ stack
   beside it, cut the domains over, and migrate the data — is a project decision for you; do not point the existing
   domains at a fresh stack before the DB question is settled.

**No fixes were made in this pass** (repo or infrastructure). The only repo-side artifact is this document.
