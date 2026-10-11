# Stateless voice-preprocess API (port 8003). Build from repository root:
#   docker build -f src/services/preprocess/Dockerfile -t audiobook-preprocess .
#
# Python 3.11: DeepFilterLib 0.5.6 publishes wheels through CPython 3.11 only.
# On 3.12 Poetry builds the sdist, which needs Rust and PyO3 0.19 (no 3.12).
#
# CPU run (this service stays off the cloner GPU):
#   docker run --rm -p 8003:8003 --env-file .env \
#     -v audiobook-preprocess-models:/data/preprocess-models \
#     audiobook-preprocess
#
# Optional env: HF_TOKEN, PREPROCESS_MODEL_DIR, PREPROCESS_DEVICE=cpu
# First start downloads the MMS aligner, DeepFilterNet3, and Silero VAD.
# The default MMS checkpoint is CC-BY-NC 4.0.

FROM python:3.11-slim-bookworm AS runtime

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
    PREPROCESS_DEVICE=cpu \
    CUDA_VISIBLE_DEVICES="" \
    PREPROCESS_MODEL_DIR=/data/preprocess-models \
    HF_HOME=/data/preprocess-models/huggingface \
    HF_HUB_CACHE=/data/preprocess-models/huggingface/hub \
    TORCH_HOME=/data/preprocess-models/torch \
    XDG_CACHE_HOME=/data/preprocess-models

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
        ffmpeg \
        libsndfile1 \
        build-essential \
        cmake \
    && rm -rf /var/lib/apt/lists/* \
    && pip install "poetry==${POETRY_VERSION}"

COPY pyproject.toml poetry.lock ./

# DeepFilterLib 0.5.6 has no CPython 3.12 wheel. Relax the constraint in this
# image only so Poetry accepts 3.11 and installs the published manylinux wheel.
RUN python <<'PY'
import hashlib
import json
import pathlib
import re
import tomllib

pyproject_path = pathlib.Path("pyproject.toml")
pyproject_text = pyproject_path.read_text(encoding="utf-8").replace(
    'requires-python = ">=3.12,<3.13"',
    'requires-python = ">=3.11,<3.13"',
    1,
)
pyproject_path.write_text(pyproject_text, encoding="utf-8")

data = tomllib.loads(pyproject_text)
project = data.get("project", {})
tool = data.get("tool", {}).get("poetry", {})
relevant_project = {
    key: project[key]
    for key in ("requires-python", "dependencies", "optional-dependencies")
    if key in project
}
relevant_poetry = {
    key: tool[key]
    for key in ("dependencies", "source", "extras", "dev-dependencies", "group")
    if key in tool
}
content = {"project": relevant_project, "tool": {"poetry": relevant_poetry}}
digest = hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()

lock_path = pathlib.Path("poetry.lock")
lock_text = lock_path.read_text(encoding="utf-8").replace(
    'python-versions = ">=3.12,<3.13"',
    'python-versions = ">=3.11,<3.13"',
    1,
)
lock_text, count = re.subn(
    r'content-hash = "[0-9a-f]+"',
    f'content-hash = "{digest}"',
    lock_text,
    count=1,
)
if count != 1:
    raise SystemExit("poetry.lock content-hash was not updated")
lock_path.write_text(lock_text, encoding="utf-8")
print(digest)
PY

# One wheel at a time, with retries. Parallel CUDA downloads drop the connection.
RUN poetry config installer.max-workers 1 \
    && poetry config requests.max-retries 10 \
    && attempt=1 \
    && while ! poetry install --with preprocess --no-root; do \
         if [ "$attempt" -ge 5 ]; then \
           echo "poetry install failed after ${attempt} attempts" >&2; \
           exit 1; \
         fi; \
         echo "poetry install failed (attempt ${attempt}), retrying"; \
         attempt=$((attempt + 1)); \
         sleep 20; \
       done

COPY src ./src

RUN mkdir -p /data/preprocess-models

VOLUME ["/data/preprocess-models"]

EXPOSE 8003

HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8003/api/health || exit 1

CMD ["uvicorn", "src.services.preprocess.app:app", "--host", "0.0.0.0", "--port", "8003", "--timeout-keep-alive", "3600"]
