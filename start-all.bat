@echo off
cd /d "%~dp0"

echo ========================================================
echo   PRAVA ONLINE - FULL STACK ISHGA TUSHIRISH
echo ========================================================
echo.
echo [1/2] Backend (Spring Boot: 8081) alohida oynada ochilmoqda...
start "Prava Backend (8081)" cmd /k "cd /d "%~dp0backend" && call start-local.bat"

echo [2/2] Frontend (Vite: 5173) alohida oynada ochilmoqda...
start "Prava Frontend (5173)" cmd /k "cd /d "%~dp0frontend\prava-test" && call start-frontend.bat"

echo.
echo ========================================================
echo   Barcha modullar ishga tushirildi!
echo   - Backend:  http://localhost:8081
echo   - Frontend: http://localhost:5173
echo ========================================================
echo.
timeout /t 5
