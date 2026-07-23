FROM python:3.12-slim AS base

WORKDIR /app

# System deps for psycopg2/argon2 build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD curl -f http://localhost:8000/healthz || exit 1

# Run migrations before starting the server. Local dev (docker-compose.yml)
# already did this via its own command override; this makes it true for
# managed hosts too (Railway, Render, etc.) that run the Dockerfile CMD
# as-is with no compose file in the picture.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]