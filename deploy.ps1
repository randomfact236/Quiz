# =============================================================================
# AI Quiz Platform - Production Deployment Script (PowerShell)
# =============================================================================
# Usage: .\deploy.ps1 [command]
# Commands:
#   deploy      - Full deployment (build + start)
#   build       - Build all Docker images
#   start       - Start all services
#   stop        - Stop all services
#   restart     - Restart all services
#   logs        - Show logs from all services
#   status      - Check service status
#   update      - Pull latest code and redeploy
#   backup      - Backup database
#   clean       - Clean up unused Docker resources
# =============================================================================

param(
    [Parameter(Position = 0)]
    [ValidateSet("deploy", "build", "start", "stop", "restart", "logs", "status", "update", "backup", "clean", "help")]
    [string]$Command = "deploy"
)

# Configuration
$ComposeFile = "docker-compose.prod.yml"
$EnvFile = ".env.production"

# Helper functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check prerequisites
function Test-Prerequisites {
    if (-not (Test-Path $ComposeFile)) {
        Write-Error "Docker Compose file not found: $ComposeFile"
        exit 1
    }
    
    if (-not (Test-Path $EnvFile)) {
        Write-Warn "Environment file not found: $EnvFile"
        Write-Info "Creating from template..."
        if (Test-Path ".env.production.example") {
            Copy-Item ".env.production.example" $EnvFile
            Write-Error "Please edit $EnvFile with your production values before deploying"
            exit 1
        }
        else {
            Write-Error "Template file not found. Please create $EnvFile manually"
            exit 1
        }
    }
    
    # Check Docker
    try {
        docker version | Out-Null
    }
    catch {
        Write-Error "Docker is not installed or not running"
        exit 1
    }
    
    # Check Docker Compose
    $composeCmd = Get-ComposeCommand
    if (-not $composeCmd) {
        Write-Error "Docker Compose is not available"
        exit 1
    }
}

# Get docker compose command
function Get-ComposeCommand {
    try {
        docker compose version | Out-Null
        return "docker compose -f $ComposeFile --env-file $EnvFile"
    }
    catch {
        try {
            docker-compose version | Out-Null
            return "docker-compose -f $ComposeFile --env-file $EnvFile"
        }
        catch {
            return $null
        }
    }
}

# Build images
function Invoke-Build {
    Write-Info "Building Docker images..."
    $cmd = Get-ComposeCommand
    Invoke-Expression "$cmd build --no-cache"
    Write-Success "Build completed"
}

# Start services
function Invoke-Start {
    Write-Info "Starting services..."
    $cmd = Get-ComposeCommand
    Invoke-Expression "$cmd up -d"
    Write-Success "Services started"
    
    Write-Info "Waiting for health checks..."
    Start-Sleep -Seconds 10
    Get-Status
}

# Stop services
function Invoke-Stop {
    Write-Info "Stopping services..."
    $cmd = Get-ComposeCommand
    Invoke-Expression "$cmd down"
    Write-Success "Services stopped"
}

# Restart services
function Invoke-Restart {
    Write-Info "Restarting services..."
    $cmd = Get-ComposeCommand
    Invoke-Expression "$cmd restart"
    Write-Success "Services restarted"
    
    Write-Info "Waiting for health checks..."
    Start-Sleep -Seconds 10
    Get-Status
}

# Show logs
function Get-Logs {
    $cmd = Get-ComposeCommand
    Invoke-Expression "$cmd logs -f --tail=100"
}

# Check status
function Get-Status {
    Write-Info "Service Status:"
    $cmd = Get-ComposeCommand
    Invoke-Expression "$cmd ps"
    
    Write-Info "`nHealth Checks:"
    
    # Check backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend API: Healthy"
        }
    }
    catch {
        Write-Error "Backend API: Unhealthy"
    }
    
    # Check frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3010/" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend: Healthy"
        }
    }
    catch {
        Write-Error "Frontend: Unhealthy"
    }
}

# Full deployment
function Invoke-Deploy {
    Write-Info "Starting full deployment..."
    Test-Prerequisites
    Invoke-Build
    Invoke-Start
    Write-Success "Deployment completed!"
    Write-Info "Frontend: http://localhost:3010"
    Write-Info "Backend API: http://localhost:4000/api"
}

# Update and redeploy
function Invoke-Update {
    Write-Info "Updating application..."
    
    # Backup first
    Invoke-Backup
    
    # Pull latest
    Write-Info "Pulling latest code..."
    git pull origin main
    
    # Rebuild and restart
    Invoke-Build
    Invoke-Restart
    
    Write-Success "Update completed!"
}

# Backup database
function Invoke-Backup {
    Write-Info "Creating database backup..."
    
    $backupDir = "backups"
    $backupFile = "$backupDir/backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    # Load env vars
    $envVars = @{}
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $envVars[$matches[1]] = $matches[2]
        }
    }
    
    # Create backup
    docker exec quiz-postgres-prod pg_dump -U $envVars['POSTGRES_USER'] -d $envVars['POSTGRES_DB'] > $backupFile
    
    Write-Success "Backup created: $backupFile"
    
    # Clean old backups
    Get-ChildItem -Path $backupDir -Name "backup_*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item
    Write-Info "Old backups cleaned up"
}

# Clean up
function Invoke-Clean {
    Write-Info "Cleaning up unused Docker resources..."
    docker system prune -af --volumes
    Write-Success "Cleanup completed"
}

# Show help
function Get-Help {
    Write-Host @"
AI Quiz Platform - Deployment Script

Usage: .\deploy.ps1 [command]

Commands:
  deploy    - Full deployment (build + start)
  build     - Build all Docker images
  start     - Start all services
  stop      - Stop all services
  restart   - Restart all services
  logs      - Show logs from all services
  status    - Check service status and health
  update    - Pull latest code and redeploy
  backup    - Backup database
  clean     - Clean up unused Docker resources
  help      - Show this help message
"@
}

# Main execution
switch ($Command) {
    "deploy" { Invoke-Deploy }
    "build" { Invoke-Build }
    "start" { Invoke-Start }
    "stop" { Invoke-Stop }
    "restart" { Invoke-Restart }
    "logs" { Get-Logs }
    "status" { Get-Status }
    "update" { Invoke-Update }
    "backup" { Invoke-Backup }
    "clean" { Invoke-Clean }
    "help" { Get-Help }
}
