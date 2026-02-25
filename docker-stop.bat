@echo off
REM StoreMyBottle Docker Stop Script for Windows

echo ========================================
echo StoreMyBottle - Docker Stop
echo ========================================
echo.

set MODE=%1
if "%MODE%"=="" set MODE=dev

if "%MODE%"=="prod" (
    echo [INFO] Stopping PRODUCTION containers...
    docker-compose -f docker-compose.prod.yml down
) else (
    echo [INFO] Stopping DEVELOPMENT containers...
    docker-compose down
)

echo.
echo [INFO] Containers stopped successfully!
echo.

set /p REMOVE_VOLUMES="Do you want to remove volumes (database data will be lost)? (y/N): "
if /i "%REMOVE_VOLUMES%"=="y" (
    if "%MODE%"=="prod" (
        docker-compose -f docker-compose.prod.yml down -v
    ) else (
        docker-compose down -v
    )
    echo [INFO] Volumes removed!
) else (
    echo [INFO] Volumes preserved.
)

echo.
pause
