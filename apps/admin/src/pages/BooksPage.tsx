import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchBooks } from "@/api/books";
import { AddBookDialog } from "@/components/books/AddBookDialog";
import { BookCard } from "@/components/books/BookCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import type { BookRow } from "@/types/api";
import { cn } from "@/lib/utils";

export function BooksPage() {
  const { request } = useApi();
  const [books, setBooks] = useState<BookRow[]>([]);
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState<string | "all">("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBooks(await fetchBooks(request));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const book of books) {
      if (book.genre) set.add(book.genre);
    }
    return Array.from(set).sort();
  }, [books]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((book) => {
      if (activeOnly && !book.is_active) return false;
      if (genreFilter !== "all" && book.genre !== genreFilter) return false;
      if (!q) return true;
      const author = [book.author.first, book.author.last].join(" ").toLowerCase();
      return book.title.toLowerCase().includes(q) || author.includes(q);
    });
  }, [books, query, genreFilter, activeOnly]);

  return (
    <div>
      <PageHeader
        title="Books"
        subtitle="Catalogue management and discovery"
        action={<AddBookDialog onSuccess={load} />}
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 bg-card pl-10"
            placeholder="Search by title or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={genreFilter === "all" ? "primary" : "outline"}
            className="text-xs"
            onClick={() => setGenreFilter("all")}
          >
            All genres
          </Button>
          {genres.map((genre) => (
            <Button
              key={genre}
              type="button"
              variant={genreFilter === genre ? "primary" : "outline"}
              className="text-xs capitalize"
              onClick={() => setGenreFilter(genre)}
            >
              {genre.replace(/_/g, " ")}
            </Button>
          ))}
          <Button
            type="button"
            variant={activeOnly ? "primary" : "outline"}
            className={cn("text-xs")}
            onClick={() => setActiveOnly((v) => !v)}
          >
            Active only
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-muted-foreground">Loading books…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No books match your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
