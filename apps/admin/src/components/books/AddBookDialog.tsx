import { useAuth } from "@clerk/react";
import { Plus } from "lucide-react";
import { useState } from "react";

import { createBookWithContent } from "@/api/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { GenreSelect } from "@/components/books/GenreSelect";
import { REFERENCE_LANGUAGES } from "@/constants/languages";
import type { ReferenceLanguage } from "@/types/api";

type AddBookDialogProps = {
  onSuccess: () => void;
};

export function AddBookDialog({ onSuccess }: AddBookDialogProps) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [authorFirst, setAuthorFirst] = useState("");
  const [authorLast, setAuthorLast] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState<ReferenceLanguage>("english");
  const [coverUrl, setCoverUrl] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setTitle("");
    setAuthorFirst("");
    setAuthorLast("");
    setGenre("");
    setLanguage("english");
    setCoverUrl("");
    setContent("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("author_first", authorFirst.trim());
      formData.append("author_last", authorLast.trim());
      formData.append("language", language);
      formData.append("content", content.trim());
      if (genre) {
        formData.append("genre", genre);
      }
      if (coverUrl.trim()) {
        formData.append("cover_url", coverUrl.trim());
      }
      await createBookWithContent(token, formData);
      setOpen(false);
      resetForm();
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
    <Modal
      open={open}
      onClose={() => {
        setOpen(false);
        resetForm();
      }}
      title="Add book"
      description="Manuscript text is stored in object storage; the database keeps only the content URL."
      className="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-book-form" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <form id="add-book-form" className="space-y-3" onSubmit={handleSubmit}>
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
        <GenreSelect value={genre} onChange={setGenre} />
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
          <textarea
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            placeholder="Full book text for audiobook generation…"
            rows={20}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </Modal>
  );
}
