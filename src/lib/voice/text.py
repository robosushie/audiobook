"""Align Whisper transcript to the user-provided reference passage."""

import re
from difflib import SequenceMatcher

from src.constants.voice import ALIGNMENT_MIN_MATCH_RATIO


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower(), flags=re.UNICODE)


def _word_spans(text: str) -> list[tuple[int, int]]:
    return [(match.start(), match.end()) for match in re.finditer(r"\S+", text)]


def find_aligned_reference_segment(reference_text: str, transcript: str) -> str:
    """Find the reference passage span that best matches the STT transcript."""
    reference = reference_text.strip()
    if not reference:
        return reference_text

    transcript_tokens = _tokenize(transcript)
    if not transcript_tokens:
        return reference

    reference_tokens = _tokenize(reference)
    spans = _word_spans(reference)
    if not reference_tokens or not spans:
        return reference

    target_len = len(transcript_tokens)
    min_len = max(1, int(target_len * 0.6))
    max_len = min(len(reference_tokens), int(target_len * 1.6) + 2)

    best_ratio = 0.0
    best_start = 0
    best_end = min(len(reference_tokens), target_len)

    for window_len in range(min_len, max_len + 1):
        for start in range(0, len(reference_tokens) - window_len + 1):
            window = reference_tokens[start : start + window_len]
            ratio = SequenceMatcher(None, window, transcript_tokens).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_start = start
                best_end = start + window_len

    if best_ratio < ALIGNMENT_MIN_MATCH_RATIO:
        return reference

    start_char = spans[best_start][0]
    end_char = spans[min(best_end, len(spans)) - 1][1]
    return reference[start_char:end_char].strip()
