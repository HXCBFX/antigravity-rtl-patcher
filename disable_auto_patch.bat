@echo off
chcp 65001 >nul
title Antigravity RTL - Disable Auto-Patch
echo =============================================================
echo   🌟 Antigravity RTL - غیرفعال‌سازی پچ خودکار هنگام ورود به ویندوز
echo =============================================================
echo.

node setup-auto-patch.js --disable

echo.
pause
