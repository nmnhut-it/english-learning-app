@echo off
echo ========================================
echo Git Cleanup - Remove node_modules from tracking
echo ========================================
echo.

:: Check if we're in a git repository
git status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: This is not a Git repository!
    echo Please run this script from your project root directory.
    pause
    exit /b 1
)

echo This script will:
echo 1. Remove node_modules from Git tracking (if tracked)
echo 2. Keep the files on your local disk
echo 3. Ensure .gitignore is properly set up
echo.
set /p confirm="Do you want to continue? (Y/N): "
if /i not "%confirm%"=="Y" exit /b 0

echo.
echo Removing node_modules from Git tracking...
echo.

:: Remove backend node_modules from git tracking
echo Removing backend/node_modules...
git rm -r --cached backend/node_modules 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Successfully removed backend/node_modules from tracking
) else (
    echo backend/node_modules was not tracked
)

:: Remove frontend node_modules from git tracking
echo Removing frontend/node_modules...
git rm -r --cached frontend/node_modules 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Successfully removed frontend/node_modules from tracking
) else (
    echo frontend/node_modules was not tracked
)

:: Also remove common build/dist directories if they exist
echo.
echo Checking for other directories to exclude...
git rm -r --cached backend/dist 2>nul
git rm -r --cached backend/build 2>nul
git rm -r --cached frontend/dist 2>nul
git rm -r --cached frontend/build 2>nul
git rm -r --cached .vscode 2>nul
git rm --cached .env 2>nul
git rm --cached .env.local 2>nul

echo.
echo Adding .gitignore to staging...
git add .gitignore

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Review the changes: git status
echo 2. Commit the changes: git commit -m "Add .gitignore and remove node_modules from tracking"
echo 3. Push to remote: git push
echo.
echo Note: The node_modules folders are still on your disk,
echo they're just no longer tracked by Git.
echo.
pause
