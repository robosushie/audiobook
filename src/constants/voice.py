"""Voice profile audio, alignment, and STT configuration."""

# Sample rate and clip duration
TARGET_SAMPLE_RATE = 24_000
MIN_CLIP_SECONDS = 10.0
MAX_CLIP_SECONDS = 12.0
DEFAULT_CLIP_SECONDS = 11.0
WINDOW_HOP_SECONDS = 0.25

# Preprocessing
PEAK_TARGET = 0.95

# Clip scoring — PLR2004 comparison thresholds
RMS_SILENCE_THRESHOLD = 1e-5
CLIPPING_AMPLITUDE_THRESHOLD = 0.99

# Text alignment — PLR2004 comparison threshold
ALIGNMENT_MIN_MATCH_RATIO = 0.25

# Groq STT
WHISPER_MODEL = "whisper-large-v3"
