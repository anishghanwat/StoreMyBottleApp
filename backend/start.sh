#!/bin/sh
# Start uvicorn and supercronic, exit container if either dies

set -e

# Start supercronic in background
supercronic /app/crontab &
CRON_PID=$!

# Start uvicorn in foreground (container lives as long as uvicorn does)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 &
UVICORN_PID=$!

# Wait for either process to exit
wait -n $CRON_PID $UVICORN_PID
EXIT_CODE=$?

# Kill the other one cleanly
kill $CRON_PID $UVICORN_PID 2>/dev/null || true
exit $EXIT_CODE
