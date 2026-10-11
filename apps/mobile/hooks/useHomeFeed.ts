import { fetchMyAudiobooks } from '@/api/audiobooks';
import { fetchBooks } from '@/api/books';
import { fetchMyPlaybacks } from '@/api/playbacks';
import { useUserEventSubscription } from '@/contexts/user-events';
import type { AudiobookRow, BookRow, PlaybackRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import * as React from 'react';

type HomeFeedState = {
  isInitialLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  continueItem: PlaybackRow | null;
  myAudiobooks: AudiobookRow[];
  recommendedBooks: BookRow[];
  trendingBooks: BookRow[];
  refetch: () => void;
};

export function useHomeFeed(): HomeFeedState {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [continueItem, setContinueItem] = React.useState<PlaybackRow | null>(null);
  const [myAudiobooks, setMyAudiobooks] = React.useState<AudiobookRow[]>([]);
  const [recommendedBooks, setRecommendedBooks] = React.useState<BookRow[]>([]);
  const [trendingBooks, setTrendingBooks] = React.useState<BookRow[]>([]);
  const [reloadKey, setReloadKey] = React.useState(0);
  const hasLoadedRef = React.useRef(false);

  const refetch = React.useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useUserEventSubscription((message) => {
    if (
      message.type === 'audiobook.created' ||
      message.type === 'audiobook.updated' ||
      message.type === 'voice.created' ||
      message.type === 'voice.updated'
    ) {
      refetch();
    }
  });

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const isRefresh = hasLoadedRef.current;
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }
      setError(null);

      try {
        const token = await getTokenRef.current();
        if (!token) {
          throw new Error('Not signed in');
        }

        const [playbacks, audiobooks, catalogue, trending] = await Promise.all([
          fetchMyPlaybacks(token, 1),
          fetchMyAudiobooks(token, { page: 1, pageSize: 8, status: 'completed' }),
          fetchBooks(token, { page: 1, pageSize: 8 }),
          fetchBooks(token, { page: 1, pageSize: 8, trending: true }),
        ]);

        if (cancelled) return;

        const books = catalogue.items;
        const nonTrending = books.filter((book) => !book.is_trending);
        const recommended = nonTrending.slice(0, 5);
        const recommendedIds = new Set(recommended.map((book) => book.id));
        if (recommended.length < 5) {
          for (const book of books) {
            if (recommended.length >= 5) break;
            if (!recommendedIds.has(book.id)) {
              recommended.push(book);
              recommendedIds.add(book.id);
            }
          }
        }

        setContinueItem(playbacks[0] ?? null);
        setMyAudiobooks(audiobooks.items.slice(0, 4));
        setRecommendedBooks(recommended.slice(0, 5));
        setTrendingBooks(trending.items);
        hasLoadedRef.current = true;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load home feed');
        }
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    isInitialLoading,
    isRefreshing,
    error,
    continueItem,
    myAudiobooks,
    recommendedBooks,
    trendingBooks,
    refetch,
  };
}
