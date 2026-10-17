"""Keep F5-style diffusion on one batch at a time.

``f5_tts`` and ``habibi_tts`` submit every text batch to a ``ThreadPoolExecutor``.
Those ODE solves then run together. A 6GB GPU cannot hold several of them, so
the first batch never finishes and the progress bar stays at 0. Replacing the
executor with a serial one keeps the same crossfade and runs one batch at a time.
"""

from __future__ import annotations

import importlib
import logging
from collections.abc import Callable
from concurrent.futures import Future
from typing import Any

logger = logging.getLogger(__name__)

_PATCHED: set[str] = set()


class _SerialExecutor:
    """Run each submitted batch before accepting the next one."""

    def __init__(self, *args: object, **kwargs: object) -> None:
        del args, kwargs
        self._index = 0

    def __enter__(self) -> _SerialExecutor:
        return self

    def __exit__(self, exc_type: object, exc: object, tb: object) -> bool:
        del exc_type, exc, tb
        return False

    def submit(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Future[Any]:
        self._index += 1
        index = self._index
        logger.info("synthesis batch %d started", index)
        try:
            result = fn(*args, **kwargs)
        except Exception:
            logger.exception("synthesis batch %d failed", index)
            raise
        logger.info("synthesis batch %d finished", index)
        future: Future[Any] = Future()
        future.set_result(result)
        return future


def use_serial_f5_batches(*module_names: str) -> None:
    """Patch inference modules so text batches do not share the GPU."""
    for module_name in module_names:
        if module_name in _PATCHED:
            continue
        try:
            module = importlib.import_module(module_name)
        except ImportError:
            logger.info("synthesis batch patch skipped; %s is not installed", module_name)
            continue
        module.ThreadPoolExecutor = _SerialExecutor
        _PATCHED.add(module_name)
        logger.info("synthesis batches will run one at a time in %s", module_name)
