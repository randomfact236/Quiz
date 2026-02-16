#!/usr/bin/env pwsh
# =============================================================================
# AI Quiz Platform - Automatic Fix Loop
# =============================================================================
# Main orchestrator that:
# 1. Diagnoses the issue
# 2. Attempts to fix it
# 3. Verifies by opening browser
# 4. Repeats if not fixed (up to max attempts)
#
# Usage:
#   .\scripts\auto-fix-loop.ps1 [-MaxAttempts <number>] [-WaitBetween <seconds>]
#
# Options:
#   -MaxAttempts  Maximum repair attempts (default: 3)
#   -WaitBetween  Seconds to wait between attempts (default: 10)
#   -Force        Skip confirmations
# =============================================================================

[CmdletBinding()]
param(
    [int]$MaxAttempts = 3,
    [int]$WaitBetween = 10,
    [switch]$Force,
    [switch]$NoBrowser  # Don't open browser, just test
)

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Cyan"
$Magenta = "Magenta"
$White = "White"

# Script paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Counters
$script:AttemptNumber = 0
$script:DiagnosticResults = @()

function Write-Banner {
    param([string]$Title)
    Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Magenta
    Write-Host "║  $Title  ║" -ForegroundColor $Magenta
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Magenta
}

function Write-Step($Number, $Total, $Message) {
    Write-Host "`n[Step $Number/$Total] $Message" -ForegroundColor $Blue
}

# =============================================================================
# Step 1: Run Diagnostics
# =============================================================================
function Invoke-Diagnostics {
    Write-Step 1 4 "RUNNING DIAGNOSTICS..."
    
    $diagnosticScript = Join-Path $ScriptDir "diagnose-services.ps1"
    
    if (-not (Test-Path $diagnosticScript)) {
        Write-Host "❌ Diagnostic script not found: $diagnosticScript" -ForegroundColor $Red
        return $false
    }
    
    # Run diagnostic and capture result
    & $diagnosticScript -Verbose:$VerbosePreference
    
    $resultFile = Join-Path $ScriptDir ".diagnostic-result.json"
    if (Test-Path $resultFile) {
        $result = Get-Content $resultFile | ConvertFrom-Json
        $script:DiagnosticResults += $result
        return $result.Success
    }
    
    # If no result file, assume failure
    return $false
}

# =============================================================================
# Step 2: Attempt Repair
# =============================================================================
function Invoke-Repair {
    Write-Step 2 4 "ATTEMPTING AUTOMATIC REPAIR..."
    
    $repairScript = Join-Path $ScriptDir "auto-repair.ps1"
    
    if (-not (Test-Path $repairScript)) {
        Write-Host "❌ Repair script not found: $repairScript" -ForegroundColor $Red
        return $false
    }
    
    # Run repair
    if ($Force) {
        & $repairScript -Force
    } else {
        & $repairScript
    }
    
    return $LASTEXITCODE -eq 0
}

# =============================================================================
# Step 3: Wait for Services
# =============================================================================
function Invoke-Wait {
    Write-Step 3 4 "WAITING FOR SERVICES TO STABILIZE..."
    
    Write-Host "   Waiting $WaitBetween seconds for services to fully start..." -ForegroundColor $Yellow
    
    for ($i = $WaitBetween; $i -gt 0; $i--) {
        Write-Host "   $i seconds remaining...   " -NoNewline -ForegroundColor $Yellow
        Start-Sleep -Seconds 1
        Write-Host "`r   $i seconds remaining...   " -NoNewline
    }
    Write-Host "`r   Continuing...                  " -ForegroundColor $Green
}

# =============================================================================
# Step 4: Verify with Browser
# =============================================================================
function Invoke-Verification {
    Write-Step 4 4 "VERIFYING CONNECTION..."
    
    $verifyScript = Join-Path $ScriptDir "verify-browser.ps1"
    
    if (-not (Test-Path $verifyScript)) {
        Write-Host "❌ Verification script not found: $verifyScript" -ForegroundColor $Red
        return $false
    }
    
    # Run verification
    $params = @{
        Url = "http://localhost:3010"
        Timeout = 30
        Verbose = $VerbosePreference
    }
    if ($NoBrowser) {
        $params.NoBrowser = $true
    }
    
    & $verifyScript @params
    
    return $LASTEXITCODE -eq 0
}

# =============================================================================
# Main Loop
# =============================================================================
Write-Banner -Title "AI QUIZ PLATFORM - AUTO FIX SYSTEM"

Write-Host "`nConfiguration:" -ForegroundColor $White
Write-Host "  Maximum Attempts: $MaxAttempts" -ForegroundColor $Blue
Write-Host "  Wait Between:     $WaitBetween seconds" -ForegroundColor $Blue
Write-Host "  No Browser:       $NoBrowser" -ForegroundColor $Blue

# Pre-flight check
Write-Host "`nPre-flight check..." -ForegroundColor $Blue
Set-Location $ProjectRoot

if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found in $ProjectRoot" -ForegroundColor $Red
    Write-Host "   Please run this script from the project root directory." -ForegroundColor $Yellow
    exit 1
}

Write-Host "✅ Project files found" -ForegroundColor $Green

# Main fix loop
$fixed = $false

while ($script:AttemptNumber -lt $MaxAttempts -and -not $fixed) {
    $script:AttemptNumber++
    
    Write-Host "`n═══════════════════════════════════════════════════════════════════" -ForegroundColor $Magenta
    Write-Host "                    ATTEMPT $script:AttemptNumber of $MaxAttempts" -ForegroundColor $Magenta
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $Magenta
    
    # Step 1: Diagnose
    $diagnosticPassed = Invoke-Diagnostics
    
    if ($diagnosticPassed) {
        Write-Host "`n✅ Diagnostics passed - Services appear to be running!" -ForegroundColor $Green
        
        # Still verify with browser to be sure
        Invoke-Wait
        $verified = Invoke-Verification
        
        if ($verified) {
            $fixed = $true
            break
        }
    }
    
    # Step 2: Repair
    $repaired = Invoke-Repair
    
    if (-not $repaired) {
        Write-Host "`n⚠️ Repair reported issues. Will retry..." -ForegroundColor $Yellow
    }
    
    # Step 3: Wait
    Invoke-Wait
    
    # Step 4: Verify
    $verified = Invoke-Verification
    
    if ($verified) {
        $fixed = $true
        break
    } else {
        Write-Host "`n❌ Verification failed after attempt $script:AttemptNumber" -ForegroundColor $Red
        
        if ($script:AttemptNumber -lt $MaxAttempts) {
            Write-Host "`n🔄 Retrying in $WaitBetween seconds..." -ForegroundColor $Yellow
            Start-Sleep -Seconds $WaitBetween
        }
    }
}

# =============================================================================
# Final Result
# =============================================================================
Write-Host "`n═══════════════════════════════════════════════════════════════════" -ForegroundColor $(if ($fixed) { $Green } else { $Red })
Write-Host "                       FINAL RESULT" -ForegroundColor $(if ($fixed) { $Green } else { $Red })
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor $(if ($fixed) { $Green } else { $Red })

if ($fixed) {
    Write-Host "`n🎉 SUCCESS! AI Quiz Platform is now running!" -ForegroundColor $Green
    Write-Host "`n📱 Access your application at:" -ForegroundColor $White
    Write-Host "   Frontend:    http://localhost:3010" -ForegroundColor $Blue
    Write-Host "   Backend API: http://localhost:4000/api" -ForegroundColor $Blue
    Write-Host "   API Docs:    http://localhost:4000/api/docs" -ForegroundColor $Blue
    Write-Host "`n💡 To view logs: docker-compose logs -f" -ForegroundColor $Yellow
    Write-Host "💡 To stop: docker-compose down" -ForegroundColor $Yellow
    
    # Save success status
    @{ Status = "SUCCESS"; Attempts = $script:AttemptNumber; Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss" } | 
        ConvertTo-Json | 
        Set-Content (Join-Path $ScriptDir ".auto-fix-result.json")
    
    exit 0
} else {
    Write-Host "`n❌ FAILED after $MaxAttempts attempts" -ForegroundColor $Red
    Write-Host "`nPossible reasons:" -ForegroundColor $Yellow
    Write-Host "   • Docker is not installed or not running" -ForegroundColor $Yellow
    Write-Host "   • Ports 3010, 4000 are occupied by other applications" -ForegroundColor $Yellow
    Write-Host "   • Insufficient system resources (RAM/CPU)" -ForegroundColor $Yellow
    Write-Host "   • Firewall/antivirus blocking connections" -ForegroundColor $Yellow
    Write-Host "`nTry these manual steps:" -ForegroundColor $White
    Write-Host "   1. Ensure Docker Desktop is running" -ForegroundColor $Blue
    Write-Host "   2. Run: docker-compose down -v" -ForegroundColor $Blue
    Write-Host "   3. Run: docker-compose up -d --build" -ForegroundColor $Blue
    Write-Host "   4. Check logs: docker-compose logs -f" -ForegroundColor $Blue
    Write-Host "`nFor help, check: DEPLOYMENT.md" -ForegroundColor $Blue
    
    # Save failure status
    @{ Status = "FAILED"; Attempts = $script:AttemptNumber; Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss" } | 
        ConvertTo-Json | 
        Set-Content (Join-Path $ScriptDir ".auto-fix-result.json")
    
    exit 1
}
