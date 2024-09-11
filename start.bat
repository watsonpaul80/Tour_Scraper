@echo off

:START
REM Prompt the user to choose between tracker, collect, or test
echo Choose an option:
echo 1. Run collecy
echo 2. Tracker login 


set /p choice=Enter option number:

REM Check the user's choice and execute the corresponding script
if "%choice%"=="1" (
    REM Call collect.js
    node collect.js
) else if "%choice%"=="2" (
    REM Call trackerlogin.js
    node trackerlogin.js
) else (
    REM If the input is invalid, display an error message
    echo Invalid option selected. Please enter either 1, 2.
    goto START
)

REM Pause to see any error messages
pause
