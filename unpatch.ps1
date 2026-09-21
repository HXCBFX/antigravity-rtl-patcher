# Antigravity RTL Patcher - PowerShell Restore Runner
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is required to run this script." -ForegroundColor Red
    exit 1
}

node cli.js --unpatch
