@echo off
echo Starting English Learning App V2...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "package.json" (
    echo Error: package.json not found
    echo Make sure you're running this script from the v2 directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Start the development server
echo Starting development server...
echo App will open at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause