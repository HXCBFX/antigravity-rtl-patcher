@echo off
chcp 65001 >nul
title Antigravity RTL - Restore Original
echo =============================================================
echo   🌟 Antigravity RTL Patcher - Restore Original
echo   بازگردانی نسخه اصلی کارخانه آنتی‌گرویتی
echo =============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    pause
    exit /b 1
)

node cli.js --unpatch

echo.
pause
