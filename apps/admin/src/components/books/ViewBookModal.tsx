import { useEffect, useState } from "react";

import { fetchBookContent } from "@/api/books";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatBookGenre } from "@/constants/genres";
import { formatReferenceLanguage } from "@/constants/languages";
import { useApi } from "@/hooks/useApi";
import type { BookRow } from "@/types/api";

type ViewBookModalProps = {
  book: BookRow | null;
  onClose: () => void;
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function authorName(author: BookRow["author"]) {
  return [author.first, author.middle, author.last].filter(Boolean).join(" ");
}

export function ViewBookModal({ book, onClose }: ViewBookModalProps) {
  const { request } = useApi();
  const [content, setContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    if (!book) {
      setContent(null);
      setContentError(null);
      return;
    }
    if (!book.content_url) {
      setContent(null);
      setContentError("No manuscript uploaded for this book.");
      return;
    }
    let cancelled = false;
    setContentLoading(true);
    setContentError(null);
    setContent(null);
    void fetchBookContent(request, book.id)
      .then((data) => {
        if (!cancelled) setContent(data.content);
      })
      .catch((err) => {
        if (!cancelled) {
          setContentError(err instanceof Error ? err.message : "Failed to load manuscript");
        }
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [book, request]);

  return (
    <Modal
      open={book !== null}
      onClose={onClose}
      title="View book"
      description="Catalogue details and manuscript"
      className="max-w-lg"
    >
      {book ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Title" value={book.title} />
            <Detail label="Author" value={authorName(book.author)} />
            <Detail label="Language" value={formatReferenceLanguage(book.language)} />
            <Detail label="Genre" value={book.genre ? formatBookGenre(book.genre) : "—"} />
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant={book.is_active ? "default" : "accent"}>
              {book.is_active ? "Active" : "Inactive"}
            </Badge>
            {book.is_trending ? <Badge variant="muted">Trending</Badge> : null}
          </div>
          {book.cover_url ? (
            <Detail label="Cover URL" value={book.cover_url} />
          ) : null}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Manuscript
            </p>
            {contentLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading manuscript…</p>
            ) : contentError ? (
              <p className="mt-2 text-sm text-destructive">{contentError}</p>
            ) : content ? (
              <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
                {content}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
