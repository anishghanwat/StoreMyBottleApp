@echo off
REM StoreMyBottle Docker Startup Script for Windows

echo ========================================
echo StoreMyBottle - Docker Startup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [INFO] Docker is running...
echo.

REM Parse command line arguments
set MODE=%1
if "%MODE%"=="" set MODE=dev

if "%MODE%"=="prod" (
    echo [INFO] Starting in PRODUCTION mode...
    echo.
    
    REM Check if .env.production exists
    if not exist .env.production (
        echo [WARNING] .env.production not found!
        echo Creating from .env.docker template...
        copy .env.docker .env.production
        echo.
        echo [ACTION REQUIRED] Please edit .env.production with your actual values
        echo Press any key to open the file...
        pause >nul
        notepad .env.production
        echo.
        echo After updating .env.production, run this script again.
        pause
        exit /b 1
    )
    
    echo [INFO] Building and starting production containers...
    docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d
) else (
    echo [INFO] Starting in DEVELOPMENT mode...
    echo.
    echo [INFO] Building and starting development containers...
    docker-compose up --build -d
)

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start containers!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Containers started successfully!
echo ========================================
echo.

if "%MODE%"=="prod" (
    echo Customer App:  http://localhost:80
    echo Bartender App: http://localhost:81
    echo Admin Portal:  http://localhost:82
    echo Backend API:   http://localhost:8000
) else (
    echo Customer App:  http://localhost:5173
    echo Bartender App: http://localhost:5174
    echo Admin Portal:  http://localhost:5175
    echo Backend API:   http://localhost:8000
)

echo.
echo Useful commands:
echo   docker-compose logs -f          - View logs
echo   docker-compose ps               - View running containers
echo   docker-compose down             - Stop all containers
echo   docker-compose down -v          - Stop and remove volumes
echo.
pause
