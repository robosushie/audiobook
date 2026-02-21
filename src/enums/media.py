"""Media and content-related enums."""

from enum import StrEnum


class VoiceProfileStatus(StrEnum):
    """Processing state of an uploaded voice profile."""

    UPLOADED = "uploaded"
    QUEUED = "queued"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class AudiobookStatus(StrEnum):
    """Generation pipeline state of a personalised audiobook."""

    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
