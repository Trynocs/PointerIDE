@echo off
setlocal

echo [Pointer] Starting live dev mode (watch + app)...
echo [Pointer] Use run\dev-stop.bat to stop the background watchers.
echo.

set "ROOT=%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev-windows.ps1" %*
pause
exit /b %ERRORLEVEL%
