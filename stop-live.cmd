@echo off
title KFZ-Oszi Stop
taskkill /fi "WINDOWTITLE eq Oszi-Bridge*" /t /f >nul 2>nul
taskkill /fi "WINDOWTITLE eq Oszi-Webserver*" /t /f >nul 2>nul
echo Bridge und Webserver beendet.
timeout /t 2 /nobreak >nul
exit /b 0
