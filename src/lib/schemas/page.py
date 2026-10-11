"""Shared list-page shape for catalogue and library APIs."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """One window of a longer list."""

    items: list[T]
    page: int
    page_size: int
    total: int
