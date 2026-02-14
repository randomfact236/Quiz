#!/usr/bin/env pwsh
# Automatic Server Startup Script for AI Quiz Platform
# This script starts both frontend and backend servers and monitors them

$ErrorActionPreference = "Continue"
$backendPort = 4000
$frontendPort = 3010
$maxWaitSeconds = 60

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Test-ServerReady($port, $path) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port$path" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-BackendServer {
    Write-ColorOutput Green "Starting Backend Server on port $backendPort..."
    $backendJob = Start-Job -ScriptBlock {
        Set-Location "$using:PWD/apps/backend"
        npm run start:dev 2>&1
    }
    return $backendJob
}

function Start-FrontendServer {
    Write-ColorOutput Green "Starting Frontend Server on port $frontendPort..."
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location "$using:PWD/apps/frontend"
        npm run dev 2>&1
    }
    return $frontendJob
}

# Kill any existing Node processes
Write-ColorOutput Yellow "Cleaning up existing Node processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Start-Sleep -Seconds 2

# Start Backend
$backendJob = Start-BackendServer

# Wait for backend to be ready
Write-ColorOutput Yellow "Waiting for backend to be ready..."
$backendReady = $false
$waited = 0
while (-not $backendReady -and $waited -lt $maxWaitSeconds) {
    Start-Sleep -Seconds 2
    $waited += 2
    $backendReady = Test-ServerReady $backendPort "/api/health"
    Write-Host "." -NoNewline
}
Write-Host ""

if ($backendReady) {
    Write-ColorOutput Green "✅ Backend is ready! (http://localhost:$backendPort)"
} else {
    Write-ColorOutput Red "❌ Backend failed to start within $maxWaitSeconds seconds"
    Write-ColorOutput Yellow "Backend logs:"
    Receive-Job -Job $backendJob
    Stop-Job -Job $backendJob
    Remove-Job -Job $backendJob
    exit 1
}

# Start Frontend
$frontendJob = Start-FrontendServer

# Wait for frontend to be ready
Write-ColorOutput Yellow "Waiting for frontend to be ready..."
$frontendReady = $false
$waited = 0
while (-not $frontendReady -and $waited -lt $maxWaitSeconds) {
    Start-Sleep -Seconds 2
    $waited += 2
    $frontendReady = Test-ServerReady $frontendPort "/"
    Write-Host "." -NoNewline
}
Write-Host ""

if ($frontendReady) {
    Write-ColorOutput Green "✅ Frontend is ready! (http://localhost:$frontendPort)"
} else {
    Write-ColorOutput Red "❌ Frontend failed to start within $maxWaitSeconds seconds"
    Write-ColorOutput Yellow "Frontend logs:"
    Receive-Job -Job $frontendJob
    Stop-Job -Job $frontendJob
    Remove-Job -Job $frontendJob
    exit 1
}

# Display success message
Write-ColorOutput Green "========================================="
Write-ColorOutput Green "🚀 Both servers are running successfully!"
Write-ColorOutput Green "========================================="
Write-ColorOutput Cyan "Frontend: http://localhost:$frontendPort"
Write-ColorOutput Cyan "Backend:  http://localhost:$backendPort"
Write-ColorOutput Cyan "Admin:    http://localhost:$frontendPort/admin"
Write-ColorOutput Green "========================================="

# Open browser
Start-Process "http://localhost:$frontendPort"

# Monitor servers
Write-ColorOutput Yellow "Monitoring servers... (Press Ctrl+C to stop)"
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if jobs are still running
        $backendStatus = Get-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
        $frontendStatus = Get-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
        
        if ($backendStatus.State -ne "Running") {
            Write-ColorOutput Red "⚠️ Backend stopped unexpectedly!"
            Write-ColorOutput Yellow "Restarting backend..."
            $backendJob = Start-BackendServer
        }
        
        if ($frontendStatus.State -ne "Running") {
            Write-ColorOutput Red "⚠️ Frontend stopped unexpectedly!"
            Write-ColorOutput Yellow "Restarting frontend..."
            $frontendJob = Start-FrontendServer
        }
        
        # Check health endpoints
        $backendHealthy = Test-ServerReady $backendPort "/api/health"
        $frontendHealthy = Test-ServerReady $frontendPort "/"
        
        if (-not $backendHealthy) {
            Write-ColorOutput Yellow "Backend health check failed, checking again..."
        }
        if (-not $frontendHealthy) {
            Write-ColorOutput Yellow "Frontend health check failed, checking again..."
        }
    }
} finally {
    Write-ColorOutput Yellow "Stopping servers..."
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
    Write-ColorOutput Green "Servers stopped."
}
