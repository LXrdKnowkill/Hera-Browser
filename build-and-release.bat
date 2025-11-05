@echo off
echo ========================================
echo   Hera Browser - Build and Release
echo ========================================
echo.

REM 1. Build
echo [1/6] Fazendo build do projeto...
call npm run package
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Build falhou!
    pause
    exit /b 1
)

REM 2. Criar instalador
echo.
echo [2/6] Criando instalador...
call npm run make
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Criacao do instalador falhou!
    pause
    exit /b 1
)

REM 3. Commit
echo.
echo [3/6] Fazendo commit...
git add .
git commit -F COMMIT_MESSAGE_v2.0.4.txt

REM 4. Tag
echo.
echo [4/6] Criando tag v2.0.4...
git tag v2.0.4

REM 5. Push
echo.
echo [5/6] Fazendo push...
git push origin main
git push origin --tags

REM 6. Informacoes
echo.
echo [6/6] Build concluido!
echo.
echo ========================================
echo   Arquivos gerados:
echo ========================================
echo.
dir /B out\make\squirrel.windows\x64\*.exe
dir /B out\make\squirrel.windows\x64\*.nupkg
echo.
echo ========================================
echo   Proximos passos:
echo ========================================
echo.
echo OPCAO 1 - GitHub CLI (mais rapido):
echo   gh release create v2.0.4 --title "v2.0.4 - Polish Update" --notes-file GITHUB_RELEASE_NOTES.md out\make\squirrel.windows\x64\*.exe out\make\squirrel.windows\x64\*.nupkg
echo.
echo OPCAO 2 - Interface Web:
echo   1. Acesse: https://github.com/SEU_USUARIO/hera-browser/releases/new
echo   2. Selecione tag: v2.0.4
echo   3. Titulo: v2.0.4 - Polish Update
echo   4. Cole o conteudo de GITHUB_RELEASE_NOTES.md
echo   5. Arraste os arquivos de out\make\squirrel.windows\x64\
echo   6. Clique em "Publish release"
echo.
pause
