@echo off
setlocal enabledelayedexpansion
title Adyton - Push to GitHub

echo ====================================================
echo        ADYTON - PUSH TO GITHUB (MAIN BRANCH)
echo ====================================================
echo.

set "GIT_EXE=C:\Users\PC\AppData\Local\Programs\MinGit\cmd\git.exe"
if not exist "%GIT_EXE%" (
    where git >nul 2>&1
    if %errorlevel% equ 0 (
        set "GIT_EXE=git"
    ) else (
        echo [ERROR] Git executable not found.
        pause
        exit /b 1
    )
)

echo [1/3] Checking Git repository status...
cd /d "C:\Users\PC\Desktop\Adyton"
"%GIT_EXE%" status

echo.
echo [2/3] Attempting standard push to https://github.com/Habuskid/Adyton.git ...
echo.
"%GIT_EXE%" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ====================================================
    echo [SUCCESS] Code pushed successfully to GitHub!
    echo URL: https://github.com/Habuskid/Adyton
    echo ====================================================
    pause
    exit /b 0
)

echo.
echo ====================================================
echo [NOTICE] Standard push requires GitHub authentication.
echo Note: GitHub passwords are no longer accepted; GitHub
echo requires a Personal Access Token (PAT).
echo ====================================================
echo.
echo Generate a token in 10 seconds here:
echo https://github.com/settings/tokens/new (Check 'repo' permission)
echo.
set /p TOKEN="Paste your GitHub Personal Access Token (or press Enter to cancel): "

if "%TOKEN%"=="" (
    echo Cancelled.
    pause
    exit /b 1
)

echo.
echo [3/3] Pushing with Personal Access Token...
"%GIT_EXE%" push https://%TOKEN%@github.com/Habuskid/Adyton.git main --force

if %errorlevel% equ 0 (
    echo.
    echo ====================================================
    echo [SUCCESS] Code pushed successfully to GitHub!
    echo URL: https://github.com/Habuskid/Adyton
    echo ====================================================
) else (
    echo.
    echo [ERROR] Push failed. Please verify your token permissions.
)

pause
