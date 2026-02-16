#!/usr/bin/env pwsh
# =============================================================================
# AI Quiz Platform - Service Diagnostic Script
# =============================================================================
# Comprehensive diagnostic tool to identify connection issues
# Run this first to understand what's wrong
#
# Usage:
#   .\scripts\diagnose-services.ps1
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Verbose,
    [string]$TargetUrl = "http://localhost:3010"
)

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"
$Magenta = "Magenta"

# Results collection
$script:Issues = @()
$script:Warnings = @()
$script:Successes = @()

function Write-Banner {
    Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Blue
    Write-Host "║           AI Quiz Platform - Connection Diagnostic               ║" -ForegroundColor $Blue
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Blue
    Write-Host ""
}

function Add-Issue($Message, $Severity = "ERROR") {
    $script:Issues += @{ Message = $Message; Severity = $Severity }
    Write-Host "  ✗ $Message" -ForegroundColor $Red
}

function Add-Warning($Message) {
    $script:Warnings += $Message
    Write-Host "  ⚠ $Message" -ForegroundColor $Yellow
}

function Add-Success($Message) {
    $script:Successes += $Message
    Write-Host "  ✓ $Message" -ForegroundColor $Green
}

# =============================================================================
# Test 1: Docker Status
# =============================================================================
function Test-DockerStatus {
    Write-Host "`n[1/10] Checking Docker Status..." -ForegroundColor $Blue
    
    try {
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            Add-Success "Docker daemon is running"
            
            # Check Docker Compose
            $composeVersion = docker compose version 2>&1
            if ($composeVersion -match "Docker Compose") {
                Add-Success "Docker Compose is available"
            } else {
                Add-Issue "Docker Compose not found or not working"
            }
        } else {
            Add-Issue "Docker daemon is NOT running - Start Docker Desktop or Docker service"
        }
    } catch {
        Add-Issue "Cannot connect to Docker: $($_.Exception.Message)"
    }
}

# =============================================================================
# Test 2: Container Status
# =============================================================================
function Test-ContainerStatus {
    Write-Host "`n[2/10] Checking Container Status..." -ForegroundColor $Blue
    
    $expectedContainers = @(
        @{ Name = "ai-quiz-frontend"; Port = 3010 },
        @{ Name = "ai-quiz-backend"; Port = 4000 },
        @{ Name = "ai-quiz-postgres"; Port = 5432 },
        @{ Name = "ai-quiz-redis"; Port = 6379 },
        @{ Name = "ai-quiz-minio"; Port = 9000 }
    )
    
    foreach ($container in $expectedContainers) {
        $status = docker ps --filter "name=$($container.Name)" --format "{{.Status}}" 2>&1
        if ($status) {
            if ($status -match "healthy") {
                Add-Success "$($container.Name) is running and healthy"
            } elseif ($status -match "Up") {
                Add-Warning "$($container.Name) is running but health check status unknown"
            } else {
                Add-Issue "$($container.Name) status: $status"
            }
        } else {
            # Check if container exists but is stopped
            $exited = docker ps -a --filter "name=$($container.Name)" --filter "status=exited" --format "{{.Names}}" 2>&1
            if ($exited -match $container.Name) {
                Add-Issue "$($container.Name) container exists but is STOPPED - Start it with: docker start $($container.Name)"
                
                # Get exit reason
                $exitCode = docker inspect --format='{{.State.ExitCode}}' $container.Name 2>&1
                $errorLog = docker logs --tail 20 $container.Name 2>&1
                Write-Host "      Exit code: $exitCode" -ForegroundColor $Yellow
                Write-Host "      Recent logs:" -ForegroundColor $Yellow
                $errorLog | ForEach-Object { Write-Host "        $_" -ForegroundColor Gray }
            } else {
                Add-Issue "$($container.Name) container NOT FOUND - Run: docker-compose up -d"
            }
        }
    }
}

# =============================================================================
# Test 3: Port Availability
# =============================================================================
function Test-PortAvailability {
    Write-Host "`n[3/10] Checking Port Availability..." -ForegroundColor $Blue
    
    $ports = @(3010, 4000, 5432, 6379, 9000, 9001)
    
    foreach ($port in $ports) {
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
            if ($connection.TcpTestSucceeded) {
                # Check what's using the port
                $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
                    Select-Object -First 1 | 
                    ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
                
                Add-Success "Port $port is open (Process: $($process.ProcessName))"
            } else {
                Add-Issue "Port $port is NOT accessible - Service may not be running or is blocked"
            }
        } catch {
            Add-Issue "Cannot test port $port`: $($_.Exception.Message)"
        }
    }
}

# =============================================================================
# Test 4: HTTP Connectivity
# =============================================================================
function Test-HttpConnectivity {
    Write-Host "`n[4/10] Testing HTTP Connectivity..." -ForegroundColor $Blue
    
    $endpoints = @(
        @{ Url = "http://localhost:3010"; Name = "Frontend" },
        @{ Url = "http://localhost:4000/api/health"; Name = "Backend Health" },
        @{ Url = "http://localhost:4000/api"; Name = "Backend API Root" }
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            Add-Success "$($endpoint.Name) at $($endpoint.Url) - Status: $($response.StatusCode)"
        } catch {
            $statusCode = $_.Exception.Response?.StatusCode.value__
            if ($statusCode) {
                Add-Warning "$($endpoint.Name) returned HTTP $statusCode - Service is running but returned error"
            } else {
                Add-Issue "$($endpoint.Name) at $($endpoint.Url) - CONNECTION REFUSED: $($_.Exception.Message)"
            }
        }
    }
}

# =============================================================================
# Test 5: Docker Network
# =============================================================================
function Test-DockerNetwork {
    Write-Host "`n[5/10] Checking Docker Network..." -ForegroundColor $Blue
    
    $network = docker network ls --filter "name=ai-quiz-network" --format "{{.Name}}" 2>&1
    if ($network -match "ai-quiz-network") {
        Add-Success "Docker network 'ai-quiz-network' exists"
        
        # Check containers are connected
        $connected = docker network inspect ai-quiz-network --format "{{json .Containers}}" 2>&1
        if ($connected -match "ai-quiz") {
            Add-Success "Containers are connected to the network"
        } else {
            Add-Issue "No containers found on ai-quiz-network - Services may not be connected"
        }
    } else {
        Add-Issue "Docker network 'ai-quiz-network' NOT FOUND - Create with: docker network create ai-quiz-network"
    }
}

# =============================================================================
# Test 6: Firewall Status
# =============================================================================
function Test-FirewallStatus {
    Write-Host "`n[6/10] Checking Firewall..." -ForegroundColor $Blue
    
    try {
        $firewallProfiles = Get-NetFirewallProfile | Where-Object { $_.Enabled -eq 'True' }
        if ($firewallProfiles) {
            Add-Warning "Windows Firewall is enabled on profiles: $($firewallProfiles.Name -join ', ')"
            
            # Check for specific port rules
            $frontendRule = Get-NetFirewallRule -DisplayName "*3010*" -ErrorAction SilentlyContinue
            if (-not $frontendRule) {
                Add-Warning "No explicit firewall rule found for port 3010"
            }
        } else {
            Add-Success "Windows Firewall is disabled (ports should be accessible)"
        }
    } catch {
        Add-Warning "Could not check firewall status: $($_.Exception.Message)"
    }
    
    # Check Windows Defender (may block localhost)
    try {
        $defender = Get-MpComputerStatus -ErrorAction SilentlyContinue
        if ($defender.RealTimeProtectionEnabled) {
            Add-Warning "Windows Defender Real-time Protection is enabled (may block connections)"
        }
    } catch {
        # Ignore - may not have permission
    }
}

# =============================================================================
# Test 7: Environment File
# =============================================================================
function Test-EnvironmentFile {
    Write-Host "`n[7/10] Checking Environment Configuration..." -ForegroundColor $Blue
    
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    $envFile = Join-Path $projectRoot ".env"
    
    if (Test-Path $envFile) {
        Add-Success ".env file exists"
        
        # Check critical variables
        $content = Get-Content $envFile -Raw
        $criticalVars = @("JWT_SECRET", "DB_PASSWORD", "REDIS_PASSWORD")
        foreach ($var in $criticalVars) {
            if ($content -match "$var=.+" -and -not ($content -match "$var=change_this")) {
                Add-Success "$var is configured"
            } else {
                Add-Warning "$var may not be properly configured"
            }
        }
    } else {
        Add-Issue ".env file NOT FOUND at $envFile - Run setup script first"
    }
}

# =============================================================================
# Test 8: DNS/Hosts File
# =============================================================================
function Test-HostsFile {
    Write-Host "`n[8/10] Checking Hosts File..." -ForegroundColor $Blue
    
    $hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
    try {
        $hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue
        $localhostEntries = $hostsContent | Where-Object { $_ -match "localhost" }
        
        if ($localhostEntries) {
            Add-Success "localhost entries found in hosts file"
            if ($Verbose) {
                $localhostEntries | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
            }
        } else {
            Add-Warning "No localhost entries in hosts file (should have: 127.0.0.1 localhost)"
        }
    } catch {
        Add-Warning "Cannot read hosts file: $($_.Exception.Message)"
    }
}

# =============================================================================
# Test 9: Resource Usage
# =============================================================================
function Test-ResourceUsage {
    Write-Host "`n[9/10] Checking Resource Usage..." -ForegroundColor $Blue
    
    try {
        $memory = Get-CimInstance -ClassName Win32_OperatingSystem
        $freeMemoryGB = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
        $totalMemoryGB = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
        
        if ($freeMemoryGB -lt 1) {
            Add-Issue "Very low memory available: $freeMemoryGB GB free of $totalMemoryGB GB - Docker may fail"
        } elseif ($freeMemoryGB -lt 2) {
            Add-Warning "Low memory available: $freeMemoryGB GB free of $totalMemoryGB GB"
        } else {
            Add-Success "Memory available: $freeMemoryGB GB free of $totalMemoryGB GB"
        }
        
        # Check Docker resource limits
        $dockerInfo = docker system info --format "{{json .}}" | ConvertFrom-Json
        if ($dockerInfo.MemTotal -lt 4GB) {
            Add-Warning "Docker memory limit is low ($([math]::Round($dockerInfo.MemTotal / 1GB, 1)) GB) - Increase in Docker Desktop settings"
        }
    } catch {
        Add-Warning "Could not check resource usage: $($_.Exception.Message)"
    }
}

# =============================================================================
# Test 10: Docker Logs Analysis
# =============================================================================
function Test-DockerLogs {
    Write-Host "`n[10/10] Analyzing Recent Docker Logs..." -ForegroundColor $Blue
    
    $services = @("ai-quiz-frontend", "ai-quiz-backend", "ai-quiz-postgres", "ai-quiz-redis")
    
    foreach ($service in $services) {
        $logs = docker logs --tail 10 $service 2>&1
        if ($logs) {
            # Check for common errors
            if ($logs -match "Error|error|ERROR|Exception|exception|FATAL|fatal") {
                $errorLine = ($logs -split "`n") | Where-Object { $_ -match "Error|error|ERROR|Exception|exception|FATAL|fatal" } | Select-Object -First 1
                Add-Issue "$service has recent errors in logs: $errorLine"
            } else {
                Add-Success "$service logs look clean (no obvious errors)"
            }
        } else {
            Add-Warning "Could not retrieve logs for $service"
        }
    }
}

# =============================================================================
# Summary Report
# =============================================================================
function Show-Summary {
    Write-Host "`n═══════════════════════════════════════════════════════════════════" -ForegroundColor $Blue
    Write-Host "                     DIAGNOSTIC SUMMARY" -ForegroundColor $Blue
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $Blue
    
    Write-Host "`n✓ Passed: $($script:Successes.Count)" -ForegroundColor $Green
    Write-Host "⚠ Warnings: $($script:Warnings.Count)" -ForegroundColor $Yellow
    Write-Host "✗ Issues: $($script:Issues.Count)" -ForegroundColor $Red
    
    if ($script:Issues.Count -gt 0) {
        Write-Host "`n═══════════════════════════════════════════════════════════════════" -ForegroundColor $Red
        Write-Host "                         CRITICAL ISSUES" -ForegroundColor $Red
        Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $Red
        
        foreach ($issue in $script:Issues) {
            Write-Host "  • $($issue.Message)" -ForegroundColor $Red
        }
        
        Write-Host "`n🔧 RECOMMENDED ACTIONS:" -ForegroundColor $Yellow
        
        # Group issues by category
        $dockerIssues = $script:Issues | Where-Object { $_.Message -match "Docker|docker" }
        $containerIssues = $script:Issues | Where-Object { $_.Message -match "container|Container" }
        $portIssues = $script:Issues | Where-Object { $_.Message -match "port|Port" }
        $connectionIssues = $script:Issues | Where-Object { $_.Message -match "connect|Connect|refused" }
        
        if ($dockerIssues) {
            Write-Host "  1. Start Docker Desktop or Docker service" -ForegroundColor $Yellow
        }
        if ($containerIssues) {
            Write-Host "  2. Start containers: docker-compose up -d" -ForegroundColor $Yellow
        }
        if ($portIssues -or $connectionIssues) {
            Write-Host "  3. Check firewall settings for ports 3010, 4000" -ForegroundColor $Yellow
            Write-Host "  4. Verify services are healthy: docker-compose ps" -ForegroundColor $Yellow
        }
        
        Write-Host "`n💡 Run auto-repair: .\scripts\auto-repair.ps1" -ForegroundColor $Magenta
        
        return $false
    } else {
        Write-Host "`n✅ All checks passed! Your application should be accessible." -ForegroundColor $Green
        Write-Host "   Try opening: http://localhost:3010" -ForegroundColor $Green
        return $true
    }
}

# =============================================================================
# Main
# =============================================================================
Write-Banner

Test-DockerStatus
Test-ContainerStatus
Test-PortAvailability
Test-HttpConnectivity
Test-DockerNetwork
Test-FirewallStatus
Test-EnvironmentFile
Test-HostsFile
Test-ResourceUsage
Test-DockerLogs

$success = Show-Summary

# Export results for other scripts
$diagnosticResult = @{
    Success = $success
    Issues = $script:Issues
    Warnings = $script:Warnings
    Successes = $script:Successes
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$resultFile = Join-Path $scriptDir ".diagnostic-result.json"
$diagnosticResult | ConvertTo-Json -Depth 10 | Set-Content $resultFile

exit ($success ? 0 : 1)
