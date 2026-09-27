@echo off
setlocal EnableExtensions DisableDelayedExpansion
rem ==========================================================================
rem  Cours d'IA du Master LGC - download, install and run (Windows)
rem
rem    run.bat            everything: download or update the project, install
rem                       the course's Python libraries (first run only), then
rem                       open the website at http://127.0.0.1:8000
rem    run.bat site       only open the website (fast)
rem    run.bat install    (re)install the course's Python libraries
rem    run.bat notebook   open Jupyter Notebook in the project folder
rem    run.bat check      list which course libraries are installed
rem    run.bat build      rebuild the website from docs\_sources, then open it
rem    run.bat help       show this help
rem
rem  Works on its own: copy run.bat anywhere and double-click it. It downloads
rem  the project next to itself (folder canva-au-for-ang-).
rem  Needs an internet connection the first time. Stop the website: Ctrl+C,
rem  or close the window.
rem ==========================================================================
title Cours d'IA - Master LGC

set "REPO_URL=https://github.com/Progremer04/canva-au-for-ang-.git"
set "ZIP_URL=https://github.com/Progremer04/canva-au-for-ang-/archive/refs/heads/main.zip"
set "ZIP_TOP=canva-au-for-ang--main"
set "DIR_NAME=canva-au-for-ang-"
set "PY_WINGET_ID=Python.Python.3.12"

set "MODE=%~1"
if not defined MODE set "MODE=all"
if /i "%MODE%"=="help" goto :usage
if /i "%MODE%"=="-h" goto :usage
if /i "%MODE%"=="--help" goto :usage
if /i "%MODE%"=="all" goto :mode_ok
if /i "%MODE%"=="site" goto :mode_ok
if /i "%MODE%"=="install" goto :mode_ok
if /i "%MODE%"=="notebook" goto :mode_ok
if /i "%MODE%"=="check" goto :mode_ok
if /i "%MODE%"=="build" goto :mode_ok
echo Unknown option: "%MODE%"
echo.
goto :usage_error
:mode_ok

echo.
echo  ==============================================
echo    Cours d'IA - Master LGC   (run.bat %MODE%)
echo  ==============================================
echo.

rem --------------------------------------------------------------------------
rem  1. Find the project, or download it next to run.bat
rem --------------------------------------------------------------------------
set "ROOT=%~dp0"
if exist "%ROOT%docs\index.html" goto :project_found
set "ROOT=%~dp0%DIR_NAME%\"
if exist "%ROOT%docs\index.html" goto :project_found
call :download_project
if errorlevel 1 goto :fail
if not exist "%ROOT%docs\index.html" goto :fail_download
goto :project_ready

:project_found
if /i "%MODE%"=="all" call :update_project

:project_ready
pushd "%ROOT%"
if not exist "docs\index.html" goto :fail_root
echo [ok] Project folder: "%CD%"
echo.

rem --------------------------------------------------------------------------
rem  2. Find Python 3 (install it with winget if missing)
rem --------------------------------------------------------------------------
call :find_python
if defined PYCMD goto :python_found
if /i "%MODE%"=="site" goto :no_python
call :install_python
call :find_python
if not defined PYCMD goto :no_python

:python_found
echo [ok] Python: %PYCMD%

rem --------------------------------------------------------------------------
rem  3. Course libraries in a private environment (.venv)
rem --------------------------------------------------------------------------
set "VENV=%CD%\.venv"
set "VPY=%VENV%\Scripts\python.exe"
set "MARKER=%VENV%\lgc-install-ok.txt"

if /i "%MODE%"=="site" goto :choose_python
if /i "%MODE%"=="build" goto :choose_python
if /i "%MODE%"=="check" goto :choose_python
if exist "%VPY%" goto :venv_ready
echo.
echo [..] Creating the Python environment .venv ...
call %PYCMD% -m venv "%VENV%"
if errorlevel 1 goto :venv_failed
if not exist "%VPY%" goto :venv_failed
:venv_ready
if /i "%MODE%"=="install" goto :install_libs
if exist "%MARKER%" goto :libs_ready
if /i "%MODE%"=="notebook" goto :install_libs
if /i "%MODE%"=="all" goto :install_libs
goto :libs_ready

:install_libs
call :install_libraries
goto :libs_ready

:venv_failed
echo [!] Could not create the .venv environment. The course libraries were not installed.
echo     The website still works. Try again later with: run.bat install
goto :choose_python

:libs_ready
:choose_python
rem RUNPY: the .venv Python if it exists, otherwise the system Python.
set RUNPY=%PYCMD%
if exist "%VPY%" set RUNPY="%VPY%"

if /i "%MODE%"=="install" goto :done_install
if /i "%MODE%"=="check" goto :run_check
if /i "%MODE%"=="notebook" goto :run_notebook
if /i "%MODE%"=="build" goto :run_build
goto :run_site

rem --------------------------------------------------------------------------
rem  4. Run
rem --------------------------------------------------------------------------
:run_site
echo.
echo [..] Starting the website. Your browser opens by itself.
echo      Keep this window open while you read; close it to stop.
echo.
call %RUNPY% "%CD%\tools\lancer.py"
if errorlevel 1 goto :fail
goto :end

:run_build
echo.
echo [..] Rebuilding the website from docs\_sources ...
call %RUNPY% "%CD%\tools\lancer.py" --rebuild
if errorlevel 1 goto :fail
goto :end

:run_check
call %RUNPY% "%CD%\tools\verifier_bibliotheques.py"
goto :end_pause

:run_notebook
call %RUNPY% -c "import notebook" >nul 2>nul
if errorlevel 1 goto :notebook_missing
echo.
echo [..] Starting Jupyter Notebook in "%CD%" ...
call %RUNPY% -m notebook --notebook-dir="%CD%"
goto :end

:notebook_missing
echo [!] Jupyter Notebook is not installed. Run: run.bat install
goto :end_pause

:done_install
echo.
echo [ok] Done. Start the website with: run.bat site
goto :end_pause

:no_python
echo.
echo [!] Python 3 was not found, so the course libraries cannot be installed.
echo     Opening the website directly from its file instead.
echo     To install Python: https://www.python.org/downloads/
echo     ^(tick "Add python.exe to PATH"^), then run run.bat again.
start "" "%CD%\docs\index.html"
goto :end_pause

rem ==========================================================================
rem  Subroutines
rem ==========================================================================

:download_project
echo [..] Downloading the project into "%ROOT%" ...
call git --version >nul 2>nul
if errorlevel 1 goto :download_zip
call git clone --depth 1 "%REPO_URL%" "%ROOT:~0,-1%"
if not errorlevel 1 exit /b 0
echo [!] git clone failed, trying the ZIP archive instead ...
:download_zip
call powershell -NoProfile -Command "exit 0" >nul 2>nul
if errorlevel 1 goto :download_impossible
set "LGC_ZIP=%TEMP%\lgc-ia-%RANDOM%%RANDOM%.zip"
set "LGC_TMP=%TEMP%\lgc-ia-%RANDOM%%RANDOM%"
call powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072; Invoke-WebRequest -UseBasicParsing -Uri $env:ZIP_URL -OutFile $env:LGC_ZIP; Expand-Archive -Force -Path $env:LGC_ZIP -DestinationPath $env:LGC_TMP"
if errorlevel 1 goto :download_zip_failed
if not exist "%LGC_TMP%\%ZIP_TOP%\docs\index.html" goto :download_zip_failed
xcopy "%LGC_TMP%\%ZIP_TOP%" "%ROOT:~0,-1%" /E /I /H /Y /Q >nul
if errorlevel 1 goto :download_zip_failed
del /q "%LGC_ZIP%" >nul 2>nul
rmdir /s /q "%LGC_TMP%" >nul 2>nul
exit /b 0
:download_zip_failed
del /q "%LGC_ZIP%" >nul 2>nul
rmdir /s /q "%LGC_TMP%" >nul 2>nul
echo [x] Could not download %ZIP_URL%
exit /b 1
:download_impossible
echo [x] Neither git nor PowerShell is available to download the project.
echo     Download it by hand: %ZIP_URL%
exit /b 1

:update_project
if not exist "%ROOT%.git" exit /b 0
call git --version >nul 2>nul
if errorlevel 1 exit /b 0
echo [..] Checking for updates ...
call git -C "%ROOT:~0,-1%" pull --ff-only
if errorlevel 1 echo [!] Update skipped ^(offline, or local changes^). Using the current version.
exit /b 0

:find_python
rem Sets PYCMD to a command that starts Python 3.9 or newer, e.g. py -3.12
rem or "C:\path\python.exe" (quotes included). PYCMD is empty if none works.
set "PYCMD="
call :probe_python py -3.12
if not defined PYCMD call :probe_python py -3.11
if not defined PYCMD call :probe_python py -3.13
if not defined PYCMD call :probe_python py -3.10
if not defined PYCMD call :probe_python py -3
if not defined PYCMD call :probe_python python
if not defined PYCMD call :probe_python python3
if not defined PYCMD call :probe_file "%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if not defined PYCMD call :probe_file "%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
if not defined PYCMD call :probe_file "%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
if not defined PYCMD call :probe_file "%ProgramFiles%\Python312\python.exe"
if not defined PYCMD call :probe_file "%ProgramFiles%\Python311\python.exe"
if not defined PYCMD call :probe_file "%ProgramFiles%\Python313\python.exe"
exit /b 0

:probe_python
rem %* = a command that may start Python. "call" also runs .bat/.cmd shims
rem (pyenv-win, Scoop...). The Microsoft Store "python" alias fails the test.
call %* -c "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)" >nul 2>nul
if errorlevel 1 exit /b 1
set "PYCMD=%*"
exit /b 0

:probe_file
if not exist "%~1" exit /b 1
"%~1" -c "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)" >nul 2>nul
if errorlevel 1 exit /b 1
set PYCMD="%~1"
exit /b 0

:install_python
call winget --version >nul 2>nul
if errorlevel 1 exit /b 1
echo [..] Python 3 not found. Installing Python 3.12 with winget ...
echo      ^(Windows may ask for your permission.^)
call winget install -e --id %PY_WINGET_ID% --scope user --accept-package-agreements --accept-source-agreements
if errorlevel 1 call winget install -e --id %PY_WINGET_ID% --accept-package-agreements --accept-source-agreements
exit /b 0

:install_libraries
echo.
echo [..] Installing the course libraries into .venv
echo      First time only: this downloads several hundred MB and can take 5 to 20 minutes.
echo.
if exist "%MARKER%" del /q "%MARKER%" >nul 2>nul
"%VPY%" -m pip install --upgrade pip
set "LGC_CORE_OK=1"
"%VPY%" -m pip install -r "%CD%\requirements.txt"
if errorlevel 1 call :install_one_by_one
echo.
echo [..] French language model for spaCy ...
"%VPY%" -m spacy download fr_core_news_sm
if errorlevel 1 set "LGC_CORE_OK="
echo.
echo [..] TextBlob corpora ...
"%VPY%" -m textblob.download_corpora lite
echo.
echo [..] Deep learning libraries ^(transformers, torch^) - large download ...
"%VPY%" -m pip install -r "%CD%\requirements-deep.txt"
if errorlevel 1 echo [!] transformers/torch could not be installed. Everything else still works.
echo.
"%VPY%" "%CD%\tools\verifier_bibliotheques.py"
if not defined LGC_CORE_OK goto :install_incomplete
>"%MARKER%" echo Installed on %DATE% %TIME%
echo [ok] Course libraries installed.
exit /b 0
:install_incomplete
echo [!] Some libraries are missing ^(see the list above^). The website still works.
echo     Try again later with: run.bat install
exit /b 1

:install_one_by_one
echo [!] Group install failed. Installing the libraries one by one ...
for /f "usebackq eol=# tokens=1" %%L in ("%CD%\requirements.txt") do call :install_one %%L
exit /b 0

:install_one
"%VPY%" -m pip install %1
if errorlevel 1 set "LGC_CORE_OK="
if errorlevel 1 echo [!] Could not install %1
exit /b 0

rem ==========================================================================
rem  Endings
rem ==========================================================================

:usage
echo Usage: run.bat [all ^| site ^| install ^| notebook ^| check ^| build ^| help]
echo.
echo   (nothing)  download or update the project, install the course's Python
echo              libraries (first run only), then open the website
echo   site       only open the website
echo   install    (re)install the course's Python libraries
echo   notebook   open Jupyter Notebook in the project folder
echo   check      list which course libraries are installed
echo   build      rebuild the website from docs\_sources, then open it
exit /b 0

:usage_error
call :usage
exit /b 2

:fail_download
echo [x] The download finished but "%ROOT%docs\index.html" is missing.
goto :fail
:fail_root
echo [x] Cannot open the folder "%ROOT%".
:fail
echo.
echo [x] run.bat stopped because of the error above.
pause
exit /b 1

:end_pause
echo.
pause
:end
popd
exit /b 0
