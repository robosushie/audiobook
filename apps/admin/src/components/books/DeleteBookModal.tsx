import { useState } from "react";

import { deleteBook } from "@/api/books";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useApi } from "@/hooks/useApi";
import type { BookRow } from "@/types/api";

type DeleteBookModalProps = {
  book: BookRow | null;
  onClose: () => void;
  onSuccess: () => void;
};

function authorName(author: BookRow["author"]) {
  return [author.first, author.middle, author.last].filter(Boolean).join(" ");
}

export function DeleteBookModal({ book, onClose, onSuccess }: DeleteBookModalProps) {
  const { request } = useApi();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!book) return;
    setLoading(true);
    setError(null);
    try {
      await deleteBook(request, book.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete book");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={book !== null}
      onClose={onClose}
      title="Delete book"
      description="This removes the book from the catalogue. Manuscript files in storage are not deleted automatically."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            className="rounded-full border border-destructive bg-card px-6 py-3 text-destructive hover:bg-destructive/10"
            onClick={() => void handleDelete()}
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </>
      }
    >
      {book ? (
        <p className="text-sm text-foreground">
          Delete <span className="font-semibold">{book.title}</span> by{" "}
          <span className="font-semibold">{authorName(book.author)}</span>?
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </Modal>
  );
}
