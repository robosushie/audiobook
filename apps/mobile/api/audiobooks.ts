import { apiFetch } from '@/api/client';
import type { AudiobookGenerateBody, AudiobookRow, ListPage } from '@/types/api';

export function fetchMyAudiobooks(
  token: string,
  params?: { page?: number; pageSize?: number; status?: string },
) {
  const search = new URLSearchParams();
  search.set('page', String(params?.page ?? 1));
  search.set('page_size', String(params?.pageSize ?? 8));
  if (params?.status) search.set('status', params.status);
  return apiFetch<ListPage<AudiobookRow>>(`/api/audiobooks/?${search.toString()}`, { token });
}

export function generateAudiobook(token: string, body: AudiobookGenerateBody) {
  return apiFetch<AudiobookRow>('/api/audiobooks/generate', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}
