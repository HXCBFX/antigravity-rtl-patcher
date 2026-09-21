@echo off
chcp 65001 >nul
title Antigravity RTL Patcher
echo =============================================================
echo   🌟 Antigravity RTL Patcher - Persian / Arabic / Hebrew
echo   پچر راست‌چین هوشمند آنتی‌گرویتی (فارسی، عربی، عبری)
echo =============================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo لطفاً ابتدا Node.js را نصب کنید: https://nodejs.org
    pause
    exit /b 1
)

:: Install dependencies if node_modules missing
if not exist "node_modules\" (
    echo Installing required dependencies...
    call npm install --no-audit --no-fund
)

:: Run patch command
node cli.js --patch

echo.
pause
