# ============================================================================
# AI QUIZ PLATFORM - STOP ALL SERVERS
# ============================================================================

$projectRoot = "E:\webiste theme and plugin\Ai-Quiz\Quiz"
$frontendPort = 3010
$backendPort = 4000

function Write-Status($message, $type = "info") {
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($type) {
        "success" { Write-Host "[$timestamp] ✓ $message" -ForegroundColor Green }
        "error"   { Write-Host "[$timestamp] ✗ $message" -ForegroundColor Red }
        "warning" { Write-Host "[$timestamp] ⚠ $message" -ForegroundColor Yellow }
        "info"    { Write-Host "[$timestamp] ℹ $message" -ForegroundColor Cyan }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "    STOPPING ALL SERVERS               " -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Kill by PID files
$pids = @()
if (Test-Path "$projectRoot\.backend.pid") {
    $pids += Get-Content "$projectRoot\.backend.pid" -ErrorAction SilentlyContinue
}
if (Test-Path "$projectRoot\.frontend.pid") {
    $pids += Get-Content "$projectRoot\.frontend.pid" -ErrorAction SilentlyContinue
}

foreach ($pid in $pids) {
    if ($pid -and $pid -match '^\d+$') {
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Status "Stopped process PID: $pid" "success"
        } catch {
            Write-Status "Process $pid already stopped" "warning"
        }
    }
}

# Kill any processes on the ports
$ports = @($frontendPort, $backendPort)
foreach ($port in $ports) {
    $connections = netstat -ano | findstr ":$port"
    if ($connections) {
        $procIds = $connections | ForEach-Object { 
            $parts = ($_ -replace '\s+', ' ').Trim().Split(' ')
            $parts[-1]
        } | Select-Object -Unique
        
        foreach ($procId in $procIds) {
            if ($procId -ne '0' -and $procId -match '^\d+$') {
                try {
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    Write-Status "Killed process $procId on port $port" "warning"
                } catch {}
            }
        }
    }
}

# Clean up PID files
Remove-Item "$projectRoot\.backend.pid" -ErrorAction SilentlyContinue
Remove-Item "$projectRoot\.frontend.pid" -ErrorAction SilentlyContinue

Write-Host ""
Write-Status "All servers stopped!" "success"
Write-Host ""
