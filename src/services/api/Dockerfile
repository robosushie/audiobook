# REST API (port 8000). Build from repository root:
#   docker build -f src/services/api/Dockerfile -t audiobook-api .
# Run:
#   docker run --rm -p 8000:8000 --env-file .env audiobook-api

FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=300 \
    PIP_RETRIES=10 \
    POETRY_VERSION=2.1.3 \
    POETRY_HOME=/opt/poetry \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    POETRY_REQUESTS_TIMEOUT=300 \
    PYTHONPATH=/app

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
        ffmpeg \
        libsndfile1 \
    && rm -rf /var/lib/apt/lists/* \
    && pip install "poetry==${POETRY_VERSION}"

COPY pyproject.toml poetry.lock ./

# One wheel at a time, with retries. Parallel CUDA downloads drop the connection.
RUN poetry config installer.max-workers 1 \
    && poetry config requests.max-retries 10 \
    && attempt=1 \
    && while ! poetry install --only main --no-root; do \
         if [ "$attempt" -ge 5 ]; then \
           echo "poetry install failed after ${attempt} attempts" >&2; \
           exit 1; \
         fi; \
         echo "poetry install failed (attempt ${attempt}), retrying"; \
         attempt=$((attempt + 1)); \
         sleep 20; \
       done

COPY alembic.ini ./
COPY src ./src

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/health || exit 1

CMD ["python", "src/services/api/entrypoint.py"]
