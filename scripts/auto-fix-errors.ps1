#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated error detection and resolution for Quiz App
.DESCRIPTION
    Detects and fixes common Internal Server Errors automatically
#>

param(
    [switch]$Frontend,
    [switch]$Backend,
    [switch]$All,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$hasErrors = $false
$fixesApplied = @()

function Write-Status($message, $type = "info") {
    $colors = @{
        "info" = "Cyan"
        "success" = "Green"
        "warning" = "Yellow"
        "error" = "Red"
    }
    Write-Host "[$type] $message" -ForegroundColor $colors[$type]
}

function Test-TypeScript($projectPath, $name) {
    Write-Status "Checking TypeScript for $name..."
    Set-Location $projectPath
    $output = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Status "TypeScript errors found in $name" "error"
        Write-Host $output
        return $false
    }
    Write-Status "TypeScript check passed for $name" "success"
    return $true
}

function Clear-NextCache($frontendPath) {
    Write-Status "Clearing Next.js cache..."
    $cachePaths = @(
        "$frontendPath\.next",
        "$frontendPath\node_modules\.cache"
    )
    
    foreach ($path in $cachePaths) {
        if (Test-Path $path) {
            try {
                Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
                Write-Status "Cleared: $path" "success"
                $script:fixesApplied += "Cleared cache: $path"
            } catch {
                Write-Status "Failed to clear: $path" "warning"
            }
        }
    }
}

function Fix-CommonIssues($projectPath, $name) {
    Write-Status "Checking for common issues in $name..."
    
    # Check for .env files
    $envFiles = @(".env", ".env.local", ".env.production", ".env.development")
    $hasEnv = $false
    foreach ($env in $envFiles) {
        if (Test-Path "$projectPath\$env") {
            $hasEnv = $true
            break
        }
    }
    
    if (-not $hasEnv -and $name -eq "Frontend") {
        Write-Status "Creating .env.local for frontend..." "warning"
        "NEXT_PUBLIC_API_URL=http://localhost:3001" | Set-Content "$projectPath\.env.local"
        "NEXT_PUBLIC_APP_NAME=AI Quiz" | Add-Content "$projectPath\.env.local"
        $script:fixesApplied += "Created .env.local"
    }
}

function Test-NodeModules($projectPath, $name) {
    Write-Status "Checking node_modules for $name..."
    if (-not (Test-Path "$projectPath\node_modules")) {
        Write-Status "node_modules missing for $name, running npm install..." "warning"
        Set-Location $projectPath
        npm install 2>&1 | Out-Null
        $script:fixesApplied += "Installed node_modules for $name"
    } else {
        Write-Status "node_modules exists for $name" "success"
    }
}

# Main execution
$rootPath = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $rootPath "apps\frontend"
$backendPath = Join-Path $rootPath "apps\backend"

Write-Status "Starting automated error detection and resolution..." "info"
Write-Status "Root path: $rootPath" "info"

if ($All -or $Frontend) {
    Write-Host "`n=== Frontend Checks ===" -ForegroundColor Magenta
    
    # Clear cache first
    Clear-NextCache $frontendPath
    
    # Check node_modules
    Test-NodeModules $frontendPath "Frontend"
    
    # Fix common issues
    Fix-CommonIssues $frontendPath "Frontend"
    
    # TypeScript check
    if (-not (Test-TypeScript $frontendPath "Frontend")) {
        $hasErrors = $true
    }
}

if ($All -or $Backend) {
    Write-Host "`n=== Backend Checks ===" -ForegroundColor Magenta
    
    # Check node_modules
    Test-NodeModules $backendPath "Backend"
    
    # Fix common issues
    Fix-CommonIssues $backendPath "Backend"
    
    # TypeScript check
    if (-not (Test-TypeScript $backendPath "Backend")) {
        $hasErrors = $true
    }
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Magenta
if ($fixesApplied.Count -gt 0) {
    Write-Status "Fixes applied:" "success"
    foreach ($fix in $fixesApplied) { 
        Write-Host "  + $fix" -ForegroundColor Green 
    }
} else {
    Write-Status "No fixes were needed" "info"
}

if ($hasErrors) {
    Write-Status "Errors still present. Please check the output above." "error"
    Write-Status "Try running: npm run dev (frontend) and npm run start:dev (backend)" "info"
    exit 1
} else {
    Write-Status "All checks passed! Internal Server Error should be resolved." "success"
    Write-Status "Please restart your dev servers:" "info"
    Write-Host "  1. Frontend: cd apps/frontend ; npm run dev" -ForegroundColor Cyan
    Write-Host "  2. Backend:  cd apps/backend ; npm run start:dev" -ForegroundColor Cyan
    exit 0
}
