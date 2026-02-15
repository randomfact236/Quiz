# 🔒 Port Security Configuration Status

## Project Port Restrictions

The AI Quiz Platform is now **configured** to use ONLY these ports:

| Service | Port | Status |
|---------|------|--------|
| Frontend (Next.js) | 3010 | ✅ Configured |
| Backend (NestJS) | 4000 | ✅ Configured |
| PostgreSQL | 5432 | ✅ Configured |
| Redis | 6379 | ✅ Configured |

## What Was Configured

### 1. Port Lock File (`.port-lock`)
- Documents reserved ports
- Serves as a marker for validation scripts

### 2. Pre-start Validation Scripts
- **Frontend**: `apps/frontend/scripts/validate-port.js`
- **Backend**: `apps/backend/scripts/validate-port.js`
- **Root**: `scripts/validate-ports.js`

These scripts run automatically before `npm run dev` or `npm start` and will **FAIL** if invalid ports are detected.

### 3. Package.json Updates
- Added `predev` and `prestart` hooks to run validation
- Added port management commands:
  - `npm run validate:ports` - Validate all port configurations
  - `npm run ports:status` - Check port status
  - `npm run ports:setup` - Reserve ports in Windows (requires Admin)
  - `npm run ports:release` - Release reserved ports (requires Admin)

### 4. Environment Files
- ✅ `apps/frontend/.env.local` - Uses port 4000 for API
- ✅ `apps/backend/.env` - Uses ports 4000, 5432, 6379
- ✅ `infrastructure/docker/docker-compose.yml` - Uses ports 5432, 6379

### 5. Docker Compose
- Removed non-standard ports (5433, 6380)
- Removed external services (RabbitMQ, MinIO) from port exposure
- Now uses only the 4 reserved ports

## ⚠️ Windows Port Reservation (Requires Admin)

To **reserve** these ports in Windows (preventing other apps from using them):

### Quick Setup
```batch
:: Run this file as Administrator
setup-port-security.bat
```

### Manual Commands (as Administrator)
```powershell
# Reserve each port
netsh int ip add excludedportrange protocol=tcp startport=3010 numberofports=1
netsh int ip add excludedportrange protocol=tcp startport=4000 numberofports=1
netsh int ip add excludedportrange protocol=tcp startport=5432 numberofports=1
netsh int ip add excludedportrange protocol=tcp startport=6379 numberofports=1

# Verify
netsh int ip show excludedportrange protocol=tcp
```

### What This Does
1. Reserves ports in Windows TCP/IP stack
2. Creates Windows Firewall rules to allow local access
3. Blocks external/internet access to these ports
4. Sets up persistent protection via scheduled task

## 🔒 Security Enforcement Layers

| Layer | Enforcement | Requires Admin |
|-------|-------------|----------------|
| Application Config | Hardcoded ports in package.json | ❌ No |
| Environment Variables | PORT=4000 in .env files | ❌ No |
| Pre-start Validation | Scripts check ports before start | ❌ No |
| Windows Port Reservation | netsh excludedportrange | ✅ Yes |
| Windows Firewall | Block external access | ✅ Yes |

## 🚀 Usage

### Start Development (with validation)
```bash
npm run dev
```
This automatically validates ports before starting servers.

### Validate Ports Only
```bash
npm run validate:ports
```

### Check Port Status
```bash
npm run ports:status
```

## ⚡ Current Status

```
✅ Port configurations validated
✅ Pre-start hooks installed
✅ Port lock file active
⏳ Windows port reservation pending (requires Admin)
⏳ Firewall rules pending (requires Admin)
```

## 🛡️ Protection Summary

- **Without Admin**: Application-level enforcement (validation scripts, hardcoded ports)
- **With Admin**: Full system-level protection (reserved ports, firewall rules)

## Next Steps

1. **Run as Administrator**: `setup-port-security.bat`
2. **Start servers**: `npm run dev`
3. **Verify**: Open http://localhost:3010

---

*Configuration completed. System-level protection requires manual administrator execution.*
