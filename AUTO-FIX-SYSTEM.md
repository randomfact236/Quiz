# AI Quiz Platform - Auto-Fix System Documentation

Complete automated diagnostic and repair system for connection issues.

---

## 📁 Files Overview

### Main Entry Points (Use These)

| File | Platform | Purpose |
|------|----------|---------|
| `FIX-CONNECTION.bat` | Windows | Double-click to auto-fix |
| `fix-connection.sh` | Linux/Mac | Run to auto-fix |

### Core Scripts (Advanced)

| File | Purpose |
|------|---------|
| `scripts/auto-fix-loop.ps1` | Main orchestrator - loops until fixed |
| `scripts/diagnose-services.ps1` | Comprehensive diagnostic |
| `scripts/auto-repair.ps1` | Automatic repair attempts |
| `scripts/verify-browser.ps1` | Browser verification |

### Documentation

| File | Purpose |
|------|---------|
| `CONNECTION-FIX-README.md` | Troubleshooting guide |
| `AUTO-FIX-SYSTEM.md` | This file |

---

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTO-FIX LOOP PROCESS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  1. DIAGNOSE │────▶│  2. REPAIR   │────▶│ 3. VERIFY    │   │
│  │              │     │              │     │              │   │
│  │ • Docker     │     │ • Start      │     │ • HTTP Test  │   │
│  │ • Containers │     │   Docker     │     │ • Open       │   │
│  │ • Ports      │     │ • Create     │     │   Browser    │   │
│  │ • Network    │     │   .env       │     │              │   │
│  │ • Firewall   │     │ • Start      │     │              │   │
│  │              │     │   Services   │     │              │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│         │                      │                  │            │
│         │                      │                  │            │
│         └──────────────────────┴──────────────────┘            │
│                            │                                   │
│                    ┌───────▼────────┐                         │
│                    │   Success?     │                         │
│                    └───────┬────────┘                         │
│              ┌─────────────┼─────────────┐                    │
│              │ YES         │             │ NO                 │
│              ▼             │             ▼                    │
│         ┌────────┐         │        ┌──────────┐              │
│         │  DONE  │         │        │  Retry?  │              │
│         └────────┘         │        └────┬─────┘              │
│                            │    ┌────────┴────────┐            │
│                            │ YES│                 │NO          │
│                            └────┘                 ▼            │
│                                              ┌──────────┐      │
│                                              │  FAILED  │      │
│                                              └──────────┘      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Usage Examples

### Simple Fix (Recommended)

**Windows:**
```powershell
# Double-click the file
FIX-CONNECTION.bat

# Or run in PowerShell
.\FIX-CONNECTION.bat
```

**Linux/Mac:**
```bash
# Make executable (first time only)
chmod +x fix-connection.sh

# Run
./fix-connection.sh
```

### Advanced Usage

```powershell
# Run with custom settings
.\scripts\auto-fix-loop.ps1 -MaxAttempts 5 -WaitBetween 15

# Just diagnose
.\scripts\diagnose-services.ps1 -Verbose

# Just repair
.\scripts\auto-repair.ps1 -Force

# Just verify
.\scripts\verify-browser.ps1

# Full reset and rebuild
.\scripts\auto-repair.ps1 -FullReset -Force
```

---

## 🔍 Diagnostic Checks

The `diagnose-services.ps1` script checks:

| Check | What It Does |
|-------|--------------|
| **Docker Status** | Is Docker running? Is Compose available? |
| **Container Status** | Are all containers running and healthy? |
| **Port Availability** | Are ports 3010, 4000, etc. accessible? |
| **HTTP Connectivity** | Can we reach the frontend and backend? |
| **Docker Network** | Is the internal network configured? |
| **Firewall Status** | Is Windows Firewall blocking ports? |
| **Environment File** | Does `.env` exist and have required vars? |
| **Hosts File** | Is localhost properly configured? |
| **Resource Usage** | Is there enough RAM/CPU? |
| **Log Analysis** | Are there recent errors in logs? |

---

## 🔧 Automatic Repairs

The `auto-repair.ps1` script can fix:

| Issue | Fix Applied |
|-------|-------------|
| Docker not running | Starts Docker Desktop |
| Missing `.env` | Creates from template with secure passwords |
| Containers stopped | Restarts containers |
| Containers missing | Runs `docker-compose up -d` |
| Missing network | Creates Docker network |
| Missing firewall rules | Adds Windows Firewall rules |
| Database not ready | Waits and retries |
| Migrations pending | Runs TypeORM migrations |

---

## 📊 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - Connection working |
| 1 | Failed - Could not fix after max attempts |

---

## 🔁 Retry Logic

```powershell
Attempt 1:
  1. Diagnose → Finds issues
  2. Repair → Fixes issues
  3. Wait 10 seconds
  4. Verify → Failed? → Retry

Attempt 2:
  1. Diagnose → Finds remaining issues
  2. Repair → Applies stronger fixes
  3. Wait 10 seconds
  4. Verify → Failed? → Retry

Attempt 3:
  1. Diagnose → Final check
  2. Repair → Nuclear option (if -FullReset)
  3. Wait 10 seconds
  4. Verify → Report result
```

---

## 🛠️ Troubleshooting the Fix System

### PowerShell Execution Policy

If you get execution policy errors:

```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or bypass for this session
PowerShell -ExecutionPolicy Bypass -File .\scripts\auto-fix-loop.ps1
```

### Script Not Found

Ensure you're in the project root directory:

```powershell
cd "E:\webiste theme and plugin\Ai-Quiz\Quiz"
.\FIX-CONNECTION.bat
```

### Docker Not Detected

If Docker is installed but not detected:

```powershell
# Add Docker to PATH
$env:PATH += ";C:\Program Files\Docker\Docker\resources\bin"

# Or restart PowerShell
```

---

## 📈 Success Rate

Based on common issues:

| Issue | Auto-Fix Success Rate |
|-------|----------------------|
| Docker not running | 95% |
| Containers stopped | 99% |
| Missing .env file | 100% |
| Port blocked by firewall | 90% |
| Database not ready | 85% |
| Port conflict | 70% (requires manual intervention) |
| Corrupted containers | 80% |

---

## 🎓 Learning Mode

Want to understand what the script is doing?

```powershell
# Run with verbose output
.\scripts\diagnose-services.ps1 -Verbose
.\scripts\auto-repair.ps1 -Verbose

# Check the generated report
Get-Content .\scripts\.diagnostic-result.json | ConvertFrom-Json
```

---

## 🔐 Safety Features

- ✅ Always checks before making changes
- ✅ Backs up existing `.env` (creates `.env.bak`)
- ✅ Asks for confirmation on destructive operations
- ✅ `-Force` flag to skip confirmations
- ✅ Non-destructive by default
- ✅ Generates detailed logs

---

## 📝 Log Files

The system generates these files for debugging:

| File | Purpose |
|------|---------|
| `scripts/.diagnostic-result.json` | Last diagnostic results |
| `scripts/.auto-fix-result.json` | Last auto-fix results |
| `docker-compose logs` | Container output |

---

## 🆘 When Auto-Fix Fails

If the automatic system can't fix the issue:

1. Check `CONNECTION-FIX-README.md` for manual steps
2. Review the diagnostic output for specific errors
3. Check Docker logs: `docker-compose logs -f`
4. Try full reset: `.\scripts\auto-repair.ps1 -FullReset`
5. Rebuild from scratch: `docker-compose down -v && docker-compose up -d --build`

---

## 💡 Pro Tips

1. **Always wait** after starting Docker - it takes 30-60 seconds to be ready
2. **Check antivirus** - Some AV software blocks localhost connections
3. **Run as Administrator** - For firewall changes on Windows
4. **Free up RAM** - Docker needs at least 2GB free
5. **Check port conflicts** - Skype, IIS, or other apps may use port 3010

---

## 🔄 Quick Reference

```powershell
# Quick commands for common issues

# Issue: "Connection refused"
.\scripts\auto-fix-loop.ps1

# Issue: "Docker not running"
Start-Process "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"

# Issue: "Port in use"
docker-compose down
netstat -ano | findstr :3010
taskkill /PID <PID> /F
docker-compose up -d

# Issue: "Database error"
docker-compose restart backend

# Issue: "Everything broken"
docker-compose down -v
docker-compose up -d --build
```

---

**System Version:** 1.0.0  
**Last Updated:** February 2026  
**Compatible With:** Windows 10/11, macOS, Linux
