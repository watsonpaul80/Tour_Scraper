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
echo [4] Ensure Bell On    - Ensures all tracker alerts are enabled.
echo [5] Exit              - Closes the program.
echo =======================================
echo.

set /p choice=Select an option (1-5): 

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
    echo.
    echo ===== Running Ensure Bell On =====
    node ensure_bell_on.js
    echo ==================================
    pause >nul
    goto MENU
) else if "%choice%"=="5" (
    echo Exiting the program...
    exit /b
) else (
    echo.
    echo Invalid option selected. Please enter a number from 1 to 5.
    echo Press any key to retry.
    pause >nul
    goto MENU
)

endlocal
