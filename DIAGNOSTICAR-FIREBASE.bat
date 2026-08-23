@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo  77 TEAM - DIAGNOSTICO FIREBASE
echo ==========================================
echo.
echo Node:
node --version
echo.
echo Firebase CLI:
call npx --yes firebase-tools --version
echo.
echo Login:
call npx --yes firebase-tools login:list
echo.
echo Projetos:
call npx --yes firebase-tools projects:list
echo.
echo Projeto ativo:
call npx --yes firebase-tools use
echo.
pause
