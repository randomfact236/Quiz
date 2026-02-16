# AI Quiz Platform - Docker Deployment Guide

Complete guide for deploying the AI Quiz Platform using Docker.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [System Requirements](#system-requirements)
- [Architecture Overview](#architecture-overview)
- [Configuration](#configuration)
- [Deployment Options](#deployment-options)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

---

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git (optional, for updates)

### One-Command Deployment

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd ai-quiz-platform

# Run setup script (Linux/Mac)
./scripts/docker-startup.sh setup

# Or on Windows PowerShell
.\scripts\docker-startup.ps1 Setup
```

The setup script will:
1. Generate secure passwords
2. Create `.env` file from template
3. Build Docker images
4. Start all services
5. Run database migrations
6. Create MinIO bucket

### Access Your Application

After deployment, access the platform at:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3010 | Main web application |
| Backend API | http://localhost:4000/api | REST API endpoints |
| API Docs | http://localhost:4000/api/docs | Swagger documentation |
| Health Check | http://localhost:4000/api/health | Service health status |
| MinIO Console | http://localhost:9001 | Object storage admin |

---

## 🖥️ System Requirements

### Minimum Requirements

```yaml
CPU: 2 cores
RAM: 4 GB
Storage: 20 GB SSD
OS: Linux, macOS, or Windows (with WSL2)
Network: Internet access for Docker images (can run offline after initial pull)
```

### Recommended for Production

```yaml
CPU: 4+ cores
RAM: 8 GB+
Storage: 50 GB+ SSD
Network: High-bandwidth for concurrent users
```

### Docker Resource Allocation

Ensure Docker has sufficient resources:

```bash
# Check Docker resources
docker system info

# Recommended Docker Desktop settings:
# - CPUs: 4
# - Memory: 8 GB
# - Swap: 2 GB
# - Disk image size: 64 GB
```

---

## 🏗️ Architecture Overview

### Services Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Docker Network                                   │
│                      (ai-quiz-network: 172.20.0.0/16)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Frontend   │────▶│    Nginx     │◀────│   Backend    │                │
│  │  (Port 3010) │     │  (Port 80)   │     │  (Port 4000) │                │
│  │  Next.js 15  │     │ Reverse Proxy│     │  NestJS 10   │                │
│  └──────────────┘     └──────────────┘     └──────┬───────┘                │
│                                                   │                         │
│                              ┌────────────────────┼────────────────────┐   │
│                              │                    │                    │   │
│                              ▼                    ▼                    ▼   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │   │
│  │  PostgreSQL  │     │    Redis     │     │    MinIO     │            │   │
│  │  (Port 5432) │     │  (Port 6379) │     │ (Port 9000)  │            │   │
│  │   Database   │     │     Cache    │     │Object Storage│            │   │
│  └──────────────┘     └──────────────┘     └──────────────┘            │   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request** → Nginx (port 80)
2. **Static Assets** → Frontend (Next.js)
3. **API Requests** → Backend (NestJS)
4. **Data Storage** → PostgreSQL (primary), Redis (cache), MinIO (files)

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
```

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for JWT tokens | `your-256-bit-secret` |
| `DB_PASSWORD` | PostgreSQL password | `secure-password-123` |
| `REDIS_PASSWORD` | Redis password | `redis-password-456` |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | `minio-password-789` |

#### Port Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_PORT` | 3010 | Next.js frontend port |
| `BACKEND_PORT` | 4000 | NestJS backend port |
| `DB_PORT` | 5432 | PostgreSQL port |
| `REDIS_PORT` | 6379 | Redis port |
| `MINIO_API_PORT` | 9000 | MinIO API port |
| `MINIO_CONSOLE_PORT` | 9001 | MinIO console port |

### Generate Secure Secrets

```bash
# Generate JWT secret (256-bit)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate random password
openssl rand -base64 32
```

---

## 🚀 Deployment Options

### Option 1: Development Mode

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access:
# - Frontend: http://localhost:3010
# - Backend: http://localhost:4000/api
```

### Option 2: Production Mode (with Nginx)

```bash
# Start with Nginx reverse proxy
docker-compose --profile nginx up -d

# Or use the script
./scripts/docker-startup.sh start --nginx

# Access:
# - Application: http://localhost (port 80)
# - API: http://localhost/api
```

### Option 3: Production Mode (Full)

```bash
# Start with all production features
docker-compose --profile production up -d

# Or use the script
./scripts/docker-startup.sh start --production
```

### Option 4: Custom Build

```bash
# Build images without starting
docker-compose build

# Build specific service
docker-compose build backend

# Start with custom config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔧 Maintenance

### Daily Operations

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart backend

# Scale backend instances (if configured)
docker-compose up -d --scale backend=3
```

### Database Migrations

```bash
# Run migrations manually
docker-compose --profile migrate run --rm migrate

# Or use the script
./scripts/docker-startup.sh migrate

# Create new migration
cd apps/backend
npx typeorm-ts-node-commonjs migration:create src/database/migrations/MigrationName
```

### Backups

#### Database Backup

```bash
# Create database backup
docker exec ai-quiz-postgres pg_dump -U aiquiz aiquiz > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i ai-quiz-postgres psql -U aiquiz aiquiz < backup_20240101.sql
```

#### MinIO Backup

```bash
# Backup MinIO data
docker run --rm -v ai-quiz-minio-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/minio_backup.tar.gz -C /data .

# Restore MinIO data
docker run --rm -v ai-quiz-minio-data:/data -v $(pwd)/backup:/backup alpine sh -c "cd /data && tar xzf /backup/minio_backup.tar.gz"
```

#### Full System Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup database
docker exec ai-quiz-postgres pg_dump -U aiquiz aiquiz > $BACKUP_DIR/database.sql

# Backup environment
cp .env $BACKUP_DIR/

# Backup volumes
docker run --rm -v ai-quiz-minio-data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/minio.tar.gz -C /data .
docker run --rm -v ai-quiz-redis-data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/redis.tar.gz -C /data .

# Compress everything
tar czf backup_$(date +%Y%m%d).tar.gz $BACKUP_DIR

echo "Backup complete: backup_$(date +%Y%m%d).tar.gz"
```

### Updates

```bash
# Pull latest images
docker-compose pull

# Rebuild with latest code
docker-compose build --no-cache

# Restart services
docker-compose up -d

# Or use the update script
./scripts/docker-startup.sh update
```

---

## 🔍 Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose logs [service-name]

# Check port conflicts
netstat -tulpn | grep :4000

# Restart with clean state
docker-compose down
docker-compose up -d
```

#### Database Connection Failed

```bash
# Check database is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify connection
docker exec -it ai-quiz-postgres psql -U aiquiz -d aiquiz -c "SELECT 1;"
```

#### Migration Failures

```bash
# Check migration status
docker-compose --profile migrate run --rm migrate npm run migration:show

# Revert last migration
docker-compose --profile migrate run --rm migrate npm run migration:revert

# Reset database (WARNING: data loss)
docker-compose down -v
docker-compose up -d postgres
docker-compose --profile migrate run --rm migrate
```

#### Frontend Build Fails

```bash
# Clear Next.js cache
docker-compose exec frontend rm -rf .next

# Rebuild
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Health Checks

All services include health checks:

```bash
# Check all health statuses
docker-compose ps

# Manual health check
curl http://localhost:4000/api/health
curl http://localhost:3010/api/health
```

### Reset Everything

```bash
# ⚠️ WARNING: Destroys all data!
docker-compose down -v
docker volume prune -f
```

---

## 🔒 Security

### Default Security Features

- ✅ Non-root Docker containers
- ✅ Secrets in environment variables
- ✅ Internal Docker network isolation
- ✅ Health checks on all services
- ✅ Resource limits configured
- ✅ Read-only filesystem where possible

### Production Hardening

#### 1. Enable HTTPS

```nginx
# infrastructure/docker/nginx/conf.d/ssl.conf
server {
    listen 443 ssl http2;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    include /etc/nginx/conf.d/locations.conf;
}
```

#### 2. Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3010/tcp
sudo ufw deny 4000/tcp
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp
sudo ufw deny 9000/tcp
sudo ufw deny 9001/tcp
```

#### 3. Environment Security

```bash
# Set secure file permissions
chmod 600 .env

# Never commit .env
echo ".env" >> .gitignore
```

#### 4. Database Security

```sql
-- Create read-only user for reporting
CREATE USER quiz_read WITH PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE aiquiz TO quiz_read;
GRANT USAGE ON SCHEMA public TO quiz_read;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO quiz_read;
```

---

## 📊 Monitoring

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Volume usage
docker volume ls -f dangling=false
```

### Logs Management

```bash
# View last 100 lines
docker-compose logs --tail=100 backend

# Follow logs with timestamps
docker-compose logs -f --timestamps backend

# Export logs
docker-compose logs backend > backend_logs.txt
```

### Performance Tuning

```yaml
# docker-compose.override.yml for performance
services:
  postgres:
    shm_size: '2gb'
    sysctls:
      - net.core.somaxconn=1024
  
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## 🌐 Advanced Configuration

### Custom Domain

```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=https://your-domain.com

# Update nginx config
# infrastructure/docker/nginx/conf.d/default.conf
server_name your-domain.com;
```

### External Database

```bash
# Use external PostgreSQL
DB_HOST=external-db-host.com
DB_PORT=5432
DB_USERNAME=aiquiz
DB_PASSWORD=external-password
DB_DATABASE=aiquiz

# Skip local postgres in docker-compose.yml
# Or use: docker-compose up -d --no-deps backend frontend
```

### Load Balancing

```yaml
# docker-compose.load-balancer.yml
services:
  backend-1:
    extends: backend
    ports:
      - "4001:4000"
  
  backend-2:
    extends: backend
    ports:
      - "4002:4000"
  
  nginx:
    volumes:
      - ./nginx/load-balancer.conf:/etc/nginx/conf.d/load-balancer.conf
```

---

## 📞 Support

For issues and questions:

1. Check logs: `docker-compose logs -f [service]`
2. Review [Troubleshooting](#troubleshooting) section
3. Check health endpoints
4. Verify environment variables

---

## 📄 License

This deployment configuration is part of the AI Quiz Platform and follows the same license terms.

---

**Last Updated:** February 2026  
**Version:** 1.0.0
