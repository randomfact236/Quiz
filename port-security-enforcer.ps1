#!/usr/bin/env pwsh
#requires -RunAsAdministrator

<#
.SYNOPSIS
    AI Quiz Platform Port Security Enforcer
.DESCRIPTION
    Reserves project ports in Windows to prevent other applications from using them.
    Creates firewall rules and port reservations for complete isolation.
    Requires Administrator privileges.
.PARAMETER Action
    Action to perform: setup, release, status, or enforce
.EXAMPLE
    .\port-security-enforcer.ps1 -Action setup
    .\port-security-enforcer.ps1 -Action release
    .\port-security-enforcer.ps1 -Action status
#>

param(
    [Parameter()]
    [ValidateSet('setup', 'release', 'status', 'enforce')]
    [string]$Action = 'status'
)

# Requires admin privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Project Configuration - Define all ports used by the project
$ProjectPorts = @{
    Frontend = 3010
    Backend = 4000
    PostgreSQL = 5432
    Redis = 6379
}

$ProjectName = "AI-Quiz-Platform"
$FirewallRulePrefix = "AIQuiz_PortReserve"

function Write-Status($Message, $Type = 'Info') {
    $colors = @{ Success = 'Green'; Error = 'Red'; Warning = 'Yellow'; Info = 'Cyan' }
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -NoNewline -ForegroundColor DarkGray
    Write-Host $Message -ForegroundColor $colors[$Type]
}

function Test-PortReserved($Port) {
    try {
        $reserved = netsh int ip show excludedportrange protocol=tcp | Select-String "$Port"
        return $null -ne $reserved
    } catch {
        return $false
    }
}

function Get-ReservedPortRanges {
    try {
        $output = netsh int ip show excludedportrange protocol=tcp
        return $output
    } catch {
        return "Unable to retrieve reserved port ranges"
    }
}

function Reserve-PortRange($StartPort, $Count = 1) {
    try {
        # Try to reserve the specific port using netsh
        $endPort = $StartPort + $Count - 1
        $range = "$StartPort-$endPort"
        
        # Check if already reserved
        if (Test-PortReserved -Port $StartPort) {
            Write-Status "Port $StartPort is already reserved" 'Warning'
            return $true
        }
        
        # Reserve the port range
        $result = netsh int ip add excludedportrange protocol=tcp startport=$StartPort numberofports=$Count 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Successfully reserved port range $range" 'Success'
            return $true
        } else {
            Write-Status "Failed to reserve port $StartPort : $result" 'Error'
            return $false
        }
    } catch {
        Write-Status "Error reserving port $StartPort : $_" 'Error'
        return $false
    }
}

function Release-PortRange($StartPort, $Count = 1) {
    try {
        $result = netsh int ip delete excludedportrange protocol=tcp startport=$StartPort numberofports=$Count 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Successfully released port $StartPort" 'Success'
            return $true
        } else {
            Write-Status "Failed to release port $StartPort (may not be reserved)" 'Warning'
            return $false
        }
    } catch {
        Write-Status "Error releasing port $StartPort : $_" 'Error'
        return $false
    }
}

function Add-FirewallRules {
    Write-Status "Creating firewall rules..." 'Info'
    
    # Remove existing rules first
    Remove-FirewallRules
    
    foreach ($name in $ProjectPorts.Keys) {
        $port = $ProjectPorts[$name]
        $ruleName = "$FirewallRulePrefix`_$name`_$port"
        
        try {
            # Create inbound rule to allow only local connections
            New-NetFirewallRule -DisplayName "$ruleName`_Inbound`" `
                -Name "$ruleName`_Inbound`" `
                -Direction Inbound `
                -Protocol TCP `
                -LocalPort $port `
                -RemoteAddress LocalSubnet `
                -Action Allow `
                -Profile Any `
                -Enabled True 2>&1 | Out-Null
            
            # Create outbound rule
            New-NetFirewallRule -DisplayName "$ruleName`_Outbound`" `
                -Name "$ruleName`_Outbound`" `
                -Direction Outbound `
                -Protocol TCP `
                -LocalPort $port `
                -Action Allow `
                -Profile Any `
                -Enabled True 2>&1 | Out-Null
            
            Write-Status "Created firewall rules for $name (port $port)" 'Success'
        } catch {
            Write-Status "Failed to create firewall rules for $name : $_" 'Error'
        }
    }
}

function Remove-FirewallRules {
    Write-Status "Removing existing firewall rules..." 'Info'
    
    try {
        $rules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "$FirewallRulePrefix`*" }
        foreach ($rule in $rules) {
            Remove-NetFirewallRule -Name $rule.Name 2>&1 | Out-Null
        }
        if ($rules.Count -gt 0) {
            Write-Status "Removed $($rules.Count) existing firewall rules" 'Success'
        }
    } catch {
        Write-Status "No existing firewall rules to remove" 'Info'
    }
}

function Block-ExternalAccess {
    Write-Status "Blocking external access to project ports..." 'Info'
    
    foreach ($name in $ProjectPorts.Keys) {
        $port = $ProjectPorts[$name]
        $ruleName = "$FirewallRulePrefix`_Block_External_$port"
        
        try {
            # Create rule to block external (internet) connections
            New-NetFirewallRule -DisplayName $ruleName `
                -Name $ruleName `
                -Direction Inbound `
                -Protocol TCP `
                -LocalPort $port `
                -RemoteAddress Internet `
                -Action Block `
                -Profile Any `
                -Enabled True 2>&1 | Out-Null
            
            Write-Status "Blocked external access to $name (port $port)" 'Success'
        } catch {
            Write-Status "Failed to block external access for $name : $_" 'Error'
        }
    }
}

function Setup-PortSecurity {
    Write-Status "Setting up port security for $ProjectName..." 'Info'
    Write-Host ""
    
    # Reserve ports
    Write-Status "Reserving project ports..." 'Info'
    $reservedCount = 0
    foreach ($name in $ProjectPorts.Keys) {
        $port = $ProjectPorts[$name]
        if (Reserve-PortRange -StartPort $port -Count 1) {
            $reservedCount++
        }
    }
    
    Write-Host ""
    
    # Create firewall rules
    Add-FirewallRules
    
    Write-Host ""
    
    # Block external access
    Block-ExternalAccess
    
    Write-Host ""
    Write-Status "Port security setup complete! Reserved $reservedCount ports." 'Success'
    Write-Host ""
    Write-Host "Reserved Ports:" -ForegroundColor Cyan
    foreach ($name in $ProjectPorts.Keys) {
        Write-Host "  $name : $($ProjectPorts[$name])" -ForegroundColor White
    }
}

function Release-PortSecurity {
    Write-Status "Releasing port reservations for $ProjectName..." 'Warning'
    Write-Host ""
    
    # Release ports
    $releasedCount = 0
    foreach ($name in $ProjectPorts.Keys) {
        $port = $ProjectPorts[$name]
        if (Release-PortRange -StartPort $port -Count 1) {
            $releasedCount++
        }
    }
    
    Write-Host ""
    
    # Remove firewall rules
    Remove-FirewallRules
    
    Write-Host ""
    Write-Status "Port security released! Freed $releasedCount ports." 'Success'
}

function Show-PortStatus {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  PORT SECURITY STATUS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Project: $ProjectName" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Configured Ports:" -ForegroundColor Yellow
    foreach ($name in $ProjectPorts.Keys) {
        $port = $ProjectPorts[$name]
        $reserved = Test-PortReserved -Port $port
        $status = if ($reserved) { "RESERVED ✓" } else { "Available" }
        $color = if ($reserved) { 'Green' } else { 'Gray' }
        Write-Host "  $port : $name - " -NoNewline
        Write-Host $status -ForegroundColor $color
    }
    
    Write-Host ""
    Write-Host "Reserved Port Ranges (System):" -ForegroundColor Yellow
    $ranges = Get-ReservedPortRanges
    $ranges | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    
    Write-Host ""
    Write-Host "Firewall Rules:" -ForegroundColor Yellow
    $rules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "$FirewallRulePrefix`*" } | Select-Object -First 10
    if ($rules) {
        $rules | ForEach-Object { 
            Write-Host "  $($_.DisplayName) - " -NoNewline
            Write-Host $_.Enabled -ForegroundColor $(if ($_.Enabled -eq 'True') { 'Green' } else { 'Red' })
        }
    } else {
        Write-Host "  No firewall rules found" -ForegroundColor DarkGray
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
}

function Enforce-PortRestrictions {
    Write-Status "Enforcing port restrictions..." 'Info'
    
    # Check if ports are reserved
    $allReserved = $true
    foreach ($name in $ProjectPorts.Keys) {
        $port = $ProjectPorts[$name]
        if (-not (Test-PortReserved -Port $port)) {
            Write-Status "Port $port ($name) is NOT reserved! Fixing..." 'Warning'
            Reserve-PortRange -StartPort $port -Count 1
            $allReserved = $false
        }
    }
    
    if ($allReserved) {
        Write-Status "All ports are properly reserved" 'Success'
    }
    
    # Check firewall rules
    $rules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "$FirewallRulePrefix`*" }
    if ($rules.Count -eq 0) {
        Write-Status "Firewall rules missing! Re-creating..." 'Warning'
        Add-FirewallRules
        Block-ExternalAccess
    } else {
        Write-Status "Firewall rules are in place ($($rules.Count) rules)" 'Success'
    }
}

# Main Execution
switch ($Action) {
    'setup' {
        Setup-PortSecurity
    }
    'release' {
        Release-PortSecurity
    }
    'status' {
        Show-PortStatus
    }
    'enforce' {
        Enforce-PortRestrictions
    }
}

Write-Host ""
