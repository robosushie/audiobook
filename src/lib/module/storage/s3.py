"""S3-compatible object storage (MinIO locally, same keys as the old disk layout)."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import TYPE_CHECKING, Any

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from dotenv import find_dotenv, load_dotenv
from src.lib.error import STORAGE_DOWNLOAD_FAILED

if TYPE_CHECKING:
    from uuid import UUID

load_dotenv(find_dotenv(usecwd=True))

VOICE_BUCKET = os.environ.get("VOICE_BUCKET", "voice")
AUDIOBOOK_BUCKET = os.environ.get("AUDIOBOOK_BUCKET", "audiobook")
BOOK_BUCKET = os.environ.get("BOOK_BUCKET", "book")


@lru_cache(maxsize=1)
def _client() -> Any:  # noqa: ANN401
    """Return a cached S3 client pointed at MinIO."""
    return boto3.client(
        "s3",
        endpoint_url=os.environ.get("S3_ENDPOINT", "http://127.0.0.1:9000"),
        aws_access_key_id=os.environ.get("S3_ACCESS_KEY", "minio"),
        aws_secret_access_key=os.environ.get("S3_SECRET_KEY", "minioadmin"),
        region_name=os.environ.get("S3_REGION", "us-east-1"),
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def storage_key(bucket: str, object_path: str) -> str:
    """Stable key stored on Voice / Book / Audiobook URL columns."""
    return f"{bucket}/{object_path}"


def raw_voice_object_path(user_id: UUID, voice_profile_id: UUID) -> str:
    """Object key for raw upload WAV (deleted after preprocess)."""
    return f"{user_id}/{voice_profile_id}/raw.wav"


def voice_object_path(user_id: UUID, voice_profile_id: UUID) -> str:
    """Object key for preprocessed reference WAV in VOICE_BUCKET."""
    return f"{user_id}/{voice_profile_id}.wav"


def audiobook_object_path(user_id: UUID, audiobook_id: UUID) -> str:
    """Object key for a generated audiobook WAV in AUDIOBOOK_BUCKET."""
    return f"{user_id}/{audiobook_id}.wav"


def book_content_object_path(book_id: UUID) -> str:
    """Object key for book manuscript text in BOOK_BUCKET."""
    return f"{book_id}/content.txt"


def book_cover_object_path(book_id: UUID, size: str = "thumb") -> str:
    """Object key for a catalogue cover. ``thumb`` is 256px, ``full`` is 1024px."""
    name = "cover-1024.jpg" if size == "full" else "cover-256.jpg"
    return f"{book_id}/{name}"


def download_bytes(bucket: str, object_path: str) -> bytes:
    """Read an object from object storage."""
    try:
        response = _client().get_object(Bucket=bucket, Key=object_path)
    except ClientError as exc:
        raise RuntimeError(
            STORAGE_DOWNLOAD_FAILED.format(bucket=bucket, path=object_path, error=exc),
        ) from exc
    body = response["Body"].read()
    if not isinstance(body, bytes):
        return bytes(body)
    return body


def download_raw_voice(user_id: UUID, voice_profile_id: UUID) -> bytes:
    """Download raw upload audio from VOICE_BUCKET."""
    return download_bytes(
        VOICE_BUCKET,
        raw_voice_object_path(user_id, voice_profile_id),
    )


def download_voice(user_id: UUID, voice_profile_id: UUID) -> bytes:
    """Download preprocessed reference audio from VOICE_BUCKET."""
    return download_bytes(VOICE_BUCKET, voice_object_path(user_id, voice_profile_id))


def download_book_content(book_id: UUID) -> bytes:
    """Download manuscript text from BOOK_BUCKET."""
    return download_bytes(BOOK_BUCKET, book_content_object_path(book_id))


def download_book_cover(book_id: UUID, size: str = "thumb") -> bytes:
    """Download a catalogue cover. Falls back to the legacy PNG if needed."""
    try:
        return download_bytes(BOOK_BUCKET, book_cover_object_path(book_id, size))
    except RuntimeError:
        if size != "thumb":
            return download_bytes(BOOK_BUCKET, book_cover_object_path(book_id, "thumb"))
        return download_bytes(BOOK_BUCKET, f"{book_id}/cover.png")


def delete_object(bucket: str, object_path: str) -> None:
    """Remove an object. Missing keys are ignored."""
    _client().delete_object(Bucket=bucket, Key=object_path)


def delete_raw_voice(user_id: UUID, voice_profile_id: UUID) -> None:
    """Delete raw upload WAV after successful preprocess."""
    delete_object(VOICE_BUCKET, raw_voice_object_path(user_id, voice_profile_id))


def delete_voice_objects(user_id: UUID, voice_profile_id: UUID) -> None:
    """Delete the raw upload and the processed clip for a voice profile."""
    delete_raw_voice(user_id, voice_profile_id)
    delete_object(VOICE_BUCKET, voice_object_path(user_id, voice_profile_id))


def upload_bytes(
    bucket: str,
    object_path: str,
    data: bytes,
    *,
    content_type: str = "application/octet-stream",
    upsert: bool = True,
) -> str:
    """Write bytes and return the storage key."""
    client = _client()
    if not upsert:
        try:
            client.head_object(Bucket=bucket, Key=object_path)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            if code not in {"404", "NoSuchKey", "NotFound"}:
                raise
        else:
            msg = f"Object already exists: {bucket}/{object_path}"
            raise FileExistsError(msg)
    client.put_object(
        Bucket=bucket,
        Key=object_path,
        Body=data,
        ContentType=content_type,
    )
    return storage_key(bucket, object_path)


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


def upload_book_content(book_id: UUID, data: bytes) -> str:
    """Upload book manuscript text to BOOK_BUCKET."""
    return upload_bytes(
        BOOK_BUCKET,
        book_content_object_path(book_id),
        data,
        content_type="text/plain; charset=utf-8",
    )


def upload_book_cover(book_id: UUID, data: bytes, *, size: str = "thumb") -> str:
    """Upload a JPEG catalogue cover. ``size`` is ``thumb`` or ``full``."""
    return upload_bytes(
        BOOK_BUCKET,
        book_cover_object_path(book_id, size),
        data,
        content_type="image/jpeg",
    )
