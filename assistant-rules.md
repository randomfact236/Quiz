# AI Quiz Platform - Assistant Rules

## Port Configuration

This project uses exactly **4 ports** for the application to function:

### Required Ports
| Port | Service | Purpose | Env Variable |
|------|---------|---------|--------------|
| **3010** | Frontend (Next.js) | Web UI server | `FRONTEND_PORT` |
| **3012** | Backend (NestJS) | API server | `BACKEND_PORT`, `PORT` |
| **5432** | PostgreSQL | Database | `DB_PORT`, `DATABASE_PORT` |
| **6379** | Redis | Cache | `REDIS_PORT` |

### Port Configuration Files
- `.port-lock` - Port reservation lock
- `port-allocation-plan.md` - Port allocation plan
- `apps/backend/src/common/constants/ports.ts` - Central port constants
- `.env` - Environment configuration
- `docker-compose.yml` - Docker port mappings

### Changing Ports
To change ports system-wide:
1. Update `apps/backend/src/common/constants/ports.ts`
2. Update `.env` file
3. Update `docker-compose.yml`
4. Run validation: `.\port-validator.ps1`

### Not Required Ports
These are NOT used: 80, 443, 3000-3004, 4000-4001, 5433-5434, 6380-6381, 5672-5674, 9000-9003, 8080-8081, 9090, 9229-9230, 5601, 15672-15673

## Development Commands
- Start servers: `.\start-ai-quiz.bat`
- Validate ports: `.\port-validator.ps1`
- Check status: `.\check-status.ps1`
