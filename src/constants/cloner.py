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
# Hindi uses the official single-language v3 pack. Shared voice-encoder and
# tokenizer files still come from ResembleAI/chatterbox. s3gen_v3.pt is stored
# as s3gen.pt because ChatterboxMultilingualTTS.from_local loads that name.
CHATTERBOX_HINDI_REPO = "ResembleAI/Chatterbox-Multilingual-hi"
CHATTERBOX_HINDI_T3 = "t3_hi.safetensors"
CHATTERBOX_MTL_SHARED_FILES = (
    "ve.pt",
    "conds.pt",
    "grapheme_mtl_merged_expanded_v1.json",
    "Cangjie5_TC.json",
)
CHATTERBOX_MTL_OPTIONAL_FILES = frozenset({"Cangjie5_TC.json"})
CHATTERBOX_HINDI_LANGUAGE_ID = "hi"
CHATTERBOX_MAX_CHUNK_CHARS = 280

HABIBI_REPO = "SWivid/Habibi-TTS"
HABIBI_CKPT_FILENAME = "Unified/model_200000.safetensors"
HABIBI_VOCAB_FILENAME = "Unified/vocab.txt"
HABIBI_MEL_SPEC_TYPE = "vocos"
HABIBI_ODE_METHOD = "euler"
HABIBI_NFE_STEP = 32
HABIBI_CROSS_FADE_DURATION = 0.15
HABIBI_DEFAULT_DIALECT = "UNK"
