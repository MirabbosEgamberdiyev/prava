@echo off
setlocal enabledelayedexpansion
cd /d C:\Users\mirabbos.egamberdiye\Desktop\PRAVA-ONLINE\prava\prava\backend

REM B4: sirlar endi hardcoded default emas - .env'dan yuklaymiz.
REM docker-compose ${VAR} interpolyatsiyasi tufayli qiymatlardagi "$" belgisi
REM .env'da "$$" sifatida escape qilingan (masalan parollarda) — shu yerda
REM lokal ishga tushirish uchun "$$" ni yana bitta "$" ga qaytaramiz.
if exist .env (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
        if not "%%A"=="" (
            set "_val=%%B"
            set "_val=!_val:$$=$!"
            set "%%A=!_val!"
        )
    )
)

echo ==========================================
echo   Spring Boot Backend (port 8081)
echo   Profile: dev
echo   URL: http://10.206.223.109:8081
echo ==========================================
mvn spring-boot:run -Dspring-boot.run.profiles=dev
pause
