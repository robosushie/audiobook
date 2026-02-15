# Temporal Language Processing Setup

This project implements a FastAPI endpoint that triggers Temporal workflows for language processing.

## Structure

- `src/services/platform/activities.py` - Activity functions (English and Hindi processors)
- `src/services/workflow/workflow_handler.py` - Workflow that routes to appropriate activity
- `src/services/workflow/worker.py` - Temporal worker that executes workflows and activities
- `src/api/main.py` - FastAPI application with the endpoint
- `src/lib/temporal_client.py` - Temporal client helper
- `src/models/schemas.py` - Pydantic models for request/response

## Setup

1. **Install dependencies:**
   ```bash
   poetry install
   ```
   
   **Note:** F5-TTS may need to be installed separately from GitHub:
   ```bash
   pip install git+https://github.com/SWivid/F5-TTS.git
   ```

2. **Start Temporal server:**
   ```bash
   # Using Docker (recommended)
   docker run -p 7233:7233 temporalio/auto-setup:latest
   ```

3. **Start the Temporal worker:**
   ```bash
   python -m src.services.workflow.worker
   ```

4. **Start the FastAPI server:**
   ```bash
   python -m src.api.main
   # Or using uvicorn directly:
   uvicorn src.api.main:app --reload
   ```

## Usage

### API Endpoint

**POST** `/process-language`

**Request Body:**
```json
{
  "from_language": "english",
  "to_language": "hindi",
  "ref_text": "reference text",
  "ref_audio": "https://example.com/ref_audio.mp3",
  "text": "text to process",
  "audio": "https://example.com/audio.mp3"
}
```

**Response:**
```json
{
  "workflow_id": "language-processing-<uuid>",
  "run_id": "<run_id>",
  "status": "started",
  "message": "Workflow started successfully. Workflow ID: <id>"
}
```

### Example using curl:

```bash
curl -X POST "http://localhost:8000/process-language" \
  -H "Content-Type: application/json" \
  -d '{
    "from_language": "english",
    "to_language": "hindi",
    "ref_text": "Hello world",
    "ref_audio": "https://example.com/ref.mp3",
    "text": "Test text",
    "audio": "https://example.com/audio.mp3"
  }'
```

## How it works

1. FastAPI endpoint receives the request with language parameters
2. Based on `to_language`, the workflow routes to either:
   - `handle_f5tts` - Uses F5-TTS model for English language processing
   - `handle_xttsv2` - Uses XTTS v2 model for Hindi, Arabic, and other languages
3. The Temporal worker executes the workflow and activities asynchronously
4. Activities download reference audio from URLs (already preprocessed from server)
5. Models generate speech audio and return the output file path

## Environment Variables

### Basic Configuration
- `TEMPORAL_CLOUD_ENDPOINT` or `TEMPORAL_ADDRESS` - Temporal server address (default: `localhost:7233`)
  - Use `TEMPORAL_CLOUD_ENDPOINT` for Temporal Cloud (e.g., `ap-south-1.aws.api.temporal.io:7233`)
  - Use `TEMPORAL_ADDRESS` for local or custom Temporal servers
- `TEMPORAL_NAMESPACE` - Temporal namespace (default: `default`)

### Authentication (for Temporal Cloud or secured servers)
- `TEMPORAL_API_KEY` - API key for Temporal Cloud authentication
- `TEMPORAL_USE_TLS` - Set to `true` to enable TLS (default: `false`, auto-enabled if API key is set)

### Advanced TLS Configuration (optional)
- `TEMPORAL_TLS_CERT_PATH` - Path to client certificate file
- `TEMPORAL_TLS_KEY_PATH` - Path to client private key file
- `TEMPORAL_TLS_SERVER_ROOT_CA_CERT_PATH` - Path to server root CA certificate file

### Example: Using Temporal Cloud

Create a `.env` file in the project root:

```env
TEMPORAL_CLOUD_ENDPOINT="ap-south-1.aws.api.temporal.io:7233"
TEMPORAL_NAMESPACE="your-namespace"
TEMPORAL_API_KEY="your-api-key-here"
```

Or using environment variables:

```bash
export TEMPORAL_CLOUD_ENDPOINT="ap-south-1.aws.api.temporal.io:7233"
export TEMPORAL_NAMESPACE="your-namespace"
export TEMPORAL_API_KEY="your-api-key-here"
```

**Note:** For Temporal Cloud, TLS is automatically enabled when an API key is provided. You don't need to set `TEMPORAL_USE_TLS`.

### Example: Using Local Temporal with API Key

```bash
export TEMPORAL_ADDRESS="localhost:7233"
export TEMPORAL_NAMESPACE="default"
export TEMPORAL_API_KEY="your-local-api-key"
export TEMPORAL_USE_TLS="true"
```

## Notes

- Reference audio is downloaded from URLs and used as-is (no preprocessing needed)
- F5-TTS is used for English language processing
- XTTS v2 is used for Hindi, Arabic, and other languages
- The workflow timeout is set to 10 minutes (600 seconds) to allow for model loading and generation
- Activities have retry policy with maximum 2 attempts
- If `to_language` is "english" or "en", it uses F5-TTS; otherwise, it uses XTTS v2
- Generated audio files are saved in temporary directories and paths are returned
