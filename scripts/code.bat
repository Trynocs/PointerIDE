@echo off
setlocal

set ROOT=%~dp0..

if defined VSCODE_SKIP_PRELAUNCH goto :skip_prelaunch

set "ELECTRON_RUN_AS_NODE=1"
node "%ROOT%\build\lib\preLaunch.ts" || exit /b %errorlevel%
set "ELECTRON_RUN_AS_NODE="

:skip_prelaunch

set NODE_ENV=development
set VSCODE_DEV=1
set VSCODE_CLI=1
set ELECTRON_ENABLE_STACK_DUMPING=1
set ELECTRON_ENABLE_LOGGING=1

for /f "usebackq delims=" %%A in (`node -p "require('./product.json').applicationName"`) do set APP_NAME=%%A

"%ROOT%\.build\electron\%APP_NAME%.exe" . --disable-extension=vscode.vscode-api-tests %*
