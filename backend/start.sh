#!/bin/bash
# Activate virtual environment and start uvicorn
source /app/.venv/bin/activate
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT
