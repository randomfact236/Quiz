# AI Quiz Platform - Production Deployment Guide

## Quick Start

```bash
# 1. Set up environment
cp .env.production.example .env.production
# Edit .env.production with your values

# 2. Deploy (Linux/Mac)
./deploy.sh

# 3. Deploy (Windows PowerShell)
.\deploy.ps1
```

---

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available
- Ports 3010, 4000, 5432, 6379 available (or configure alternatives)

---

## Environment Configuration

### 1. Create Environment File

```bash
cp .env.production.example .env.production
```

### 2. Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | `StrongP@ssw0rd123` |
| `JWT_SECRET` | JWT signing secret | `64-char-hex-string...` |
| `CORS_ORIGIN` | Frontend URL | `https://quiz.yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `https://api.yourdomain.com/api` |

### 3. Generate JWT Secret

```bash
# Linux/Mac
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Windows PowerShell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Deployment Commands

### Linux/Mac (Bash)

```bash
# Full deployment
./deploy.sh deploy

# Individual commands
./deploy.sh build      # Build images
./deploy.sh start      # Start services
./deploy.sh stop       # Stop services
./deploy.sh restart    # Restart services
./deploy.sh logs       # View logs
./deploy.sh status     # Check health
./deploy.sh backup     # Backup database
./deploy.sh update     # Update & redeploy
```

### Windows (PowerShell)

```powershell
# Full deployment
.\deploy.ps1 deploy

# Individual commands
.\deploy.ps1 build
.\deploy.ps1 start
.\deploy.ps1 stop
.\deploy.ps1 restart
.\deploy.ps1 logs
.\deploy.ps1 status
.\deploy.ps1 backup
.\deploy.ps1 update
```

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Nginx/SSL     │────▶│   Frontend      │────▶│    Backend      │
│   (Optional)    │     │   Next.js 15    │     │   NestJS 10     │
│   :443          │     │   :3010         │     │   :4000         │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                              ┌─────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    PostgreSQL   │
                    │      :5432      │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │     Redis       │
                    │      :6379      │
                    └─────────────────┘
```

---

## Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Frontend | Node 20 Alpine | 3010 | Next.js 15 App |
| Backend | Node 20 Alpine | 4000 | NestJS API |
| Database | Postgres 15 Alpine | 5432 | Data storage |
| Cache | Redis 7 Alpine | 6379 | Session & cache |

---

## Health Checks

All services include automated health checks:

- **PostgreSQL**: `pg_isready` every 10s
- **Redis**: `redis-cli ping` every 10s
- **Backend**: HTTP GET `/api/health` every 30s
- **Frontend**: HTTP GET `/` every 30s

Check status manually:

```bash
# Backend
curl http://localhost:4000/api/health

# Frontend
curl http://localhost:3010/
```

---

## SSL/HTTPS Setup

### Option 1: Nginx Reverse Proxy (Recommended)

Create `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name quiz.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### Option 2: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d quiz.yourdomain.com -d api.yourdomain.com
```

### Option 3: Cloudflare Tunnel

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Create tunnel
cloudflared tunnel create quiz-app
cloudflared tunnel route dns quiz-app quiz.yourdomain.com
cloudflared tunnel run quiz-app
```

---

## Backup & Restore

### Automatic Backups

Backups are created automatically before updates. Location: `backups/`

### Manual Backup

```bash
# Linux/Mac
./deploy.sh backup

# Windows
.\deploy.ps1 backup
```

### Restore from Backup

```bash
# Stop services
./deploy.sh stop

# Restore database
docker exec -i quiz-postgres-prod psql -U aiquiz -d aiquiz < backups/backup_20240115_120000.sql

# Start services
./deploy.sh start
```

---

## Monitoring

### View Logs

```bash
# All services
./deploy.sh logs

# Specific service
docker logs -f quiz-backend-prod
docker logs -f quiz-frontend-prod
docker logs -f quiz-postgres-prod
docker logs -f quiz-redis-prod
```

### Resource Usage

```bash
docker stats
```

### Database Monitoring

```bash
# Connect to database
docker exec -it quiz-postgres-prod psql -U aiquiz -d aiquiz

# Check tables
\dt

# Check connections
SELECT * FROM pg_stat_activity;
```

---

## Troubleshooting

### Build Failures

```bash
# Clean build cache
./deploy.sh clean
./deploy.sh build
```

### Database Connection Issues

```bash
# Check postgres is running
docker ps | grep postgres

# Check logs
docker logs quiz-postgres-prod

# Verify credentials in .env.production
cat .env.production | grep POSTGRES
```

### Port Conflicts

Edit `docker-compose.prod.yml` to change ports:

```yaml
ports:
  - "3001:3010"  # Frontend on 3001
  - "4001:4000"  # Backend on 4001
```

### Container Won't Start

```bash
# Check logs
docker logs quiz-backend-prod
docker logs quiz-frontend-prod

# Restart specific service
docker restart quiz-backend-prod
```

---

## Updates

### Update Application

```bash
# Pull latest code and redeploy
./deploy.sh update
```

This will:
1. Create database backup
2. Pull latest code from git
3. Rebuild Docker images
4. Restart services

### Update Docker Images Only

```bash
./deploy.sh build
./deploy.sh restart
```

---

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated strong JWT secret
- [ ] Set correct CORS origin
- [ ] Database ports bound to localhost only
- [ ] SSL/HTTPS configured
- [ ] Firewall rules configured (ufw/cloud provider)
- [ ] Regular backups scheduled
- [ ] `.env.production` not in git

---

## Environment-Specific Configurations

### VPS (DigitalOcean, AWS, Linode)

```bash
# 1. Set up firewall
sudo ufw allow 22
sudo ufw allow 443
sudo ufw allow 80
sudo ufw enable

# 2. Deploy
./deploy.sh deploy

# 3. Set up SSL with Let's Encrypt
sudo certbot --nginx
```

### Railway/Render (Platform)

Use the provided Docker Compose or individual Dockerfiles:

- Backend: `apps/backend/Dockerfile`
- Frontend: `apps/frontend/Dockerfile`

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml quiz-app

# Check services
docker stack ps quiz-app
docker service logs quiz-app_backend
```

---

## Support

For issues or questions:

1. Check logs: `./deploy.sh logs`
2. Check status: `./deploy.sh status`
3. Review environment variables
4. Verify ports are available
