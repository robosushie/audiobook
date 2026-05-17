"""HTTP helpers for book text and reference audio URLs."""

import httpx

from src.lib.error import URL_FETCH_FAILED


def fetch_text(url: str) -> str:
    """Download UTF-8 text from a URL (e.g. book manuscript)."""
    try:
        response = httpx.get(url, follow_redirects=True, timeout=120.0)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RuntimeError(URL_FETCH_FAILED.format(url=url, error=exc)) from exc
    return response.text


def fetch_bytes(url: str) -> bytes:
    """Download binary content from a URL (e.g. reference WAV)."""
    try:
        response = httpx.get(url, follow_redirects=True, timeout=120.0)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RuntimeError(URL_FETCH_FAILED.format(url=url, error=exc)) from exc
    return response.content
