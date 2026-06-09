import { apiFetch } from '@/api/client';
import type { AudiobookGenerateBody, AudiobookRow } from '@/types/api';

export function fetchMyAudiobooks(token: string) {
  return apiFetch<AudiobookRow[]>('/api/audiobooks/', { token });
}

export function generateAudiobook(token: string, body: AudiobookGenerateBody) {
  return apiFetch<AudiobookRow>('/api/audiobooks/generate', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}
