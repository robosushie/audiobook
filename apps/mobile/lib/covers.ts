import { getApiBaseUrl } from '@/lib/env';

const BOOK_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CoverSize = 'thumb' | 'full';

export function resolveCoverUrl(
  coverUrl: string | null | undefined,
  bookId: string | null | undefined,
  size: CoverSize = 'thumb',
): string | null {
  if (!coverUrl) return null;
  if (/^https?:\/\//i.test(coverUrl)) return coverUrl;
  if (!bookId || !BOOK_ID.test(bookId)) return null;
  const query = size === 'full' ? '?size=full' : '';
  return `${getApiBaseUrl()}/api/books/${bookId}/cover${query}`;
}
