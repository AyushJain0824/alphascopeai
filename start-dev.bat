@echo off
title AlphaScope AI - Dev Server
cd /d "%~dp0"
echo Starting AlphaScope AI...
echo.
call npm run dev
pause
