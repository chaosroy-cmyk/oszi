@echo off
title KFZ-Oszi Starter
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python nicht gefunden. Bitte von python.org installieren
  echo und beim Setup "Add Python to PATH" anhaken.
  pause
  exit /b 1
)
if not exist bridge.py (
  echo bridge.py nicht gefunden - start-live.cmd muss im
  echo Kompendium-Ordner liegen.
  pause
  exit /b 1
)

echo Starte Bridge (Fenster "Oszi-Bridge") ...
start "Oszi-Bridge" cmd /k python bridge.py

echo Starte Webserver (Fenster "Oszi-Webserver") ...
start "Oszi-Webserver" cmd /k python -m http.server 8080 --bind 127.0.0.1

echo Warte kurz, dann oeffnet der Browser ...
timeout /t 2 /nobreak >nul
start "" http://localhost:8080

echo.
echo Fertig. Beide Fenster offen lassen.
echo Beenden spaeter mit stop-live.cmd oder Fenster schliessen.
timeout /t 4 /nobreak >nul
exit /b 0
