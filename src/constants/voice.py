"""Voice profile audio, alignment, and preprocess configuration."""

# Stored reference clip
TARGET_SAMPLE_RATE = 24_000
PEAK_TARGET = 0.95
HIGHPASS_HZ = 80.0

# Decode / model sample rates
DENOISE_SAMPLE_RATE = 48_000
ALIGN_SAMPLE_RATE = 16_000

# Clip selection. A reading shorter than MAX is kept whole when it has enough speech.
MIN_CLIP_SECONDS = 8.0
MAX_CLIP_SECONDS = 12.0
TARGET_CLIP_SECONDS = 10.0
MIN_SPEECH_SECONDS = 6.0
EDGE_PAD_SECONDS = 0.10
VAD_EDGE_PAD_SECONDS = 0.05
MAX_INTERNAL_PAUSE_SECONDS = 0.35
KEPT_PAUSE_SECONDS = 0.12
GAP_PENALTY_START_SECONDS = 0.40

# Mean of per-word exp(log-prob). Below this, the take does not match the passage.
MIN_ALIGNMENT_SCORE = 0.05

ALIGNMENT_MODEL = "MahmoudAshraf/mms-300m-1130-forced-aligner"
FFMPEG_TIMEOUT_SECONDS = 120
PREPARE_HTTP_TIMEOUT_SECONDS = 600.0
