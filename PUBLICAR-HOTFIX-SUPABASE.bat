@echo off
setlocal
cd /d "%~dp0"
title 77 TEAM - Publicar Hotfix Supabase

echo ==========================================
echo  PUBLICAR HOTFIX SUPABASE / CACHE
echo ==========================================
echo.

call npx --yes firebase-tools login:list >nul 2>nul
if errorlevel 1 (
  call npx --yes firebase-tools login
  if errorlevel 1 (
    echo ERRO: login Firebase nao concluido.
    pause
    exit /b 1
  )
)

call npx --yes firebase-tools deploy --only hosting --project team-f78cd
if errorlevel 1 (
  echo ERRO no deploy do Hosting.
  pause
  exit /b 1
)

echo.
echo HOTFIX PUBLICADO.
echo Abra o site e pressione CTRL+F5.
pause
