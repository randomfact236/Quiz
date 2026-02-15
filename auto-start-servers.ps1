# AI Quiz Platform - Auto Server Start Script
# This script checks if servers are running and auto-starts them if not

param(
    [switch]$OpenBrowser,
    [switch]$Silent
)

$FrontendPort = 3010
$BackendPort = 4000
$FrontendUrl = "http://localhost:$FrontendPort"
$BackendUrl = "http://localhost:$BackendPort/api"
$ProjectRoot = "e:\webiste theme and plugin\Ai-Quiz\Quiz"

function Write-Status($Message, $Type = "Info") {
    if ($Silent) { return }
    $colors = @{ "Success" = "Green"; "Error" = "Red"; "Warning" = "Yellow"; "Info" = "Cyan" }
    Write-Host $Message -ForegroundColor $colors[$Type]
}

function Test-ServerRunning($Port) {
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
        return $null -ne $connection
    } catch {
        return $false
    }
}

function Test-ServerResponding($Url) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-Server($Name, $Port, $NpmScript, $LogFile) {
    Write-Status "Starting $Name on port $Port..." "Warning"
    $logPath = Join-Path $ProjectRoot $LogFile
    $errPath = Join-Path $ProjectRoot ($LogFile -replace '\.log$', '.err')
    
    $proc = Start-Process -FilePath "npm" -ArgumentList "run", $NpmScript `
        -WorkingDirectory $ProjectRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput $logPath `
        -RedirectStandardError $errPath `
        -PassThru
    
    # Wait for server to start
    $maxWait = 60
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        if (Test-ServerRunning $Port) {
            Write-Status "✅ $Name is now running on port $Port (PID: $($proc.Id))" "Success"
            return $true
        }
    }
    Write-Status "❌ Timeout starting $Name" "Error"
    return $false
}

# Main Script
Write-Status "=== AI Quiz Platform Server Check ===" "Info"
Write-Status "Checking server status..." "Info"

$frontendRunning = Test-ServerRunning $FrontendPort
$backendRunning = Test-ServerRunning $BackendPort

if ($frontendRunning -and $backendRunning) {
    Write-Status "✅ Both servers are already running!" "Success"
    $frontendResponding = Test-ServerResponding $FrontendUrl
    $backendResponding = Test-ServerResponding "$BackendUrl/health" -or (Test-ServerResponding $BackendUrl)
    
    if ($frontendResponding) {
        Write-Status "✅ Frontend responding at $FrontendUrl" "Success"
    } else {
        Write-Status "⚠️ Frontend listening but not responding yet" "Warning"
    }
    
    if ($backendResponding) {
        Write-Status "✅ Backend responding at $BackendUrl" "Success"
    } else {
        Write-Status "⚠️ Backend listening but not responding yet" "Warning"
    }
} else {
    if (-not $frontendRunning) {
        Start-Server "Frontend" $FrontendPort "dev:frontend" "frontend.log"
    } else {
        Write-Status "✅ Frontend already running on port $FrontendPort" "Success"
    }
    
    if (-not $backendRunning) {
        Start-Server "Backend" $BackendPort "dev:backend" "backend.log"
    } else {
        Write-Status "✅ Backend already running on port $BackendPort" "Success"
    }
    
    Write-Status "Waiting for servers to fully initialize..." "Info"
    Start-Sleep -Seconds 10
}

# Final verification
Write-Status "" "Info"
Write-Status "=== Final Status ===" "Info"
netstat -ano | findstr "$FrontendPort\|$BackendPort" | findstr "LISTENING"

if ($OpenBrowser) {
    Write-Status "Opening browser..." "Info"
    Start-Process $FrontendUrl
}

Write-Status "" "Info"
Write-Status "Frontend: $FrontendUrl" "Info"
Write-Status "Backend:  $BackendUrl" "Info"
Write-Status "" "Info"
Write-Status "Done!" "Success"
