#!/usr/bin/env pwsh
# Server Status Checker

param(
    [int]$BackendPort = 4000,
    [int]$FrontendPort = 3010
)

function Test-Endpoint($url, $name) {
    Write-Host "Checking $name at $url... " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ OK (HTTP $($response.StatusCode))" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ FAILED ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     AI Quiz Platform - Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
Write-Host "Node Processes: $($nodeProcesses.Count) running" -ForegroundColor Yellow
if ($nodeProcesses.Count -gt 0) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "  - PID $($proc.Id): $($proc.ProcessName) (CPU: $([math]::Round($proc.CPU, 1))%)" -ForegroundColor Gray
    }
}
Write-Host ""

# Check ports
Write-Host "Port Status:" -ForegroundColor Yellow
$backendConn = Test-NetConnection -ComputerName localhost -Port $BackendPort -WarningAction SilentlyContinue
$frontendConn = Test-NetConnection -ComputerName localhost -Port $FrontendPort -WarningAction SilentlyContinue

Write-Host "  Backend port ($BackendPort): " -NoNewline
if ($backendConn.TcpTestSucceeded) { Write-Host "OPEN" -ForegroundColor Green } else { Write-Host "CLOSED" -ForegroundColor Red }

Write-Host "  Frontend port ($FrontendPort): " -NoNewline
if ($frontendConn.TcpTestSucceeded) { Write-Host "OPEN" -ForegroundColor Green } else { Write-Host "CLOSED" -ForegroundColor Red }

Write-Host ""

# Check HTTP endpoints
Write-Host "HTTP Endpoint Tests:" -ForegroundColor Yellow
$results = @()
$results += Test-Endpoint "http://127.0.0.1:$BackendPort/api/health" "Backend Health"
$results += Test-Endpoint "http://127.0.0.1:$FrontendPort" "Frontend"
$results += Test-Endpoint "http://127.0.0.1:$FrontendPort/admin" "Admin Panel"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
$allPassed = $results -notcontains $false
if ($allPassed) {
    Write-Host "     ✅ ALL SYSTEMS OPERATIONAL" -ForegroundColor Green
    Write-Host "     Access: http://localhost:$FrontendPort" -ForegroundColor Cyan
} else {
    Write-Host "     ❌ SOME SERVICES ARE DOWN" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
