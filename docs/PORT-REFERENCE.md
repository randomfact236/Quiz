# AI Quiz Platform - Port Reference

**Version:** 2.0 - Merged  
**Last Updated:** 2026-03-17  
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

These **4 ports** are required and currently in use:

| Port | Service | Status | Description |
|------|---------|--------|-------------|
| **3010** | Frontend (Next.js) | ✅ Active | Main frontend |
| **3012** | Backend (NestJS) | ✅ Active | API server |
| **5432** | PostgreSQL | ✅ Active | Database |
| **6379** | Redis | ✅ Active | Cache |

### Port 3010 - Frontend (Next.js)

- **Service**: AI Quiz Frontend (Next.js 15)
- **Protocol**: HTTP
- **Access URL**: http://localhost:3010
- **Environment Variable**: `FRONTEND_PORT`
- **Configuration Files**:
  - `.env`: `FRONTEND_PORT=3010`
  - `apps/backend/src/common/constants/ports.ts`: `FRONTEND_PORT`
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
- **Docker Compose**: `docker-compose.yml`
- **Purpose**: Primary relational database

---

### Port 6379 - Redis

- **Service**: Redis (latest)
- **Protocol**: TCP/IP (Redis protocol)
- **Environment Variable**: `REDIS_PORT`
- **Configuration Files**:
  - `.env`: `REDIS_PORT=6379`
  - `apps/backend/src/common/constants/ports.ts`: `REDIS_PORT`
- **Docker Compose**: `docker-compose.yml`
- **Purpose**: Cache layer for session management and caching

---

## 🚫 Not Required Ports

The following ports are mentioned in documentation but are **NOT required**:

- Ports 80, 443 (Nginx - production only)
- Ports 3000-3004, 4000-4001 (Legacy/alternatives)
- Ports 5433-5434 (PostgreSQL alternatives)
- Ports 6380-6381 (Redis alternatives)
- Ports 5672-5674, 15672-15673 (RabbitMQ - not implemented)
- Ports 9000-9003 (MinIO - not implemented)
- Ports 8080-8081 (Testing)
- Ports 9090, 5601 (Monitoring - optional)
- Ports 9229-9230 (Debug - development only)

---

## Deployment URLs (Development)

- Frontend: http://localhost:3010
- API: http://localhost:3012/api

---

## Configuration Files

- `.env` - Environment configuration
- `docker-compose.yml` - Docker services

---

## ✅ Verification Status

- ✅ 4/4 required ports configured
- ✅ Website works with ports 3010, 3012, 5432, 6379
