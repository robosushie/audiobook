import { useAuth } from "@clerk/react";
import { useEffect, useRef, useState } from "react";

import { fetchBookContent, updateBook, updateBookContent } from "@/api/books";
import { GenreSelect } from "@/components/books/GenreSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { REFERENCE_LANGUAGES } from "@/constants/languages";
import { useApi } from "@/hooks/useApi";
import type { BookRow, ReferenceLanguage } from "@/types/api";

type EditBookModalProps = {
  book: BookRow | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function EditBookModal({ book, onClose, onSuccess }: EditBookModalProps) {
  const { request } = useApi();
  const { getToken } = useAuth();
  const [title, setTitle] = useState("");
  const [authorFirst, setAuthorFirst] = useState("");
  const [authorMiddle, setAuthorMiddle] = useState("");
  const [authorLast, setAuthorLast] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState<ReferenceLanguage>("english");
  const [coverUrl, setCoverUrl] = useState("");
  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadedBookId = useRef<string | null>(null);

  useEffect(() => {
    if (!book) {
      loadedBookId.current = null;
      return;
    }
    setTitle(book.title);
    setAuthorFirst(book.author.first);
    setAuthorMiddle(book.author.middle ?? "");
    setAuthorLast(book.author.last);
    setGenre(book.genre ?? "");
    setLanguage(book.language);
    setCoverUrl(book.cover_url ?? "");
    setIsActive(book.is_active);
    setIsTrending(book.is_trending);
    setError(null);

    if (loadedBookId.current === book.id) return;
    loadedBookId.current = book.id;

    if (!book.content_url) {
      setContent("");
      setInitialContent("");
      setContentLoading(false);
      return;
    }

    let cancelled = false;
    setContentLoading(true);
    void fetchBookContent(request, book.id)
      .then((data) => {
        if (!cancelled) {
          setContent(data.content);
          setInitialContent(data.content);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load manuscript");
          setContent("");
          setInitialContent("");
        }
      })
      .finally(() => {
        if (!cancelled) setContentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [book, request]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!book) return;
    setLoading(true);
    setError(null);
    try {
      await updateBook(request, book.id, {
        title: title.trim(),
        author: {
          first: authorFirst.trim(),
          middle: authorMiddle.trim() || null,
          last: authorLast.trim(),
        },
        genre: genre ? genre : null,
        language,
        cover_url: coverUrl.trim() || null,
        is_active: isActive,
        is_trending: isTrending,
      });

      const trimmedContent = content.trim();
      const contentChanged = trimmedContent !== initialContent.trim();
      if (contentChanged) {
        if (!trimmedContent) {
          throw new Error("Manuscript content cannot be empty");
        }
        const token = await getToken();
        if (!token) {
          throw new Error("Not authenticated");
        }
        await updateBookContent(token, book.id, trimmedContent);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update book");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={book !== null}
      onClose={onClose}
      title="Edit book"
      description="Update metadata and manuscript. Content is stored in object storage."
      className="max-w-lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-book-form" disabled={loading || contentLoading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      {book ? (
        <form id="edit-book-form" className="space-y-3" onSubmit={handleSubmit}>
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Author first"
              value={authorFirst}
              onChange={(e) => setAuthorFirst(e.target.value)}
              required
            />
            <Input
              placeholder="Author last"
              value={authorLast}
              onChange={(e) => setAuthorLast(e.target.value)}
              required
            />
          </div>
          <Input
            placeholder="Author middle (optional)"
            value={authorMiddle}
            onChange={(e) => setAuthorMiddle(e.target.value)}
          />
          <GenreSelect value={genre} onChange={setGenre} legacyGenre={book.genre} />
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Language</span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value as ReferenceLanguage)}
            >
              {REFERENCE_LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            placeholder="Cover URL"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Manuscript content</span>
            {contentLoading ? (
              <p className="text-sm text-muted-foreground">Loading manuscript…</p>
            ) : (
              <textarea
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                placeholder="Full book text for audiobook generation…"
                rows={20}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            )}
          </label>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
              />
              Trending
            </label>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      ) : null}
    </Modal>
  );
}
