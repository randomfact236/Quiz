# AI Quiz Project - Security Setup Guide

## 🔒 EXCLUSIVE PORT LOCKDOWN

This project implements a complete security lockdown where all assigned ports are exclusively reserved for the AI Quiz project only.

## 🚫 SECURITY REQUIREMENTS

### IMMEDIATE ACTION REQUIRED:
1. **Run Firewall Protection** (as Administrator)
2. **Verify Security Setup**
3. **Monitor Port Security**

---

## 1. Firewall Protection Setup

### Windows Firewall Configuration
Run the following command as **Administrator**:

```powershell
# Navigate to project directory
cd "E:\webiste theme and plugin\Ai-Quiz\Quiz"

# Execute firewall protection script
.\firewall-protection.ps1
```

This will:
- ✅ Block all external inbound connections to AI Quiz ports
- ✅ Allow localhost access for development
- ✅ Create Windows Firewall rules for protection

---

## 2. Security Verification

### Run Security Monitor
```powershell
# Check current security status
.\port-security-monitor.ps1

# Continuous monitoring (optional)
.\port-security-monitor.ps1 -Continuous -IntervalSeconds 300
```

Expected output should show:
- ✅ All ports properly blocked from external access
- ✅ Localhost access working when services are running
- ✅ Firewall rules active

---

## 3. Port Access Rules

### ALLOWED ACCESS:
- **Localhost only** (127.0.0.1, ::1)
- **Internal project communication**
- **Development and testing**

### BLOCKED ACCESS:
- ❌ External IP addresses
- ❌ Other projects
- ❌ Internet access (except approved domains)
- ❌ Unauthorized network connections

---

## 4. EXCLUSIVE PORT LIST (Required Only)

These are the **only required ports** for the website to work:

| Port | Service | Access | Required? |
|------|---------|--------|-----------|
| 3010 | Frontend (Next.js) | Localhost only | ✅ YES |
| 3012 | Backend (NestJS) | Localhost only | ✅ YES |
| 5432 | PostgreSQL | Localhost only | ✅ YES |
| 6379 | Redis Cache | Localhost only | ✅ YES |

### Not Required Ports (Removed)
The following ports are no longer part of this project:
- Ports 3000-3004, 4000-4001 (Legacy/alternatives)
- Ports 5433-5434 (PostgreSQL alternatives)
- Ports 6380-6381 (Redis alternatives)
- Ports 5672-5674, 15672-15673 (RabbitMQ - not implemented)
- Ports 9000-9003 (MinIO - not implemented)
- Ports 8080-8081 (Testing - optional)
- Ports 9090, 5601 (Monitoring - optional)
- Ports 9229-9230 (Debug - development only)

---

## 5. Development Guidelines

### ✅ ALLOWED:
- Local development on assigned ports
- Inter-service communication within project
- Approved outbound connections (npm, git)
- Localhost testing and debugging

### ❌ NOT ALLOWED:
- External API calls (except approved)
- Communication with other projects
- Internet access beyond essentials
- Port sharing with other applications

---

## 6. Security Monitoring

### Regular Checks Required:
- Daily port security verification
- Weekly firewall rule validation
- Monthly security audit
- Incident response readiness

### Emergency Procedures:
1. **Security Breach Detected**: Immediately stop all services
2. **Run**: `.\port-security-monitor.ps1` to identify issues
3. **Fix**: Run `.\firewall-protection.ps1` as Administrator
4. **Report**: Document and resolve security incidents

---

## 7. Configuration Files

- `firewall-protection.ps1` - Firewall setup script
- `port-security-monitor.ps1` - Security monitoring
- `.port-lock` - Port lock configuration
- `port-allocation-plan.md` - Port allocation details

---

## ⚠️ IMPORTANT NOTES

- **Administrator privileges required** for firewall setup
- **Security lockdown is mandatory** - no exceptions
- **Regular monitoring required** to maintain security
- **All team members must follow** these security guidelines
- **Only 4 ports required**: 3010, 3012, 5432, 6379

**VIOLATION OF THESE RULES WILL RESULT IN IMMEDIATE PROJECT LOCKDOWN**