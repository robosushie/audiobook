"""Permanent failures from the voice-preprocess pipeline."""


class PrepareRejected(Exception):
    """The recording cannot be turned into a clone reference."""

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail
