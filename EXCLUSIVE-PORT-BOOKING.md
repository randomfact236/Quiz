# AI Quiz Project - EXCLUSIVE PORT BOOKING

**Version:** 1.0 - LOCKED
**Created:** 2026-02-13
**Project:** AI Quiz Website
**Status:** 🔒 EXCLUSIVE - NO OTHER PROJECT MAY USE THESE PORTS

---

## 🔒 EXCLUSIVELY BOOKED PORTS (10 Ports)

**WARNING: These 10 ports are EXCLUSIVELY reserved for AI Quiz project.**
**No other projects or services are permitted to use these ports.**

| # | Port | Service | Category | Status |
|---|------|---------|----------|--------|
| 1 | **3000** | Web Frontend (Next.js) | Active | 🔒 BOOKED |
| 2 | **3001** | API Legacy | Legacy | 🔒 BOOKED |
| 3 | **3002** | Web Legacy | Legacy | 🔒 BOOKED |
| 4 | **3003** | API Server | Active | 🔒 BOOKED |
| 5 | **5433** | PostgreSQL Database | Database | 🔒 BOOKED |
| 6 | **5672** | RabbitMQ AMQP | Queue | 🔒 BOOKED |
| 7 | **6380** | Redis Cache | Cache | 🔒 BOOKED |
| 8 | **9000** | MinIO API | Storage | 🔒 BOOKED |
| 9 | **9001** | MinIO Console | Storage | 🔒 BOOKED |
| 10 | **15672** | RabbitMQ Management | Queue | 🔒 BOOKED |

---

## 🚫 PROJECT BOUNDARY RULES

### INBOUND RULES (What can access these ports):
- ✅ AI Quiz project services ONLY
- ✅ Localhost (127.0.0.1) connections ONLY
- ❌ External internet access - BLOCKED
- ❌ Other projects - BLOCKED
- ❌ Remote connections - BLOCKED

### OUTBOUND RULES (This project can only use):
- ✅ Ports 3000, 3001, 3002, 3003 (Frontend/API)
- ✅ Ports 5433, 6380 (Database/Cache)
- ✅ Ports 5672, 15672 (Message Queue)
- ✅ Ports 9000, 9001 (Storage)
- ❌ All other ports - BLOCKED

---

## 🛡️ FIREWALL CONFIGURATION

### Port Range Locked: 3000-3003, 5433, 5672, 6380, 9000-9001, 15672

### Inbound Protection:
```
Block ALL external access to booked ports
Allow ONLY localhost (127.0.0.1, ::1) connections
Deny access from any other project/service
```

### Outbound Restriction:
```
Allow outbound ONLY to booked ports
Block any attempt to use non-booked ports
Log all violation attempts
```

---

## 📋 PORT ALLOCATION DETAILS

### Frontend/API Layer (3000-3003):
| Port | Service | Process Name | Config File |
|------|---------|--------------|-------------|
| 3000 | Next.js Dev Server | next.exe | next.config.js |
| 3001 | Legacy API | node.exe | server.config.js |
| 3002 | Legacy Web | node.exe | web.config.js |
| 3003 | Main API Server | node.exe | api.config.js |

### Data Layer (5433, 6380):
| Port | Service | Process Name | Config File |
|------|---------|--------------|-------------|
| 5433 | PostgreSQL | postgres.exe | postgresql.conf |
| 6380 | Redis Cache | redis-server.exe | redis.conf |

### Message Queue Layer (5672, 15672):
| Port | Service | Process Name | Config File |
|------|---------|--------------|-------------|
| 5672 | RabbitMQ AMQP | erl.exe | rabbitmq.conf |
| 15672 | RabbitMQ Mgmt UI | erl.exe | rabbitmq.conf |

### Storage Layer (9000-9001):
| Port | Service | Process Name | Config File |
|------|---------|--------------|-------------|
| 9000 | MinIO API | minio.exe | minio.conf |
| 9001 | MinIO Console | minio.exe | minio.conf |

---

## ⚠️ VIOLATION POLICY

Any attempt to use these ports by non-AI-Quiz projects will:
1. Be logged to security audit file
2. Be blocked by firewall rules
3. Trigger alert notification

Any attempt by AI Quiz project to use non-booked ports will:
1. Be blocked by outbound firewall
2. Be logged for review
3. Require manual override by administrator

---

## 🔄 CHANGE LOG

| Date | Version | Change |
|------|---------|--------|
| 2026-02-13 | 1.0 | Initial exclusive booking - 10 ports locked |

---

## ✅ ACTIVATION STATUS

- [ ] Firewall rules applied (Run `firewall-protection.ps1` as Admin)
- [ ] Port lock verified
- [ ] Outbound restrictions active
- [ ] Monitoring enabled

**To activate:** Run `.\port-lock-setup.ps1` as Administrator

---

**LOCKED BY:** AI Quiz Project
**LOCK DATE:** 2026-02-13
**UNLOCK REQUIRES:** Administrator approval + documented reason