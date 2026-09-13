@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

REM System va PowerShell yo'llarini ta'minlash
set "PATH=%SystemRoot%\System32\WindowsPowerShell\v1.0;%SystemRoot%\System32;%PATH%"

REM Java 17+ mavjudligini ta'minlash (JAVA_HOME ni PATH boshiga qo'yish)
if exist "C:\Program Files\Java\jdk-17" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"
    set "PATH=C:\Program Files\Java\jdk-17\bin;%PATH%"
) else if defined JAVA_HOME (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
)

echo ==========================================
echo   Prava Online - Spring Boot Backend
echo ==========================================

REM .env fayldan o'zgaruvchilarni yuklash
if exist .env (
    echo [.env] Konfiguratsiya yuklanmoqda...
    for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
        if not "%%A"=="" (
            set "%%A=%%B"
        )
    )
) else (
    echo [OGOHLANTIRISH] .env fayli topilmadi!
)

REM Maven yoki mvnw wrapper ni tekshirish
where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "MVN_CMD=mvn"
    echo [INFO] Tizim Maven ishlatilmoqda: mvn
) else (
    if exist mvnw.cmd (
        set "MVN_CMD=mvnw.cmd"
        echo [INFO] Mahalliy Maven Wrapper ishlatilmoqda: mvnw.cmd
    ) else (
        set "MVN_CMD=mvn"
        echo [OGOHLANTIRISH] mvn yoki mvnw.cmd topilmadi, 'mvn' deb chaqiriladi.
    )
)

echo ==========================================
echo   Spring Boot Backend (port 8081)
echo   Profile: dev
echo   URL: http://localhost:8081
echo   Swagger / API: http://localhost:8081/api
echo ==========================================
%MVN_CMD% spring-boot:run -Dspring-boot.run.profiles=dev
pause
