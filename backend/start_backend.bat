@echo off
echo Starting StoreMyBottle Backend Server...
echo.
cd /d "%~dp0"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --ssl-keyfile=key.pem --ssl-certfile=cert.pem
