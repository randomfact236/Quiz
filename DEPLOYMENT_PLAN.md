# Quiz App Deployment Plan

## Overview
Next.js + NestJS quiz app deployed via Dokploy Docker Compose stack.

**Domains:**
- Frontend: https://quiz.profitbenefit.com
- Backend API: https://api.profitbenefit.com

## Architecture
```
Internet → Cloudflare → VPS (Dokploy) → Docker Network
                                        ├── postgres (DB)
                                        ├── redis (Cache)
                                        ├── backend (NestJS :3001)
                                        └── frontend (Next.js :3000)
```

## Quick Deploy Commands

### Restart all services
```bash
cd /etc/dokploy/compose/quiz-stack-gz5jv5/code && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d
```

### View logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Create admin account
```bash
docker exec quiz-backend npm run create-admin -- --email=admin@aiquiz.com --password=admin123
```

### Rebuild without cache
```bash
docker compose -f docker-compose.prod.yml build --no-cache && docker compose -f docker-compose.prod.yml up -d
```

## Development Workflow

### Local Development (IDE + Node.js)
1. Clone repo: `git clone https://github.com/YOUR_REPO`
2. `npm install`
3. Create `.env` with local database connection
4. `npm run dev`
5. Open `localhost:3000`
6. Push to GitHub → Dokploy auto-deploys

### Production Deployment (VPS via PuTTY/Dokploy)
1. Push code to GitHub
2. Dokploy detects push → builds Docker images
3. Containers restart with new code

## Database Schema
- **PostgreSQL** handles all persistent data
- **Redis** handles caching and session data
- `DB_SYNCHRONIZE=true` auto-creates tables on schema changes

## Security Notes
- PostgreSQL connection uses `ssl: false` inside Docker network
- User registration is DISABLED - admin accounts via CLI only
- Registration endpoint removed from auth controller

## Troubleshooting

### Build fails
- Check Dockerfile paths are correct
- Verify `apps/backend/Dockerfile` and `apps/frontend/Dockerfile` exist

### DB connection fails
- Verify `ssl: false` in `database-config.ts`
- Check `DB_HOST=postgres` in docker-compose

### Frontend 502 errors
- Check backend is up: `docker compose -f docker-compose.prod.yml ps`
- Verify `ALLOWED_ORIGINS` includes `quiz.profitbenefit.com`

### Container naming
- `quiz-postgres` - PostgreSQL database
- `quiz-redis` - Redis cache
- `quiz-backend` - NestJS API
- `quiz-frontend` - Next.js frontend
