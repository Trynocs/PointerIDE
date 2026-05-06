@echo off
setlocal

echo [Pointer] Stopping all dev processes (watchers + app)...
echo.

set "ROOT=%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\dev-stop.ps1" %*
pause
exit /b %ERRORLEVEL%
