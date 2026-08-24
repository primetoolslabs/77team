@echo off
setlocal
cd /d "%~dp0"
title 77 TEAM - Publicar Firestore Rules

call npx --yes firebase-tools deploy --only firestore:rules --project team-f78cd
if errorlevel 1 (
  echo.
  echo Nao foi possivel publicar as regras.
  echo Se aparecer HTTP 503, o problema continua no servico Firebase Rules.
  pause
  exit /b 1
)
echo REGRAS PUBLICADAS COM SUCESSO.
pause
