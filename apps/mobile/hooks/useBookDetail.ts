import { fetchBook, fetchBookContent } from '@/api/books';
import type { BookContentRow, BookRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import * as React from 'react';

type BookDetailState = {
  book: BookRow | null;
  content: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useBookDetail(bookId: string | undefined): BookDetailState {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const [book, setBook] = React.useState<BookRow | null>(null);
  const [content, setContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const refetch = React.useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  React.useEffect(() => {
    if (!bookId) {
      setError('Book not found');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('Not signed in');

        const [bookRow, contentRow] = await Promise.all([
          fetchBook(token, bookId),
          fetchBookContent(token, bookId).catch(() => null as BookContentRow | null),
        ]);

        if (cancelled) return;
        setBook(bookRow);
        setContent(contentRow?.content ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load book');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookId, reloadKey]);

  return { book, content, isLoading, error, refetch };
}
