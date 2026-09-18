@echo off
echo Starting TPL2026 Backend Server...
cd /d %~dp0server
start "TPL2026 Backend" cmd /k "node index.js"
echo.
echo Starting TPL2026 Frontend...
cd /d %~dp0
start "TPL2026 Frontend" cmd /k "npx ng serve --open"
echo.
echo TPL2026 is starting up!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:4200
echo Admin Login: admin / tpl2026admin
