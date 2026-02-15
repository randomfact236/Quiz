#!/usr/bin/env pwsh
# Auto-Connect Server Automation Script
# Handles server startup, monitoring, and automatic reconnection

param(
    [switch]$NoBrowser,
    [int]$BackendPort = 4000,
    [int]$FrontendPort = 3010,
    [switch]$Monitor
)

$ErrorActionPreference = "Stop"
$script:BackendProcess = $null
$script:FrontendProcess = $null
$script:LogFile = "$PSScriptRoot/server-monitor.log"

function Write-Log($Message, $Level = "INFO") {
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry -ForegroundColor $(if ($Level -eq "ERROR") { "Red" } elseif ($Level -eq "WARN") { "Yellow" } elseif ($Level -eq "SUCCESS") { "Green" } else { "White" })
    Add-Content -Path $script:LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

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

function Clear-StalePids {
    Write-Log "Cleaning up stale PID files..." "INFO"
    Remove-Item -Path "$PSScriptRoot/.backend.pid" -ErrorAction SilentlyContinue
    Remove-Item -Path "$PSScriptRoot/.frontend.pid" -ErrorAction SilentlyContinue
    Write-Log "PID files cleaned" "SUCCESS"
}

function Stop-ExistingServers {
    Write-Log "Stopping any existing Node processes..." "WARN"
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

function Wait-ForServer($Port, $Name, $MaxWait = 60) {
    Write-Log "Waiting for $Name to accept connections on port $Port..." "INFO"
    $waited = 0
    while ($waited -lt $MaxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        if (Test-PortOpen $Port) {
            Write-Log "✅ $Name is running on port $Port" "SUCCESS"
            return $true
        }
        if ($waited % 5 -eq 0) {
            Write-Log "  Still waiting for $Name... ($waited/$MaxWait seconds)" "INFO"
        }
    }
    Write-Log "❌ $Name failed to start within $MaxWait seconds" "ERROR"
    return $false
}

function Start-Backend {
    Write-Log "Starting Backend Server (port $BackendPort)..." "INFO"
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -WorkingDirectory "$PSScriptRoot/apps/backend" -PassThru -WindowStyle Minimized
    $script:BackendProcess = $process
    return Wait-ForServer $BackendPort "Backend"
}

function Start-Frontend {
    Write-Log "Starting Frontend Server (port $FrontendPort)..." "INFO"
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$PSScriptRoot/apps/frontend" -PassThru -WindowStyle Minimized
    $script:FrontendProcess = $process
    return Wait-ForServer $FrontendPort "Frontend"
}

function Save-Pids {
    if ($script:BackendProcess) {
        $script:BackendProcess.Id | Out-File -FilePath "$PSScriptRoot/.backend.pid" -Force
    }
    if ($script:FrontendProcess) {
        $script:FrontendProcess.Id | Out-File -FilePath "$PSScriptRoot/.frontend.pid" -Force
    }
}

function Show-SuccessMessage {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  🚀 SERVERS ARE RUNNING!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
    Write-Host "  Backend:  http://localhost:$BackendPort" -ForegroundColor Cyan
    Write-Host "  Admin:    http://localhost:$FrontendPort/admin" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Log "Backend PID: $($script:BackendProcess.Id)" "INFO"
    Write-Log "Frontend PID: $($script:FrontendProcess.Id)" "INFO"
}

function Open-Browser {
    if (-not $NoBrowser) {
        Write-Log "Opening browser..." "INFO"
        Start-Process "http://localhost:$FrontendPort"
    }
}

function Test-ServerHealth {
    param($Process, $Port, $Name)
    
    # Check if process is still running
    $running = Get-Process -Id $Process.Id -ErrorAction SilentlyContinue
    if (-not $running) {
        Write-Log "⚠️ $Name process stopped unexpectedly!" "ERROR"
        return $false
    }
    
    # Check if port is responding
    $portOpen = Test-PortOpen $Port
    if (-not $portOpen) {
        Write-Log "⚠️ $Name port $Port is not responding" "WARN"
        return $false
    }
    
    return $true
}

function Restart-Server($Name, $StartFunction) {
    Write-Log "Attempting to restart $Name..." "WARN"
    try {
        & $StartFunction
        Write-Log "$Name restarted successfully" "SUCCESS"
        return $true
    } catch {
        Write-Log "Failed to restart $Name`: $_" "ERROR"
        return $false
    }
}

function Show-ActionMenu() {
    Write-Host ""
    Write-Host "🔧 Select an action:" -ForegroundColor Yellow
    Write-Host "  [1] Start Servers (with browser)" -ForegroundColor White
    Write-Host "  [2] Start Servers (no browser)" -ForegroundColor White
    Write-Host "  [3] Start with Auto-Monitoring" -ForegroundColor White
    Write-Host "  [4] Stop Servers" -ForegroundColor White
    Write-Host "  [5] Restart Servers" -ForegroundColor White
    Write-Host "  [6] Check Status Only" -ForegroundColor White
    Write-Host "  [Q] Quit" -ForegroundColor White
    Write-Host ""
    return Read-Host "Enter your choice (1-6 or Q)"
}

function Start-Monitoring {
    Write-Log "Starting server monitoring... (Press Ctrl+C to stop)" "INFO"
    
    try {
        while ($true) {
            Start-Sleep -Seconds 10
            
            $backendHealthy = Test-ServerHealth $script:BackendProcess $BackendPort "Backend"
            $frontendHealthy = Test-ServerHealth $script:FrontendProcess $FrontendPort "Frontend"
            
            if (-not $backendHealthy) {
                Write-Log "Backend is unhealthy, attempting restart..." "WARN"
                if (Get-Process -Id $script:BackendProcess.Id -ErrorAction SilentlyContinue) {
                    Stop-Process -Id $script:BackendProcess.Id -Force -ErrorAction SilentlyContinue
                }
                Start-Sleep -Seconds 2
                if (-not (Start-Backend)) {
                    Write-Log "Failed to restart backend. Shutting down..." "ERROR"
                    break
                }
            }
            
            if (-not $frontendHealthy) {
                Write-Log "Frontend is unhealthy, attempting restart..." "WARN"
                if (Get-Process -Id $script:FrontendProcess.Id -ErrorAction SilentlyContinue) {
                    Stop-Process -Id $script:FrontendProcess.Id -Force -ErrorAction SilentlyContinue
                }
                Start-Sleep -Seconds 2
                if (-not (Start-Frontend)) {
                    Write-Log "Failed to restart frontend. Shutting down..." "ERROR"
                    break
                }
            }
            
            # Periodic HTTP health check every 60 seconds
            if ((Get-Date).Second -lt 10) {
                $backendHttp = Test-HttpEndpoint $BackendPort "/api/health"
                $frontendHttp = Test-HttpEndpoint $FrontendPort "/"
                
                if (-not $backendHttp) {
                    Write-Log "Backend HTTP health check failed" "WARN"
                }
                if (-not $frontendHttp) {
                    Write-Log "Frontend HTTP health check failed" "WARN"
                }
            }
            
            Save-Pids
        }
    } catch {
        Write-Log "Monitoring error: $_" "ERROR"
    } finally {
        Write-Log "Shutting down servers..." "WARN"
        if ($script:BackendProcess) {
            Stop-Process -Id $script:BackendProcess.Id -Force -ErrorAction SilentlyContinue
        }
        if ($script:FrontendProcess) {
            Stop-Process -Id $script:FrontendProcess.Id -Force -ErrorAction SilentlyContinue
        }
        Clear-StalePids
        Write-Log "Servers stopped." "SUCCESS"
    }
}

# ==================== MAIN EXECUTION ====================

Write-Log "========================================" "INFO"
Write-Log "  AI Quiz Server Auto-Connect" "INFO"
Write-Log "========================================" "INFO"

# Check current server status
$backendRunning = Test-PortOpen $BackendPort
$frontendRunning = Test-PortOpen $FrontendPort

# Display status and ask user for action
Write-Host ""
Write-Host "📊 Current Server Status:" -ForegroundColor Cyan
Write-Host "  Backend  (port $BackendPort): $(if ($backendRunning) { '✅ RUNNING' } else { '❌ STOPPED' })" -ForegroundColor $(if ($backendRunning) { 'Green' } else { 'Red' })
Write-Host "  Frontend (port $FrontendPort): $(if ($frontendRunning) { '✅ RUNNING' } else { '❌ STOPPED' })" -ForegroundColor $(if ($frontendRunning) { 'Green' } else { 'Red' })
Write-Host ""

# Show action options menu
$choice = Show-ActionMenu

switch ($choice.ToUpper()) {
    '1' { 
        $NoBrowser = $false
        $Monitor = $false
    }
    '2' { 
        $NoBrowser = $true
        $Monitor = $false
    }
    '3' { 
        $NoBrowser = $false
        $Monitor = $true
    }
    '4' {
        Write-Log "Stopping servers..." "WARN"
        Stop-ExistingServers
        Clear-StalePids
        Write-Log "Servers stopped." "SUCCESS"
        exit 0
    }
    '5' {
        Write-Log "Restarting servers..." "WARN"
        Stop-ExistingServers
        Clear-StalePids
        $NoBrowser = $false
        $Monitor = $false
    }
    '6' {
        Write-Host ""
        Write-Host "✅ Status check complete." -ForegroundColor Green
        exit 0
    }
    'Q' {
        Write-Log "Exiting..." "INFO"
        exit 0
    }
    default {
        Write-Log "Invalid choice. Exiting." "ERROR"
        exit 1
    }
}

Write-Host ""
Write-Log "Selected action: $(if ($Monitor) { 'Start with Monitoring' } elseif ($NoBrowser) { 'Start (no browser)' } else { 'Start with browser' })" "INFO"
Write-Host ""

# Clean up
Clear-StalePids
Stop-ExistingServers

# Verify ports are free
Write-Log "Checking if ports are available..." "INFO"
if (Test-PortOpen $BackendPort) {
    Write-Log "Port $BackendPort is already in use!" "ERROR"
    exit 1
}
if (Test-PortOpen $FrontendPort) {
    Write-Log "Port $FrontendPort is already in use!" "ERROR"
    exit 1
}
Write-Log "Ports are free" "SUCCESS"

# Start servers
if (-not (Start-Backend)) {
    Write-Log "Failed to start backend. Exiting." "ERROR"
    exit 1
}

# Wait a bit for backend to fully initialize
Start-Sleep -Seconds 3

if (-not (Start-Frontend)) {
    Write-Log "Failed to start frontend. Stopping backend..." "ERROR"
    Stop-Process -Id $script:BackendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Save PIDs
Save-Pids

# Show success
Show-SuccessMessage

# Open browser
Open-Browser

# Start monitoring if requested
if ($Monitor) {
    Start-Monitoring
} else {
    Write-Log "Servers started. Run with -Monitor flag to enable auto-restart monitoring." "INFO"
    Write-Log "To stop servers, close the Node.js windows or run: Get-Process node | Stop-Process" "INFO"
}
