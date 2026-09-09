# AI Quiz Platform

Full-stack quiz platform: **Next.js 15** frontend + **NestJS 10** backend with
PostgreSQL (TypeORM), Redis, JWT auth (email + Google OAuth), and a built-in
admin panel for content management (MCQ quizzes, riddles, dad jokes, image
riddles) with bulk CSV/JSON import.

## Monorepo layout

```
apps/frontend   Next.js 15 (App Router) — port 3010
apps/backend    NestJS 10 API — port 3012 (API prefix /api/v1)
plan/           architecture & feature plans, content import sets
```

## Requirements

- Node.js 20 (see `.nvmrc`), npm 9+
- Docker (for Postgres + Redis in development)

## Getting started

```bash
npm install

# configure environment (both files exist as working defaults in dev;
# NEVER commit real secrets)
cp .env .env.local        # optional per-developer overrides
# apps/backend/.env holds DB/Redis/JWT/OAuth config for the API

npm run dev               # runs frontend + backend concurrently
```

- Frontend: http://localhost:3010
- API: http://localhost:3012/api/v1
- Swagger: http://localhost:3012/api/docs
- Health: http://localhost:3012/api/v1/health

Create an admin account:

```bash
npm run create-admin --workspace=apps/backend
```

## Scripts (root)

| Script               | What it does                         |
| -------------------- | ------------------------------------ |
| `npm run dev`        | frontend + backend in watch mode     |
| `npm run build`      | build both workspaces                |
| `npm test`           | unit tests (jest) in both workspaces |
| `npm run lint`       | eslint across the repo               |
| `npm run type-check` | tsc --noEmit in both workspaces      |

## Error tracking

Client errors (window errors, unhandled rejections, error boundaries) and API
failures are reported as first-party analytics events (`client_error`,
`api_failed`) via `apps/frontend/src/lib/error-tracking.ts` into the backend
`analytics` module, viewable on the admin dashboard. Server-side errors go
through winston + the global exception filter.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md). Production runs via
`docker-compose.prod.yml` — all secrets come from an untracked `.env` next to
it (`POSTGRES_PASSWORD`, `JWT_SECRET`, `REDIS_PASSWORD`; generate with
`openssl rand -base64 48`).

Security notes:

- Schema changes in production go **only** through TypeORM migrations
  (`DB_SYNCHRONIZE` must stay `false`; the backend refuses to boot otherwise).
- Behind a reverse proxy set `TRUST_PROXY=true` so rate limiting and
  brute-force lockout see real client IPs.
- Hosted Postgres: set `DB_SSL=true` (and `DB_SSL_REJECT_UNAUTHORIZED=false`
  only for self-signed certs).
- Frontend image hosts are allowlisted via `NEXT_PUBLIC_IMAGE_HOSTS`
  (comma-separated hostnames).
