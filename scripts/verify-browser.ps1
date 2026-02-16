#!/usr/bin/env pwsh
# =============================================================================
# AI Quiz Platform - Browser Verification Script
# =============================================================================
# Opens browser to verify the application is working
# 
# Usage:
#   .\scripts\verify-browser.ps1 [-Url <url>] [-Timeout <seconds>]
#
# Returns:
#   Exit code 0 = Success (page loaded)
#   Exit code 1 = Failed (connection refused or error)
# =============================================================================

[CmdletBinding()]
param(
    [string]$Url = "http://localhost:3010",
    [int]$Timeout = 30,
    [switch]$NoBrowser,  # Just test, don't open browser
    [switch]$Verbose
)

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status($Message, $Color) {
    Write-Host $Message -ForegroundColor $Color
}

# =============================================================================
# Test Connection
# =============================================================================
function Test-Connection {
    param([string]$TestUrl)
    
    try {
        if ($Verbose) {
            Write-Status "Testing connection to $TestUrl..." $Blue
        }
        
        $response = Invoke-WebRequest -Uri $TestUrl -TimeoutSec $Timeout -UseBasicParsing -ErrorAction Stop
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            ContentLength = $response.RawContentLength
        }
    } catch {
        $statusCode = $_.Exception.Response?.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $errorMessage
        }
    }
}

# =============================================================================
# Open Browser
# =============================================================================
function Open-Browser {
    param([string]$TargetUrl)
    
    Write-Status "Opening browser to $TargetUrl..." $Blue
    
    try {
        # Try to use Start-Process with the default browser
        Start-Process $TargetUrl
        return $true
    } catch {
        Write-Status "Could not open browser automatically: $($_.Exception.Message)" $Yellow
        Write-Status "Please manually open: $TargetUrl" $Yellow
        return $false
    }
}

# =============================================================================
# Main
# =============================================================================

if (-not $NoBrowser) {
    Write-Status "`n╔══════════════════════════════════════════════════════════════════╗" $Blue
    Write-Status "║              AI Quiz Platform - Browser Verification             ║" $Blue
    Write-Status "╚══════════════════════════════════════════════════════════════════╝" $Blue
    Write-Status ""
}

# Wait a moment for services to be ready
if (-not $NoBrowser) {
    Write-Status "Waiting 3 seconds for services to stabilize..." $Yellow
    Start-Sleep -Seconds 3
}

# Test the connection
$result = Test-Connection -TestUrl $Url

if ($result.Success) {
    Write-Status "✅ Connection successful! HTTP $($result.StatusCode)" $Green
    Write-Status "   Content received: $($result.ContentLength) bytes" $Green
    
    if (-not $NoBrowser) {
        Open-Browser -TargetUrl $Url
        
        Write-Status "`n🎉 SUCCESS! The AI Quiz Platform is running at:" $Green
        Write-Status "   $Url" $Green
        Write-Status "`n   Other URLs:" $Blue
        Write-Status "   • Frontend:    http://localhost:3010" $Blue
        Write-Status "   • Backend API: http://localhost:4000/api" $Blue
        Write-Status "   • API Docs:    http://localhost:4000/api/docs" $Blue
    }
    
    exit 0
} else {
    if ($result.StatusCode) {
        Write-Status "❌ Server returned HTTP $($result.StatusCode)" $Red
    } else {
        Write-Status "❌ Connection refused or failed" $Red
    }
    
    if ($Verbose) {
        Write-Status "   Error: $($result.Error)" $Red
    }
    
    if (-not $NoBrowser) {
        Write-Status "`n⚠️ The application is not accessible. Possible causes:" $Yellow
        Write-Status "   • Docker services not running" $Yellow
        Write-Status "   • Services still starting up (wait a moment and try again)" $Yellow
        Write-Status "   • Port conflict" $Yellow
        Write-Status "   • Firewall blocking connection" $Yellow
        Write-Status "`n💡 Run auto-repair: .\scripts\auto-repair.ps1" $Blue
    }
    
    exit 1
}
