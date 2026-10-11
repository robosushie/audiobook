"""Pick an 8-12 second word span from forced-alignment timestamps."""

from __future__ import annotations

import math
from dataclasses import dataclass

from src.constants.voice import (
    GAP_PENALTY_START_SECONDS,
    MAX_CLIP_SECONDS,
    MIN_ALIGNMENT_SCORE,
    MIN_CLIP_SECONDS,
    MIN_SPEECH_SECONDS,
    TARGET_CLIP_SECONDS,
)
from src.lib.error import (
    PREPARE_LOW_CONFIDENCE,
    PREPARE_NO_SPAN,
    PREPARE_TOO_LITTLE_SPEECH,
)
from src.lib.voice.errors import PrepareRejected


@dataclass(frozen=True, slots=True)
class AlignedWord:
    """One whitespace token placed on the recording timeline."""

    text: str
    start: float
    end: float
    score: float
    token_index: int


@dataclass(frozen=True, slots=True)
class WordSpan:
    """Chosen reference span and the confidence of its alignment."""

    start_index: int
    end_index: int
    start_time: float
    end_time: float
    alignment_score: float


def _is_speech_token(text: str) -> bool:
    return any(char.isalnum() for char in text)


def _confidence(words: list[AlignedWord]) -> float:
    if not words:
        return 0.0
    total = 0.0
    for word in words:
        value = word.score
        if not math.isfinite(value):
            value = -20.0
        total += math.exp(min(0.0, max(-20.0, value)))
    return total / len(words)


def _gap_penalty(words: list[AlignedWord]) -> float:
    excess = 0.0
    for previous, nxt in zip(words, words[1:], strict=False):
        gap = nxt.start - previous.end
        if gap > GAP_PENALTY_START_SECONDS:
            excess += gap - GAP_PENALTY_START_SECONDS
    return excess


def _span_from(words: list[AlignedWord]) -> WordSpan:
    score = _confidence(words)
    if score < MIN_ALIGNMENT_SCORE:
        raise PrepareRejected(PREPARE_LOW_CONFIDENCE)
    return WordSpan(
        start_index=words[0].token_index,
        end_index=words[-1].token_index,
        start_time=words[0].start,
        end_time=words[-1].end,
        alignment_score=score,
    )


def select_word_span(words: list[AlignedWord]) -> WordSpan:
    """Choose the cleanest ~10 s run of aligned words, or the whole short reading."""
    speech = [word for word in words if _is_speech_token(word.text) and word.end > word.start]
    if not speech:
        raise PrepareRejected(PREPARE_TOO_LITTLE_SPEECH)

    speech_seconds = sum(word.end - word.start for word in speech)
    timeline = speech[-1].end - speech[0].start
    if timeline <= MAX_CLIP_SECONDS:
        if speech_seconds < MIN_SPEECH_SECONDS:
            raise PrepareRejected(PREPARE_TOO_LITTLE_SPEECH)
        return _span_from(speech)

    best_rank = -math.inf
    best: list[AlignedWord] | None = None
    for start in range(len(speech)):
        for end in range(start, len(speech)):
            window = speech[start : end + 1]
            duration = window[-1].end - window[0].start
            if duration < MIN_CLIP_SECONDS:
                continue
            if duration > MAX_CLIP_SECONDS:
                break
            confidence = _confidence(window)
            rank = confidence - (0.05 * _gap_penalty(window)) - (0.01 * abs(duration - TARGET_CLIP_SECONDS))
            if rank > best_rank:
                best_rank = rank
                best = window

    if best is None:
        raise PrepareRejected(PREPARE_NO_SPAN)
    if sum(word.end - word.start for word in best) < MIN_SPEECH_SECONDS:
        raise PrepareRejected(PREPARE_TOO_LITTLE_SPEECH)
    return _span_from(best)
