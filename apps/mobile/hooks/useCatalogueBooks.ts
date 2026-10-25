import { fetchBooks } from '@/api/books';
import { isCatalogueLanguage } from '@/lib/constants/languages';
import type { BookRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import * as React from 'react';

export const CATALOGUE_PAGE_SIZE = 8;

type CatalogueFilters = {
  q?: string;
  genre?: string;
  language?: string;
  page?: number;
};

export function useCatalogueBooks(filters: CatalogueFilters = {}) {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const query = filters.q?.trim() ?? '';
  const genre = filters.genre?.trim() ?? '';
  const language = filters.language?.trim() ?? '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;

  const [books, setBooks] = React.useState<BookRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const requestId = React.useRef(0);

  const load = React.useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error('Not signed in');
      const data = await fetchBooks(token, {
        page,
        pageSize: CATALOGUE_PAGE_SIZE,
        q: query || undefined,
        genre: genre || undefined,
        language: language || undefined,
      });
      if (id !== requestId.current) return;
      const visible = language
        ? data.items
        : data.items.filter((book) => isCatalogueLanguage(book.language));
      setBooks(visible);
      setTotal(data.total);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [genre, language, page, query]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return {
    books,
    total,
    page,
    pageSize: CATALOGUE_PAGE_SIZE,
    isLoading,
    error,
    refetch: load,
  };
}
