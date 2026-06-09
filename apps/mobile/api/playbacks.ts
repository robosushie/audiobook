import { apiFetch } from '@/api/client';
import type { PlaybackRow } from '@/types/api';

export function fetchMyPlaybacks(token: string, limit = 4) {
  return apiFetch<PlaybackRow[]>(`/api/playbacks/me?limit=${limit}`, { token });
}

export function upsertMyPlayback(token: string, audiobookId: string, progress: number) {
  return apiFetch<PlaybackRow>(`/api/playbacks/me/${audiobookId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ progress }),
  });
}
