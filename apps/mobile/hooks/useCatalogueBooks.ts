import { fetchBooks } from '@/api/books';
import type { BookRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import * as React from 'react';

export function useCatalogueBooks() {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const [books, setBooks] = React.useState<BookRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error('Not signed in');
      const data = await fetchBooks(token);
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { books, isLoading, error, refetch: load };
}
