# AI Quiz Project - Firewall Protection Script
# Run this script as Administrator to protect AI Quiz ports

# AI Quiz exclusive ports - UPDATE HERE when ports change
$aiQuizPorts = "3010", "3012", "4000", "5432", "6379"

Write-Host "Setting up firewall protection for AI Quiz exclusive ports..." -ForegroundColor Green

# Remove any existing rule with the same name
Remove-NetFirewallRule -DisplayName "AI-Quiz-Exclusive-Ports" -ErrorAction SilentlyContinue

# Create firewall rule to block external access
New-NetFirewallRule `
    -DisplayName "AI-Quiz-Exclusive-Ports" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $aiQuizPorts `
    -Action Block `
    -RemoteAddress "Internet" `
    -LocalAddress "Any" `
    -Profile "Domain,Private,Public" `
    -Description "Blocks external access to AI Quiz exclusive ports. Localhost access allowed."

# Allow localhost access explicitly
New-NetFirewallRule `
    -DisplayName "AI-Quiz-Allow-Localhost" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $aiQuizPorts `
    -Action Allow `
    -RemoteAddress "127.0.0.1", "::1" `
    -LocalAddress "Any" `
    -Profile "Domain,Private,Public" `
    -Description "Allows localhost access to AI Quiz ports."

Write-Host "Firewall protection configured!" -ForegroundColor Green
Write-Host "AI Quiz ports are now protected from external access." -ForegroundColor Yellow
Write-Host ""
Write-Host "Protected ports: $($aiQuizPorts -join ', ')" -ForegroundColor Cyan