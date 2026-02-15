@echo off
echo Reserving AI Quiz Platform ports...
netsh int ip add excludedportrange protocol=tcp startport=5432 numberofports=1 2>nul
netsh int ip add excludedportrange protocol=tcp startport=6379 numberofports=1 2>nul
echo Done.
netsh int ip show excludedportrange protocol=tcp | findstr "3010 4000 5432 6379"
pause
