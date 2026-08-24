@echo off
setlocal
cd /d "%~dp0"
title 77 TEAM - Publicar somente o site

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
  echo ERRO AO PUBLICAR HOSTING.
  pause
  exit /b 1
)

echo SITE PUBLICADO COM SUCESSO.
pause
