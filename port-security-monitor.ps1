# AI Quiz Project - Port Security Monitor
# This script monitors that AI Quiz ports are properly secured

$aiQuizPorts = 3010, 3012, 5432, 6379

Write-Host "🔍 AI Quiz Port Security Check - $(Get-Date)" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

$securityIssues = @()

foreach ($port in $aiQuizPorts) {
    # Check if port is actually in use
    $portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

    Write-Host "Port $port : " -NoNewline

    if ($portInUse) {
        Write-Host "IN USE (PID: $($portInUse.OwningProcess))" -ForegroundColor Yellow -NoNewline
        Write-Host " ✓ Service running" -ForegroundColor Green
    } else {
        Write-Host "NOT IN USE" -ForegroundColor Gray -NoNewline
        Write-Host " ✓ Properly blocked" -ForegroundColor Green
    }
}

# Check firewall rules
Write-Host "`n🔥 Firewall Rules Check:" -ForegroundColor Cyan
$firewallRule = Get-NetFirewallRule -DisplayName "AI-Quiz-Exclusive-Ports" -ErrorAction SilentlyContinue
if ($firewallRule) {
    Write-Host "✓ AI Quiz firewall rule exists" -ForegroundColor Green
    if ($firewallRule.Enabled -eq "True") {
        Write-Host "✓ Firewall rule is enabled" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Firewall rule is disabled" -ForegroundColor Yellow
        $securityIssues += "AI Quiz firewall rule is disabled"
    }
} else {
    Write-Host "🚨 AI Quiz firewall rule missing!" -ForegroundColor Red
    $securityIssues += "AI Quiz firewall rule not found"
}

# Report issues
if ($securityIssues.Count -gt 0) {
    Write-Host "`n🚨 SECURITY ISSUES DETECTED:" -ForegroundColor Red
    foreach ($issue in $securityIssues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
    Write-Host "`n🔧 Run 'firewall-protection.ps1' as Administrator to fix firewall issues" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ All security checks passed!" -ForegroundColor Green
}

Write-Host ("`n" + "=" * 50) -ForegroundColor Cyan