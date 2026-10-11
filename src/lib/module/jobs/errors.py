"""Job-layer errors that must not be retried."""


class NonRetriableError(Exception):
    """Raised for permanent failures (missing rows, invalid inputs)."""
