@echo off
setlocal EnableDelayedExpansion

:MENU
cls
echo =======================================
echo           ATR Stable Tour Scraper
echo =======================================
echo Choose an option:
echo [1] Run Collect       - Collects and processes new stable tour data.
echo [2] Tracker Login     - Logs into the tracker system for authentication.
echo [3] Failed Horses     - Attempts to retry adding previously failed horses.
echo [4] Exit              - Closes the program.
echo =======================================
echo.

set /p choice=Select an option (1-4): 

REM Check the user's choice and execute the corresponding script
if "%choice%"=="1" (
    echo.
    echo ===== Running Collect =====
    node collect.js
    echo ============================
    pause >nul
    goto MENU
) else if "%choice%"=="2" (
    echo.
    echo ==== Running Tracker Login ====
    node trackerlogin.js
    echo ================================
    pause >nul
    goto MENU
) else if "%choice%"=="3" (
    echo.
    echo ===== Running Failed Horses =====
    node failedhorses.js
    echo =================================
    pause >nul
    goto MENU
) else if "%choice%"=="4" (
    echo Exiting the program...
    exit /b
) else (
    echo.
    echo Invalid option selected. Please enter a number from 1 to 4.
    echo Press any key to retry.
    pause >nul
    goto MENU
)

endlocal
