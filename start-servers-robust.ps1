# ============================================================================
# AI QUIZ PLATFORM - ROBUST SERVER STARTUP
# Prevents "Internal Server Error" by proper cleanup and health monitoring
# ============================================================================

param(
    [switch]$SkipFrontendBuild,
    [switch]$SkipBackendBuild,
    [switch]$DevMode
)

$ErrorActionPreference = "Stop"
$projectRoot = "E:\webiste theme and plugin\Ai-Quiz\Quiz"
$frontendPort = 3010
$backendPort = 4000
$maxWaitSeconds = 120

function Write-Status($message, $type = "info") {
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($type) {
        "success" { Write-Host "[$timestamp] ✓ $message" -ForegroundColor Green }
        "error"   { Write-Host "[$timestamp] ✗ $message" -ForegroundColor Red }
        "warning" { Write-Host "[$timestamp] ⚠ $message" -ForegroundColor Yellow }
        "info"    { Write-Host "[$timestamp] ℹ $message" -ForegroundColor Cyan }
    }
}

function Clear-Port($port) {
    Write-Status "Clearing port $port..." "info"
    $connections = netstat -ano | findstr ":$port"
    if ($connections) {
        $pids = $connections | ForEach-Object { 
            $parts = ($_ -replace '\s+', ' ').Trim().Split(' ')
            $parts[-1]
        } | Select-Object -Unique
        
        foreach ($pid in $pids) {
            if ($pid -ne '0' -and $pid -match '^\d+$') {
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Status "Killed process $pid on port $port" "warning"
                } catch {}
            }
        }
    }
}

function Test-ServerHealth($url, $name) {
    $retries = 30
    $delay = 2
    
    for ($i = 0; $i -lt $retries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch {
            Start-Sleep -Seconds $delay
        }
    }
    return $false
}

function Start-Backend() {
    Write-Status "Starting Backend Server..." "info"
    
    Set-Location "$projectRoot\apps\backend"
    
    # Clear old dist to prevent cached errors
    if (Test-Path "$projectRoot\apps\backend\dist") {
        Remove-Item -Recurse -Force "$projectRoot\apps\backend\dist" -ErrorAction SilentlyContinue
        Write-Status "Cleared old build cache" "info"
    }
    
    # Start backend in background
    $proc = Start-Process -FilePath "npm" -ArgumentList "run", "start" -PassThru -WindowStyle Hidden -WorkingDirectory "$projectRoot\apps\backend"
    $proc.Id | Out-File -FilePath "$projectRoot\.backend.pid" -Encoding ASCII
    
    Write-Status "Backend starting with PID: $($proc.Id)" "info"
    
    # Wait for health check
    Write-Status "Waiting for backend health check..." "info"
    if (Test-ServerHealth "http://localhost:$backendPort/api/health" "Backend") {
        Write-Status "Backend is healthy on port $backendPort" "success"
        return $true
    } else {
        Write-Status "Backend failed to start!" "error"
        return $false
    }
}

function Start-Frontend() {
    Write-Status "Starting Frontend Server..." "info"
    
    Set-Location "$projectRoot\apps\frontend"
    
    # Clear Next.js cache to prevent stale builds
    if (Test-Path "$projectRoot\apps\frontend\.next") {
        Remove-Item -Recurse -Force "$projectRoot\apps\frontend\.next" -ErrorAction SilentlyContinue
        Write-Status "Cleared Next.js cache" "info"
    }
    
    # Start frontend in background
    $proc = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden -WorkingDirectory "$projectRoot\apps\frontend"
    $proc.Id | Out-File -FilePath "$projectRoot\.frontend.pid" -Encoding ASCII
    
    Write-Status "Frontend starting with PID: $($proc.Id)" "info"
    
    # Wait for frontend to be ready
    Write-Status "Waiting for frontend to be ready..." "info"
    if (Test-ServerHealth "http://localhost:$frontendPort" "Frontend") {
        Write-Status "Frontend is ready on port $frontendPort" "success"
        return $true
    } else {
        Write-Status "Frontend failed to start!" "error"
        return $false
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  AI QUIZ PLATFORM - SERVER STARTUP    " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Clear ports
Write-Status "Step 1: Clearing ports..." "info"
Clear-Port $frontendPort
Clear-Port $backendPort
Start-Sleep -Seconds 2

# Step 2: Start Backend
Write-Status "Step 2: Starting Backend..." "info"
$backendOk = Start-Backend
if (-not $backendOk) {
    Write-Status "Failed to start backend! Check logs." "error"
    exit 1
}

# Step 3: Start Frontend
Write-Status "Step 3: Starting Frontend..." "info"
$frontendOk = Start-Frontend
if (-not $frontendOk) {
    Write-Status "Failed to start frontend! Check logs." "error"
    exit 1
}

# Step 4: Final status
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Status "ALL SERVERS RUNNING SUCCESSFULLY!" "success"
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Status "Frontend: http://localhost:$frontendPort" "info"
Write-Status "Backend:  http://localhost:$backendPort/api" "info"
Write-Host ""
Write-Status "Use 'stop-servers.ps1' to stop all servers" "warning"
Write-Host ""

Set-Location $projectRoot
