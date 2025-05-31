@echo off
echo ========================================
echo Installing dependencies for presentation mode
echo ========================================
echo.

cd frontend
echo Installing react-markdown and remark-gfm...
npm install react-markdown@^9.0.0 remark-gfm@^4.0.0

echo.
echo ========================================
echo Installation complete!
echo Run start-app.bat to launch the application
echo ========================================
pause
