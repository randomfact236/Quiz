# ============================================================================
# AI QUIZ PLATFORM - SERVER HEALTH MONITOR
# Run this in a separate PowerShell window to auto-restart crashed servers
# ============================================================================

param(
    [int]$CheckIntervalSeconds = 10,
    [switch]$AutoRestart
)

$projectRoot = "E:\webiste theme and plugin\Ai-Quiz\Quiz"
$frontendPort = 3010
$backendPort = 4000
$logFile = "$projectRoot\server-monitor.log"

function Write-Log($message, $type = "info") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$type] $message"
    
    # Console output
    switch ($type) {
        "success" { Write-Host $logEntry -ForegroundColor Green }
        "error"   { Write-Host $logEntry -ForegroundColor Red }
        "warning" { Write-Host $logEntry -ForegroundColor Yellow }
        "info"    { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    # File output
    Add-Content -Path $logFile -Value $logEntry -ErrorAction SilentlyContinue
}

function Test-Server($url, $name) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Restart-Servers() {
    Write-Log "Restarting all servers..." "warning"
    & "$projectRoot\stop-servers.ps1" | Out-Null
    Start-Sleep -Seconds 3
    & "$projectRoot\start-servers-robust.ps1"
}

# Main monitoring loop
Write-Log "========================================" 
Write-Log "  SERVER HEALTH MONITOR STARTED        "
Write-Log "  Check Interval: ${CheckIntervalSeconds}s"
Write-Log "  Auto-Restart: $AutoRestart"
Write-Log "========================================"

$consecutiveFailures = 0
$maxFailures = 3

while ($true) {
    $backendHealthy = Test-Server "http://localhost:$backendPort/api/health" "Backend"
    $frontendHealthy = Test-Server "http://localhost:$frontendPort" "Frontend"
    
    if ($backendHealthy -and $frontendHealthy) {
        if ($consecutiveFailures -gt 0) {
            Write-Log "Servers recovered and running normally!" "success"
            $consecutiveFailures = 0
        } else {
            Write-Log "All servers healthy ✓" "success"
        }
    } else {
        $consecutiveFailures++
        
        if (-not $backendHealthy) {
            Write-Log "BACKEND DOWN (Failure #$consecutiveFailures)" "error"
        }
        if (-not $frontendHealthy) {
            Write-Log "FRONTEND DOWN (Failure #$consecutiveFailures)" "error"
        }
        
        if ($AutoRestart -and $consecutiveFailures -ge $maxFailures) {
            Write-Log "Max failures reached! Auto-restarting..." "warning"
            Restart-Servers
            $consecutiveFailures = 0
        }
    }
    
    Start-Sleep -Seconds $CheckIntervalSeconds
}
