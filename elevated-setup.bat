@echo off
:: Run all port reservations
echo ========================================
echo AI QUIZ PLATFORM - PORT RESERVATION
echo ========================================
echo.

netsh int ip add excludedportrange protocol=tcp startport=3010 numberofports=1 >nul 2>&1
if %errorLevel% == 0 (echo [OK] Port 3010 reserved) else (echo [SKIP] Port 3010 already reserved or error)

netsh int ip add excludedportrange protocol=tcp startport=4000 numberofports=1 >nul 2>&1
if %errorLevel% == 0 (echo [OK] Port 4000 reserved) else (echo [SKIP] Port 4000 already reserved or error)

netsh int ip add excludedportrange protocol=tcp startport=5432 numberofports=1 >nul 2>&1
if %errorLevel% == 0 (echo [OK] Port 5432 reserved) else (echo [SKIP] Port 5432 already reserved or error)

netsh int ip add excludedportrange protocol=tcp startport=6379 numberofports=1 >nul 2>&1
if %errorLevel% == 0 (echo [OK] Port 6379 reserved) else (echo [SKIP] Port 6379 already reserved or error)

echo.
echo ========================================
echo VERIFICATION
echo ========================================
netsh int ip show excludedportrange protocol=tcp | findstr "3010 4000 5432 6379"

echo.
echo ========================================
echo DONE
echo ========================================
pause
