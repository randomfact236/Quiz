# Port Allocation Plan for AI Quiz Project

**Version:** 3.0
**Last Updated:** 2026-03-08
**Status:** Simplified - Only Required Ports

## Required Ports (Website Works With These Only)

These **4 ports** are required for the website to function:

| Port | Service | Status | Description |
|------|---------|--------|-------------|
| **3010** | Frontend (Next.js) | ✅ Active | Main frontend development server |
| **3012** | Backend (NestJS) | ✅ Active | Main API server |
| **5432** | PostgreSQL | ✅ Active | Primary database |
| **6379** | Redis | ✅ Active | Cache layer |

### All Other Ports Are NOT Required

The following ports are mentioned in this project but are **NOT required** for the website to work:

- Port 80, 443 (Nginx - optional for production)
- Port 3000-3004 (Legacy/alternatives - not used)
- Port 4000, 4001 (Alternative backend - not used)
- Port 5433, 5434 (PostgreSQL alternatives - not used)
- Port 6380, 6381 (Redis alternatives - not used)
- Port 5672, 5673, 5674 (RabbitMQ - not implemented)
- Port 9000, 9001, 9002, 9003 (MinIO - not implemented)
- Port 8080, 8081 (Testing - optional)
- Port 9090 (Prometheus - optional)
- Port 9229, 9230 (Debug - development only)
- Port 5601 (Kibana - optional)
- Port 15672, 15673 (RabbitMQ Management - not implemented)

## Port Allocation Summary

### Frontend Services
- **Port 3010**: Next.js Development Server
  - **Service**: AI Quiz Frontend (Next.js 15)
  - **Access**: http://localhost:3010

### Backend Services
- **Port 3012**: NestJS API Server
  - **Service**: AI Quiz Backend API (NestJS 10)
  - **Access**: http://localhost:3012/api

### Database Services
- **Port 5432**: PostgreSQL Database
  - **Service**: Primary relational database

### Caching Services
- **Port 6379**: Redis Cache
  - **Service**: In-memory data store and cache

## Configuration

The only ports configured in the application are:
- `.env` file: FRONTEND_PORT=3010, BACKEND_PORT=3012, DB_PORT=5432, REDIS_PORT=6379
- `.port-lock` file: ALLOWED_PORTS=3010,3012,5432,6379

## Security

- All 4 required ports are reserved for exclusive use by AI Quiz Platform
- Firewall rules block external access to these ports
- Ports are validated before server startup