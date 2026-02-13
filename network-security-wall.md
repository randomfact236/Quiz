# AI Quiz Project - Network Security Wall

**Version:** 1.0
**Created:** 2026-02-13
**Status:** Active
**Project:** AI Quiz Website

---

## 🛡️ Network Security Architecture

This document defines the complete network security wall for the AI Quiz project, creating an isolated and protected environment for all project services.

---

## 🔒 Security Perimeter

### Project Boundary
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI QUIZ SECURITY WALL                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND LAYER                        │    │
│  │   Port 3000 (Next.js)  │  Port 3001/3002 (Legacy)       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API LAYER                             │    │
│  │   Port 3003 (API Server)                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    DATA LAYER                            │    │
│  │   Port 5433 (PostgreSQL) │ Port 6380 (Redis)            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    SERVICE LAYER                         │    │
│  │   Port 5672/15672 (RabbitMQ) │ Port 9000/9001 (MinIO)   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🚫 EXTERNAL ACCESS BLOCKED                                      │
│  ✅ LOCALHOST ONLY ACCESS                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Access Control Rules

### Inbound Rules (Traffic Coming IN)

| Rule | Source | Destination | Ports | Action |
|------|--------|-------------|-------|--------|
| 1 | Any (External) | AI Quiz Ports | All | 🚫 BLOCK |
| 2 | 127.0.0.1 | AI Quiz Ports | All | ✅ ALLOW |
| 3 | ::1 (IPv6 localhost) | AI Quiz Ports | All | ✅ ALLOW |
| 4 | 10.0.0.0/8 (Internal) | AI Quiz Ports | All | 🚫 BLOCK |
| 5 | 172.16.0.0/12 (Docker) | AI Quiz Ports | 3000-3003 | ✅ ALLOW |
| 6 | 172.16.0.0/12 (Docker) | AI Quiz Ports | 5433, 6380 | ✅ ALLOW |

### Outbound Rules (Traffic Going OUT)

| Rule | Source | Destination | Ports | Action |
|------|--------|-------------|-------|--------|
| 1 | AI Quiz Services | AI Quiz Ports | All | ✅ ALLOW |
| 2 | AI Quiz Services | Internet | 80 (HTTP) | ✅ ALLOW |
| 3 | AI Quiz Services | Internet | 443 (HTTPS) | ✅ ALLOW |
| 4 | AI Quiz Services | DNS Server | 53 (DNS) | ✅ ALLOW |
| 5 | AI Quiz Services | Any | Other | 🚫 BLOCK |

---

## 📋 Protected Ports Detail

### Frontend Ports (3000-3003)
```
Port 3000 - Next.js Development Server
├── Access: Localhost Only
├── Protocol: HTTP
├── Process: next.exe / node.exe
└── Firewall: Block External, Allow Localhost

Port 3001 - Legacy API
├── Access: Localhost Only
├── Protocol: HTTP
├── Process: node.exe
└── Firewall: Block External, Allow Localhost

Port 3002 - Legacy Web
├── Access: Localhost Only
├── Protocol: HTTP
├── Process: node.exe
└── Firewall: Block External, Allow Localhost

Port 3003 - Main API Server
├── Access: Localhost Only
├── Protocol: HTTP
├── Process: node.exe
└── Firewall: Block External, Allow Localhost
```

### Database Ports (5433, 6380)
```
Port 5433 - PostgreSQL Database
├── Access: Localhost + Docker Network
├── Protocol: TCP
├── Process: postgres.exe
└── Firewall: Block All External

Port 6380 - Redis Cache
├── Access: Localhost + Docker Network
├── Protocol: TCP
├── Process: redis-server.exe
└── Firewall: Block All External
```

### Message Queue Ports (5672, 15672)
```
Port 5672 - RabbitMQ AMQP
├── Access: Localhost + Docker Network
├── Protocol: AMQP
├── Process: erl.exe
└── Firewall: Block All External

Port 15672 - RabbitMQ Management
├── Access: Localhost Only
├── Protocol: HTTP
├── Process: erl.exe
└── Firewall: Block All External
```

### Storage Ports (9000, 9001)
```
Port 9000 - MinIO API
├── Access: Localhost + Docker Network
├── Protocol: HTTP/S3
├── Process: minio.exe
└── Firewall: Block All External

Port 9001 - MinIO Console
├── Access: Localhost Only
├── Protocol: HTTP
├── Process: minio.exe
└── Firewall: Block All External
```

---

## 🛠️ Firewall Configuration

### Windows Firewall Rules (PowerShell)

```powershell
# ============================================
# AI QUIZ NETWORK SECURITY WALL
# Run as Administrator
# ============================================

$ProjectPorts = @(3000, 3001, 3002, 3003, 5433, 5672, 6380, 9000, 9001, 15672)
$RulePrefix = "AI-QUIZ-WALL"

# Remove existing rules
Remove-NetFirewallRule -DisplayName "$RulePrefix*" -ErrorAction SilentlyContinue

# BLOCK all external inbound access
New-NetFirewallRule `
    -DisplayName "$RulePrefix-BLOCK-EXTERNAL-IN" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $ProjectPorts `
    -Action Block `
    -RemoteAddress "Any" `
    -Profile "Domain,Private,Public" `
    -Description "AI Quiz: Block all external inbound access"

# ALLOW localhost inbound access
New-NetFirewallRule `
    -DisplayName "$RulePrefix-ALLOW-LOCALHOST-IN" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $ProjectPorts `
    -Action Allow `
    -RemoteAddress @("127.0.0.1", "::1") `
    -Profile "Domain,Private,Public" `
    -Description "AI Quiz: Allow localhost inbound access"

# ALLOW Docker network inbound access (172.16.0.0/12)
New-NetFirewallRule `
    -DisplayName "$RulePrefix-ALLOW-DOCKER-IN" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $ProjectPorts `
    -Action Allow `
    -RemoteAddress "172.16.0.0/12" `
    -Profile "Domain,Private,Public" `
    -Description "AI Quiz: Allow Docker network inbound access"

# ALLOW outbound to project ports
New-NetFirewallRule `
    -DisplayName "$RulePrefix-ALLOW-PROJECT-OUT" `
    -Direction Outbound `
    -Protocol TCP `
    -RemotePort $ProjectPorts `
    -Action Allow `
    -Profile "Domain,Private,Public" `
    -Description "AI Quiz: Allow outbound to project ports"

# ALLOW essential outbound (HTTP/HTTPS/DNS)
New-NetFirewallRule `
    -DisplayName "$RulePrefix-ALLOW-ESSENTIAL-OUT" `
    -Direction Outbound `
    -Protocol TCP `
    -RemotePort @(53, 80, 443) `
    -Action Allow `
    -Profile "Domain,Private,Public" `
    -Description "AI Quiz: Allow essential outbound (DNS, HTTP, HTTPS)"
```

---

## 📊 Security Monitoring

### Audit Events
| Event Type | Action | Severity |
|------------|--------|----------|
| External connection attempt | Log + Block | HIGH |
| Unauthorized port access | Log + Block | MEDIUM |
| Configuration change | Log | INFO |
| Service start/stop | Log | INFO |

### Log Locations
```
Windows Firewall Log:
%SystemRoot%\System32\LogFiles\Firewall\pfirewall.log

AI Quiz Audit Log:
%SystemRoot%\System32\LogFiles\Firewall\ai-quiz-port-audit.log
```

### Monitoring Commands
```powershell
# Check firewall status
Get-NetFirewallProfile | Select-Object Name, Enabled

# View AI Quiz rules
Get-NetFirewallRule -DisplayName "AI-QUIZ-WALL*" | Format-Table

# Monitor blocked connections
Get-WinEvent -LogName "Microsoft-Windows-Windows Firewall With Advanced Security/Firewall" | Where-Object {$_.Message -match "3000|3001|3002|3003|5433|5672|6380|9000|9001|15672"}
```

---

## ⚠️ Threat Response

### Incident Response Plan

| Threat Level | Description | Response |
|--------------|-------------|----------|
| LOW | Single blocked attempt | Log only |
| MEDIUM | Multiple attempts from same IP | Log + Alert |
| HIGH | Sustained attack pattern | Log + Alert + Investigate |
| CRITICAL | Breach detected | Isolate + Alert + Emergency response |

### Emergency Isolation Procedure
```powershell
# Emergency: Block ALL traffic to AI Quiz ports
New-NetFirewallRule `
    -DisplayName "AI-QUIZ-EMERGENCY-LOCKDOWN" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $ProjectPorts `
    -Action Block `
    -RemoteAddress "Any" `
    -Profile "Any" `
    -Enabled True
```

---

## ✅ Security Checklist

### Pre-Deployment
- [ ] Firewall rules activated
- [ ] Port protection enabled
- [ ] Audit logging configured
- [ ] Monitoring dashboards set up
- [ ] Incident response plan documented

### Ongoing
- [ ] Weekly security log review
- [ ] Monthly rule audit
- [ ] Quarterly penetration testing
- [ ] Annual security assessment

---

## 📁 Related Files

| File | Purpose |
|------|---------|
| `port-lock-setup.ps1` | Firewall setup script |
| `firewall-protection.ps1` | Basic firewall rules |
| `EXCLUSIVE-PORT-BOOKING.md` | Port reservation details |
| `SECURITY-README.md` | Security overview |

---

**Security Status:** 🔒 ACTIVE
**Last Updated:** 2026-02-13
**Next Review:** 2026-03-13