@echo off
setlocal
title Voidcord Installer
cd /d "%~dp0"

if not exist "node_modules\.bin\tsx.cmd" (
    echo Dependencies not installed. Run: pnpm install --frozen-lockfile
    pause
    exit /b 1
)

:menu
cls
echo ==============================
echo       Voidcord Installer
echo ==============================
echo.
echo 1. Inject Voidcord into Discord
echo 2. UnInject Voidcord from Discord
echo 3. Exit
echo.
choice /c 123 /n /m "Select an option: "
if errorlevel 3 exit /b 0
if errorlevel 2 goto uninject
if errorlevel 1 goto inject

:inject
echo.
echo Injecting Voidcord...
call node scripts\runInstaller.mjs -- --install
set "RESULT=%ERRORLEVEL%"
goto result

:uninject
echo.
echo Removing Voidcord from Discord...
call node scripts\runInstaller.mjs -- --uninstall
set "RESULT=%ERRORLEVEL%"

:result
echo.
if "%RESULT%"=="0" (
    echo Operation completed successfully.
) else (
    echo Operation failed with exit code %RESULT%.
)
pause
goto menu
