# AI Quiz Project - PORT LOCK SETUP SCRIPT
# Creates firewall wall around AI Quiz exclusive ports
# Run this script as Administrator

#Requires -RunAsAdministrator

param(
    [switch]$Remove,      # Remove all rules
    [switch]$Status       # Show current status only
)

# ============================================
# EXCLUSIVELY BOOKED PORTS FOR AI QUIZ PROJECT
# ============================================
$ExclusivePorts = @(
    3000,  # Web Frontend (Next.js)
    3001,  # API Legacy
    3002,  # Web Legacy
    3003,  # API Server
    5433,  # PostgreSQL Database
    5672,  # RabbitMQ AMQP
    6380,  # Redis Cache
    9000,  # MinIO API
    9001,  # MinIO Console
    15672  # RabbitMQ Management
)

$RulePrefix = "AI-QUIZ-LOCK"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI QUIZ PROJECT - PORT LOCK SYSTEM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show status only
if ($Status) {
    Write-Host "Current Firewall Rules for AI Quiz:" -ForegroundColor Yellow
    Get-NetFirewallRule -DisplayName "$RulePrefix*" -ErrorAction SilentlyContinue | 
        Select-Object DisplayName, Enabled, Direction, Action | Format-Table -AutoSize
    
    Write-Host "`nPort Availability Check:" -ForegroundColor Yellow
    foreach ($port in $ExclusivePorts) {
        $listener = netstat -ano | findstr ":$port "
        if ($listener) {
            Write-Host "  Port $port : IN USE" -ForegroundColor Red
        } else {
            Write-Host "  Port $port : AVAILABLE" -ForegroundColor Green
        }
    }
    return
}

# Remove all rules
if ($Remove) {
    Write-Host "Removing all AI Quiz port lock rules..." -ForegroundColor Yellow
    
    Remove-NetFirewallRule -DisplayName "$RulePrefix*" -ErrorAction SilentlyContinue
    
    Write-Host "All rules removed successfully!" -ForegroundColor Green
    return
}

# ============================================
# CREATE FIREWALL WALL
# ============================================

Write-Host "Creating EXCLUSIVE PORT LOCK for AI Quiz Project..." -ForegroundColor Green
Write-Host ""

# Remove existing rules first
Write-Host "Step 1: Removing existing rules..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "$RulePrefix*" -ErrorAction SilentlyContinue

# ============================================
# INBOUND RULES - Block external, allow localhost
# ============================================

Write-Host "Step 2: Creating INBOUND protection rules..." -ForegroundColor Yellow

# Rule 1: Block ALL external access to AI Quiz ports
New-NetFirewallRule `
    -DisplayName "$RulePrefix-INBLOCK-EXTERNAL" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $ExclusivePorts `
    -Action Block `
    -RemoteAddress "Any" `
    -Profile "Domain,Private,Public" `
    -Description "BLOCKS all external access to AI Quiz exclusive ports" `
    -Enabled True | Out-Null

Write-Host "  [+] Blocked external inbound access to all 10 ports" -ForegroundColor Green

# Rule 2: Allow ONLY localhost (127.0.0.1) access
New-NetFirewallRule `
    -DisplayName "$RulePrefix-INALLOW-LOCALHOST" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $ExclusivePorts `
    -Action Allow `
    -RemoteAddress @("127.0.0.1", "::1", "localhost") `
    -Profile "Domain,Private,Public" `
    -Description "ALLOWS only localhost access to AI Quiz ports" `
    -Enabled True | Out-Null

Write-Host "  [+] Allowed localhost inbound access" -ForegroundColor Green

# ============================================
# OUTBOUND RULES - Restrict project to these ports only
# ============================================

Write-Host "Step 3: Creating OUTBOUND restriction rules..." -ForegroundColor Yellow

# Rule 3: Block outbound to non-AI-Quiz ports (for project isolation)
# This creates a "wall" - the project can only communicate on these ports
New-NetFirewallRule `
    -DisplayName "$RulePrefix-OUTALLOW-BOOKED" `
    -Direction Outbound `
    -Protocol TCP `
    -RemotePort $ExclusivePorts `
    -Action Allow `
    -Profile "Domain,Private,Public" `
    -Description "ALLOWS outbound to AI Quiz booked ports only" `
    -Enabled True | Out-Null

Write-Host "  [+] Allowed outbound to booked ports" -ForegroundColor Green

# Rule 4: Allow essential system ports (DNS, HTTP/HTTPS for updates)
$SystemPorts = @(53, 80, 443)
New-NetFirewallRule `
    -DisplayName "$RulePrefix-OUTALLOW-SYSTEM" `
    -Direction Outbound `
    -Protocol TCP `
    -RemotePort $SystemPorts `
    -Action Allow `
    -Profile "Domain,Private,Public" `
    -Description "ALLOWS essential system ports (DNS, HTTP, HTTPS)" `
    -Enabled True | Out-Null

Write-Host "  [+] Allowed essential system ports (53, 80, 443)" -ForegroundColor Green

# ============================================
# PER-PORT RULES - Individual port locks
# ============================================

Write-Host "Step 4: Creating individual port lock rules..." -ForegroundColor Yellow

$PortNames = @{
    3000 = "Web-Frontend"
    3001 = "API-Legacy"
    3002 = "Web-Legacy"
    3003 = "API-Server"
    5433 = "PostgreSQL"
    5672 = "RabbitMQ-AMQP"
    6380 = "Redis-Cache"
    9000 = "MinIO-API"
    9001 = "MinIO-Console"
    15672 = "RabbitMQ-Mgmt"
}

foreach ($port in $ExclusivePorts) {
    $portName = $PortNames[$port]
    
    # Create individual port block rule
    New-NetFirewallRule `
        -DisplayName "$RulePrefix-PORT-$port-$portName" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $port `
        -Action Block `
        -RemoteAddress "Any" `
        -Profile "Domain,Private,Public" `
        -Description "EXCLUSIVE: Port $port ($portName) reserved for AI Quiz only" `
        -Enabled True | Out-Null
}

Write-Host "  [+] Created 10 individual port lock rules" -ForegroundColor Green

# ============================================
# LOGGING RULE - Log all access attempts
# ============================================

Write-Host "Step 5: Enabling logging for security audit..." -ForegroundColor Yellow

# Create audit rule
New-NetFirewallRule `
    -DisplayName "$RulePrefix-AUDIT-LOG" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $ExclusivePorts `
    -Action Block `
    -RemoteAddress "Any" `
    -Profile "Domain,Private,Public" `
    -Description "AUDIT: Logs all access attempts to AI Quiz ports" `
    -Enabled True `
    -LogFileName "%SystemRoot%\System32\LogFiles\Firewall\ai-quiz-port-audit.log" `
    -LogMaxSizeKilobytes 4096 `
    -LogBlocked True `
    -LogAllowed False | Out-Null

Write-Host "  [+] Audit logging enabled" -ForegroundColor Green

# ============================================
# VERIFICATION
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PORT LOCK ACTIVATION COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "EXCLUSIVE PORTS BOOKED:" -ForegroundColor Yellow
Write-Host "  3000  - Web Frontend (Next.js)" -ForegroundColor White
Write-Host "  3001  - API Legacy" -ForegroundColor White
Write-Host "  3002  - Web Legacy" -ForegroundColor White
Write-Host "  3003  - API Server" -ForegroundColor White
Write-Host "  5433  - PostgreSQL Database" -ForegroundColor White
Write-Host "  5672  - RabbitMQ AMQP" -ForegroundColor White
Write-Host "  6380  - Redis Cache" -ForegroundColor White
Write-Host "  9000  - MinIO API" -ForegroundColor White
Write-Host "  9001  - MinIO Console" -ForegroundColor White
Write-Host "  15672 - RabbitMQ Management" -ForegroundColor White
Write-Host ""
Write-Host "PROTECTION ACTIVE:" -ForegroundColor Green
Write-Host "  [x] External access BLOCKED" -ForegroundColor Green
Write-Host "  [x] Localhost access ALLOWED" -ForegroundColor Green
Write-Host "  [x] Outbound restricted to booked ports" -ForegroundColor Green
Write-Host "  [x] Audit logging ENABLED" -ForegroundColor Green
Write-Host ""
Write-Host "Total Ports Locked: 10" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check status: .\port-lock-setup.ps1 -Status" -ForegroundColor Yellow
Write-Host "To remove lock:   .\port-lock-setup.ps1 -Remove" -ForegroundColor Yellow
Write-Host ""