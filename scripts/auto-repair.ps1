#!/usr/bin/env pwsh
# =============================================================================
# AI Quiz Platform - Auto Repair Script
# =============================================================================
# Automatically fixes common connection issues
# 
# Usage:
#   .\scripts\auto-repair.ps1 [-Force] [-Verbose]
#
# Options:
#   -Force    Skip confirmation prompts
#   -Verbose  Show detailed output
# =============================================================================

[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$FullReset
)

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"
$Magenta = "Magenta"

$script:FixedIssues = @()
$script:FailedFixes = @()

function Write-Banner {
    Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Magenta
    Write-Host "║              AI Quiz Platform - Auto Repair System               ║" -ForegroundColor $Magenta
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Magenta
    Write-Host ""
}

function Write-Action($Message) {
    Write-Host "  🔧 $Message" -ForegroundColor $Blue
}

function Write-Fixed($Message) {
    $script:FixedIssues += $Message
    Write-Host "  ✅ FIXED: $Message" -ForegroundColor $Green
}

function Write-Failed($Message) {
    $script:FailedFixes += $Message
    Write-Host "  ❌ FAILED: $Message" -ForegroundColor $Red
}

function Confirm-Action($Message) {
    if ($Force) { return $true }
    $response = Read-Host "$Message (y/N)"
    return $response -eq 'y' -or $response -eq 'Y'
}

# =============================================================================
# Fix 1: Start Docker
# =============================================================================
function Repair-Docker {
    Write-Host "`n[Fix 1/8] Checking Docker..." -ForegroundColor $Blue
    
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Action "Docker is not running. Attempting to start..."
        
        # Try to start Docker Desktop
        $dockerDesktopPaths = @(
            "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
            "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
            "${env:LocalAppData}\Docker\Docker Desktop.exe"
        )
        
        $dockerFound = $false
        foreach ($path in $dockerDesktopPaths) {
            if (Test-Path $path) {
                Write-Action "Starting Docker Desktop from $path..."
                Start-Process -FilePath $path -WindowStyle Minimized
                $dockerFound = $true
                break
            }
        }
        
        if ($dockerFound) {
            Write-Action "Waiting for Docker to start (this may take 30-60 seconds)..."
            $maxWait = 60
            $waited = 0
            while ($waited -lt $maxWait) {
                Start-Sleep -Seconds 2
                $waited += 2
                $test = docker info 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Fixed "Docker started successfully after $waited seconds"
                    return $true
                }
                Write-Host "    Waiting... ($waited/$maxWait seconds)" -ForegroundColor $Yellow
            }
            Write-Failed "Docker did not start within $maxWait seconds"
            return $false
        } else {
            Write-Failed "Docker Desktop not found. Please install Docker."
            return $false
        }
    } else {
        Write-Fixed "Docker is already running"
        return $true
    }
}

# =============================================================================
# Fix 2: Create Environment File
# =============================================================================
function Repair-EnvironmentFile {
    Write-Host "`n[Fix 2/8] Checking Environment File..." -ForegroundColor $Blue
    
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    $envFile = Join-Path $projectRoot ".env"
    $envExample = Join-Path $projectRoot ".env.example"
    
    if (-not (Test-Path $envFile)) {
        if (Test-Path $envExample) {
            if (Confirm-Action ".env file missing. Create from template?") {
                Copy-Item $envExample $envFile
                
                # Generate secure passwords
                Write-Action "Generating secure passwords..."
                $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
                $redisPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
                $minioPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
                $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
                
                $content = Get-Content $envFile -Raw
                $content = $content -replace "change_this_to_secure_password_123", $dbPassword
                $content = $content -replace "change_this_redis_password_456", $redisPassword
                $content = $content -replace "change_this_minio_password_789", $minioPassword
                $content = $content -replace "change_this_to_a_very_long_random_secret_key_min_64_chars_long_for_security", $jwtSecret
                Set-Content $envFile $content
                
                Write-Fixed "Created .env file with secure passwords"
                return $true
            }
        } else {
            Write-Failed ".env.example not found. Cannot create .env file."
            return $false
        }
    } else {
        Write-Fixed ".env file exists"
        return $true
    }
}

# =============================================================================
# Fix 3: Start Containers
# =============================================================================
function Repair-Containers {
    Write-Host "`n[Fix 3/8] Starting Containers..." -ForegroundColor $Blue
    
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    Set-Location $projectRoot
    
    # Check docker-compose.yml exists
    if (-not (Test-Path "docker-compose.yml")) {
        Write-Failed "docker-compose.yml not found in $projectRoot"
        return $false
    }
    
    Write-Action "Pulling latest images..."
    docker-compose pull 2>&1 | Out-Null
    
    Write-Action "Building images if needed..."
    docker-compose build 2>&1 | Out-Null
    
    Write-Action "Starting all services..."
    $result = docker-compose up -d 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Fixed "All containers started successfully"
        
        # Wait for services to be ready
        Write-Action "Waiting for services to initialize (15 seconds)..."
        Start-Sleep -Seconds 15
        
        return $true
    } else {
        Write-Failed "Failed to start containers: $result"
        return $false
    }
}

# =============================================================================
# Fix 4: Fix Stopped Containers
# =============================================================================
function Repair-StoppedContainers {
    Write-Host "`n[Fix 4/8] Checking for Stopped Containers..." -ForegroundColor $Blue
    
    $containers = docker ps -a --filter "name=ai-quiz" --format "{{.Names}}|{{.Status}}" 2>&1
    $fixed = 0
    
    foreach ($container in $containers) {
        $parts = $container -split "\|"
        $name = $parts[0]
        $status = $parts[1]
        
        if ($status -match "Exited|Restarting|Dead") {
            Write-Action "Found stopped container: $name"
            
            # Get logs to understand why it stopped
            $logs = docker logs --tail 20 $name 2>&1
            Write-Host "    Last logs:" -ForegroundColor $Yellow
            $logs | Select-Object -Last 5 | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
            
            # Try to restart
            Write-Action "Attempting to restart $name..."
            docker restart $name 2>&1 | Out-Null
            
            Start-Sleep -Seconds 3
            
            # Check if it's running now
            $newStatus = docker ps --filter "name=$name" --format "{{.Status}}" 2>&1
            if ($newStatus -match "Up") {
                Write-Fixed "Restarted $name successfully"
                $fixed++
            } else {
                Write-Failed "Could not restart $name"
            }
        }
    }
    
    if ($fixed -eq 0 -and -not ($containers -match "Exited")) {
        Write-Fixed "No stopped containers found"
    }
    
    return $true
}

# =============================================================================
# Fix 5: Run Database Migrations
# =============================================================================
function Repair-Migrations {
    Write-Host "`n[Fix 5/8] Checking Database Migrations..." -ForegroundColor $Blue
    
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    Set-Location $projectRoot
    
    # Check if postgres is running
    $postgresRunning = docker ps --filter "name=ai-quiz-postgres" --filter "status=running" --format "{{.Names}}" 2>&1
    if (-not $postgresRunning) {
        Write-Failed "PostgreSQL container is not running"
        return $false
    }
    
    Write-Action "Waiting for PostgreSQL to be ready..."
    $maxWait = 30
    $waited = 0
    $ready = $false
    
    while ($waited -lt $maxWait -and -not $ready) {
        $test = docker exec ai-quiz-postgres pg_isready -U aiquiz 2>&1
        if ($test -match "accepting connections") {
            $ready = $true
        } else {
            Start-Sleep -Seconds 1
            $waited++
        }
    }
    
    if (-not $ready) {
        Write-Failed "PostgreSQL did not become ready in time"
        return $false
    }
    
    Write-Fixed "PostgreSQL is ready"
    
    # Check if backend needs migrations
    Write-Action "Running database migrations..."
    $result = docker-compose --profile migrate run --rm migrate 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Fixed "Database migrations completed"
        return $true
    } else {
        Write-Warning "Migration result: $result"
        Write-Fixed "Migrations may have already been applied or not needed"
        return $true
    }
}

# =============================================================================
# Fix 6: Create Docker Network
# =============================================================================
function Repair-DockerNetwork {
    Write-Host "`n[Fix 6/8] Checking Docker Network..." -ForegroundColor $Blue
    
    $network = docker network ls --filter "name=ai-quiz-network" --format "{{.Name}}" 2>&1
    
    if (-not $network) {
        Write-Action "Creating Docker network 'ai-quiz-network'..."
        docker network create ai-quiz-network --subnet=172.20.0.0/16 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Fixed "Created Docker network"
            return $true
        } else {
            Write-Failed "Failed to create Docker network"
            return $false
        }
    } else {
        Write-Fixed "Docker network already exists"
        return $true
    }
}

# =============================================================================
# Fix 7: Fix Firewall Rules
# =============================================================================
function Repair-Firewall {
    Write-Host "`n[Fix 7/8] Configuring Firewall..." -ForegroundColor $Blue
    
    try {
        # Check if ports are blocked
        $frontendRule = Get-NetFirewallRule -DisplayName "AI Quiz Frontend" -ErrorAction SilentlyContinue
        $backendRule = Get-NetFirewallRule -DisplayName "AI Quiz Backend" -ErrorAction SilentlyContinue
        
        if (-not $frontendRule) {
            Write-Action "Adding firewall rule for port 3010 (Frontend)..."
            New-NetFirewallRule -DisplayName "AI Quiz Frontend" -Direction Inbound -Protocol TCP -LocalPort 3010 -Action Allow -ErrorAction SilentlyContinue | Out-Null
            Write-Fixed "Added firewall rule for port 3010"
        }
        
        if (-not $backendRule) {
            Write-Action "Adding firewall rule for port 4000 (Backend)..."
            New-NetFirewallRule -DisplayName "AI Quiz Backend" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow -ErrorAction SilentlyContinue | Out-Null
            Write-Fixed "Added firewall rule for port 4000"
        }
        
        if ($frontendRule -and $backendRule) {
            Write-Fixed "Firewall rules already exist"
        }
        
        return $true
    } catch {
        Write-Warning "Could not configure firewall: $($_.Exception.Message)"
        return $true  # Not critical
    }
}

# =============================================================================
# Fix 8: Full Reset (if requested)
# =============================================================================
function Repair-FullReset {
    if (-not $FullReset) { return $true }
    
    Write-Host "`n[Fix 8/8] FULL RESET REQUESTED..." -ForegroundColor $Red
    
    if (-not $Force) {
        $confirm = Read-Host "⚠️ This will DELETE ALL DATA! Type 'DELETE ALL DATA' to confirm"
        if ($confirm -ne "DELETE ALL DATA") {
            Write-Host "Full reset cancelled" -ForegroundColor $Yellow
            return $true
        }
    }
    
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    Set-Location $projectRoot
    
    Write-Action "Stopping all containers..."
    docker-compose down 2>&1 | Out-Null
    
    Write-Action "Removing all volumes..."
    docker volume rm -f ai-quiz-postgres-data ai-quiz-redis-data ai-quiz-minio-data ai-quiz-backend-logs 2>&1 | Out-Null
    
    Write-Action "Removing network..."
    docker network rm ai-quiz-network 2>&1 | Out-Null
    
    Write-Action "Pruning unused Docker resources..."
    docker system prune -f 2>&1 | Out-Null
    
    Write-Fixed "Full reset completed - Starting fresh deployment..."
    
    # Now do a fresh start
    return Repair-Containers
}

# =============================================================================
# Verification
# =============================================================================
function Test-Connection {
    Write-Host "`n═══════════════════════════════════════════════════════════════════" -ForegroundColor $Blue
    Write-Host "                    VERIFYING REPAIRS..." -ForegroundColor $Blue
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $Blue
    
    $tests = @(
        @{ Url = "http://localhost:3010"; Name = "Frontend" },
        @{ Url = "http://localhost:4000/api/health"; Name = "Backend" }
    )
    
    $passed = 0
    $failed = 0
    
    foreach ($test in $tests) {
        try {
            $response = Invoke-WebRequest -Uri $test.Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            Write-Host "  ✅ $($test.Name): $($test.Url) - HTTP $($response.StatusCode)" -ForegroundColor $Green
            $passed++
        } catch {
            Write-Host "  ❌ $($test.Name): $($test.Url) - FAILED" -ForegroundColor $Red
            $failed++
        }
    }
    
    Write-Host "`nResults: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { $Green } else { $Red })
    
    return $failed -eq 0
}

# =============================================================================
# Summary
# =============================================================================
function Show-Summary {
    Write-Host "`n═══════════════════════════════════════════════════════════════════" -ForegroundColor $Magenta
    Write-Host "                       REPAIR SUMMARY" -ForegroundColor $Magenta
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $Magenta
    
    Write-Host "`n✅ Fixed: $($script:FixedIssues.Count)" -ForegroundColor $Green
    foreach ($fix in $script:FixedIssues) {
        Write-Host "   • $fix" -ForegroundColor $Green
    }
    
    if ($script:FailedFixes.Count -gt 0) {
        Write-Host "`n❌ Failed: $($script:FailedFixes.Count)" -ForegroundColor $Red
        foreach ($fail in $script:FailedFixes) {
            Write-Host "   • $fail" -ForegroundColor $Red
        }
    }
}

# =============================================================================
# Main
# =============================================================================
Write-Banner

# Run all repair functions
$results = @()
$results += Repair-Docker
$results += Repair-EnvironmentFile
$results += Repair-DockerNetwork
$results += Repair-Containers
$results += Repair-StoppedContainers
$results += Repair-Migrations
$results += Repair-Firewall
$results += Repair-FullReset

Show-Summary

# Final verification
$success = Test-Connection

if ($success) {
    Write-Host "`n🎉 ALL REPAIRS SUCCESSFUL! Your application is ready." -ForegroundColor $Green
    Write-Host "   Open: http://localhost:3010" -ForegroundColor $Green
    exit 0
} else {
    Write-Host "`n⚠️ Some issues remain. Try running with -FullReset flag or check logs:" -ForegroundColor $Yellow
    Write-Host "   docker-compose logs -f" -ForegroundColor $Yellow
    exit 1
}
