@echo off
setlocal
cd /d "%~dp0"
title 77 TEAM - Publicar Firestore Rules

echo ==========================================
echo  77 TEAM - PUBLICAR FIRESTORE RULES
echo ==========================================

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  echo Instale o Node.js LTS e tente novamente.
  pause
  exit /b 1
)

if not exist "firebase.json" (
  echo ERRO: firebase.json nao encontrado.
  pause
  exit /b 1
)

if not exist "firestore.rules" (
  echo ERRO: firestore.rules nao encontrado.
  pause
  exit /b 1
)

call npx --yes firebase-tools login:list >nul 2>nul
if errorlevel 1 (
  echo Fazendo login no Firebase...
  call npx --yes firebase-tools login
  if errorlevel 1 (
    echo ERRO: login nao concluido.
    pause
    exit /b 1
  )
)

echo.
echo Publicando firestore.rules...
call npx --yes firebase-tools deploy --only firestore:rules

if errorlevel 1 (
  echo.
  echo PUBLICACAO FALHOU.
  echo Se aparecer HTTP 503, o servico do Firebase esta indisponivel.
  echo O arquivo local nao consegue corrigir indisponibilidade do servidor.
  echo Execute este mesmo arquivo novamente mais tarde.
  pause
  exit /b 1
)

echo.
echo FIRESTORE RULES PUBLICADO COM SUCESSO.
pause
