@echo off
echo ========================================
echo StoreMyBottle - Local Development
echo ========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker might not be running!
    echo Please make sure Docker Desktop is started.
    echo.
    pause
)

echo [INFO] Starting MySQL database...
docker-compose up db -d

echo.
echo [INFO] Waiting for MySQL to be ready...
timeout /t 5 /nobreak >nul

echo.
echo [INFO] Initializing database...
cd backend
python init_db.py

echo.
echo [INFO] Creating admin user...
python create_admin.py admin@storemybottle.com admin123

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo.
echo 1. Backend (Terminal 1):
echo    cd backend
echo    python main.py
echo.
echo 2. Customer Frontend (Terminal 2):
echo    cd frontend
echo    npm install
echo    npm run dev
echo.
echo 3. Bartender Frontend (Terminal 3):
echo    cd frontend-bartender
echo    npm install
echo    npm run dev
echo.
echo 4. Admin Portal (Terminal 4):
echo    cd admin
echo    npm install
echo    npm run dev
echo.
echo ========================================
echo Access URLs:
echo ========================================
echo Backend API:  http://localhost:8000
echo Customer App: http://localhost:5173
echo Bartender:    http://localhost:5174
echo Admin Portal: http://localhost:5175
echo.
pause
