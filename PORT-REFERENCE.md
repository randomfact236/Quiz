# AI Quiz Platform - Port Reference Assistant

**Version:** 1.0  
**Last Updated:** 2026-03-08  
**Project:** AI Quiz Platform (NestJS + Next.js + PostgreSQL + Redis)

---

## 📋 Quick Reference

| Port | Service | Status | Purpose |
|------|---------|--------|---------|
| **3010** | Frontend (Next.js) | ✅ Active | Main frontend development server |
| **3012** | Backend API (NestJS) | ✅ Active | REST API server |
| **5432** | PostgreSQL | ✅ Active | Primary database |
| **6379** | Redis | ✅ Active | Cache layer |

---

## ✅ Active Ports (Required)

### Port 3010 - Frontend (Next.js)

- **Service**: AI Quiz Frontend (Next.js 15)
- **Protocol**: HTTP
- **Access URL**: http://localhost:3010
- **Environment Variable**: `FRONTEND_PORT`
- **Configuration Files**:
  - `.env`: `FRONTEND_PORT=3010`
  - `apps/backend/src/common/constants/ports.ts`: `FRONTEND_PORT`
- **Docker Compose**: `docker-compose.yml`, `apps/backend/docker-compose.yml`
- **Purpose**: Serves the React-based web application UI

---

### Port 3012 - Backend API (NestJS)

- **Service**: AI Quiz Backend API (NestJS 10)
- **Protocol**: HTTP
- **Access URL**: http://localhost:3012/api
- **Environment Variable**: `PORT`, `BACKEND_PORT`
- **Configuration Files**:
  - `.env`: `BACKEND_PORT=3012`
  - `apps/backend/src/common/constants/ports.ts`: `BACKEND_PORT`
  - `apps/backend/src/main.ts`: Uses `SERVER_PORT`
- **Docker Compose**: `docker-compose.yml`, `apps/backend/docker-compose.yml`
- **Purpose**: Serves REST API endpoints for quiz functionality

---

### Port 5432 - PostgreSQL Database

- **Service**: PostgreSQL 15/16
- **Protocol**: TCP/IP (PostgreSQL wire protocol)
- **Environment Variable**: `DB_PORT`, `DATABASE_PORT`
- **Configuration Files**:
  - `.env`: `DB_PORT=5432`
  - `apps/backend/src/common/constants/ports.ts`: `DATABASE_PORT`
  - `apps/backend/src/database/database-config.ts`: Uses `DB_PORT`
- **Docker Compose**: `docker-compose.yml`, `apps/backend/docker-compose.yml`
- **Connection Details**:
  - Host: `localhost` (development), `postgres` (Docker)
  - Default DB: `aiquiz`
  - Default User: `aiquiz`
- **Purpose**: Primary relational database for storing quiz questions, users, scores, and game data

---

### Port 6379 - Redis Cache

- **Service**: Redis 7
- **Protocol**: TCP/IP (Redis protocol)
- **Environment Variable**: `REDIS_PORT`
- **Configuration Files**:
  - `.env`: `REDIS_PORT=6379`
  - `apps/backend/src/common/constants/ports.ts`: `REDIS_PORT`
  - `apps/backend/src/common/cache/cache.service.ts`: Uses `REDIS_PORT`
- **Docker Compose**: `docker-compose.yml`, `apps/backend/docker-compose.yml`
- **Connection Details**:
  - Host: `localhost` (development), `redis` (Docker)
- **Purpose**: In-memory caching, session storage, rate limiting

---

## 🔧 Port Configuration Files

### Primary Configuration

| File | Description |
|------|-------------|
| [`.port-lock`](.port-lock) | Port reservation lock file with allowed ports |
| [`port-allocation-plan.md`](port-allocation-plan.md) | Official port allocation plan |
| [`current-port-status.md`](current-port-status.md) | Current port status documentation |
| [`.env.example`](.env.example) | Environment variable template with port config |

### Backend Configuration

| File | Description |
|------|-------------|
| [`apps/backend/src/common/constants/ports.ts`](apps/backend/src/common/constants/ports.ts) | Central port constants |
| [`apps/backend/src/common/constants/app.constants.ts`](apps/backend/src/common/constants/app.constants.ts) | App-wide constants (re-exports ports) |
| [`apps/backend/src/main.ts`](apps/backend/src/main.ts) | Server startup with port config |
| [`apps/backend/src/database/database-config.ts`](apps/backend/src/database/database-config.ts) | Database connection config |
| [`apps/backend/src/common/cache/cache.service.ts`](apps/backend/src/common/cache/cache.service.ts) | Redis connection config |

### Docker Configuration

| File | Description |
|------|-------------|
| [`docker-compose.yml`](docker-compose.yml) | Main Docker Compose with port mappings |
| [`apps/backend/docker-compose.yml`](apps/backend/docker-compose.yml) | Backend-specific Docker Compose |

---

## 🚫 Not Required Ports

The following ports are mentioned in documentation but are **NOT required** for the website to function:

| Port Range | Service | Status | Notes |
|------------|---------|--------|-------|
| 80, 443 | Nginx | Optional | Production reverse proxy only |
| 3000-3004 | Next.js (Legacy) | ❌ Not Used | Previous frontend ports |
| 4000, 4001 | Backend (Alternative) | ❌ Not Used | Alternative backend ports |
| 5433, 5434 | PostgreSQL (Alt) | ❌ Not Used | Secondary DB instances |
| 6380, 6381 | Redis (Alt) | ❌ Not Used | Alternative Redis instances |
| 5672-5674 | RabbitMQ | ❌ Not Implemented | Message queue (not added) |
| 9000-9003 | MinIO | ❌ Not Implemented | Object storage (not added) |
| 8080, 8081 | Testing | Optional | Development testing |
| 9090 | Prometheus | Optional | Metrics monitoring |
| 9229, 9230 | Node Debug | Optional | Development debugging |
| 5601 | Kibana | Optional | Log visualization |
| 15672, 15673 | RabbitMQ Mgmt | ❌ Not Implemented | Management UI |

---

## 🔐 Port Security

- All 4 required ports are reserved for exclusive use by AI Quiz Platform
- Run `setup-port-security.bat` as Administrator to reserve ports in Windows
- Run `port-security-enforcer.ps1 -Action setup` to configure firewall rules
- Run `server-manager.ps1 -Action validate` to validate port configuration

---

## 🔍 Port Validation

To check if all required ports are properly configured:

```bash
# Using PowerShell
.\port-validator.ps1

# Using Node.js
node apps/backend/scripts/validate-port.js
```

---

## 📝 Environment Variables Reference

```env
# Port Configuration
FRONTEND_PORT=3010
BACKEND_PORT=3012
DB_PORT=5432
REDIS_PORT=6379

# Derived/Related
NEXT_PUBLIC_API_URL=http://localhost:3012/api
API_URL=http://localhost:3012/api
CORS_ORIGIN=http://localhost:3010
```

---

## 🔧 Changing Ports

If you need to change ports system-wide, modify these files in order:

1. **Primary**: [`apps/backend/src/common/constants/ports.ts`](apps/backend/src/common/constants/ports.ts)
2. **Environment**: `.env` file
3. **Docker**: `docker-compose.yml`
4. **Documentation**: Update this file

Then regenerate any affected configurations.

---

## 📞 Port Access Summary

| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| Frontend | 3010 | 3010 | http://localhost:3010 |
| Backend API | 3012 | 3012 | http://localhost:3012/api |
| PostgreSQL | 5432 | 5432 | localhost:5432 |
| Redis | 6379 | 6379 | localhost:6379 |

---

*This file is auto-generated and maintained as part of the AI Quiz Platform documentation.*
