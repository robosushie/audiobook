import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { fetchBooks } from "@/api/books";
import { AddBookDialog } from "@/components/books/AddBookDialog";
import { BookCard } from "@/components/books/BookCard";
import { DeleteBookModal } from "@/components/books/DeleteBookModal";
import { EditBookModal } from "@/components/books/EditBookModal";
import { ViewBookModal } from "@/components/books/ViewBookModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { BOOK_GENRES } from "@/constants/genres";
import { REFERENCE_LANGUAGES } from "@/constants/languages";
import { useApi } from "@/hooks/useApi";
import type { BookGenre, BookRow, ReferenceLanguage } from "@/types/api";
import { cn } from "@/lib/utils";

export function BooksPage() {
  const { request } = useApi();
  const [books, setBooks] = useState<BookRow[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [genreFilters, setGenreFilters] = useState<BookGenre[]>([]);
  const [languageFilters, setLanguageFilters] = useState<ReferenceLanguage[]>([]);
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewBook, setViewBook] = useState<BookRow | null>(null);
  const [editBook, setEditBook] = useState<BookRow | null>(null);
  const [deleteBook, setDeleteBook] = useState<BookRow | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBooks(request, {
        page,
        pageSize: 8,
        q: debouncedQuery || undefined,
        genres: genreFilters,
        languages: languageFilters,
        activeOnly,
      });
      setBooks(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [activeOnly, debouncedQuery, genreFilters, languageFilters, page, request]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Books"
        subtitle="Catalogue management and discovery"
        action={<AddBookDialog onSuccess={load} />}
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 bg-card pl-10"
            placeholder="Search by title or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <MultiSelectFilter
            label="Genres"
            options={BOOK_GENRES}
            selected={genreFilters}
            onChange={(next) => {
              setGenreFilters(next);
              setPage(1);
            }}
            className="w-44 sm:w-48"
          />
          <MultiSelectFilter
            label="Languages"
            options={REFERENCE_LANGUAGES}
            selected={languageFilters}
            onChange={(next) => {
              setLanguageFilters(next);
              setPage(1);
            }}
            className="w-44 sm:w-48"
          />
          <Button
            type="button"
            variant={activeOnly ? "primary" : "outline"}
            className={cn("h-10 text-xs")}
            onClick={() => {
              setActiveOnly((value) => !value);
              setPage(1);
            }}
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
      ) : books.length === 0 ? (
        <p className="text-muted-foreground">No books match your filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onView={setViewBook}
              onEdit={setEditBook}
              onDelete={setDeleteBook}
            />
          ))}
        </div>
      )}

      <Pager page={page} pageSize={8} total={total} onPageChange={setPage} />

      <ViewBookModal book={viewBook} onClose={() => setViewBook(null)} />
      <EditBookModal
        book={editBook}
        onClose={() => setEditBook(null)}
        onSuccess={load}
      />
      <DeleteBookModal
        book={deleteBook}
        onClose={() => setDeleteBook(null)}
        onSuccess={load}
      />
    </div>
  );
}
