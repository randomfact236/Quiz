# Testing, Quality & Tooling (whole repo)

Verification infrastructure: unit/e2e tests, lint/format, type-checking, quality gates, utility scripts, CI. Covers both apps and the root workspace.

## 1. Inventory & Current State

| Area | Config / Location | State |
|---|---|---|
| Backend unit tests | `apps/backend/package.json` jest config (rootDir src, `*.spec.ts`) + `@nestjs/testing` | **Config exists; 0 spec files** (verified by recursive search) |
| Backend e2e tests | `test:e2e` script → `./test/jest-e2e.json` | **Broken**: no `test/` directory exists |
| Frontend unit tests | `test` script → jest; devDeps @testing-library/* installed | **No jest config block in package.json, no jest.config, 0 test files** — `npm test` finds nothing/fails |
| Frontend e2e | `test:e2e` → playwright; @playwright/test installed | **No playwright.config.ts, no tests dir** — script fails |
| Root test orchestration | root `package.json` `test`/`test:coverage` via workspaces | Propagates the emptiness |
| Lint | root eslint 8 + `.eslintrc.json`; frontend `next lint --max-warnings=1000`; backend eslint with `--fix` baked into `lint` script | Present; frontend threshold of 1000 warnings effectively silences lint |
| Format | prettier + husky + lint-staged configured at root | `.husky/` directory is **empty** — hooks not installed (`npx husky` never run); pre-commit protection absent |
| Type-check | root `type-check: tsc --noEmit`, frontend same | Errors recorded in logs (see §2) |
| Quality scanner | `scan:code*` / `quality:gate` scripts → `scripts/enterprise-code-scanner.ts` | **Script does not exist** (only validate-ports.js, docker-startup.* in scripts/) — all scan commands fail; likely also missing `tsconfig.scanner.json` |
| Port validation | `scripts/validate-ports.js` + per-app copies run as predev/prestart | Works; part of the 4-port convention (see `devops-deployment.md`) |
| DB utilities | backend scripts: `validate-port.js`, `fix-deps.js` (postinstall), `migrate.sh`; SQL file `add-riddle-test-data.sql` | Present |
| CI/CD | `.github/workflows`, gitlab-ci etc. | **None found** |

## 2. Recorded Error State (stale-log caveat)

`tsc-errors.log` (root) lists ~12 TypeScript errors, all frontend riddle-mcq related:

- Missing exports from `lib/riddle-mcq-api`: `getAllRiddleMcqsAdmin` (admin page.tsx:292, RiddleMcqSection.tsx:473), `getChaptersBySubject`, `getAllChapters`, `getRiddlesByChapter`.
- `RiddlesStats` type missing `totalChapters` vs local state shape (riddle-mcq/page.tsx:24).
- Several implicit-any parameters.

These match files touched in recent git history, so they may be partially stale — but they were never verified fixed (no log of a clean pass). Other stale artifacts: `backend.log/.err`, `backend_stdout/_stderr.log`, `startup_debug.log`, `temp_crash.log`, `docker_full.log`, per-app `tsc*.log`, `lint.log`, `server.log`, plus committed `tsconfig.tsbuildinfo` files. `apps/frontend/code-review-issues.md` tracks older review findings.

## 3. What Is Done

- Dependency wiring for a full quality stack is *installed*: jest/ts-jest/@nestjs/testing, testing-library, Playwright, eslint/prettier/husky/lint-staged, port validators.
- Workspace-level orchestration scripts exist for every concern (test/lint/type-check/coverage).
- Port-safety automation (predev validation + PowerShell enforcers) is genuinely wired and functional.
- Enterprise scanner *concept* documented in root scripts (thresholds, compare mode).

## 4. What Is Broken / Missing

1. **Zero automated tests in the entire repository** — no unit, integration, or e2e test exists despite complete tooling being installed. Highest-priority gap.
2. Both e2e entry points are broken references (missing configs/dirs).
3. Husky hooks not installed → lint-staged never runs → commits can reintroduce lint/type errors unchecked.
4. Quality-gate commands (`quality:gate`, `scan:code`) reference a nonexistent scanner script.
5. No CI pipeline to enforce anything on push/PR.
6. No coverage thresholds configured anywhere.
7. Repo hygiene: ~10 log files + tsbuildinfo artifacts at root/app level should be gitignored/cleaned.

## 5. Recommendations (priority order)

1. **Fix tooling first** (cheap): remove or implement scanner scripts; add minimal `jest.config.ts` to frontend; create `test/jest-e2e.json` or delete the scripts; install husky (`npx husky init`) with lint-staged.
2. **Seed critical-path tests**: AuthService (lockout/enumeration/reset), QuizService bulk import + filter counts, api-client refresh retry. Target the bug hotspots identified in sections 04–07.
3. Add one Playwright smoke spec: home → quiz play → results, against dockerized deps.
4. Stand up GitHub Actions: type-check + lint + backend tests (+ FE build) per PR; add coverage report, then thresholds (suggest 40% lines initially on backend services).
5. Clean stale logs/tsbuildinfo from working tree and extend `.gitignore`.

## 6. Process To Proceed

1. Week 1: tooling fixes + first 10 unit tests + CI skeleton.
2. Week 2: service-layer coverage for auth + quiz modules; fix any bugs surfaced (several known bugs in `05`/`06` docs make ideal first regression tests).
3. Ongoing: require green CI before merge; grow coverage with each feature PR rather than a big-bang push.

