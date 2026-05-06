@echo off
setlocal

echo [Pointer] Starting app only (no watchers, no npm install, no rebuild)...
echo [Pointer] Use run\start-dev.bat for live dev mode.
echo.

set "ROOT=%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\start-pointer.ps1" %*
pause
exit /b %ERRORLEVEL%
