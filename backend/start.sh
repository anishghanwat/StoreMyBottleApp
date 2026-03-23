#!/bin/sh
# Start uvicorn and supercronic, exit container if either dies

# Start supercronic in background
supercronic /app/crontab &
CRON_PID=$!

# Start uvicorn in background
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 &
UVICORN_PID=$!

# Wait for either process to exit (sh-compatible, no wait -n)
while kill -0 $CRON_PID 2>/dev/null && kill -0 $UVICORN_PID 2>/dev/null; do
    sleep 2
done

# One of them died — kill the other and exit
kill $CRON_PID $UVICORN_PID 2>/dev/null || true
exit 1
