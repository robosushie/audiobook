# Stateless cloner API (port 8002). Build from repository root:
#   docker build -f src/services/cloner/Dockerfile -t audiobook-cloner .
#
# GPU run:
#   docker run --rm --gpus all -p 8002:8002 --env-file .env \
#     -v audiobook-cloner-models:/data/cloner-models \
#     audiobook-cloner
#
# CPU run (slow):
#   docker run --rm -p 8002:8002 --env-file .env \
#     -v audiobook-cloner-models:/data/cloner-models \
#     audiobook-cloner
#
# Optional env: HF_TOKEN (gated IndicF5), HABIBI_DIALECT=UNK, CLONER_MODEL_DIR
# First start downloads Chatterbox + IndicF5 + Habibi Unified + Vocos into the volume.

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
    PYTHONPATH=/app \
    CLONER_MODEL_DIR=/data/cloner-models

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
        ffmpeg \
        libsndfile1 \
        build-essential \
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
       done \
    && pip install --retries 10 --timeout 300 chatterbox-tts --no-deps

COPY src ./src

RUN mkdir -p /data/cloner-models

VOLUME ["/data/cloner-models"]

EXPOSE 8002

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8002/api/health || exit 1

CMD ["uvicorn", "src.services.cloner.app:app", "--host", "0.0.0.0", "--port", "8002", "--timeout-keep-alive", "3600"]
