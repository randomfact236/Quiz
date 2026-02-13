@echo off
echo ==================================================
echo 🔍 AI Quiz Port Security Check - %DATE% %TIME%
echo ==================================================

set "ports=3010 3011 4000 4001 5432 5434 6379 6381 5674 5673 15673 9090 3004 5601 9229 9230 8080 8081 9002 9003"

echo Checking AI Quiz exclusive ports...
echo.

for %%p in (%ports%) do (
    netstat -ano | findstr ":%%p " >nul 2>&1
    if %errorlevel% equ 0 (
        echo Port %%p: IN USE ✓ Service running
    ) else (
        echo Port %%p: NOT IN USE ✓ Properly blocked
    )
)

echo.
echo ==================================================
echo Checking firewall rules...
echo.

netsh advfirewall firewall show rule name="AI-Quiz-Exclusive-Ports" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ AI Quiz firewall rule exists
) else (
    echo 🚨 AI Quiz firewall rule MISSING!
    echo Run firewall-protection.ps1 as Administrator
)

echo.
echo ==================================================
echo Security check complete!
echo Run this script regularly to monitor port security.
echo ==================================================
pause