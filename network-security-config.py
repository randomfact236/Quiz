# AI Quiz Project - Network Security Configuration
# This file documents the exclusive port lockdown for the AI Quiz project

# EXCLUSIVE PORT LOCKDOWN - AI QUIZ PROJECT ONLY
# ===============================================

# These ports are EXCLUSIVELY reserved for AI Quiz project
# No other projects or external services may access these ports

AI_QUIZ_EXCLUSIVE_PORTS = [
    3010,  # Next.js Development Server
    3011,  # Next.js Production Preview
    4000,  # NestJS API Server
    4001,  # NestJS Admin API
    5432,  # PostgreSQL Database
    5434,  # PostgreSQL Test Database
    6379,  # Redis Cache
    6381,  # Redis Test Instance
    5674,  # RabbitMQ AMQP
    5673,  # RabbitMQ Test Instance
    15673, # RabbitMQ Management UI
    9090,  # Prometheus Metrics
    3004,  # Grafana Dashboard
    5601,  # Kibana (ELK Stack)
    9229,  # Node.js Debug Port
    9230,  # Next.js Debug Port
    8080,  # Test Coverage Reports
    8081,  # E2E Test Runner
    9002,  # MinIO API
    9003   # MinIO Console
]

# SECURITY RESTRICTIONS
# =====================

# 1. INBOUND TRAFFIC: Only localhost (127.0.0.1, ::1) access allowed
# 2. OUTBOUND TRAFFIC: Restricted to essential services only
# 3. EXTERNAL ACCESS: Blocked for all AI Quiz ports
# 4. INTER-PROJECT COMMUNICATION: Not allowed

# ALLOWED OUTBOUND CONNECTIONS (Essential only)
ALLOWED_OUTBOUND = [
    "npmjs.org",      # Package downloads
    "registry.npmjs.org",
    "github.com",     # Git operations
    "api.github.com"
]

# BLOCKED EXTERNAL SERVICES
BLOCKED_SERVICES = [
    "External APIs",
    "Third-party services",
    "Internet access (except allowed domains)",
    "Other project ports",
    "Unapproved network connections"
]

# IMPLEMENTATION REQUIREMENTS
# ===========================

# 1. Firewall Rules:
#    - Run firewall-protection.ps1 as Administrator
#    - Block all external inbound connections to AI Quiz ports
#    - Allow only localhost inbound connections

# 2. Application Configuration:
#    - Configure services to bind only to localhost
#    - Implement connection validation
#    - Log all network connections

# 3. Development Environment:
#    - Use localhost for all inter-service communication
#    - No external dependencies allowed
#    - Isolated development environment

# MONITORING AND ENFORCEMENT
# ===========================

# Regular checks required:
# - Port availability verification
# - Firewall rule validation
# - Network traffic monitoring
# - Access log review

# VIOLATION CONSEQUENCES
# ======================

# Any unauthorized access to these ports will result in:
# - Immediate project lockdown
# - Security incident response
# - Port reassignment
# - Access revocation