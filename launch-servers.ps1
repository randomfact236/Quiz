#!/usr/bin/env pwsh
# Robust Server Launcher with Real Health Checks

param(
    [switch]$NoBrowser,
    [int]$BackendPort = 4000,
    [int]$FrontendPort = 3010
)

$ErrorActionPreference = "Stop"

function Test-PortOpen($port) {
    try {
        $conn = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        return $conn.TcpTestSucceeded
    } catch {
        return $false
    }
}

function Test-HttpEndpoint($port, $path = "") {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port$path" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Write-Status($message, $color = "White") {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $message" -ForegroundColor $color
}

# Cleanup
Write-Status "Stopping any existing Node processes..." "Yellow"
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Verify ports are free
Write-Status "Checking ports..." "Yellow"
if (Test-PortOpen $BackendPort) {
    Write-Status "Port $BackendPort is already in use!" "Red"
    exit 1
}
if (Test-PortOpen $FrontendPort) {
    Write-Status "Port $FrontendPort is already in use!" "Red"
    exit 1
}
Write-Status "Ports are free" "Green"

# Start Backend
Write-Status "Starting Backend Server (port $BackendPort)..." "Cyan"
$backendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -WorkingDirectory "$PSScriptRoot/apps/backend" -PassThru -WindowStyle Minimized

# Wait for backend
Write-Status "Waiting for backend to accept connections..." "Yellow"
$maxWait = 60
$waited = 0
$backendReady = $false
while ($waited -lt $maxWait -and -not $backendReady) {
    Start-Sleep -Seconds 2
    $waited += 2
    $backendReady = Test-PortOpen $BackendPort
    if ($waited % 5 -eq 0) {
        Write-Status "  Still waiting for backend... ($waited/$maxWait seconds)" "Gray"
    }
}

if (-not $backendReady) {
    Write-Status "Backend failed to start! Check the backend window for errors." "Red"
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
Write-Status "✅ Backend is running on port $BackendPort" "Green"

# Additional wait for NestJS to fully initialize
Start-Sleep -Seconds 3

# Start Frontend
Write-Status "Starting Frontend Server (port $FrontendPort)..." "Cyan"
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$PSScriptRoot/apps/frontend" -PassThru -WindowStyle Minimized

# Wait for frontend
Write-Status "Waiting for frontend to accept connections..." "Yellow"
$waited = 0
$frontendReady = $false
while ($waited -lt $maxWait -and -not $frontendReady) {
    Start-Sleep -Seconds 2
    $waited += 2
    $frontendReady = Test-PortOpen $FrontendPort
    if ($waited % 5 -eq 0) {
        Write-Status "  Still waiting for frontend... ($waited/$maxWait seconds)" "Gray"
    }
}

if (-not $frontendReady) {
    Write-Status "Frontend failed to start! Check the frontend window for errors." "Red"
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
Write-Status "✅ Frontend is running on port $FrontendPort" "Green"

# Final verification with HTTP requests
Write-Status "Performing HTTP health checks..." "Yellow"
Start-Sleep -Seconds 2

$backendHealthy = Test-HttpEndpoint $BackendPort "/api/health"
$frontendHealthy = Test-HttpEndpoint $FrontendPort "/"

if (-not $backendHealthy) {
    Write-Status "Backend HTTP health check failed!" "Red"
}
if (-not $frontendHealthy) {
    Write-Status "Frontend HTTP health check failed!" "Red"
}

# Save PIDs for cleanup
$backendProcess.Id | Out-File -FilePath "$PSScriptRoot/.backend.pid" -Force
$frontendProcess.Id | Out-File -FilePath "$PSScriptRoot/.frontend.pid" -Force

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  🚀 SERVERS ARE RUNNING!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:$BackendPort" -ForegroundColor Cyan
Write-Host "  Admin:    http://localhost:$FrontendPort/admin" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Status "Backend PID: $($backendProcess.Id)" "Gray"
Write-Status "Frontend PID: $($frontendProcess.Id)" "Gray"
Write-Host ""

if (-not $NoBrowser) {
    Write-Status "Opening browser..." "Yellow"
    Start-Process "http://localhost:$FrontendPort"
}

Write-Status "Monitoring servers... (Press Ctrl+C to stop)" "Yellow"

try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if processes are still running
        $backendRunning = Get-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
        $frontendRunning = Get-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue
        
        if (-not $backendRunning) {
            Write-Status "⚠️ Backend stopped unexpectedly!" "Red"
            Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
            exit 1
        }
        
        if (-not $frontendRunning) {
            Write-Status "⚠️ Frontend stopped unexpectedly!" "Red"
            Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
            exit 1
        }
        
        # Periodic health checks every 30 seconds
        if ((Get-Date).Second -lt 5) {
            $backendPortOpen = Test-PortOpen $BackendPort
            $frontendPortOpen = Test-PortOpen $FrontendPort
            
            if (-not $backendPortOpen) {
                Write-Status "⚠️ Backend port closed but process running - may be unhealthy" "Yellow"
            }
            if (-not $frontendPortOpen) {
                Write-Status "⚠️ Frontend port closed but process running - may be unhealthy" "Yellow"
            }
        }
    }
} finally {
    Write-Host ""
    Write-Status "Shutting down servers..." "Yellow"
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$PSScriptRoot/.backend.pid" -ErrorAction SilentlyContinue
    Remove-Item -Path "$PSScriptRoot/.frontend.pid" -ErrorAction SilentlyContinue
    Write-Status "Servers stopped." "Green"
}
