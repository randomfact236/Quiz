#!/usr/bin/env pwsh
#requires -Version 5.1

<#
.SYNOPSIS
    AI Quiz Platform Server Manager
.DESCRIPTION
    Manages starting, stopping, and monitoring of frontend and backend servers
    with automatic port conflict resolution and health checks.
    Enforces strict port restrictions - project can only use designated ports.
#>

param(
    [Parameter()]
    [ValidateSet('start', 'stop', 'restart', 'status', 'fix', 'validate')]
    [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# STRICT PORT CONFIGURATION - Project CANNOT use ports outside these
$script:ProjectPorts = @{
    Frontend = 3010
    Backend = 4000
    PostgreSQL = 5432
    Redis = 6379
}

$FrontendPort = $ProjectPorts.Frontend
$BackendPort = $ProjectPorts.Backend
$FrontendDir = Join-Path $PSScriptRoot 'apps' 'frontend'
$BackendDir = Join-Path $PSScriptRoot 'apps' 'backend'
$RootDir = $PSScriptRoot

# PID files
$FrontendPidFile = Join-Path $RootDir '.frontend.pid'
$BackendPidFile = Join-Path $RootDir '.backend.pid'

function Write-StatusMessage($Message, $Type = 'Info') {
    $colorMap = @{ Success = 'Green'; Error = 'Red'; Warning = 'Yellow'; Info = 'Cyan' }
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor DarkGray
    Write-Host $Message -ForegroundColor $colorMap[$Type]
}

function Test-ValidProjectPort($Port) {
    $allowedPorts = $script:ProjectPorts.Values
    return $allowedPorts -contains $Port
}

function Validate-PortConfiguration {
    Write-StatusMessage 'Validating port configuration...' 'Info'
    
    $configFiles = @(
        "$RootDir\apps\frontend\.env.local",
        "$RootDir\apps\backend\.env"
    )
    
    $allValid = $true
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            $portMatches = [regex]::Matches($content, '(?i)(PORT|port)[:=]\s*(\d+)')
            foreach ($match in $portMatches) {
                $port = [int]$match.Groups[2].Value
                if (-not (Test-ValidProjectPort -Port $port)) {
                    Write-StatusMessage "INVALID PORT in $file : $port (not in allowed list)" 'Error'
                    $allValid = $false
                }
            }
        }
    }
    
    if ($allValid) {
        Write-StatusMessage 'All port configurations are valid' 'Success'
    } else {
        Write-StatusMessage 'Port validation failed! Allowed ports: ' + ($script:ProjectPorts.Values -join ', ') 'Error'
        exit 1
    }
    return $allValid
}

function Show-PortRestrictions {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  PORT RESTRICTIONS ENFORCED" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This project is RESTRICTED to these ports ONLY:" -ForegroundColor Yellow
    Write-Host ""
    foreach ($name in $script:ProjectPorts.Keys | Sort-Object) {
        $port = $script:ProjectPorts[$name]
        Write-Host "  $name : Port $port" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Using any other port will be BLOCKED." -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Test-PortInUse($Port) {
    $connections = netstat -ano | Select-String ":$Port"
    return $null -ne $connections
}

function Get-ProcessUsingPort($Port) {
    $line = netstat -ano | Select-String ":$Port.*LISTENING" | Select-Object -First 1
    if ($line) {
        $parts = $line -split '\s+'
        return $parts[$parts.Length - 1]
    }
    return $null
}

function Stop-ServerByPort($Port, $Name) {
    $procId = Get-ProcessUsingPort -Port $Port
    if ($procId) {
        Write-StatusMessage "Stopping $Name (PID: $procId) on port $Port..." 'Warning'
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        if (Test-PortInUse -Port $Port) {
            Start-Sleep -Seconds 1
            $procId2 = Get-ProcessUsingPort -Port $Port
            if ($procId2) {
                taskkill /F /PID $procId2 2>$null | Out-Null
            }
        }
    }
}

function Stop-AllServers {
    Write-StatusMessage 'Stopping all servers...' 'Warning'
    
    @($FrontendPidFile, $BackendPidFile) | ForEach-Object {
        if (Test-Path $_) {
            $procId = Get-Content $_ -ErrorAction SilentlyContinue
            if ($procId) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-StatusMessage "Stopped process $procId" 'Info'
            }
            Remove-Item $_ -Force -ErrorAction SilentlyContinue
        }
    }
    
    Stop-ServerByPort -Port $FrontendPort -Name 'Frontend'
    Stop-ServerByPort -Port $BackendPort -Name 'Backend'
    
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-StatusMessage 'All servers stopped' 'Success'
}

function Start-Backend {
    Write-StatusMessage 'Starting Backend Server...' 'Info'
    
    if (Test-PortInUse -Port $BackendPort) {
        Write-StatusMessage "Port $BackendPort is already in use!" 'Error'
        return $false
    }
    
    $backendCmd = "cd `"$BackendDir`"; npm run start:dev"
    $process = Start-Process powershell -ArgumentList "-Command", $backendCmd -PassThru -WindowStyle Hidden
    
    if ($process) {
        $process.Id | Set-Content $BackendPidFile
        Write-StatusMessage "Backend started (PID: $($process.Id))" 'Success'
        return $true
    }
    return $false
}

function Start-Frontend {
    Write-StatusMessage 'Starting Frontend Server...' 'Info'
    
    if (Test-PortInUse -Port $FrontendPort) {
        Write-StatusMessage "Port $FrontendPort is already in use!" 'Error'
        return $false
    }
    
    $frontendCmd = "cd `"$FrontendDir`"; npm run dev"
    $process = Start-Process powershell -ArgumentList "-Command", $frontendCmd -PassThru -WindowStyle Hidden
    
    if ($process) {
        $process.Id | Set-Content $FrontendPidFile
        Write-StatusMessage "Frontend started (PID: $($process.Id))" 'Success'
        return $true
    }
    return $false
}

function Get-ServerStatus {
    $status = @{
        Frontend = @{ Running = $false; Port = $FrontendPort; PID = $null }
        Backend = @{ Running = $false; Port = $BackendPort; PID = $null }
    }
    
    if (Test-PortInUse -Port $FrontendPort) {
        $status.Frontend.Running = $true
        $status.Frontend.PID = Get-ProcessUsingPort -Port $FrontendPort
    }
    
    if (Test-PortInUse -Port $BackendPort) {
        $status.Backend.Running = $true
        $status.Backend.PID = Get-ProcessUsingPort -Port $BackendPort
    }
    
    return $status
}

function Show-Status {
    $status = Get-ServerStatus
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  SERVER STATUS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    @('Frontend', 'Backend') | ForEach-Object {
        $s = $status[$_]
        $state = if ($s.Running) { 'RUNNING' } else { 'STOPPED' }
        $color = if ($s.Running) { 'Green' } else { 'Red' }
        Write-Host "  $_ ($($s.Port)): " -NoNewline
        Write-Host $state -ForegroundColor $color -NoNewline
        if ($s.PID) {
            Write-Host " (PID: $($s.PID))" -ForegroundColor DarkGray
        } else {
            Write-Host ''
        }
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($status.Frontend.Running -and $status.Backend.Running) {
        Write-Host "  http://localhost:$FrontendPort" -ForegroundColor Green
        Write-Host "  http://localhost:$BackendPort" -ForegroundColor Green
    }
}

function Repair-Servers {
    Write-StatusMessage 'Fixing server issues...' 'Warning'
    
    Stop-AllServers
    
    $maxWait = 10
    $waited = 0
    while ((Test-PortInUse -Port $FrontendPort) -or (Test-PortInUse -Port $BackendPort)) {
        if ($waited -ge $maxWait) {
            Write-StatusMessage 'Force killing node processes...' 'Error'
            taskkill /F /IM node.exe 2>$null | Out-Null
            break
        }
        Write-StatusMessage ("Waiting for ports... " + $waited + "/" + $maxWait) 'Warning'
        Start-Sleep -Seconds 1
        $waited++
    }
    
    Write-StatusMessage 'Starting servers fresh...' 'Info'
    Start-Backend
    Start-Sleep -Seconds 3
    Start-Frontend
    
    Start-Sleep -Seconds 10
    Show-Status
}

# Main execution
switch ($Action) {
    'start' {
        Show-PortRestrictions
        Validate-PortConfiguration
        Show-Status
        $status = Get-ServerStatus
        
        if (-not $status.Backend.Running) {
            Start-Backend
            Start-Sleep -Seconds 3
        }
        if (-not $status.Frontend.Running) {
            Start-Frontend
        }
        
        Start-Sleep -Seconds 5
        Show-Status
    }
    'stop' {
        Stop-AllServers
        Show-Status
    }
    'restart' {
        Stop-AllServers
        Start-Sleep -Seconds 2
        Show-PortRestrictions
        Validate-PortConfiguration
        Start-Backend
        Start-Sleep -Seconds 3
        Start-Frontend
        Start-Sleep -Seconds 5
        Show-Status
    }
    'status' {
        Show-PortRestrictions
        Show-Status
    }
    'fix' {
        Repair-Servers
    }
    'validate' {
        Show-PortRestrictions
        Validate-PortConfiguration
    }
}
