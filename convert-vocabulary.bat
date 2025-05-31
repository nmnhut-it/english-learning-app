@echo off
echo Converting vocabulary format in markdown files...
echo.

powershell -ExecutionPolicy Bypass -File convert-vocabulary-format.ps1

echo.
echo Press any key to exit...
pause > nul
