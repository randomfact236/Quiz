# AI Quiz Project - Port Status

**Version:** 3.0 - Simplified
**Last Updated:** 2026-03-08
**Project:** AI Quiz Website

## ✅ Active Ports (Required)

These **4 ports** are required and currently in use:

| Port | Service | Status | Description |
|------|---------|--------|-------------|
| **3010** | Frontend (Next.js) | ✅ Active | Main frontend |
| **3012** | Backend (NestJS) | ✅ Active | API server |
| **5432** | PostgreSQL | ✅ Active | Database |
| **6379** | Redis | ✅ Active | Cache |

## 🚫 Not Required Ports

The following ports are mentioned in documentation but are **NOT required** for the website to work:

- Ports 80, 443 (Nginx - production only)
- Ports 3000-3004, 4000-4001 (Legacy/alternatives)
- Ports 5433-5434 (PostgreSQL alternatives)
- Ports 6380-6381 (Redis alternatives)
- Ports 5672-5674, 15672-15673 (RabbitMQ - not implemented)
- Ports 9000-9003 (MinIO - not implemented)
- Ports 8080-8081 (Testing)
- Ports 9090, 5601 (Monitoring - optional)
- Ports 9229-9230 (Debug - development only)

## Deployment URLs (Development)

- Frontend: http://localhost:3010
- API: http://localhost:3012/api

## Configuration Files

- `.port-lock` - Contains the 4 required ports
- `.env` - Environment configuration
- `port-allocation-plan.md` - Simplified port plan

## ✅ Verification Status

- ✅ 4/4 required ports configured
- ✅ Website works with ports 3010, 3012, 5432, 6379
