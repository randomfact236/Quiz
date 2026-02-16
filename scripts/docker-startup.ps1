# =============================================================================
# AI Quiz Platform - Docker Startup Script (PowerShell)
# =============================================================================
# This script automates the deployment of the AI Quiz Platform with Docker
#
# Usage:
#   .\scripts\docker-startup.ps1 [command] [options]
#
# Commands:
#   Start       - Start all services (default)
#   Stop        - Stop all services
#   Restart     - Restart all services
#   Logs        - View logs from all services
#   Status      - Check service status
#   Migrate     - Run database migrations only
#   Setup       - Initial setup (creates .env, runs migrations)
#   Clean       - Stop and remove all data (WARNING: destroys all data!)
#   Build       - Rebuild all Docker images
#   Update      - Pull latest code and update containers
#
# Options:
#   -Production  - Use production profile (includes nginx)
#   -Nginx       - Include nginx reverse proxy
#   -Verbose     - Verbose output
#
# Examples:
#   .\scripts\docker-startup.ps1 Start
#   .\scripts\docker-startup.ps1 Start -Production
#   .\scripts\docker-startup.ps1 Logs -Service backend
#   .\scripts\docker-startup.ps1 Setup
# =============================================================================

[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [ValidateSet("Start", "Stop", "Restart", "Logs", "Status", "Migrate", "Setup", "Clean", "Build", "Update", "Help")]
    [string]$Command = "Start",
    
    [switch]$Production,
    [switch]$Nginx,
    [switch]$Verbose,
    [string]$Service
)

# Error action preference
$ErrorActionPreference = "Stop"

# Script paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

# =============================================================================
# Helper Functions
# =============================================================================
function Write-Banner {
    Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Blue
    Write-Host "║              AI Quiz Platform - Docker Deployment                ║" -ForegroundColor $Blue
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Blue
    Write-Host ""
}

function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor $Green
}

function Write-Error($message) {
    Write-Host "✗ $message" -ForegroundColor $Red
}

function Write-Warning($message) {
    Write-Host "⚠ $message" -ForegroundColor $Yellow
}

function Write-Info($message) {
    Write-Host "ℹ $message" -ForegroundColor $Blue
}

function Test-Docker {
    try {
        $dockerVersion = docker version --format '{{.Server.Version}}' 2>$null
        if (-not $dockerVersion) {
            throw "Docker not running"
        }
        Write-Success "Docker is installed and running (version: $dockerVersion)"
    } catch {
        Write-Error "Docker is not running or not installed. Please install and start Docker first."
        exit 1
    }
    
    try {
        $composeVersion = docker compose version --short 2>$null
        if (-not $composeVersion) {
            throw "Docker Compose not found"
        }
        Write-Success "Docker Compose is installed (version: $composeVersion)"
    } catch {
        Write-Error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    }
}

function Test-EnvFile {
    $envFile = Join-Path $ProjectRoot ".env"
    $envExample = Join-Path $ProjectRoot ".env.example"
    
    if (-not (Test-Path $envFile)) {
        Write-Warning ".env file not found!"
        if (Test-Path $envExample) {
            Write-Info "Creating .env from .env.example..."
            Copy-Item $envExample $envFile
            
            Write-Info "Generating secure passwords..."
            $dbPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
            $redisPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
            $minioPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
            $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
            
            $content = Get-Content $envFile -Raw
            $content = $content -replace "change_this_to_secure_password_123", $dbPassword
            $content = $content -replace "change_this_redis_password_456", $redisPassword
            $content = $content -replace "change_this_minio_password_789", $minioPassword
            $content = $content -replace "change_this_to_a_very_long_random_secret_key_min_64_chars_long_for_security", $jwtSecret
            Set-Content $envFile $content
            
            Write-Success "Secure passwords generated and saved to .env"
            Write-Warning "Please review the .env file before continuing!"
            Write-Info "File location: $envFile"
            Read-Host "Press Enter to continue or Ctrl+C to abort"
        } else {
            Write-Error ".env.example file not found! Cannot create .env file."
            exit 1
        }
    } else {
        Write-Success ".env file exists"
    }
}

function Get-ComposeCommand {
    return "docker compose"
}

# =============================================================================
# Command Functions
# =============================================================================
function Start-Services {
    Write-Banner
    Test-Docker
    Test-EnvFile
    
    Set-Location $ProjectRoot
    
    $composeCmd = Get-ComposeCommand
    $profileArgs = @()
    
    if ($Production) {
        $profileArgs += "--profile"
        $profileArgs += "production"
        Write-Info "Using profile: production"
    } elseif ($Nginx) {
        $profileArgs += "--profile"
        $profileArgs += "nginx"
        Write-Info "Using profile: nginx"
    }
    
    Write-Info "Building and starting services..."
    
    # Build images
    Write-Info "Building Docker images..."
    & $composeCmd @profileArgs build --parallel
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    
    # Start services
    Write-Info "Starting services..."
    & $composeCmd @profileArgs up -d --remove-orphans
    if ($LASTEXITCODE -ne 0) { throw "Failed to start services" }
    
    # Wait for services
    Write-Info "Waiting for services to be healthy..."
    Start-Sleep -Seconds 5
    
    Write-Success "All services are running!"
    Write-Host ""
    Write-Host "Access your application:" -ForegroundColor $Green
    Write-Host "  - Frontend:    http://localhost:3010"
    Write-Host "  - Backend API: http://localhost:4000/api"
    Write-Host "  - API Docs:    http://localhost:4000/api/docs"
    Write-Host "  - Health:      http://localhost:4000/api/health"
    
    if ($Production -or $Nginx) {
        Write-Host "  - Nginx:       http://localhost (port 80)"
        Write-Host "  - MinIO Console: http://localhost:9001"
    }
    
    Write-Host ""
    Write-Info "View logs with: .\scripts\docker-startup.ps1 Logs"
}

function Stop-Services {
    Write-Banner
    Set-Location $ProjectRoot
    $composeCmd = Get-ComposeCommand
    
    Write-Info "Stopping services..."
    & $composeCmd --profile nginx --profile production --profile migrate --profile setup down
    
    Write-Success "All services stopped"
}

function Restart-Services {
    Write-Banner
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services
}

function Show-Logs {
    param([string]$ServiceName)
    
    Set-Location $ProjectRoot
    $composeCmd = Get-ComposeCommand
    
    if ($ServiceName) {
        & $composeCmd logs -f $ServiceName
    } else {
        & $composeCmd logs -f
    }
}

function Show-Status {
    Write-Banner
    Set-Location $ProjectRoot
    $composeCmd = Get-ComposeCommand
    
    Write-Host "Service Status:" -ForegroundColor $Blue
    & $composeCmd ps
}

function Invoke-Migrations {
    Write-Banner
    Test-Docker
    Test-EnvFile
    
    Set-Location $ProjectRoot
    $composeCmd = Get-ComposeCommand
    
    Write-Info "Running database migrations..."
    
    # Start database if not running
    $running = & $composeCmd ps --format json | ConvertFrom-Json | Where-Object { $_.Name -like "*postgres*" }
    if (-not $running) {
        Write-Info "Starting database..."
        & $composeCmd up -d postgres
        Start-Sleep -Seconds 5
    }
    
    # Wait for database
    Write-Info "Waiting for database to be ready..."
    $maxRetries = 30
    $retryCount = 0
    $ready = $false
    
    while (-not $ready -and $retryCount -lt $maxRetries) {
        try {
            $result = docker exec ai-quiz-postgres pg_isready -U aiquiz -d aiquiz 2>$null
            if ($result -match "accepting connections") {
                $ready = $true
            }
        } catch {}
        
        if (-not $ready) {
            $retryCount++
            Start-Sleep -Seconds 1
        }
    }
    
    if (-not $ready) {
        throw "Database failed to become ready"
    }
    
    Write-Success "Database is ready"
    
    # Run migrations
    Write-Info "Executing migrations..."
    & $composeCmd --profile migrate run --rm migrate
    
    Write-Success "Migrations completed!"
}

function Invoke-Setup {
    Write-Banner
    Write-Info "Initial setup for AI Quiz Platform"
    
    Test-Docker
    
    # Check/create .env file
    $envFile = Join-Path $ProjectRoot ".env"
    if (-not (Test-Path $envFile)) {
        Test-EnvFile
    }
    
    # Create necessary directories
    $nginxDir = Join-Path $ProjectRoot "infrastructure/docker/nginx/conf.d"
    $postgresDir = Join-Path $ProjectRoot "infrastructure/docker/postgres/init"
    New-Item -ItemType Directory -Force -Path $nginxDir | Out-Null
    New-Item -ItemType Directory -Force -Path $postgresDir | Out-Null
    
    Start-Services
}

function Clear-AllData {
    Write-Banner
    Write-Warning "WARNING: This will remove all containers and volumes!"
    Write-Warning "All data will be lost including database and uploaded files!"
    Write-Host ""
    
    $confirm = Read-Host "Are you sure? Type 'yes' to continue"
    
    if ($confirm -eq "yes") {
        Set-Location $ProjectRoot
        $composeCmd = Get-ComposeCommand
        
        Write-Info "Stopping services..."
        & $composeCmd --profile nginx --profile production --profile migrate --profile setup down -v
        
        Write-Info "Removing volumes..."
        docker volume rm -f ai-quiz-postgres-data ai-quiz-redis-data ai-quiz-minio-data ai-quiz-backend-logs ai-quiz-nginx-cache 2>$null
        
        Write-Success "All data cleaned!"
    } else {
        Write-Info "Clean operation cancelled"
    }
}

function Build-Images {
    Write-Banner
    Test-Docker
    
    Set-Location $ProjectRoot
    $composeCmd = Get-ComposeCommand
    $profileArgs = @()
    
    if ($Production) {
        $profileArgs += "--profile"
        $profileArgs += "production"
    } elseif ($Nginx) {
        $profileArgs += "--profile"
        $profileArgs += "nginx"
    }
    
    Write-Info "Rebuilding Docker images (no cache)..."
    & $composeCmd @profileArgs build --no-cache --parallel
    
    Write-Success "Images rebuilt!"
}

function Update-Platform {
    Write-Banner
    Write-Info "Updating AI Quiz Platform..."
    
    # Pull latest code
    $gitDir = Join-Path $ProjectRoot ".git"
    if (Test-Path $gitDir) {
        Write-Info "Pulling latest code..."
        git -C $ProjectRoot pull
    }
    
    # Rebuild and restart
    Build-Images
    Restart-Services
}

function Show-Help {
    @"
AI Quiz Platform - Docker Startup Script

Usage: .\scripts\docker-startup.ps1 [command] [options]

Commands:
  Start       Start all services (default)
  Stop        Stop all services
  Restart     Restart all services
  Logs        View logs from all services
  Status      Check service status
  Migrate     Run database migrations only
  Setup       Initial setup (creates .env, runs migrations)
  Clean       Stop and remove all data (WARNING: destroys all data!)
  Build       Rebuild all Docker images
  Update      Pull latest code and update containers
  Help        Show this help message

Options:
  -Production  Use production profile (includes nginx)
  -Nginx       Include nginx reverse proxy
  -Verbose     Verbose output
  -Service     Service name for Logs command

Examples:
  .\scripts\docker-startup.ps1 Start
  .\scripts\docker-startup.ps1 Start -Production
  .\scripts\docker-startup.ps1 Logs -Service backend
  .\scripts\docker-startup.ps1 Setup
"@
}

# =============================================================================
# Main Execution
# =============================================================================
try {
    switch ($Command) {
        "Start" { Start-Services }
        "Stop" { Stop-Services }
        "Restart" { Restart-Services }
        "Logs" { Show-Logs -ServiceName $Service }
        "Status" { Show-Status }
        "Migrate" { Invoke-Migrations }
        "Setup" { Invoke-Setup }
        "Clean" { Clear-AllData }
        "Build" { Build-Images }
        "Update" { Update-Platform }
        "Help" { Show-Help }
        default { Show-Help }
    }
} catch {
    Write-Error "An error occurred: $_"
    exit 1
}
