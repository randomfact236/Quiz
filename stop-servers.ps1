# ============================================================================
# AI QUIZ PLATFORM - STOP ALL SERVERS
# ============================================================================

$projectRoot = "E:\webiste theme and plugin\Ai-Quiz\Quiz"
$frontendPort = 3010
$backendPort = 3012

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

for ($i = 0; $i -lt $pids.Count; $i++) {
    $p = $pids[$i]
    if ($p -and $p -match '^\d+$') {
        try {
            Stop-Process -Id $p -Force -ErrorAction Stop
            Write-Status "Stopped process PID: $p" "success"
        } catch {
            Write-Status "Process $p already stopped" "warning"
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
        
        for ($j = 0; $j -lt $procIds.Count; $j++) {
            $p = $procIds[$j]
            if ($p -ne '0' -and $p -match '^\d+$') {
                try {
                    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                    Write-Status "Killed process $p on port $port" "warning"
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
"
