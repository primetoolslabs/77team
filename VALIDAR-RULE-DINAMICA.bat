@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo  77 TEAM - VALIDAR RULE DINAMICA
echo ==========================================
echo.
findstr /C:"function permission(key)" firestore.rules >nul
if errorlevel 1 goto :fail
findstr /C:"rolePermissions" firestore.rules >nul
if errorlevel 1 goto :fail
findstr /C:"permission('character_edit')" firestore.rules >nul
if errorlevel 1 goto :fail
findstr /C:"paymentsMatrixPermission()" firestore.rules >nul
if errorlevel 1 goto :fail
echo Estrutura dinamica encontrada.
echo.
echo Depois que esta Rule for publicada uma vez,
echo alteracoes normais na matriz Cargos e Permissoes
echo serao lidas do Firestore em tempo de execucao.
pause
exit /b 0
:fail
echo ERRO: estrutura esperada nao encontrada.
pause
exit /b 1
