#!/usr/bin/env pwsh
#requires -Version 5.1

<#
.SYNOPSIS
    Port Configuration Validator for AI Quiz Platform
.DESCRIPTION
    Validates that all server configurations use only the allowed project ports.
    Prevents the project from accidentally using ports outside the designated range.
#>

# Allowed ports for this project
$script:AllowedPorts = @(3010, 4000, 5432, 6379)
$script:AllowedPortRanges = @()  # Add ranges if needed, e.g., @(3000..3010)

function Test-ValidProjectPort($Port) {
    # Check if port is in the allowed list
    if ($AllowedPorts -contains $Port) {
        return $true
    }
    
    # Check if port is in any allowed range
    foreach ($range in $AllowedPortRanges) {
        if ($Port -in $range) {
            return $true
        }
    }
    
    return $false
}

function Test-PortConfiguration {
    param(
        [string]$ConfigFile,
        [string]$FileType = 'env'
    )
    
    $errors = @()
    
    if (-not (Test-Path $ConfigFile)) {
        return @{ Valid = $true; Errors = @(); Message = "File not found: $ConfigFile" }
    }
    
    $content = Get-Content $ConfigFile -Raw
    
    # Look for port configurations
    $portPatterns = @(
        'PORT\s*=\s*(\d+)',
        'port:\s*(\d+)',
        'PORT:\s*(\d+)',
        '-p\s+(\d+)',
        ':(\d+)/',
        'localhost:(\d+)',
        '127\.0\.0\.1:(\d+)'
    )
    
    foreach ($pattern in $portPatterns) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $port = [int]$match.Groups[1].Value
            if (-not (Test-ValidProjectPort -Port $port)) {
                $errors += "Invalid port $port found in $ConfigFile (line: $($match.Value))"
            }
        }
    }
    
    return @{
        Valid = $errors.Count -eq 0
        Errors = $errors
        Message = if ($errors.Count -eq 0) { "All ports valid in $ConfigFile" } else { "Found $($errors.Count) invalid ports" }
    }
}

function Validate-AllConfigurations {
    Write-Host "Validating project port configurations..." -ForegroundColor Cyan
    Write-Host ""
    
    $rootDir = $PSScriptRoot
    $allValid = $true
    
    # Files to check
    $configFiles = @(
        @{ Path = "$rootDir\apps\frontend\.env.local"; Type = 'env' },
        @{ Path = "$rootDir\apps\frontend\.env"; Type = 'env' },
        @{ Path = "$rootDir\apps\backend\.env"; Type = 'env' },
        @{ Path = "$rootDir\apps\backend\src\main.ts"; Type = 'typescript' },
        @{ Path = "$rootDir\docker-compose.yml"; Type = 'yaml' },
        @{ Path = "$rootDir\docker-compose.yaml"; Type = 'yaml' }
    )
    
    foreach ($fileInfo in $configFiles) {
        $result = Test-PortConfiguration -ConfigFile $fileInfo.Path -FileType $fileInfo.Type
        
        if ($result.Valid) {
            Write-Host "  ✓ $($fileInfo.Path)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($fileInfo.Path)" -ForegroundColor Red
            foreach ($error in $result.Errors) {
                Write-Host "    - $error" -ForegroundColor DarkRed
            }
            $allValid = $false
        }
    }
    
    Write-Host ""
    
    if ($allValid) {
        Write-Host "All configurations are valid!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Configuration validation failed!" -ForegroundColor Red
        Write-Host "Allowed ports: $($AllowedPorts -join ', ')" -ForegroundColor Yellow
        return $false
    }
}

function Get-AllowedPorts {
    return @{
        Frontend = 3010
        Backend = 4000
        PostgreSQL = 5432
        Redis = 6379
    }
}

function Show-PortMap {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  AI QUIZ PLATFORM - PORT ALLOCATION" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $ports = Get-AllowedPorts
    
    foreach ($service in $ports.Keys | Sort-Object) {
        $port = $ports[$service]
        $status = if (Test-PortInUse -Port $port) { "IN USE" } else { "Available" }
        $color = if ($status -eq "IN USE") { 'Green' } else { 'Gray' }
        
        Write-Host "  $service".PadRight(15) -NoNewline
        Write-Host " : Port " -NoNewline
        Write-Host $port.ToString().PadRight(6) -NoNewline -ForegroundColor Yellow
        Write-Host " [$status]" -ForegroundColor $color
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "NOTE: This project is restricted to these ports only." -ForegroundColor Yellow
    Write-Host "      Using other ports will cause validation errors." -ForegroundColor Yellow
}

function Test-PortInUse($Port) {
    $connections = netstat -ano | Select-String ":$Port.*LISTENING"
    return $null -ne $connections
}

# Export functions for use by other scripts
Export-ModuleMember -Function Test-ValidProjectPort, Validate-AllConfigurations, Get-AllowedPorts, Show-PortMap, Test-PortInUse

# If run directly, show the port map
if ($MyInvocation.InvocationName -ne '.') {
    Show-PortMap
}
