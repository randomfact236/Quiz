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

## 4. EXCLUSIVE PORT LIST

| Port | Service | Access |
|------|---------|--------|
| 3010 | Next.js Dev Server | Localhost only |
| 3011 | Next.js Preview | Localhost only |
| 4000 | NestJS API | Localhost only |
| 4001 | NestJS Admin | Localhost only |
| 5432 | PostgreSQL | Localhost only |
| 5434 | PostgreSQL Test | Localhost only |
| 6379 | Redis Cache | Localhost only |
| 6381 | Redis Test | Localhost only |
| 5674 | RabbitMQ AMQP | Localhost only |
| 5673 | RabbitMQ Test | Localhost only |
| 15673 | RabbitMQ Mgmt | Localhost only |
| 9090 | Prometheus | Localhost only |
| 3004 | Grafana | Localhost only |
| 5601 | Kibana | Localhost only |
| 9229 | Node.js Debug | Localhost only |
| 9230 | Next.js Debug | Localhost only |
| 8080 | Test Coverage | Localhost only |
| 8081 | E2E Test Runner | Localhost only |
| 9002 | MinIO API | Localhost only |
| 9003 | MinIO Console | Localhost only |

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
- `network-security-config.py` - Security configuration reference
- `current-port-status.md` - Port allocation and security status
- `port-allocation-plan.md` - Detailed port planning

---

## ⚠️ IMPORTANT NOTES

- **Administrator privileges required** for firewall setup
- **Security lockdown is mandatory** - no exceptions
- **Regular monitoring required** to maintain security
- **All team members must follow** these security guidelines

**VIOLATION OF THESE RULES WILL RESULT IN IMMEDIATE PROJECT LOCKDOWN**