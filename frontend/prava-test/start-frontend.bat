@echo off
cd /d "%~dp0"

echo ==========================================
echo   Prava Online - Frontend (prava-test)
echo ==========================================

REM Eski yoki faol bo'lmagan korporativ proxy'larni tozalash
set HTTP_PROXY=
set HTTPS_PROXY=
set ALL_PROXY=

REM Node.js mavjudligini tekshirish
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [XATO] Node.js tizimda topilmadi!
    echo Iltimos, Node.js ni https://nodejs.org saytidan o'rnating.
    pause
    exit /b 1
)

REM node_modules mavjudligini tekshirish
if not exist node_modules (
    echo [INFO] node_modules mavjud emas. Kerakli paketlar o'rnatilmoqda (npm install)...
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% neq 0 (
        echo [XATO] npm install muvaffaqiyatsiz tugadi!
        pause
        exit /b 1
    )
)

echo ==========================================
echo   Frontend Vite Server ishga tushirilmoqda...
echo   URL: http://localhost:5173
echo ==========================================
call npm run dev
pause
