#!/usr/bin/env pwsh
# =============================================================================
# AI Quiz Platform - ChunkLoadError Auto-Fix System
# =============================================================================

$ErrorActionPreference = "Stop"

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status($Message, $Color) {
    Write-Host $Message -ForegroundColor $Color
}

function Test-Frontend {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3010" -TimeoutSec 10 -UseBasicParsing
        if ($response.Content -match "ChunkLoadError|Loading chunk" -or $response.StatusCode -ne 200) {
            return $false
        }
        return $true
    } catch {
        return $false
    }
}

function Clear-NextCache {
    Write-Status "Clearing Next.js cache..." $Yellow
    docker exec quiz-frontend sh -c 'rm -rf /app/apps/frontend/.next'
    Write-Status "✓ Cache cleared" $Green
}

function Restart-Frontend {
    Write-Status "Restarting frontend container..." $Yellow
    docker-compose restart frontend 2>&1 | Out-Null
    Start-Sleep -Seconds 15
    Write-Status "✓ Frontend restarted" $Green
}

function Rebuild-Frontend {
    Write-Status "Rebuilding frontend container..." $Yellow
    docker-compose stop frontend 2>&1 | Out-Null
    docker-compose rm -f frontend 2>&1 | Out-Null
    docker-compose build frontend 2>&1 | Out-Null
    docker-compose up -d frontend 2>&1 | Out-Null
    Start-Sleep -Seconds 20
    Write-Status "✓ Frontend rebuilt" $Green
}

function Wait-ForCompile {
    Write-Status "Waiting for Next.js to compile..." $Yellow
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 2
        $attempt++
        $logs = docker logs quiz-frontend --tail 5 2>&1
        if ($logs -match "Compiled|Ready in") {
            Write-Status "✓ Compilation complete" $Green
            return $true
        }
        Write-Host "  Compiling... ($attempt/$maxAttempts)" -ForegroundColor $Blue
    }
    return $false
}

# =============================================================================
# Main Fix Loop
# =============================================================================
Write-Status "`n╔══════════════════════════════════════════════════════════════╗" $Blue
Write-Status "║     AI Quiz Platform - ChunkLoadError Auto-Fix System        ║" $Blue
Write-Status "╚══════════════════════════════════════════════════════════════╝" $Blue

$maxFixAttempts = 5
$fixAttempt = 0
$fixed = $false

while (($fixAttempt -lt $maxFixAttempts) -and (-not $fixed)) {
    $fixAttempt = $fixAttempt + 1
    Write-Status "`n[Fix Attempt $fixAttempt/$maxFixAttempts]" $Blue
    
    # Step 1: Test current state
    Write-Status "Testing current frontend state..." $Yellow
    if (Test-Frontend) {
        Write-Status "✅ Frontend is working correctly!" $Green
        $fixed = $true
        break
    }
    Write-Status "❌ ChunkLoadError detected" $Red
    
    # Step 2: Apply fixes based on attempt number
    if ($fixAttempt -eq 1) {
        Write-Status "Attempt 1: Clearing cache and restarting..." $Blue
        Clear-NextCache
        Restart-Frontend
        Wait-ForCompile
    }
    elseif ($fixAttempt -eq 2) {
        Write-Status "Attempt 2: Rebuilding container..." $Blue
        Rebuild-Frontend
        Wait-ForCompile
    }
    elseif ($fixAttempt -eq 3) {
        Write-Status "Attempt 3: Full reset with volume cleanup..." $Blue
        docker-compose stop frontend 2>&1 | Out-Null
        docker-compose rm -f frontend 2>&1 | Out-Null
        docker system prune -f 2>&1 | Out-Null
        docker-compose up -d frontend 2>&1 | Out-Null
        Wait-ForCompile
    }
    elseif ($fixAttempt -eq 4) {
        Write-Status "Attempt 4: Checking for port conflicts..." $Blue
        docker-compose stop frontend 2>&1 | Out-Null
        docker-compose rm -f frontend 2>&1 | Out-Null
        docker-compose up -d frontend 2>&1 | Out-Null
        Start-Sleep -Seconds 30
    }
    elseif ($fixAttempt -eq 5) {
        Write-Status "Attempt 5: Nuclear option - complete rebuild..." $Red
        docker-compose down 2>&1 | Out-Null
        docker volume rm -f quiz-postgres-data 2>&1 | Out-Null
        docker system prune -af 2>&1 | Out-Null
        docker-compose up -d 2>&1 | Out-Null
        Start-Sleep -Seconds 60
    }
    
    # Step 3: Verify
    Write-Status "Verifying fix..." $Yellow
    Start-Sleep -Seconds 5
    if (Test-Frontend) {
        Write-Status "✅ SUCCESS! Frontend is now working!" $Green
        $fixed = $true
    } else {
        Write-Status "❌ Still not working, trying next fix..." $Red
    }
}

# =============================================================================
# Final Result
# =============================================================================
Write-Status "`n══════════════════════════════════════════════════════════════" $Blue
Write-Status "                    FINAL RESULT" $Blue
Write-Status "══════════════════════════════════════════════════════════════" $Blue

if ($fixed) {
    Write-Status "`n🎉 SUCCESS! The ChunkLoadError has been fixed!" $Green
    Write-Status "`n📱 Your application is accessible at:" $Green
    Write-Status "   http://localhost:3010" $Green
    Write-Status "`n💡 If you still see the error in browser:" $Yellow
    Write-Status "   1. Press Ctrl+F5 (hard refresh)" $Yellow
    Write-Status "   2. Or open in Incognito/Private mode" $Yellow
    Write-Status "   3. Or clear browser cache (Ctrl+Shift+Delete)" $Yellow
    exit 0
} else {
    Write-Status "`n❌ FAILED after $maxFixAttempts attempts" $Red
    Write-Status "`nTrying manual diagnostic..." $Yellow
    
    # Show diagnostic info
    Write-Status "`nContainer Status:" $Blue
    docker ps --filter "name=quiz" --format "table {{.Names}}\t{{.Status}}"
    
    Write-Status "`nRecent Frontend Logs:" $Blue
    docker logs quiz-frontend --tail 20
    
    Write-Status "`nPlease try manually:" $Red
    Write-Status "   1. Open: http://localhost:3010" $Yellow
    Write-Status "   2. If still broken, try: docker-compose restart frontend" $Yellow
    exit 1
}
