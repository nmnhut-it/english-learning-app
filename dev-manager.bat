@echo off
title English Learning Platform - Dev Manager
color 0A

:MENU
cls
echo ==========================================
echo    English Learning Platform Dev Manager
echo ==========================================
echo.
echo 1. Start Both Servers (Development)
echo 2. Start Backend Only
echo 3. Start Frontend Only
echo 4. Install/Update Dependencies
echo 5. Build for Production
echo 6. Clean Install (Delete node_modules)
echo 7. Check Port Usage
echo 8. Open Project in VS Code
echo 9. Exit
echo.
echo ==========================================
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto START_BOTH
if "%choice%"=="2" goto START_BACKEND
if "%choice%"=="3" goto START_FRONTEND
if "%choice%"=="4" goto INSTALL_DEPS
if "%choice%"=="5" goto BUILD_PROD
if "%choice%"=="6" goto CLEAN_INSTALL
if "%choice%"=="7" goto CHECK_PORTS
if "%choice%"=="8" goto OPEN_VSCODE
if "%choice%"=="9" goto EXIT

echo Invalid choice! Please try again.
pause
goto MENU

:START_BOTH
cls
echo Starting both servers...
echo.

:: Check if ports are already in use
netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 3000 is already in use!
    echo Frontend server may fail to start.
    echo.
)

netstat -ano | findstr :3001 >nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Port 3001 is already in use!
    echo Backend server may fail to start.
    echo.
)

start "Backend Server" cmd /k "cd /d backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

echo.
echo Servers are starting...
echo Backend: http://0.0.0.0:3001
echo Frontend: http://0.0.0.0:3000
echo.
pause
goto MENU

:START_BACKEND
cls
echo Starting backend server only...
start "Backend Server" cmd /k "cd /d backend && npm run dev"
echo.
echo Backend server started on http://0.0.0.0:3001
pause
goto MENU

:START_FRONTEND
cls
echo Starting frontend server only...
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"
echo.
echo Frontend server started on http://0.0.0.0:3000
pause
goto MENU

:INSTALL_DEPS
cls
echo Installing/Updating dependencies...
echo.
echo Installing backend dependencies...
cd backend
call npm install
cd ..
echo.
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo.
echo Dependencies installed successfully!
pause
goto MENU

:BUILD_PROD
cls
echo Building for production...
echo.

:: Build backend
echo Building backend...
cd backend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Backend build failed!
    cd ..
    pause
    goto MENU
)
cd ..

:: Build frontend
echo.
echo Building frontend...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    cd ..
    pause
    goto MENU
)
cd ..

echo.
echo Production build completed successfully!
echo Backend build: ./backend/dist
echo Frontend build: ./frontend/dist
pause
goto MENU

:CLEAN_INSTALL
cls
echo Performing clean install...
echo This will delete node_modules and package-lock.json files
echo.
set /p confirm="Are you sure? (Y/N): "
if /i not "%confirm%"=="Y" goto MENU

echo.
echo Cleaning backend...
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"
if exist "backend\package-lock.json" del "backend\package-lock.json"

echo Cleaning frontend...
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"
if exist "frontend\package-lock.json" del "frontend\package-lock.json"

echo.
echo Clean completed. Installing fresh dependencies...
echo.
goto INSTALL_DEPS

:CHECK_PORTS
cls
echo Checking port usage...
echo.
echo Checking port 3000 (Frontend):
netstat -ano | findstr :3000
if %ERRORLEVEL% NEQ 0 (
    echo Port 3000 is free
)
echo.
echo Checking port 3001 (Backend):
netstat -ano | findstr :3001
if %ERRORLEVEL% NEQ 0 (
    echo Port 3001 is free
)
echo.
pause
goto MENU

:OPEN_VSCODE
cls
echo Opening project in VS Code...
code .
goto MENU

:EXIT
echo.
echo Goodbye!
timeout /t 2 /nobreak >nul
exit
