import { apiFetch } from '@/api/client';
import type { AudiobookGenerateBody, AudiobookRow, ListPage } from '@/types/api';

export const AUDIOBOOK_PAGE_SIZE = 50;

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

export async function fetchVisibleAudiobooks(token: string) {
  const [all, queued, processing] = await Promise.all([
    fetchMyAudiobooks(token, { page: 1, pageSize: AUDIOBOOK_PAGE_SIZE }),
    fetchMyAudiobooks(token, { page: 1, pageSize: AUDIOBOOK_PAGE_SIZE, status: 'queued' }),
    fetchMyAudiobooks(token, { page: 1, pageSize: AUDIOBOOK_PAGE_SIZE, status: 'processing' }),
  ]);
  const seen = new Set(all.items.map((item) => item.id));
  const inProgress = [...queued.items, ...processing.items].filter((item) => !seen.has(item.id));
  return {
    ...all,
    items: [...inProgress, ...all.items],
  };
}

export function generateAudiobook(token: string, body: AudiobookGenerateBody) {
  return apiFetch<AudiobookRow>('/api/audiobooks/generate', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}
