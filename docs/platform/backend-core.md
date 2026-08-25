# Backend Platform Core (config, database, common, settings, health, bootstrap)

Cross-cutting backend infrastructure shared by all feature modules. Complements `devops-deployment.md` (which covers Docker/ports/deploy). Backend paths relative to `apps/backend/src/`.

## 1. Scope & File Inventory

| File                                                   | Purpose                                                                                                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.ts`                                              | Bootstrap: helmet, 50mb JSON limit, CORS, global ValidationPipe (whitelist+transform), `/api` prefix + **URI versioning default v1**, Swagger at `/api/docs` (dev only)          |
| `app.module.ts`                                        | ConfigModule(global, `.env`), TypeORM async factory (`getOrThrow` for DB creds, `synchronize` only via env flag), registers all 10 feature modules + global filter & interceptor |
| `config/settings.ts`                                   | Static defaults object (pagination, cache TTLs, per-module emoji/difficulty/timer presets) consumed by SettingsService                                                           |
| `database/database-config.ts`                          | Env-validated DataSource factories (runtime / CLI / seed; seed blocked in production)                                                                                            |
| `database/data-source.ts`                              | CLI migration data-source used by `migration:*` npm scripts                                                                                                                      |
| `database/create-admin.ts`, `seed-*.ts`                | Admin bootstrap + question seeding scripts (dev-only)                                                                                                                            |
| `migrations/`                                          | 4 migrations: AddQuestionTypeAndCorrectLetter, AddQuizIndexes, AddRiddleCategories, AddRiddleMcqIndexes                                                                          |
| `common/cache/cache.service.ts`                        | ioredis wrapper: get/set(setex)/del/getTTL/delPattern with error-swallowing fallback                                                                                             |
| `common/services/bulk-action.service.ts` (+strategies) | Shared publish/unpublish/trash/delete executor for all content modules                                                                                                           |
| `common/services/email.service.ts`                     | Resend integration; logs-only when RESEND_API_KEY missing; password-reset HTML template                                                                                          |
| `common/guards/admin.guard.ts`, `roles.guard.ts`       | Two overlapping admin checks (see §3.4)                                                                                                                                          |
| `common/filters/http-exception.filter.ts`              | Global exception → JSON envelope                                                                                                                                                 |
| `common/interceptors/logging.interceptor.ts`           | Global request logging                                                                                                                                                           |
| `common/constants/app.constants.ts`                    | Ports, pool size, cache TTLs, memory/disk thresholds, page sizes                                                                                                                 |
| `settings/`                                            | SystemSetting entity + service merging DB overrides over static defaults (prototype-pollution guard on `__proto__` keys) + controller                                            |
| `health/health.controller.ts`                          | Terminus checks: DB ping, heap/RSS, disk (Windows-aware path); liveness + readiness routes                                                                                       |

## 2. What Is Done (implemented & working)

- **Secure-by-default DB config**: runtime requires env vars via `getOrThrow` (`app.module.ts:57-61`); CLI config validates and reports missing vars (`database-config.ts:22-38`); seeding hard-blocked in production.
- **Bootstrap hardening**: helmet, CORS allow-list from env, payload cap for bulk imports, global ValidationPipe with `whitelist` + `forbidNonWhitelisted` (`main.ts:44-52`).
- **API surface discipline**: `/api` prefix + URI v1 versioning matches frontend client which appends `/v1` (`apps/frontend/src/lib/api-client.ts:16-18`); Swagger only outside production.
- **Settings system**: DB overrides layered over typed defaults with deep clone, forbidden-key protection, graceful fallback when table absent (`settings.service.ts:32-40`).
- **Shared bulk-action infrastructure** reused by quiz, riddle-mcq, dad-jokes, image-riddles — avoids per-module duplication.
- **Health checks** cover DB/memory/disk with platform-aware disk path and K8s-style liveness/readiness split.

## 3. Issues / Gaps Found

1. **No global JwtAuthGuard (APP_GUARD)** — auth is opt-in per route. Any new controller without explicit guards is silently public. Default-deny via global guard + `_Public()` decorator is the safer posture (decorator already exists and is honored by the guard).
2. **No rate limiting infrastructure**: `@nestjs/throttler` is a dependency and controllers use `@Throttle()`, but ThrottlerModule is never imported and no ThrottlerGuard APP_GUARD is registered — decorators are inert (detail in `../features/auth-users.md` §3.2).
3. **Migrations vs synchronize drift**: runtime relies on `DB_SYNCHRONIZE=true` in dev while 4 migrations exist; data-source comments admit "no explicit migrations required" — schema parity between environments depends on humans running them.
4. **Duplicate guard semantics**: `AdminGuard` (role check) vs `RolesGuard` (reads `@Roles()` metadata) — modules inconsistently pick one; consolidate into RolesGuard everywhere.
5. **Redis is a hard startup dependency**: CacheService constructs ioredis eagerly; if Redis is down every cache call logs errors and content endpoints still work, but nothing surfaces connection state to health checks (Terminus doesn't ping Redis).
6. **`config/settings.ts` contains mojibake emoji strings** (`dY~,`, `dYc`) from an encoding accident — these propagate as category emoji defaults.
7. **CORS origin is single-valued** (`main.ts` enableCors) — no array support for preview deployments.

## 4. What Is Missing / Needs To Be Done

1. Register global JwtAuthGuard + ThrottlerGuard as APP_GUARDs; annotate genuinely public routes with `_Public()`.
2. Add Redis ping to health check; decide degrade-vs-fail policy.
3. Adopt migrations as the only schema path: set `DB_SYNCHRONIZE=false` even in dev, generate a baseline migration from current schema.
4. Fix mojibake defaults in settings.ts (file encoding) and add a lint rule/test guarding UTF-8.
5. Support comma-separated CORS_ORIGIN list.
6. Consolidate guards; document the auth model (who guards what) in one place — this file's endpoint maps in sections 04/05/06 already expose inconsistencies.

## 5. Process To Proceed

1. Land the APP_GUARD change behind a smoke test of every public route (home page subjects, riddles, jokes, image-riddles, quiz public reads, auth routes, health) — any 401 regression means a missed `_Public()`.
2. Then throttler activation with conservative limits.
3. Migration-baseline work last (needs a maintenance window for dev DBs).
