# Port Configuration Guide

## Overview

This document explains how ports are configured in the AI Quiz application and how to change them in the future.

## Centralized Port Configuration

All port numbers are defined in **ONE** location:

### For Backend (NestJS)
**File:** `apps/backend/src/common/constants/ports.ts`

```typescript
/** Backend API Server Port */
export const BACKEND_PORT = parseInt(process.env.PORT || '3012', 10);

/** Frontend Port (Next.js) */
export const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '3010', 10);

/** Database Port */
export const DATABASE_PORT = parseInt(process.env.DATABASE_PORT || '5432', 10);

/** Redis Port */
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
```

### For Frontend (Next.js)
**File:** `apps/frontend/next.config.mjs` and `apps/frontend/next.config.docker.js`

```javascript
const API_PORT = process.env.NEXT_PUBLIC_API_PORT || '3012';

module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || `http://localhost:${API_PORT}/api`,
  },
};
```

---

## How to Change All Ports (Single Point of Change)

### Method 1: Environment Variables (Recommended)

Set environment variables before running the application:

```bash
# Unix/Linux/Mac
export PORT=3012
export NEXT_PUBLIC_API_PORT=3012

# Windows (CMD)
set PORT=3012
set NEXT_PUBLIC_API_PORT=3012

# Windows (PowerShell)
$env:PORT="3012"
$env:NEXT_PUBLIC_API_PORT="3012"
```

### Method 2: Edit the Central Port File

To change the default port, edit **only** `apps/backend/src/common/constants/ports.ts`:

```typescript
// Change this line for the backend:
export const BACKEND_PORT = parseInt(process.env.PORT || '3013', 10);

// Change this line for the frontend API port:
export const FRONTEND_PORT = parseInt(process.env.FRONT3013', END_PORT || '10);
```

---

## Port Assignment

| Port | Service | Config File |
|------|---------|-------------|
| 3010 | Frontend (Next.js Dev) | `next.config.mjs` |
| 3012 | Backend API (NestJS) | `ports.ts` |
| 4000 | Alternative API | `ports.ts` |
| 5432 | PostgreSQL | `docker-compose.yml` |
| 6379 | Redis | `docker-compose.yml` |

---

## Files That Use Ports

The following files reference ports. They are configured to read from environment variables or the central config:

### Backend
- `apps/backend/src/common/constants/ports.ts` ← **PRIMARY CONFIG**
- `apps/backend/src/common/constants/app.constants.ts` ← imports from ports.ts
- `apps/backend/src/main.ts` ← uses SERVER_PORT from app.constants
- `apps/backend/.env` ← PORT variable
- `apps/backend/Dockerfile` ← ENV PORT
- `apps/backend/docker-compose.yml` ← PORT environment

### Frontend
- `apps/frontend/next.config.mjs` ← reads from env variable
- `apps/frontend/next.config.docker.js` ← reads from env variable
- `apps/frontend/.env.local` ← NEXT_PUBLIC_API_URL
- `apps/frontend/src/lib/api-client.ts` ← reads from env variable

### Infrastructure
- `docker-compose.yml` ← uses ${PORT} or hardcoded
- `docker-compose.prod.yml` ← uses ${PORT}
- `.port-lock` ← port reservation file

### Scripts
- `scripts/validate-ports.js` ← validates port availability
- `apps/backend/scripts/validate-port.js` ← validates port for backend
- `start-dev.bat`, `start-ai-quiz.bat`, etc. ← display messages

---

## Docker Configuration

For Docker, ports are set via environment variables:

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - PORT=3012    # Change here
    ports:
      - "3012:3012" # Change here
```

Or use `.env` file:

```bash
# .env
PORT=3012
```

---

## Verification

After changing ports, verify by:

1. Check the backend is running: `curl http://localhost:3012/api/health`
2. Check the frontend: `curl http://localhost:3010`
3. Check Docker: `docker ps` to see port mappings

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr 3012

# Linux/Mac
lsof -i :3012
```

### Clear Port Conflicts
Stop the service using the port or choose a different port in `ports.ts`.
