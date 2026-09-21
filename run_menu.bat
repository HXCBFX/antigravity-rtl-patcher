@echo off
chcp 65001 >nul
title Antigravity RTL Patcher - Menu
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install --no-audit --no-fund
)

node cli.js
