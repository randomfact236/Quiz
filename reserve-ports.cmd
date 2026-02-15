@echo off
netsh int ip add excludedportrange protocol=tcp startport=3010 numberofports=1
netsh int ip add excludedportrange protocol=tcp startport=4000 numberofports=1
netsh int ip add excludedportrange protocol=tcp startport=5432 numberofports=1
netsh int ip add excludedportrange protocol=tcp startport=6379 numberofports=1
