# AI Quiz Platform - Connection Fix Guide

Experiencing "localhost refused to connect" error? This guide will help you fix it automatically or manually.

---

## 🚀 Quick Fix (Automatic)

### Windows
Double-click: `FIX-CONNECTION.bat`

Or run in PowerShell:
```powershell
.\scripts\auto-fix-loop.ps1
```

### Linux/Mac
Run in terminal:
```bash
./fix-connection.sh
```

Or with PowerShell:
```powershell
pwsh ./scripts/auto-fix-loop.ps1
```

---

## 🔧 What the Auto-Fix Does

The automatic repair system performs these steps in a loop until fixed:

1. **Diagnose** - Checks Docker, containers, ports, network, firewall
2. **Repair** - Attempts automatic fixes for identified issues
3. **Wait** - Allows services to stabilize
4. **Verify** - Opens browser to confirm connection works

Maximum 3 attempts by default.

---

## 📋 Common Issues & Solutions

### Issue 1: Docker Not Running

**Symptoms:**
- "Docker daemon is not running"
- Cannot connect to Docker

**Fix:**
```powershell
# Windows - Start Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Linux
sudo systemctl start docker

# Mac
open -a Docker
```

### Issue 2: Containers Not Started

**Symptoms:**
- "ai-quiz-frontend container NOT FOUND"
- "Connection refused" on all ports

**Fix:**
```powershell
# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### Issue 3: Port Already in Use

**Symptoms:**
- "Port 3010 is already allocated"
- "Bind for 0.0.0.0:3010 failed"

**Fix:**
```powershell
# Find what's using the port (Windows)
netstat -ano | findstr :3010

# Find and kill process (Windows)
taskkill /PID <PID> /F

# Or change ports in .env
FRONTEND_PORT=3011
BACKEND_PORT=4001
```

### Issue 4: Firewall Blocking

**Symptoms:**
- "Connection refused" despite containers running
- Works with localhost but not 127.0.0.1

**Fix (Windows):**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "AI Quiz Frontend" -Direction Inbound -Protocol TCP -LocalPort 3010 -Action Allow
New-NetFirewallRule -DisplayName "AI Quiz Backend" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
```

**Fix (Linux):**
```bash
sudo ufw allow 3010/tcp
sudo ufw allow 4000/tcp
```

### Issue 5: Database Connection Failed

**Symptoms:**
- Backend container keeps restarting
- "Connection refused" to PostgreSQL

**Fix:**
```powershell
# Check PostgreSQL logs
docker-compose logs postgres

# Reset database (WARNING: data loss)
docker-compose down -v
docker-compose up -d
```

### Issue 6: Services Starting But Not Ready

**Symptoms:**
- "HTTP 502 Bad Gateway"
- "Empty reply from server"

**Fix:**
```powershell
# Wait longer for services
docker-compose restart

# Check logs for specific errors
docker-compose logs -f backend
```

---

## 🔍 Manual Diagnostic

Run individual diagnostic checks:

```powershell
# Full diagnostic
.\scripts\diagnose-services.ps1 -Verbose

# Just test ports
Test-NetConnection -ComputerName localhost -Port 3010
Test-NetConnection -ComputerName localhost -Port 4000

# Check Docker containers
docker ps
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🔨 Manual Repair

### Option 1: Quick Restart

```powershell
docker-compose restart
```

### Option 2: Full Rebuild

```powershell
docker-compose down
docker-compose up -d --build
```

### Option 3: Complete Reset (⚠️ Data Loss)

```powershell
docker-compose down -v  # Removes volumes
docker volume prune -f   # Cleans up
docker-compose up -d --build
```

### Option 4: Individual Service Repair

```powershell
# Restart just the frontend
docker-compose restart frontend

# Rebuild just the backend
docker-compose up -d --build backend

# Run migrations manually
docker-compose --profile migrate run --rm migrate
```

---

## 🌐 Testing Connection

### Command Line Tests

```powershell
# Test frontend
curl http://localhost:3010

# Test backend
curl http://localhost:4000/api/health

# Test with verbose output
curl -v http://localhost:3010
```

### Browser Tests

Open these URLs:
- http://localhost:3010 - Should show the app
- http://localhost:4000/api/health - Should return `{"status":"ok"}`
- http://localhost:4000/api/docs - Should show Swagger UI

---

## 📊 Checklist

Before reporting an issue, verify:

- [ ] Docker Desktop is running
- [ ] Containers are running (`docker-compose ps`)
- [ ] Ports are not blocked by firewall
- [ ] No other app is using port 3010 or 4000
- [ ] `.env` file exists and is configured
- [ ] At least 2GB RAM available for Docker
- [ ] Tried `docker-compose restart`
- [ ] Tried `docker-compose down -v` then `docker-compose up -d`

---

## 🆘 Still Not Working?

### Get Debug Information

```powershell
# Save diagnostic output
.\scripts\diagnose-services.ps1 -Verbose | Out-File diagnostic.log

# Save container logs
docker-compose logs > container-logs.txt

# Save Docker info
docker info > docker-info.txt
docker-compose ps > docker-ps.txt
```

### Common Log Errors

**"Error: connect ECONNREFUSED"**
→ Database is not ready. Wait 30 seconds and retry.

**"Bind address already in use"**
→ Port conflict. Change ports in `.env` or kill conflicting process.

**"Migration failed"**
→ Database schema issue. Reset with `docker-compose down -v`.

**"JWT secret not set"**
→ Missing `.env` file. Run setup or copy from `.env.example`.

---

## 📞 Support Commands

```powershell
# Complete status check
.\scripts\diagnose-services.ps1

# Auto repair attempt
.\scripts\auto-repair.ps1 -Verbose

# Full reset and rebuild
.\scripts\auto-repair.ps1 -FullReset -Force

# Open browser verification
.\scripts\verify-browser.ps1
```

---

## 🔄 Reset Everything (Nuclear Option)

⚠️ **WARNING: This deletes all data!**

```powershell
# Stop everything
docker-compose down -v

# Remove all related volumes
docker volume rm -f ai-quiz-postgres-data ai-quiz-redis-data ai-quiz-minio-data

# Remove all related images
docker rmi -f $(docker images -q "ai-quiz-*")

# Clean Docker
docker system prune -f

# Start fresh
docker-compose up -d
```

---

## ✨ Success Indicators

You know it's working when:

1. `docker-compose ps` shows all containers "Up"
2. `curl http://localhost:4000/api/health` returns JSON
3. Browser shows the application at http://localhost:3010
4. No error messages in `docker-compose logs`

---

**Last Updated:** February 2026  
**Version:** 1.0.0
