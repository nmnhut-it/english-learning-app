@echo off
echo Installing missing dependencies...
cd backend
npm install axios
echo.
echo Dependencies installed! Restarting the app...
cd ..
.\start-app.bat
