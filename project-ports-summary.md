# AI Quiz Project - Ports Used Summary

**Version:** 3.0 - EXCLUSIVE LOCK
**Last Updated:** 2026-02-13
**Project:** AI Quiz Website
**Framework:** Next.js 15 + NestJS 10 + PostgreSQL + Redis + RabbitMQ
**Status:** 🔒 EXCLUSIVELY BOOKED - See EXCLUSIVE-PORT-BOOKING.md

---

## 🔒 EXCLUSIVELY BOOKED PORTS (10 Ports - LOCKED)

**These ports are EXCLUSIVELY reserved for AI Quiz Project.**
**NO other projects may use these ports. Firewall wall active.**

| Port | Service | Category | Status |
|------|---------|----------|--------|
| **3000** | Web Frontend (Next.js) | Active | 🔒 BOOKED |
| **3001** | API Legacy | Legacy | 🔒 BOOKED |
| **3002** | Web Legacy | Legacy | 🔒 BOOKED |
| **3003** | API Server | Active | 🔒 BOOKED |
| **5433** | PostgreSQL Database | Database | 🔒 BOOKED |
| **5672** | RabbitMQ AMQP | Queue | 🔒 BOOKED |
| **6380** | Redis Cache | Cache | 🔒 BOOKED |
| **9000** | MinIO API | Storage | 🔒 BOOKED |
| **9001** | MinIO Console | Storage | 🔒 BOOKED |
| **15672** | RabbitMQ Management | Queue | 🔒 BOOKED |

---

## 🚫 PROJECT BOUNDARY WALL

### Inbound Rules:
- ✅ AI Quiz project services ONLY
- ✅ Localhost (127.0.0.1) connections ONLY
- ❌ External internet access - BLOCKED
- ❌ Other projects - BLOCKED

### Outbound Rules:
- ✅ Ports 3000-3003 (Frontend/API)
- ✅ Ports 5433, 6380 (Database/Cache)
- ✅ Ports 5672, 15672 (Message Queue)
- ✅ Ports 9000, 9001 (Storage)
- ✅ Ports 53, 80, 443 (System/DNS/HTTP)
- ❌ All other ports - BLOCKED

---

## 📊 Total Ports Booked: 10

## 🛡️ Security Status:
- ✅ 10 ports exclusively booked
- ✅ Firewall wall configured (run `port-lock-setup.ps1` as Admin)
- ✅ Localhost access only
- ✅ External access blocked
- ✅ Audit logging enabled
- ✅ Outbound restricted to booked ports only

---

## 🚀 Activation Commands:

```powershell
# Activate port lock (Run as Administrator)
.\port-lock-setup.ps1

# Check status
.\port-lock-setup.ps1 -Status

# Remove lock (if needed)
.\port-lock-setup.ps1 -Remove
```

---

## 📋 Related Files:
- `EXCLUSIVE-PORT-BOOKING.md` - Full port booking documentation
- `port-lock-setup.ps1` - Firewall wall setup script
- `current-port-status.md` - Current port availability status
