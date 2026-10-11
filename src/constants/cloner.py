"""Cloner engine model identifiers."""

INDICF5_REPO = "ai4bharat/IndicF5"
INDICF5_CKPT_FILENAME = "model.safetensors"
INDICF5_VOCAB_FILENAME = "checkpoints/vocab.txt"

INDICF5_VOCODER_NAME = "vocos"
INDICF5_VOCODER_REPO = "charactr/vocos-mel-24khz"
INDICF5_MEL_SPEC_TYPE = "vocos"
INDICF5_ODE_METHOD = "euler"

CHATTERBOX_REPO = "ResembleAI/chatterbox"
CHATTERBOX_FILES = (
    "ve.safetensors",
    "t3_cfg.safetensors",
    "s3gen.safetensors",
    "tokenizer.json",
    "conds.pt",
)
CHATTERBOX_MAX_CHUNK_CHARS = 280

HABIBI_REPO = "SWivid/Habibi-TTS"
HABIBI_CKPT_FILENAME = "Unified/model_200000.safetensors"
HABIBI_VOCAB_FILENAME = "Unified/vocab.txt"
HABIBI_MEL_SPEC_TYPE = "vocos"
HABIBI_ODE_METHOD = "euler"
HABIBI_NFE_STEP = 32
HABIBI_CROSS_FADE_DURATION = 0.15
HABIBI_DEFAULT_DIALECT = "UNK"
