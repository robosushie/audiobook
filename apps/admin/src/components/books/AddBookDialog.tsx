import { Plus } from "lucide-react";
import { useState } from "react";

import { createBook } from "@/api/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";

type AddBookDialogProps = {
  onSuccess: () => void;
};

export function AddBookDialog({ onSuccess }: AddBookDialogProps) {
  const { request } = useApi();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [authorFirst, setAuthorFirst] = useState("");
  const [authorLast, setAuthorLast] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("en");
  const [coverUrl, setCoverUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createBook(request, {
        title,
        author: { first: authorFirst, last: authorLast },
        genre: genre || null,
        language,
        cover_url: coverUrl || null,
        is_active: true,
        is_trending: false,
        categories: [],
      });
      setOpen(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create book");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add book
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Add book</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
          <Input placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
          <Input placeholder="Language (e.g. en)" value={language} onChange={(e) => setLanguage(e.target.value)} />
          <Input placeholder="Cover URL" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
