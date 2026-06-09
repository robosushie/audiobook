import { fetchMyAudiobooks } from '@/api/audiobooks';
import { useUserEventSubscription } from '@/contexts/user-events';
import type { AudiobookSSEPayload } from '@/lib/sse/types';
import type { AudiobookRow } from '@/types/api';
import { useAuth } from '@clerk/expo';
import * as React from 'react';

export function useLibraryAudiobooks() {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;

  const [audiobooks, setAudiobooks] = React.useState<AudiobookRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error('Not signed in');
      const data = await fetchMyAudiobooks(token);
      setAudiobooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

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

  return { audiobooks, isLoading, error, refetch: () => load() };
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
