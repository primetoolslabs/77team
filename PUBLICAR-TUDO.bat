@echo off
setlocal
cd /d "%~dp0"
title 77 TEAM - Publicar Projeto

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  pause
  exit /b 1
)

call npx --yes firebase-tools login:list >nul 2>nul
if errorlevel 1 (
  call npx --yes firebase-tools login
  if errorlevel 1 (
    echo ERRO: login nao concluido.
    pause
    exit /b 1
  )
)

call npx --yes firebase-tools deploy --only firestore:rules,hosting

if errorlevel 1 (
  echo PUBLICACAO FALHOU.
  echo Se o retorno for HTTP 503, tente novamente mais tarde.
  pause
  exit /b 1
)

echo PROJETO PUBLICADO COM SUCESSO.
pause
