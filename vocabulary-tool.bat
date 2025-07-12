@echo off
echo ========================================
echo Vocabulary Processing Tool - Quick Start
echo ========================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

cd /d "%~dp0"

:: Install backend dependencies if needed
if not exist "backend\node_modules" (
    echo Installing dependencies...
    cd backend
    call npm install
    cd ..
    echo.
)

:: Start vocabulary tool server
echo Starting vocabulary tool server...
start "Vocabulary Tool Server" cmd /k "cd /d backend && node server.js"

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Open vocabulary tool in browser
echo Opening vocabulary tool in browser...
start http://localhost:3001/vocabulary-tool

echo.
echo ========================================
echo Vocabulary Tool is running!
echo ========================================
echo.
echo Access at: http://localhost:3001/vocabulary-tool
echo.
echo To stop: Close the server window or press Ctrl+C
echo.
pause
