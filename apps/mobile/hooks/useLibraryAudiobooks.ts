import { fetchMyAudiobooks } from '@/api/audiobooks';
import { useUserEventSubscription } from '@/contexts/user-events';
import type { AudiobookSSEPayload } from '@/lib/sse/types';
import type { AudiobookRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import * as React from 'react';

const PAGE_SIZE = 8;

export function useLibraryAudiobooks(status?: string) {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const [audiobooks, setAudiobooks] = React.useState<AudiobookRow[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestId = React.useRef(0);

  const loadPage = React.useCallback(
    async (nextPage: number, append: boolean) => {
      const id = ++requestId.current;
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);
      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('Not signed in');
        const data = await fetchMyAudiobooks(token, {
          page: nextPage,
          pageSize: PAGE_SIZE,
          status,
        });
        if (id !== requestId.current) return;
        setAudiobooks((prev) => (append ? [...prev, ...data.items] : data.items));
        setPage(data.page);
        setTotal(data.total);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load library');
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [status],
  );

  React.useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  useUserEventSubscription((message) => {
    if (message.type === 'audiobook.created' || message.type === 'audiobook.updated') {
      const row = audiobookFromSSE(message.data as AudiobookSSEPayload);
      setAudiobooks((prev) => {
        const index = prev.findIndex((item) => item.id === row.id);
        if (index === -1) return [row, ...prev];
        const next = [...prev];
        next[index] = { ...next[index], ...row };
        return next;
      });
    }
  });

  const hasMore = audiobooks.length < total;

  const loadMore = React.useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    void loadPage(page + 1, true);
  }, [hasMore, isLoading, isLoadingMore, loadPage, page]);

  const refetch = React.useCallback(() => {
    void loadPage(1, false);
  }, [loadPage]);

  return {
    audiobooks,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refetch,
  };
}

function audiobookFromSSE(data: AudiobookSSEPayload): AudiobookRow {
  return {
    id: data.id,
    user_id: data.user_id,
    book_id: data.book_id,
    voice_profile_id: data.voice_profile_id,
    status: data.status,
    content_url: data.content_url,
    duration: data.duration,
    completed_at: data.completed_at ?? null,
    book_title: data.book_title,
    book_cover_url: data.book_cover_url,
    book_author: data.book_author,
    book_language: data.book_language,
    playback_progress: data.playback_progress ?? 0,
  };
}
