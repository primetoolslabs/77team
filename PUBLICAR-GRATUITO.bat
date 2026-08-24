@echo off
setlocal
cd /d "%~dp0"
title 77 TEAM - Firebase Plano Gratuito

echo ==========================================
echo  77 TEAM - PLANO GRATUITO (SPARK)
echo ==========================================
echo.
echo Publicando somente Hosting.
echo Cloud Functions NAO fazem parte desta versao.
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
  echo ERRO AO PUBLICAR HOSTING.
  pause
  exit /b 1
)

echo.
echo SITE PUBLICADO COM SUCESSO NO PLANO GRATUITO.
pause
