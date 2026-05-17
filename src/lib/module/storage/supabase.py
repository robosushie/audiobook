"""Supabase Storage client and upload helpers."""

import os
from functools import lru_cache
from uuid import UUID

from dotenv import find_dotenv, load_dotenv
from supabase import Client, create_client

from src.lib.error import STORAGE_DOWNLOAD_FAILED

load_dotenv(find_dotenv(usecwd=True))

VOICE_BUCKET = os.environ["VOICE_BUCKET"]
AUDIOBOOK_BUCKET = os.environ["AUDIOBOOK_BUCKET"]


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return a cached Supabase client (SUPABASE_URL + SUPABASE_KEY)."""
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    return create_client(url, key)


def raw_voice_object_path(user_id: UUID, voice_profile_id: UUID) -> str:
    """Object key for raw upload WAV (deleted after preprocess)."""
    return f"{user_id}/{voice_profile_id}/raw.wav"


def voice_object_path(user_id: UUID, voice_profile_id: UUID) -> str:
    """Object key for preprocessed reference WAV in VOICE_BUCKET."""
    return f"{user_id}/{voice_profile_id}.wav"


def audiobook_object_path(user_id: UUID, audiobook_id: UUID) -> str:
    """Object key for a generated audiobook WAV in AUDIOBOOK_BUCKET."""
    return f"{user_id}/{audiobook_id}.wav"


def download_bytes(bucket: str, object_path: str) -> bytes:
    """Download an object from Supabase Storage."""
    client = get_supabase_client()
    try:
        return client.storage.from_(bucket).download(object_path)
    except Exception as exc:
        raise RuntimeError(
            STORAGE_DOWNLOAD_FAILED.format(bucket=bucket, path=object_path, error=exc),
        ) from exc


def download_raw_voice(user_id: UUID, voice_profile_id: UUID) -> bytes:
    """Download raw upload audio from VOICE_BUCKET."""
    return download_bytes(VOICE_BUCKET, raw_voice_object_path(user_id, voice_profile_id))


def download_voice(user_id: UUID, voice_profile_id: UUID) -> bytes:
    """Download preprocessed reference audio from VOICE_BUCKET."""
    return download_bytes(VOICE_BUCKET, voice_object_path(user_id, voice_profile_id))


def delete_object(bucket: str, object_path: str) -> None:
    """Remove an object from Supabase Storage."""
    client = get_supabase_client()
    client.storage.from_(bucket).remove([object_path])


def delete_raw_voice(user_id: UUID, voice_profile_id: UUID) -> None:
    """Delete raw upload WAV after successful preprocess."""
    delete_object(VOICE_BUCKET, raw_voice_object_path(user_id, voice_profile_id))


def upload_bytes(
    bucket: str,
    object_path: str,
    data: bytes,
    *,
    content_type: str = "application/octet-stream",
    upsert: bool = True,
) -> str:
    """Upload bytes to a bucket and return the public URL."""
    client = get_supabase_client()
    file_options: dict[str, str] = {"content-type": content_type}
    if upsert:
        file_options["upsert"] = "true"
    client.storage.from_(bucket).upload(object_path, data, file_options=file_options)
    return client.storage.from_(bucket).get_public_url(object_path)


def upload_voice(
    object_path: str,
    data: bytes,
    *,
    content_type: str = "audio/wav",
) -> str:
    """Upload a voice profile audio file to VOICE_BUCKET."""
    return upload_bytes(VOICE_BUCKET, object_path, data, content_type=content_type)


def upload_audiobook(
    object_path: str,
    data: bytes,
    *,
    content_type: str = "audio/wav",
) -> str:
    """Upload a generated audiobook to AUDIOBOOK_BUCKET."""
    return upload_bytes(AUDIOBOOK_BUCKET, object_path, data, content_type=content_type)
