@echo off
setlocal

echo [Pointer] Building release...
echo [Pointer] See docs/RELEASE.md for details.
echo.

set "ROOT=%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\build-pointer-release.ps1" %*
pause
exit /b %ERRORLEVEL%
