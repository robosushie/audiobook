"""Shared user-facing and internal error messages."""

# Voice profiles — API
VOICE_PROFILE_NOT_FOUND = "Voice profile not found"
VOICE_USER_NOT_FOUND = "User not found. Sign in via the app to create a profile."
VOICE_EXPECTED_AUDIO = "Expected an audio file (e.g. WAV)."
VOICE_EMPTY_FILE = "Empty file."
VOICE_PROCESSING_FAILED = "Voice processing failed: {error}"

# Voice profiles — pipeline
REFERENCE_TEXT_REQUIRED = "reference_text is required for voice profile upload"
REFERENCE_NOT_FOUND = "Reference passage not found"
REFERENCE_IN_USE = "Reference is linked to voice profiles and cannot be deleted"
REFERENCE_DUPLICATE = "A reference with this text and language already exists"
REFERENCE_ID_OR_TEXT_REQUIRED = "Provide reference_id or reference_text with language"
VOICE_AUDIO_NOT_READY = "Voice profile audio is not ready for cloning"
PREPARE_EMPTY_TEXT = "reference_text is empty"
PREPARE_DECODE_FAILED = "Could not decode the recording"
PREPARE_TOO_LITTLE_SPEECH = "Recording does not contain at least 6 seconds of speech"
PREPARE_ALIGNMENT_FAILED = "Could not align the recording to the reference passage"
PREPARE_LOW_CONFIDENCE = "Recording does not match the reference passage closely enough"
PREPARE_NO_SPAN = (
    "Could not find an 8-12 second span that matches the reference passage"
)

# Books & audiobooks
BOOK_NOT_FOUND = "Book not found"
BOOK_CONTENT_URL_MISSING = "Book has no content_url or the manuscript is empty"
STORAGE_DOWNLOAD_FAILED = "Failed to download {bucket}/{path}: {error}"
URL_FETCH_FAILED = "Failed to fetch {url}: {error}"

# Cloning
UNSUPPORTED_CLONER_TYPE = "Unsupported cloner type: {cloner_type}"
CLONE_SYNTHESIS_FAILED = "Cloning failed ({cloner}, language={language}): {error}"
AUDIOBOOK_GENERATION_FAILED = "Audiobook generation failed: {error}"
