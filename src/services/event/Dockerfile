# Event / Inngest worker (port 8001). Build from repository root:
#   docker build -f src/services/event/Dockerfile -t audiobook-event .
# Run (mount model cache + env):
#   docker run --rm -p 8001:8001 --env-file .env \
#     -v audiobook-cloner-models:/data/cloner-models \
#     audiobook-event
#
# Required env at runtime: DATABASE_*, SUPABASE_*, INNGEST_*,
# GROQ_API_KEY (voice preprocess), HF_TOKEN (IndicF5 download).

FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=2.1.3 \
    POETRY_HOME=/opt/poetry \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    PYTHONPATH=/app \
    CLONER_MODEL_DIR=/data/cloner-models \
    COQUI_TOS_AGREED=1

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

RUN poetry install --only main --no-root

COPY src ./src

RUN mkdir -p /data/cloner-models

VOLUME ["/data/cloner-models"]

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8001/api/health || exit 1

CMD ["uvicorn", "src.services.event.app:app", "--host", "0.0.0.0", "--port", "8001"]
