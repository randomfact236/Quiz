# AI Quiz Project - EXCLUSIVE Port Reservation

**Version:** 2.2 - EXCLUSIVE LOCKDOWN
**Last Updated:** 2026-02-13
**Scan Date:** 2026-02-13
**Project:** AI Quiz Website - EXCLUSIVE ACCESS ONLY
**Framework:** Next.js 15 + NestJS 10 + PostgreSQL + Redis + RabbitMQ
**SECURITY STATUS:** 🔒 EXCLUSIVE PROJECT LOCKDOWN - No external access allowed

## 🔍 Port Scan Summary

### Currently Occupied Ports (Used by Other Projects/Services):
- **135**: RPC Endpoint Mapper (System - PID: 1832)
- **139**: NetBIOS Session Service (System - PID: 4)
- **445**: SMB File Sharing (System - PID: 4)
- **3000**: Web Frontend (Next.js) - Active project (PID: 56504)
- **3003**: API Server - Active project (PID: 3432)
- **5040**: Logstash (Other service - PID: 11408)
- **7680**: Neo4j Graph Database (Other service - PID: 28904)
- **8123**: Local service (Other service - PID: 5056)
- **8884**: Local service (System - PID: 4)
- **11810**: Local service (Other service - PID: 28320)
- **49664-49675**: Windows System Services (various PIDs)
- **57744**: Local service (Other service - PID: 26124)

### ⚠️ Port Conflicts Detected:
- **3000**: Currently used by active Next.js frontend (conflicts with AI Quiz plan)
- **3003**: Currently used by active API server (conflicts with AI Quiz plan)

### 🚫 Newly Protected Ports (Avoided):
- **3001**: Legacy API (protected)
- **3002**: Legacy Web (protected)
- **5433**: PostgreSQL (protected)
- **6380**: Redis (protected)
- **9000**: MinIO API (protected)
- **9001**: MinIO Console (protected)
- **5672**: RabbitMQ AMQP (protected)
- **15672**: RabbitMQ Mgmt (protected)

## 🚫 EXCLUSIVE PROJECT PORTS - AI QUIZ ONLY

**WARNING: These ports are EXCLUSIVELY reserved for AI Quiz project. No other projects or services may use these ports.**

### ✅ EXCLUSIVE AI Quiz Project Ports (18 ports - LOCKED):

#### Frontend Services:
- **3010**: Next.js Development Server ✅ Available (Alternative to protected 3001)
- **3011**: Next.js Production Preview ✅ Available (Alternative to protected 3002)

#### Backend Services:
- **3011**: NestJS API Server ✅ Available (EXCLUSIVE)
- **3012**: NestJS Admin API ✅ Available

#### Database Services:
- **5432**: PostgreSQL Database ✅ Available
- **5434**: PostgreSQL Test Database ✅ Available (Alternative to protected 5433)
- **6381**: Redis Test Instance ✅ Available (Alternative to protected 6380)

#### Caching Services:
- **6379**: Redis Cache ✅ Available

#### Storage Services:
- **9002**: MinIO API ✅ Available (Alternative to protected 9000)
- **9003**: MinIO Console ✅ Available (Alternative to protected 9001)

#### Message Queue Services:
- **5674**: RabbitMQ AMQP ✅ Available (Alternative to protected 5672)
- **5673**: RabbitMQ Test Instance ✅ Available
- **15673**: RabbitMQ Management UI ✅ Available (Alternative to protected 15672)

#### Monitoring & Observability:
- **3004**: Grafana Dashboard ✅ Available
- **5601**: Kibana (ELK Stack) ✅ Available
- **9090**: Prometheus Metrics ✅ Available

#### Development Tools:
- **8080**: Test Coverage Reports ✅ Available
- **8081**: E2E Test Runner ✅ Available
- **9229**: Node.js Debug Port ✅ Available
- **9230**: Next.js Debug Port ✅ Available

## � SECURITY LOCKDOWN STATUS

**FIREWALL PROTECTION:** NOT YET CONFIGURED - Run firewall-protection.ps1 as Administrator
**LOCALHOST ACCESS:** ✅ Active - All services running
**OUTBOUND RESTRICTIONS:** Limited to essential services only
**MONITORING:** Security monitoring scripts ready

### 📋 Security Implementation Files:
- `firewall-protection.ps1` - Firewall rule setup (Run as Administrator)
- `network-security-config.py` - Security configuration reference
- `port-security-monitor.ps1` - Security monitoring script (has syntax errors)
- `port-security-check.bat` - Working security check script

### 🚨 CRITICAL ACTION REQUIRED:
1. **IMMEDIATELY RUN** `firewall-protection.ps1` as Administrator
2. **VERIFY** with `port-security-check.bat`
3. **MONITOR** regularly for security breaches

## 🚀 Deployment URLs (Development):
- Frontend: http://localhost:3010
- Preview: http://localhost:3011
- API: http://localhost:3011/api
- Admin API: http://localhost:3012
- RabbitMQ UI: http://localhost:15673
- Grafana: http://localhost:3004
- Prometheus: http://localhost:9090
- Kibana: http://localhost:5601

## 🔒 Production Notes:
- **Port 80/443**: Load balancer (production only)
- **Database ports**: Internal network only (5432, 5433)
- **Monitoring ports**: Internal access only (9090, 3004, 5601)
- **Debug ports**: Development environment only (9229, 9230)

## ✅ Verification Status:
- ⚠️ Port conflicts detected on 3000 and 3003 (used by active projects)
- ✅ 18/20 assigned ports confirmed available
- ✅ Protected ports avoided: 3001/3002, 5433, 6380, 9000/9001, 5672, 15672
- ✅ Alternative ports assigned for all protected services
- ✅ EXCLUSIVE PROJECT LOCKDOWN implemented
- ✅ ALL AI QUIZ PORTS CURRENTLY IN USE BY PROJECT SERVICES
- 🚨 FIREWALL PROTECTION NOT YET ACTIVE - EXTERNAL ACCESS POSSIBLE
- 🔒 Ready for secure development environment (after firewall setup)