@echo off
cd /d C:\Users\mirabbos.egamberdiye\Desktop\PRAVA-ONLINE\prava\prava\backend
echo ==========================================
echo   Spring Boot Backend (port 8081)
echo   Profile: dev
echo   URL: http://10.206.223.109:8081
echo ==========================================
mvn spring-boot:run -Dspring-boot.run.profiles=dev
pause
