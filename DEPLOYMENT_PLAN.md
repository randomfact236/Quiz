# Quiz App Deployment Plan

## Overview
Next.js + NestJS quiz app deployed via Dokploy Docker Compose stack.

**Domains:**
- Frontend: https://quiz.profitbenefit.com
- Backend API: https://api.profitbenefit.com

**Stack:**
- Frontend: Next.js (port 3010 internal)
- Backend: NestJS (port 3012 internal)
- Database: PostgreSQL 15 (port 5432 internal)
- Cache: Redis 7 (port 6379 internal)

## Architecture
```
Internet → Cloudflare → VPS (Dokploy) → Docker Network (quiz-network)
                                              ├── postgres:5432
                                              ├── redis:6379
                                              ├── backend:3012
                                              └── frontend:3010
```

## Quick Deploy Commands (PuTTY)

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

## Database Commands

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

## Create Admin via CLI (npm)
```bash
docker exec quiz-backend sh -c "cd /app/apps/backend && npm run create-admin -- --email=admin@aiquiz.com --password=admin123"
```

## Development Workflow

### Local Development (IDE only - no Docker)
1. Clone repo: `git clone https://github.com/randomfact236/Quiz.git`
2. `npm install`
3. Create `.env` with local database connection (optional - for backend changes)
4. `npm run dev`
5. Open `localhost:3000`
6. Push to GitHub → Dokploy auto-deploys

### Production Deployment (GitHub → Dokploy)
1. Push code to GitHub (main branch)
2. Dokploy detects push → builds Docker images
3. Containers restart with new code

## Docker Image Cache Issue

**IMPORTANT:** Docker layers may cache old code even after rebuild. If code changes don't appear:
1. Use `docker rm -f` to delete containers before `docker compose up -d`
2. Or in Dokploy dashboard: use "Force Redeploy" option

## Database Credentials
```
DB_HOST: postgres
DB_PORT: 5432
DB_USERNAME: aiquiz
DB_PASSWORD: aiquiz_password
DB_DATABASE: aiquiz
```

## Troubleshooting

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

## Security Notes
- PostgreSQL connection uses `ssl: false` inside Docker network
- User registration is DISABLED - admin accounts via CLI only
- Registration endpoint removed from auth controller

## Container Names
- `quiz-postgres` - PostgreSQL 15 Alpine
- `quiz-redis` - Redis 7 Alpine
- `quiz-backend` - NestJS API
- `quiz-frontend` - Next.js Frontend

## Docker Compose Services
All services run on `quiz-network` bridge network and reference each other by service name (not localhost).
