# AI Quiz Platform - Deployment Guide

## Overview

Next.js + NestJS quiz app with local-first development, VPS for production only.

**Domains:**
- Production Frontend: https://quiz.profitbenefit.com
- Production API: https://api.profitbenefit.com

---

## Architecture

```
┌─────────────────────────────────────────────────────┐      ┌─────────────────────────────┐
│  LOCAL MACHINE (Development)                         │      │  VPS PRODUCTION (Dokploy)   │
│                                                     │      │                             │
│  ┌─────────────────────────────────────────────┐    │      │  Live site                  │
│  │  Docker: PostgreSQL :5432, Redis :6379      │    │      │  quiz.profitbenefit.com     │
│  └─────────────────────────────────────────────┘    │      │                             │
│                                                     │      │  Auto-deploy on git push    │
│  npm run start:dev  →  localhost:3012 (Backend)      │─────▶│                             │
│  npm run dev        →  localhost:3010 (Frontend)     │      │                             │
│                                                     │      │                             │
│  RAM usage: ~4-7 GB                                 │      │                             │
└─────────────────────────────────────────────────────┘      └─────────────────────────────┘
```

---

## Development Setup

| Component | Running On | How |
|-----------|------------|-----|
| PostgreSQL | Docker (localhost:5432) | `docker-compose.local.yml` |
| Redis | Docker (localhost:6379) | `docker-compose.local.yml` |
| Backend | npm (localhost:3012) | `npm run start:dev` |
| Frontend | npm (localhost:3010) | `npm run dev` |

---

## Local Development Commands

### Start Databases (Docker)
```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.local.yml up -d postgres redis

# Verify they're running
docker ps
```

### Start Development Servers
```bash
# Terminal 1 - Backend
cd apps/backend && npm run start:dev

# Terminal 2 - Frontend
cd apps/frontend && npm run dev

# View at localhost:3010
```

### Stop Databases (when done)
```bash
docker-compose -f docker-compose.local.yml down
```

### Production
```bash
git push origin main
# Dokploy auto-deploys
```

---

## Key Points

| Aspect | Decision |
|--------|----------|
| Staging | **Not needed** - local test sufficient |
| Browser location | **Your choice** - same result |
| Local databases | **Docker** (PostgreSQL + Redis) |
| Apps | **npm** (backend: start:dev, frontend: dev) |
| Production | **VPS only** - already configured |

---

## Production VPS Commands (Dokploy)

### Recommended Deploy Command (prevents container conflicts)
```bash
cd /etc/dokploy/compose/quiz-stack-gz5jv5/code && docker rm -f quiz-frontend quiz-backend quiz-postgres quiz-redis 2>/dev/null || true && docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
```

### Or use the dedicated script (after pulling latest code)
```bash
cd /etc/dokploy/compose/quiz-stack-gz5jv5/code && chmod +x dokploy-deploy.sh && ./dokploy-deploy.sh
```

### Full restart (delete + recreate)
```bash
cd /etc/dokploy/compose/quiz-stack-gz5jv5/code && docker rm -f quiz-postgres quiz-redis quiz-backend quiz-frontend && docker compose -f docker-compose.prod.yml up -d
```

### View logs
```bash
cd /etc/dokploy/compose/quiz-stack-gz5jv5/code && docker compose -f docker-compose.prod.yml logs -f
```

### View backend logs only
```bash
docker logs quiz-backend --tail=50
```

### Restart single service
```bash
docker restart quiz-backend
```

### Recreate containers with fresh images
```bash
cd /etc/dokploy/compose/quiz-stack-gz5jv5/code && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d
```

---

## Database Commands (VPS)

### Connect to PostgreSQL
```bash
docker exec -it quiz-postgres psql -U aiquiz -d aiquiz
```

### List tables
```bash
docker exec quiz-postgres psql -U aiquiz -d aiquiz -c "\dt"
```

### Create admin via SQL (if npm create-admin fails)
```bash
docker exec quiz-postgres psql -U aiquiz -d aiquiz -c "INSERT INTO users (email, password, name, role, \"createdAt\", \"updatedAt\") VALUES ('admin@aiquiz.com', '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAF3Dj/T1LGS', 'Admin User', 'admin', NOW(), NOW());"
```
Password: `admin123`

### Reset database (delete and recreate)
```bash
docker exec quiz-postgres dropdb -U aiquiz aiquiz && docker exec quiz-postgres createdb -U aiquiz aiquiz && docker restart quiz-backend
```

### Create Admin via CLI (npm)
```bash
docker exec quiz-backend sh -c "cd /app/apps/backend && npm run create-admin -- --email=admin@aiquiz.com --password=admin123"
```

---

## Database Credentials (VPS)
```
DB_HOST: postgres
DB_PORT: 5432
DB_USERNAME: aiquiz
DB_PASSWORD: aiquiz_password
DB_DATABASE: aiquiz
```

---

## Container Names (VPS)
- `quiz-postgres` - PostgreSQL 15 Alpine
- `quiz-redis` - Redis 7 Alpine
- `quiz-backend` - NestJS API
- `quiz-frontend` - Next.js Frontend

---

## Services (VPS)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Frontend | Node 20 Alpine | 3010 | Next.js App |
| Backend | Node 20 Alpine | 3012 | NestJS API |
| Database | Postgres 15 Alpine | 5432 | Data storage |
| Cache | Redis 7 Alpine | 6379 | Session & cache |

---

## Troubleshooting

### Login fails locally
1. **Check if PostgreSQL is running:**
   ```bash
   # If using Docker:
   docker ps | grep postgres
   
   # Or test connection:
   psql -U aiquiz -d aiquiz -h localhost
   ```

2. **Check if Redis is running:**
   ```bash
   # If using Docker:
   docker ps | grep redis
   
   # Or test:
   redis-cli ping
   ```

3. **Create admin account (if no admin exists):**
   ```bash
   cd apps/backend && npm run create-admin -- --email=admin@aiquiz.com --password=admin123
   ```

4. **Check backend logs for errors:**
   ```bash
   cd apps/backend && npm run start:dev
   # Look for Redis/Postgres connection errors
   ```

### "Failed to fetch" on frontend
- Backend may be down: `docker ps`
- Check backend logs: `docker logs quiz-backend`
- Verify `CORS_ORIGIN` includes frontend domain

### Build fails
- Check Dockerfile paths: `apps/backend/Dockerfile`, `apps/frontend/Dockerfile`
- Verify docker-compose.prod.yml context is correct

### DB connection fails
- Verify `DB_SSL: 'false'` in docker-compose (required for Docker networking)
- Check `DB_HOST=postgres` (service name, not localhost)
- Verify database container is running

### Frontend 502 errors
- Backend may be starting up - wait 10 seconds
- Check backend health: `docker logs quiz-backend`
- Verify `ALLOWED_ORIGINS` includes `quiz.profitbenefit.com`

### Docker layers caching old code
- The build process caches npm install and COPY layers
- For fresh rebuild: delete containers, then `docker compose -f docker-compose.prod.yml up -d --build`

### Local "Works but prod doesn't" issues
- Run `docker-compose.local.yml` to validate before big changes
- Test migrations in local Docker first
- Clear Redis cache if caching behavior differs

---

## Security Notes (VPS)
- PostgreSQL connection uses `ssl: false` inside Docker network
- User registration is DISABLED - admin accounts via CLI only
- Registration endpoint removed from auth controller

---

## Health Checks (VPS)

| Service | Check | Interval |
|---------|-------|----------|
| PostgreSQL | `pg_isready` | 10s |
| Redis | `redis-cli ping` | 10s |
| Backend | HTTP GET `/api/health` | 30s |
| Frontend | HTTP GET `/` | 30s |

---

## Backup & Restore (VPS)

### Manual Backup
```bash
docker exec quiz-postgres pg_dump -U aiquiz aiquiz > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup
```bash
docker exec -i quiz-postgres psql -U aiquiz -d aiquiz < backups/backup_YYYYMMDD_HHMMSS.sql
```

---

## Direct VPS Push

| Edit Type | Safe to Push Direct? |
|-----------|---------------------|
| Text/spelling fix | ✅ Yes |
| Color change | ✅ Yes |
| Minor CSS adjustment | ✅ Yes |
| Console.log addition | ✅ Yes |
| Comment added | ✅ Yes |
| Single line fix | ✅ Yes |
| Typo fix | ✅ Yes |

| Edit Type | Test First (Local Docker) |
|-----------|--------------------------|
| Database schema change | ❌ Required |
| New API endpoint | ❌ Required |
| Authentication change | ❌ Required |
| Payment logic | ❌ Required |
| Big refactor | ❌ Required |
| Migration files | ❌ Required |
| New dependency added | ❌ Required |

---

## Bottom Line

- **Start Docker** for databases (PostgreSQL + Redis)
- **Start npm** for apps (backend + frontend)
- **Develop locally** with full stack running
- **Test at** localhost:3010
- **Push to production** when ready
- **No staging** - unnecessary for solo development
- **Small edits** → safe to push direct to VPS
- **Big changes** → validate locally first
