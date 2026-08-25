# DevOps, Deployment & Environment Configuration

## 1. Scope & File Inventory (table of key files + purpose)

### Docker / Compose

| File                              | Purpose                                                                                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile` (root)               | Multi-stage backend-only production image (builder → `production` stage, node:20-alpine, non-root `nestjs` user, EXPOSE 3012). Despite living at root, it builds only the NestJS backend.                 |
| `docker-compose.yml`              | Dev stack: postgres:15-alpine, redis:7-alpine, backend via `apps/backend/Dockerfile.dev`, frontend via `apps/frontend/Dockerfile.simple`. Healthchecks on DB/Redis; hardcoded dev credentials.            |
| `docker-compose.local.yml`        | "Local" variant — nearly identical to `docker-compose.yml` but also bind-mounts backend src/tsconfig and injects a placeholder `JWT_SECRET`. Documented in DEPLOYMENT.md as the primary local DB starter. |
| `docker-compose.prod.yml`         | Production stack for Dokploy VPS; no port mappings exposed (reverse-proxy handled externally), no healthchecks, hardcoded `JWT_SECRET`/DB password placeholders, `DB_SYNCHRONIZE: 'true'`.                |
| `apps/backend/docker-compose.yml` | A THIRD compose file scoped to backend (`ai-quiz-*` container names, postgres:16, service name `api`). Duplicates/conflicts with root compose files.                                                      |
| `.dockerignore`                   | Excludes node_modules, .git, .next, logs, env files from build context.                                                                                                                                   |

### App Dockerfiles

| File                                  | Purpose                                                                                                                                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/backend/Dockerfile`             | 3-stage (builder/development/production); production stage identical to root `Dockerfile`. Copies full `src` into the runtime image (build output AND source shipped together).                                   |
| `apps/backend/Dockerfile.dev`         | Single-stage dev image; runs `node scripts/fix-deps.js && npm rebuild bcrypt`; `npm run start:dev`.                                                                                                               |
| `apps/backend/docker-entrypoint.sh`   | Waits for Postgres/Redis via `nc`, optionally runs `npm run migration:run`, then `exec`s CMD. **Note: not referenced by any Dockerfile/compose file** (no `ENTRYPOINT` anywhere), so it is currently dead config. |
| `apps/frontend/Dockerfile`            | Proper Next.js multi-stage prod build with `ARG NEXT_PUBLIC_API_URL`, non-root user, copies `.next`, runs `npm start`. Does **not** use `output: 'standalone'`.                                                   |
| `apps/frontend/Dockerfile.simple`     | Dev image: installs deps, `CMD ["npm","run","dev"]` — used by both dev compose files as the frontend service.                                                                                                     |
| `apps/frontend/next.config.docker.js` | Standalone-output variant of next config with Docker polling tweaks; **not referenced** by any Dockerfile (frontend Dockerfile uses default `next.config.mjs`).                                                   |

### Deploy scripts & docs

| File                       | Purpose                                                                                                                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deploy.ps1` / `deploy.sh` | Mirrored deploy CLIs (deploy/build/start/stop/restart/logs/status/update/backup/clean) targeting `docker-compose.prod.yml` + `.env.production`.                                                                                                      |
| `dokploy-deploy.sh`        | Dokploy auto-deploy entry: force-removes old containers by name, `docker compose -f docker-compose.prod.yml up -d --build --remove-orphans`.                                                                                                         |
| `DEPLOYMENT.md`            | Deployment guide: local dev = npm processes 3010/3012 + Dockerized Postgres/Redis via `docker-compose.local.yml`; prod = Dokploy VPS at quiz.profitbenefit.com / api.profitbenefit.com with VPS path `/etc/dokploy/compose/quiz-stack-gz5jv5/code/`. |

### Environment files

| File                      | Purpose                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env` (root)             | **Committed to git** despite `.gitignore` listing `.env` — tracked before ignore was added. Contains variable names: NODE_ENV, APP_NAME, APP_VERSION, FRONTEND_PORT, BACKEND_PORT, DB_PORT, REDIS_PORT, DB_HOST/PORT/USERNAME/PASSWORD/DATABASE, REDIS_HOST/PORT/PASSWORD, JWT_SECRET, JWT_EXPIRES_IN, NEXT_PUBLIC_API_URL, API_URL, CORS_ORIGIN, CACHE_TTL_SECONDS, CACHE_ENABLED (values not reproduced here). |
| `.env.example`            | Full template: app settings, ports, DB, Redis, JWT, API URLs, CORS, bcrypt rounds, rate limiting, cache, logging, SMTP, feature flags. Several keys are aspirational (not read by code).                                                                                                                                                                                                                         |
| `.env.production.example` | Slimmer template: POSTGRES*\*, JWT_SECRET, CORS_ORIGIN, NEXT_PUBLIC_API_URL/APP_NAME/APP_VERSION, optional SMTP/SENTRY placeholders. Note it uses `POSTGRES*_`naming while code reads`DB\__`.                                                                                                                                                                                                                    |
| `apps/backend/.env`       | **Tracked in git** (confirmed via `git ls-files`). Contains PORT, NODE*ENV, DB*_, REDIS\__, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN, GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL, RESEND_API_KEY, RESEND_DOMAIN, FROM_EMAIL (names only listed here). This is a live secrets leak in version control.                                                                                                                   |

### Build/config/scripts

| File                                                                                             | Purpose                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` (root)                                                                            | npm workspaces (`apps/*`, `libs/*`); scripts for dev/build/test/lint/type-check plus custom tooling: `validate:ports`, `ports:*` (port-security-enforcer.ps1), `scan:code*`/`quality:gate` (enterprise-code-scanner.ts), `fix`/`fix:frontend`/`fix:backend` (auto-fix-errors.ps1). References `infrastructure/docker/docker-compose.yml` which **does not exist**, and several scripts that don't exist (see §5). |
| `tsconfig.json` (root)                                                                           | Strict monorepo TS config (ES2022, bundler resolution, very strict flags incl. `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) with paths `@/*`, `@backend/*`, `@shared/*`, `@database/*` (last two point at a `libs/` folder that doesn't exist yet).                                                                                                                                                  |
| `scripts/validate-ports.js`                                                                      | Pre-dev port check — but checks **3000/3001/5432/6379**, not the project's actual 3010/3012.                                                                                                                                                                                                                                                                                                                      |
| `scripts/docker-startup.ps1` / `.sh`                                                             | Large orchestration scripts for Docker-based startup.                                                                                                                                                                                                                                                                                                                                                             |
| `apps/backend/scripts/fix-deps.js`, `migrate.sh`, `validate-port.js`, `add-riddle-test-data.sql` | Backend build/migration helpers used by Dockerfile.dev and entrypoint.                                                                                                                                                                                                                                                                                                                                            |

### Root PowerShell/BAT helper scripts (all committed)

`start-servers-auto.ps1`, `start-servers-robust.ps1`, `stop-servers.ps1`, `server-manager.ps1` (start/stop/restart/status/fix/validate with strict port table 3010/3012), `monitor-servers.ps1`, `check-status.ps1`, `port-security-enforcer.ps1` (admin-only; reserves ports 3010/3012/5432/6379 via Windows excluded port ranges + firewall rules), `port-security-monitor.ps1`, `auto-start-servers.ps1`, `auto-connect-server.ps1`, `launch-servers.ps1`, `start-ai-quiz.bat`/`.sh`, `STOP.bat`.

### Repo hygiene artifacts present at root (untracked but on disk)

`backend.log`, `backend.err`, `backend_stderr.log`, `backend_stdout.log`, `docker_full.log`, `startup_debug.log`, `temp_crash.log`, `tsc-errors.log`, `.backend.pid`, `tsconfig.tsbuildinfo` (**tracked**), `login-details.json` (**tracked in git** — contains what its name implies; contents deliberately not reproduced).

## 2. What Is Done (implemented & working)

- **Backend production image**: root `Dockerfile` and `apps/backend/Dockerfile` produce a working multi-stage node:20-alpine image, non-root user, `DOCKER_ENV=true npm run build`, CMD `node dist/main.js`.
- **Dev orchestration**: `docker-compose.local.yml` reliably brings up Postgres 15 + Redis 7 with healthchecks and `depends_on: condition: service_healthy`; DEPLOYMENT.md's documented workflow (Dockerized DB/cache + npm-run backend/frontend) matches reality.
- **Deploy automation**: `deploy.ps1`/`deploy.sh` implement the full command surface (deploy, backup with pg_dump + 7-day retention, update = git pull → rebuild, clean) and health-check both services over HTTP.
- **Dokploy pipeline**: `dokploy-deploy.sh` handles container-name conflicts and redeploy; DEPLOYMENT.md documents the exact VPS paths and domains, so a documented, apparently-used production path exists.
- **Backend startup safety net**: `docker-entrypoint.sh` implements DB/Redis wait loops (30 retries × 2s) and optional migration run with `SKIP_MIGRATIONS` escape hatch.
- **Health endpoint**: `apps/backend/src/health/health.controller.ts` exposes Terminus checks (DB ping, heap/RSS memory, disk storage) plus liveness route; `deploy.ps1:160` polls `/api/health`.
- **Port management strategy**: consistent 4-port convention (3010 frontend / 3012 backend / 5432 PG / 6379 Redis) enforced across `.env`, `server-manager.ps1`, `port-security-enforcer.ps1`, `PORT-REFERENCE.md`, and `apps/backend/src/common/constants/ports.ts:18-27` (single source of truth reading `process.env.PORT`/`FRONTEND_PORT`).
- **Frontend prod image**: `apps/frontend/Dockerfile` correctly passes `NEXT_PUBLIC_API_URL` as a build ARG (required since it's inlined at build time) and drops to a non-root user.
- **Quality tooling wired into package.json**: husky + lint-staged, eslint/prettier configs, `type-check`, workspace-level test scripts.

## 3. What Is Partially Done / In Progress

- **Production hardening of docker-compose.prod.yml**: has no healthchecks, no `restart:` policies, no resource limits, and still carries `JWT_SECRET: your-secret-key-here-change-this-in-production` and `DB_PASSWORD: aiquiz_password` inline rather than sourcing from `.env.production` variables. It works, but secrets hygiene is incomplete.
- **Env var standardization**: three different naming schemes coexist — `.env.production.example` uses `POSTGRES_USER/PASSWORD/DB`, while backend code reads `DB_USERNAME/DB_PASSWORD/DB_DATABASE` (`database-config.ts:81-85`); `deploy.ps1:230` reads `POSTGRES_USER`/`POSTGRES_DB` from the env file for pg_dump. Partial bridging only.
- **Migration strategy**: `docker-entrypoint.sh` supports migrations and `migration:run` exists in backend package scripts, but prod compose sets `DB_SYNCHRONIZE: 'true'` (schema sync instead of migrations) — two competing approaches, migrations effectively bypassed in production.
- **Frontend standalone build**: `next.config.docker.js` exists with `output: 'standalone'` precisely to slim images, but the frontend Dockerfile doesn't use it and ships all of `node_modules` (~1GB+ images). Half-migrated.
- **Port validation**: `package.json:21` wires `predev` → `scripts/validate-ports.js`, so the mechanism exists, but the script validates wrong ports (3000/3001 vs actual 3010/3012).
- **Windows-first developer experience**: many overlapping start scripts (`start-servers-auto`, `start-servers-robust`, `launch-servers`, `auto-start-servers`, `server-manager`) — clearly iterated repeatedly; functionality overlaps heavily and none is designated canonical.

## 4. What Is Missing / Needs To Be Done

- **Secrets rotation & removal from git history**: `apps/backend/.env` (with JWT_SECRET, GOOGLE_CLIENT_SECRET, RESEND_API_KEY) and `login-details.json` are committed. Need: untrack them, purge git history (e.g., git-filter-repo), rotate every credential they contained. (Contents intentionally not printed.)
- **CI/CD**: there is no GitHub Actions/GitLab CI pipeline. No automated lint/typecheck/test/build gate before deploys; Dokploy deploys straight from git push.
- **Prod compose parameterization**: move `JWT_SECRET`, DB creds, CORS_ORIGIN out of `docker-compose.prod.yml` into env interpolation (`${VAR}`) backed by `.env.production`; add healthchecks and restart policies; set `DB_SYNCHRONIZE=false` and rely on migration flow.
- **Image size optimization**: adopt `output: 'standalone'` in the real `next.config.mjs`, prune backend runtime image (it currently copies full `src` and all root `node_modules` including devDependencies).
- **Consolidate compose files**: 4 compose files (root yml, local yml, prod yml, backend yml) with divergent postgres versions (15 vs 16), container names (`quiz-postgres` vs `ai-quiz-postgres`), and service names (`backend` vs `api`). Collapse to one base + overlays.
- **Wire or delete dead artifacts**: `docker-entrypoint.sh` (unreferenced), `next.config.docker.js` (unreferenced), `infrastructure/docker/docker-compose.yml` referenced by package.json but nonexistent, `libs/*` workspaces and tsconfig paths pointing at missing folders.
- **Log/junk cleanup + prevention**: remove root `*.log`, `.pid`, `tsc-errors.log`, `temp_crash.log`; extend `.gitignore` to cover `*.tsbuildinfo`, `login-details.json` patterns; add a CI check for committed secrets (gitleaks/trufflehog).
- **Monitoring/alerting**: nothing beyond manual `check-status.ps1`/`monitor-servers.ps1`; no uptime monitoring, log aggregation, or error tracking in prod (Sentry var exists in example but unused).
- **Backup restore procedure**: backups are scripted, but there is no documented restore test/runbook.

## 5. Known Issues, Bugs & Tech Debt (with file:line references where possible)

1. **Secrets committed to git** — `apps/backend/.env` and `login-details.json` appear in `git ls-files` output. Also root `.env` is tracked even though `.gitignore:10` lists `.env` (ignore added after tracking). Highest-severity issue.
2. **Wrong ports in predev validator** — `scripts/validate-ports.js:2` checks `[3000, 3001, 5432, 6379]`; project actually uses 3010/3012 (`PORT-REFERENCE.md`, `ports.ts:18-27`). The check gives false confidence and can pass while 3010/3012 are occupied.
3. **Hardcoded prod credentials/JWT secret** — `docker-compose.prod.yml` (backend environment block): `JWT_SECRET: your-secret-key-here-change-this-in-production`, `DB_PASSWORD: aiquiz_password`, `DB_SYNCHRONIZE: 'true'`. Schema-sync in production risks data loss on entity changes.
4. **Duplicate/conflicting compose stacks** — `apps/backend/docker-compose.yml` uses postgres:16-alpine, names `ai-quiz-postgres`/`ai-quiz-api`, and mounts `.:/app`; root compose uses postgres:15-alpine and `quiz-postgres`/`quiz-backend`. Running both collides on host ports 5432/6379/3012.
5. **Dead references in package.json** — `package.json:37-39` points `docker:up/down/build` at `infrastructure/docker/docker-compose.yml` which does not exist; `scan:code*` scripts reference `tsconfig.scanner.json` and `scripts/enterprise-code-scanner.ts`, and `fix*` reference `./scripts/auto-fix-errors.ps1` — none of these files exist in `scripts/` (only validate-ports.js and docker-startup.\* do). Running these npm scripts fails.
6. **Entrypoint never runs** — neither backend Dockerfile nor any compose file sets `ENTRYPOINT ["docker-entrypoint.sh"]`, so the DB-wait/migration logic in `apps/backend/docker-entrypoint.sh` is inert; prod relies solely on compose `depends_on` (which in prod compose has no conditions/healthchecks at all).
7. **Root Dockerfile duplicates apps/backend/Dockerfile** — identical builder+production stages maintained twice; drift risk (root one already lacks the middle `development` stage).
8. **Frontend dev server in every compose environment** — `Dockerfile.simple:10` runs `npm run dev`; both root compose files label this `NODE_ENV: development` while `deploy` docs imply Docker is prod-capable. The prod path does use `apps/frontend/Dockerfile`, but the easy-to-grab dev compose would silently ship a dev server.
9. **`deploy.ps1:230` env parsing fragility** — naive regex `'^([^#][^=]+)=(.*)$'` breaks on quoted values or `=` inside values when loading `.env.production` for pg_dump.
10. **Repo junk** — ~200KB of logs (`temp_crash.log` alone is 75KB), `.backend.pid`, and `tsconfig.tsbuildinfo` (1.25MB, tracked in git) pollute the working tree; `.gitignore:19-23` covers logs/pids but not `*.tsbuildinfo`.
11. **tsconfig paths to nowhere** — `tsconfig.json` defines `@shared/*` and `@database/*` aliases for `libs/shared`, `libs/database`; no `libs/` directory exists, and root `type-check` (`tsc --noEmit`) spans both apps under one config despite backend having its own tsconfig.
12. **`assistant-rules.md` staleness** — instructs running `.\port-validator.ps1` and references `.port-lock` / `port-allocation-plan.md`; neither file exists at repo root (the real tools are `port-security-enforcer.ps1` and `scripts/validate-ports.js`).

## 6. How It Works (summary)

Local development is Windows-centric and mostly **outside Docker for the apps**: `start-ai-quiz.bat` (or `npm run dev`, or any of the PowerShell launchers) boots the Next.js dev server on :3010 and NestJS on :3012 via npm, while PostgreSQL and Redis come from `docker-compose.local.yml` (`up -d postgres redis`). The `predev` hook attempts port validation, and `port-security-enforcer.ps1` can reserve the four canonical ports at the OS level (admin required) to stop other apps stealing them. Configuration flows from `apps/backend/.env` (runtime, ConfigService) and root `.env` (compose/tooling); `apps/backend/src/common/constants/ports.ts` centralizes port constants with env overrides.

For production, the project targets a Dokploy-managed VPS: a git push triggers `dokploy-deploy.sh`, which force-cleans stale containers and runs `docker compose -f docker-compose.prod.yml up -d --build`. That file builds the backend from the multi-stage `apps/backend/Dockerfile` (non-root, dist-only CMD) and the frontend from `apps/frontend/Dockerfile` (Next.js build with `NEXT_PUBLIC_API_URL` baked in as an ARG). No ports are published on prod; a reverse proxy fronts quiz.profitbenefit.com and api.profitbenefit.com. Manual operation goes through `deploy.ps1`/`deploy.sh`, which wrap compose commands and add pg_dump backups (7-day retention) and HTTP health checks against `/api/health` (Terminus: DB ping + memory + disk). The intended-but-unwired `docker-entrypoint.sh` shows the desired startup contract: wait for DB/Redis → migrate → exec app.

## 7. Recommended Process To Proceed (prioritized step-by-step action plan)

1. **Security incident response (day 0)**: untrack `login-details.json`, `apps/backend/.env`, and root `.env` (`git rm --cached`); purge history with git-filter-repo; rotate JWT secret, Google OAuth client secret, Resend API key, DB passwords; add gitleaks to CI.
2. **Fix .gitignore gaps**: add `*.tsbuildinfo`, `*.pid`, `backups/`, `login-details.json`; commit the ignore change.
3. **Parameterize prod compose**: replace inline `JWT_SECRET`/DB password/`CORS_ORIGIN` with `${VAR:-}` interpolation from `.env.production`; set `DB_SYNCHRONIZE=false`; add healthchecks + `restart: unless-stopped`; verify `.env.production.example` key names match what code reads (`DB_*`, not just `POSTGRES_*`).
4. **Pick one migration path**: wire `docker-entrypoint.sh` into the backend Dockerfiles (`ENTRYPOINT`) OR drop it; keep migrations, retire schema-sync in prod.
5. **Consolidate Docker assets**: delete `apps/backend/docker-compose.yml` (or make it the single dev overlay), deduplicate root `Dockerfile` vs `apps/backend/Dockerfile`, either wire `next.config.docker.js` + standalone output into the frontend Dockerfile or delete it.
6. **Repair package.json scripts**: fix/remove `docker:up|down|build` (missing infrastructure file), `scan:code*`, `fix*` (missing scripts), and correct `validate-ports.js` to check 3010/3012 (+5432/6379).
7. **Add CI**: a minimal pipeline — install → lint → type-check per workspace → unit tests → docker build both images on PR; deploy job gated on main.
8. **Clean the tree**: delete root logs/pid/tsbuildinfo files; move future logs into `logs/` (ignored) or rely on docker logging drivers.
9. **Slim images**: multi-stage prune of backend `node_modules` (prod deps only), standalone Next output, drop `src` copy from runtime stage.
10. **Runbook**: document backup _restore_, rollback (`docker compose down` + previous tag), and health-check expectations in DEPLOYMENT.md; designate ONE canonical launcher script and archive the rest of the PowerShell variants into a `scripts/legacy/` folder.
