"""Cut each catalogue manuscript to about half, on a paragraph boundary."""

from __future__ import annotations

import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parent / "data"
BOOKS = DATA / "books.json"
STORIES = DATA / "stories"


def halve(text: str) -> str:
    stripped = text.strip()
    target = max(1, len(stripped) // 2)
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", stripped) if part.strip()]
    if len(paragraphs) <= 1:
        sentences = [part.strip() for part in re.split(r"(?<=[.!?।])\s+", stripped) if part.strip()]
        return _take_until(sentences, target, " ")
    return _take_until(paragraphs, target, "\n\n")


def _take_until(parts: list[str], target: int, joiner: str) -> str:
    kept: list[str] = []
    total = 0
    for part in parts:
        if kept and total >= target:
            break
        kept.append(part)
        total += len(part) + len(joiner)
    return joiner.join(kept) if kept else parts[0]


def main() -> None:
    books = json.loads(BOOKS.read_text(encoding="utf-8"))
    before = 0
    after = 0
    for book in books:
        original = str(book["content"]).strip()
        shortened = halve(original)
        book["content"] = shortened
        before += len(original)
        after += len(shortened)
        stem = Path(str(book["cover"])).stem
        (STORIES / f"{stem}.txt").write_text(shortened + "\n", encoding="utf-8")
    BOOKS.write_text(json.dumps(books, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"books={len(books)} chars {before} -> {after} ratio={after / before:.2f}")


if __name__ == "__main__":
    main()
